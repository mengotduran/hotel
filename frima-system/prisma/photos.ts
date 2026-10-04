import "dotenv/config";
import sharp from "sharp";
import { prisma } from "../src/lib/prisma";
import { removeUpload, saveUpload } from "../src/lib/media/storage";
import { imageSize } from "../src/lib/media/storage";
import { PALETTES, SCENES, type SceneFn } from "./illustrations";

/**
 * Gives every published unit three illustrations.
 *
 * They are drawn, not photographed. The point is that the site reads as a
 * finished hotel site before the real photos exist. Replace them from
 * /admin/content as soon as there are proper pictures.
 */

const WIDTH = 1600;
const HEIGHT = 1200;

/** Which three scenes each kind of unit shows, in order. */
const SCENE_PLAN: Record<string, { scene: string; fr: string; en: string }[]> = {
  ROOM: [
    { scene: "bedroom", fr: "Vue d'ensemble de la chambre", en: "Overview of the room" },
    { scene: "workspace", fr: "Coin bureau et rangement", en: "Desk and storage corner" },
    { scene: "bathroom", fr: "Salle d'eau privative", en: "Private bathroom" },
  ],
  STUDIO: [
    { scene: "living", fr: "Espace de vie du studio", en: "Studio living area" },
    { scene: "kitchenette", fr: "Coin cuisine équipé", en: "Fitted kitchenette" },
    { scene: "bathroom", fr: "Salle d'eau privative", en: "Private bathroom" },
  ],
  APARTMENT: [
    { scene: "living", fr: "Salon de l'appartement", en: "Apartment living room" },
    { scene: "bedroomTwin", fr: "Chambre de l'appartement", en: "Apartment bedroom" },
    { scene: "balconyView", fr: "Balcon et vue dégagée", en: "Balcony and open view" },
  ],
  HALL: [
    { scene: "conference", fr: "Configuration conférence", en: "Theatre configuration" },
    { scene: "boardroom", fr: "Configuration réunion", en: "Boardroom configuration" },
    { scene: "eventSpace", fr: "Configuration réception", en: "Reception configuration" },
  ],
};

/** Halls differ enough from one another to lead on their own look. */
const HALL_LEAD: Record<string, string> = {
  "SALLE-CONF": "conference",
  "SALLE-REU": "boardroom",
  "ESPACE-EVT": "eventSpace",
};

function planFor(room: { kind: string; number: string }) {
  const plan = SCENE_PLAN[room.kind] ?? SCENE_PLAN.ROOM;
  const lead = HALL_LEAD[room.number];
  if (!lead) return plan;
  // Put the hall's own configuration first, keep the other two after it.
  return [...plan].sort((a, b) =>
    a.scene === lead ? -1 : b.scene === lead ? 1 : 0,
  );
}

async function render(scene: SceneFn, paletteIndex: number, id: string) {
  const svg = scene(PALETTES[paletteIndex % PALETTES.length], id);
  return sharp(Buffer.from(svg))
    .resize(WIDTH, HEIGHT)
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer();
}

async function main() {
  const rooms = await prisma.room.findMany({
    where: { active: true },
    orderBy: [{ kind: "asc" }, { number: "asc" }],
    include: { images: { include: { media: true } } },
  });

  console.log(`\nIllustrating ${rooms.length} units…\n`);

  // Clear what this script produced before, so it can be re-run safely.
  let cleared = 0;
  for (const room of rooms) {
    for (const image of room.images) {
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
        cleared++;
      }
    }
  }
  if (cleared > 0) console.log(`  cleared ${cleared} previous image(s)\n`);

  let made = 0;
  let bytes = 0;

  for (const [index, room] of rooms.entries()) {
    const plan = planFor(room);
    const label = room.name ?? room.number;

    for (const [slot, step] of plan.entries()) {
      const scene = SCENES[step.scene];
      if (!scene) throw new Error(`Unknown scene: ${step.scene}`);

      // A stable id per image keeps SVG gradient ids unique in one document.
      const buffer = await render(scene, index + slot, `${room.number}-${slot}`);
      const size = imageSize(buffer);

      const media = await prisma.media.create({
        data: {
          filename: `${room.slug}-${slot + 1}.jpg`,
          mimeType: "image/jpeg",
          size: buffer.length,
          width: size?.width ?? WIDTH,
          height: size?.height ?? HEIGHT,
          altFr: `${label} · ${step.fr}`,
          altEn: `${label} · ${step.en}`,
        },
      });
      await saveUpload(media.id, media.mimeType, buffer);

      await prisma.roomImage.create({
        data: { roomId: room.id, mediaId: media.id, sortOrder: slot },
      });

      made++;
      bytes += buffer.length;
    }

    console.log(
      `  ${room.number.padEnd(12)} ${plan.map((s) => s.scene).join(", ")}`,
    );
  }

  console.log(
    `\n  ${made} images · ${(bytes / 1024 / 1024).toFixed(1)} Mo · ${WIDTH}×${HEIGHT}\n`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
