import "dotenv/config";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "../src/lib/prisma";
import { removeUpload, saveUpload } from "../src/lib/media/storage";

/**
 * Imports real photographs from the `photos/` folder.
 *
 * Drop files into a folder named after a unit number, or after a unit type to
 * cover every unit of that type:
 *
 *   photos/101/            only unit 101
 *   photos/ROOM/           every room
 *   photos/STUDIO/         every studio
 *   photos/APARTMENT/      every apartment
 *   photos/HALL/           every hall
 *
 * A folder named after a specific unit wins over the type folder. Files are
 * taken in filename order, so prefix them 1-, 2-, 3- to control which one
 * becomes the cover. Re-running the script replaces that unit's pictures.
 */

const SOURCE_DIR = path.join(process.cwd(), "photos");
const MAX_WIDTH = 2400;
const ACCEPTED = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/** Below this the picture will look soft behind a full-bleed hero. */
const COMFORTABLE_WIDTH = 1400;

async function listImages(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir);
    return entries
      .filter((name) => ACCEPTED.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((name) => path.join(dir, name));
  } catch {
    return [];
  }
}

async function folderExists(dir: string): Promise<boolean> {
  try {
    return (await stat(dir)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Deals a distinct set of pictures to each unit of a type.
 *
 * The pool is smaller than units x slots, so supporting views (bathrooms,
 * corners) repeat across units while the lead picture never does. That is
 * what a real property looks like: the rooms differ, the bathrooms do not.
 */
function dealForUnit(pool: string[], unitIndex: number, slots = 3): string[] {
  const mains = pool.filter((f) => path.basename(f).startsWith("main-"));
  const supports = pool.filter((f) => path.basename(f).startsWith("support-"));

  // Without role prefixes, fall back to a sliding window over the pool.
  if (mains.length === 0 || supports.length === 0) {
    if (pool.length <= slots) return pool;
    return Array.from(
      { length: Math.min(slots, pool.length) },
      (_, i) => pool[(unitIndex * slots + i) % pool.length],
    );
  }

  const picked = [mains[unitIndex % mains.length]];
  for (let i = 0; i < slots - 1; i++) {
    const candidate = supports[(unitIndex * (slots - 1) + i) % supports.length];
    if (!picked.includes(candidate)) picked.push(candidate);
  }

  // Top up from the mains if the support pool was too small to fill the set.
  let extra = 1;
  while (picked.length < slots && picked.length < pool.length) {
    const candidate = mains[(unitIndex + extra) % mains.length];
    if (!picked.includes(candidate)) picked.push(candidate);
    extra++;
  }

  return picked;
}

async function clearRoomImages(roomId: string) {
  const existing = await prisma.roomImage.findMany({
    where: { roomId },
    include: { media: true },
  });

  for (const image of existing) {
    await prisma.roomImage.delete({ where: { id: image.id } });

    const stillUsed = await prisma.roomImage.count({
      where: { mediaId: image.mediaId },
    });
    const asCover = await prisma.post.count({
      where: { coverMediaId: image.mediaId },
    });
    if (stillUsed === 0 && asCover === 0) {
      await prisma.media.delete({ where: { id: image.mediaId } });
      await removeUpload(image.media.id, image.media.mimeType);
    }
  }
}

async function main() {
  if (!(await folderExists(SOURCE_DIR))) {
    console.log(`\nNo photos folder at ${SOURCE_DIR}.`);
    console.log("Create it, add unit or type folders inside, then re-run.\n");
    return;
  }

  const rooms = await prisma.room.findMany({
    where: { active: true },
    orderBy: [{ kind: "asc" }, { number: "asc" }],
  });

  console.log("\nImporting photographs\n");

  let imported = 0;
  let bytes = 0;
  let soft = 0;
  const covered: string[] = [];
  const uncovered: string[] = [];

  // Position of each unit within its own type, so the pool can be dealt out.
  const seenOfKind = new Map<string, number>();

  for (const room of rooms) {
    // A folder named for this exact unit beats the type folder.
    const exact = await listImages(path.join(SOURCE_DIR, room.number));
    const pool = exact.length
      ? exact
      : await listImages(path.join(SOURCE_DIR, room.kind));

    if (pool.length === 0) {
      uncovered.push(room.number);
      continue;
    }

    const unitIndex = seenOfKind.get(room.kind) ?? 0;
    seenOfKind.set(room.kind, unitIndex + 1);

    // A folder for this exact unit is used as given; a shared type folder is
    // dealt so no two units of that type look the same.
    const files = exact.length ? exact : dealForUnit(pool, unitIndex);

    await clearRoomImages(room.id);

    const label = room.name ?? room.number;
    let slot = 0;

    for (const file of files) {
      const source = sharp(file).rotate();
      const meta = await source.metadata();

      if ((meta.width ?? 0) < COMFORTABLE_WIDTH) soft++;

      const buffer = await source
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true, mozjpeg: true })
        .toBuffer();

      const out = await sharp(buffer).metadata();

      const media = await prisma.media.create({
        data: {
          filename: path.basename(file),
          mimeType: "image/jpeg",
          size: buffer.length,
          width: out.width ?? null,
          height: out.height ?? null,
          altFr: `${label}, photographie ${slot + 1}`,
          altEn: `${label}, photograph ${slot + 1}`,
        },
      });

      await saveUpload(media.id, media.mimeType, buffer);
      await prisma.roomImage.create({
        data: { roomId: room.id, mediaId: media.id, sortOrder: slot },
      });

      slot++;
      imported++;
      bytes += buffer.length;
    }

    covered.push(`${room.number} (${slot})`);
    console.log(
      `  ${room.number.padEnd(12)} ${files.map((f) => path.basename(f).replace(/^(main|support)-\d+-/, "").replace(/\.jpg$/, "")).join(", ")}`,
    );
  }

  // Folders that belong to a page rather than a unit. Their ids are kept in
  // settings so the dining, events and about pages can read them.
  const PAGE_BUCKETS: Record<string, string> = {
    DINING: "site.photos.dining",
    EXTERIOR: "site.photos.exterior",
  };

  for (const [bucket, key] of Object.entries(PAGE_BUCKETS)) {
    const files = await listImages(path.join(SOURCE_DIR, bucket));
    if (files.length === 0) continue;

    const previous = await prisma.setting.findUnique({ where: { key } });
    for (const id of (previous?.value ?? "").split(",").filter(Boolean)) {
      const media = await prisma.media.findUnique({ where: { id } });
      if (!media) continue;
      const used = await prisma.roomImage.count({ where: { mediaId: id } });
      const cover = await prisma.post.count({ where: { coverMediaId: id } });
      if (used === 0 && cover === 0) {
        await prisma.media.delete({ where: { id } });
        await removeUpload(media.id, media.mimeType);
      }
    }

    const ids: string[] = [];
    for (const file of files) {
      const buffer = await sharp(file)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true, mozjpeg: true })
        .toBuffer();
      const out = await sharp(buffer).metadata();

      const media = await prisma.media.create({
        data: {
          filename: path.basename(file),
          mimeType: "image/jpeg",
          size: buffer.length,
          width: out.width ?? null,
          height: out.height ?? null,
        },
      });
      await saveUpload(media.id, media.mimeType, buffer);
      ids.push(media.id);
      imported++;
      bytes += buffer.length;
    }

    await prisma.setting.upsert({
      where: { key },
      create: { key, value: ids.join(",") },
      update: { value: ids.join(",") },
    });
    console.log(`  ${bucket.padEnd(12)} ${ids.length} page image(s)`);
  }

  console.log(`  units with photographs  ${covered.length}`);
  if (covered.length) console.log(`    ${covered.join(", ")}`);
  if (uncovered.length) {
    console.log(`  units still illustrated ${uncovered.length}`);
    console.log(`    ${uncovered.join(", ")}`);
  }
  console.log(`\n  ${imported} images, ${(bytes / 1024 / 1024).toFixed(1)} Mo`);

  if (soft > 0) {
    console.log(
      `\n  ${soft} file(s) narrower than ${COMFORTABLE_WIDTH}px. They will look`,
    );
    console.log("  soft behind a full-bleed hero. Prefer 1600px or wider.");
  }
  console.log();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
