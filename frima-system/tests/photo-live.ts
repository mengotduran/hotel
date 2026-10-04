import "dotenv/config";
import sharp from "sharp";
import { prisma } from "../src/lib/prisma";
import { GET } from "../src/app/api/live/route";
import {
  deleteRoomPhoto, moveRoomPhoto, saveRoomContent, uploadRoomPhoto,
} from "../src/lib/actions/website";
import { publicRooms, parseStayRange } from "../src/lib/availability";
import { readUpload } from "../src/lib/media/storage";
import type { LiveEvent } from "../src/lib/live/bus";

/**
 * Proves the loop a receptionist actually cares about: change a photograph or a
 * price in /admin/content, and a guest with the page already open sees it.
 *
 * The admin action runs for real, the SSE route is subscribed to the same bus,
 * and the bytes a browser's EventSource would receive are read off the stream.
 */

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` (${detail})` : ""}`);
  }
}

function eq(label: string, actual: unknown, expected: unknown) {
  check(label, Object.is(actual, expected), `got ${actual}, expected ${expected}`);
}

/** A real, decodable JPEG, so the upload path is exercised honestly. */
async function makeJpeg(width: number, height: number, tint: string) {
  return sharp({
    create: {
      width, height, channels: 3,
      background: tint,
    },
  })
    .jpeg({ quality: 80 })
    .toBuffer();
}

function fileFrom(buffer: Buffer, name: string): File {
  return new File([new Uint8Array(buffer)], name, { type: "image/jpeg" });
}

async function main() {
  console.log("\nPhotograph updates reaching the site live\n");

  const room = await prisma.room.findFirstOrThrow({
    where: { published: true, kind: "ROOM" },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  const before = room.images.length;

  // A browser opens the page and holds the event stream.
  const controller = new AbortController();
  const response = await GET(
    new Request("http://localhost/api/live", { signal: controller.signal }),
  );
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const readChunk = async () => decoder.decode((await reader.read()).value);

  await readChunk(); // retry hint
  await readChunk(); // ready

  /**
   * Reads the next change event, giving up rather than hanging the suite if
   * nothing arrives. A missing event is a failure, not a reason to block.
   */
  const nextEvent = async (): Promise<LiveEvent | null> => {
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
      const chunk = await Promise.race([
        readChunk(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2_000)),
      ]);
      if (chunk === null) return null;
      if (!chunk.startsWith("event: change")) continue; // skip heartbeats
      return JSON.parse(
        chunk.slice(chunk.indexOf("data: ") + 6, chunk.indexOf("\n\n")),
      ) as LiveEvent;
    }
    return null;
  };

  // --- Upload -------------------------------------------------------------
  // On a freshly seeded database a unit may have no pictures at all, so put a
  // first one in place before testing reordering against it.
  if (before === 0) {
    const seedUpload = new FormData();
    seedUpload.set("roomId", room.id);
    seedUpload.set("file", fileFrom(await makeJpeg(1600, 1200, "#c9a227"), "first.jpg"));
    const seeded = await uploadRoomPhoto(seedUpload);
    if (!seeded.ok) throw new Error(seeded.error);
    await nextEvent();
  }
  const baseline = before === 0 ? 1 : before;

  const upload = new FormData();
  upload.set("roomId", room.id);
  upload.set("file", fileFrom(await makeJpeg(1800, 1200, "#1e3a5f"), "new.jpg"));
  upload.set("altFr", "Photo de test");

  const uploaded = await uploadRoomPhoto(upload);
  check("the admin accepts the upload", uploaded.ok);
  if (!uploaded.ok) throw new Error(uploaded.error);

  const uploadEvent = await nextEvent();
  check("the site is told something changed", uploadEvent !== null);
  eq("on the rooms topic", uploadEvent?.topic, "rooms");
  eq("and that it was a photograph", uploadEvent?.action, "photo");
  eq("naming the unit", uploadEvent?.id, room.id);

  const afterUpload = await prisma.room.findUniqueOrThrow({
    where: { id: room.id },
    include: { images: { orderBy: { sortOrder: "asc" }, include: { media: true } } },
  });
  eq("the unit has one more picture", afterUpload.images.length, baseline + 1);

  const added = afterUpload.images.at(-1)!;
  eq("stored at full size", added.media.width, 1800);
  check("the bytes are on disk", (await readUpload(added.mediaId, "image/jpeg")) !== null);

  // What a guest loading the page now would receive.
  const listed = await publicRooms(parseStayRange());
  const listedRoom = listed.find((r) => r.id === room.id)!;
  check(
    "the new picture is in what the public site serves",
    listedRoom.images.some((image) => image.id === added.mediaId),
  );

  // --- Reorder ------------------------------------------------------------
  const moved = await moveRoomPhoto(added.id, "up");
  check("reordering works", moved.ok);
  const moveEvent = await nextEvent();
  eq("reordering notifies the site", moveEvent?.action, "photo");

  const afterMove = await prisma.room.findUniqueOrThrow({
    where: { id: room.id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  check(
    "the picture climbed one place",
    afterMove.images.findIndex((i) => i.id === added.id) === baseline - 1,
  );

  // --- Price --------------------------------------------------------------
  const newRate = room.baseRate + 3500;
  const priced = new FormData();
  priced.set("id", room.id);
  priced.set("slug", room.slug);
  priced.set("baseRate", String(newRate));
  priced.set("published", "on");

  check("a price change is accepted", (await saveRoomContent(priced)).ok);

  const updatedEvent = await nextEvent();
  eq("the site is told the unit changed", updatedEvent?.action, "updated");
  const priceEvent = await nextEvent();
  eq("and specifically the price", priceEvent?.action, "price");

  const afterPrice = await prisma.room.findUniqueOrThrow({ where: { id: room.id } });
  eq("the new rate is stored", afterPrice.baseRate, newRate);

  const repriced = await publicRooms(parseStayRange());
  eq(
    "and is what the public site now quotes",
    repriced.find((r) => r.id === room.id)?.baseRate,
    newRate,
  );

  // --- Delete -------------------------------------------------------------
  check("deleting works", (await deleteRoomPhoto(added.id)).ok);
  const deleteEvent = await nextEvent();
  eq("deleting notifies the site", deleteEvent?.action, "photo");

  const afterDelete = await prisma.room.findUniqueOrThrow({
    where: { id: room.id },
    include: { images: true },
  });
  eq("the unit is back to its original count", afterDelete.images.length, baseline);
  check(
    "and the orphaned file was removed from disk",
    (await readUpload(added.mediaId, "image/jpeg")) === null,
  );

  // Put the rate back so re-running the suite is idempotent.
  const restore = new FormData();
  restore.set("id", room.id);
  restore.set("slug", room.slug);
  restore.set("baseRate", String(room.baseRate));
  restore.set("published", "on");
  await saveRoomContent(restore);

  controller.abort();
  await reader.cancel().catch(() => {});

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("\nCrashed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
