import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Pulls a pool of hotel photographs into `photos/` so `db:import-photos` can
 * assign them. Images come from Unsplash, whose licence allows free commercial
 * use. They are stock pictures of other properties and stand in only until
 * FRIMA's own photographs exist.
 *
 * Every candidate is downloaded, decoded and measured. Anything too small or
 * too soft is rejected rather than shipped, because a blurred picture does more
 * harm to the page than a missing one.
 */

const OUT = path.join(process.cwd(), "photos");

const MIN_WIDTH = 1500;
const MIN_BYTES = 90_000; // a 1600px photo under this is over-compressed
const REQUEST = "?auto=format&fit=crop&w=2000&q=80";

interface Candidate {
  id: string;
  /** Which folder the picture belongs in. */
  bucket: string;
  /**
   * `main` can lead a unit (the room itself). `support` is a secondary view
   * such as a bathroom or a corner, which several units may share.
   */
  role: "main" | "support";
  note: string;
}

/** Unsplash photo ids, grouped by the kind of unit they suit. */
const CANDIDATES: Candidate[] = [
  // --- Rooms -------------------------------------------------------------
  { id: "photo-1566073771259-6a8506099945", bucket: "ROOM", role: "main", note: "double room" },
  { id: "photo-1611892440504-42a792e24d32", bucket: "ROOM", role: "main", note: "bed and window" },
  { id: "photo-1582719478250-c89cae4dc85b", bucket: "ROOM", role: "main", note: "twin room" },
  { id: "photo-1631049307264-da0ec9d70304", bucket: "ROOM", role: "main", note: "warm bedroom" },
  { id: "photo-1618773928121-c32242e63f39", bucket: "ROOM", role: "support", note: "bed detail" },
  { id: "photo-1590490360182-c33d57733427", bucket: "ROOM", role: "main", note: "light bedroom" },
  { id: "photo-1595576508898-0ad5c879a061", bucket: "ROOM", role: "support", note: "bathroom" },
  { id: "photo-1584622650111-993a426fbf0a", bucket: "ROOM", role: "support", note: "basin and mirror" },
  { id: "photo-1552321554-5fefe8c9ef14", bucket: "ROOM", role: "support", note: "desk corner" },
  { id: "photo-1560448204-e02f11c3d0e2", bucket: "ROOM", role: "support", note: "seating corner" },
  { id: "photo-1616594039964-ae9021a400a0", bucket: "ROOM", role: "support", note: "bathroom shower" },
  { id: "photo-1505693416388-ac5ce068fe85", bucket: "ROOM", role: "main", note: "made bed" },

  // --- Studios -----------------------------------------------------------
  { id: "photo-1522708323590-d24dbb6b0267", bucket: "STUDIO", role: "main", note: "living area" },
  { id: "photo-1556911220-bff31c812dba", bucket: "STUDIO", role: "support", note: "kitchenette" },
  { id: "photo-1556909212-d5b604d0c90d", bucket: "STUDIO", role: "support", note: "kitchen counter" },
  { id: "photo-1493809842364-78817add7ffb", bucket: "STUDIO", role: "main", note: "sofa and light" },
  { id: "photo-1600121848594-d8644e57abab", bucket: "STUDIO", role: "main", note: "studio interior" },
  { id: "photo-1600566753086-00f18fb6b3ea", bucket: "STUDIO", role: "main", note: "open plan" },

  // --- Apartments --------------------------------------------------------
  { id: "photo-1502672260266-1c1ef2d93688", bucket: "APARTMENT", role: "main", note: "living room" },
  { id: "photo-1484154218962-a197022b5858", bucket: "APARTMENT", role: "support", note: "kitchen" },
  { id: "photo-1598928506311-c55ded91a20c", bucket: "APARTMENT", role: "main", note: "bedroom" },
  { id: "photo-1560185007-cde436f6a4d0", bucket: "APARTMENT", role: "main", note: "apartment view" },
  { id: "photo-1507652313519-d4e9174996dd", bucket: "APARTMENT", role: "support", note: "dining corner" },
  { id: "photo-1574362848149-11496d93a7c7", bucket: "APARTMENT", role: "support", note: "balcony" },

  // --- Halls -------------------------------------------------------------
  { id: "photo-1431540015161-0bf868a2d407", bucket: "HALL", role: "main", note: "conference" },
  { id: "photo-1540575467063-178a50c2df87", bucket: "HALL", role: "support", note: "audience" },
  { id: "photo-1556761175-5973dc0f32e7", bucket: "HALL", role: "main", note: "boardroom" },
  { id: "photo-1497366754035-f200968a6e72", bucket: "HALL", role: "main", note: "meeting room" },
  { id: "photo-1511795409834-ef04bbd61622", bucket: "HALL", role: "main", note: "event space" },
  { id: "photo-1464366400600-7168b8af9bc3", bucket: "HALL", role: "support", note: "reception event" },

  // --- Dining and exterior, used on the editorial pages ------------------
  { id: "photo-1517248135467-4c7edcad34c4", bucket: "DINING", role: "main", note: "restaurant" },
  { id: "photo-1414235077428-338989a2e8c0", bucket: "DINING", role: "main", note: "dining room" },
  { id: "photo-1551218808-94e220e084d2", bucket: "DINING", role: "support", note: "plated dish" },
  { id: "photo-1514933651103-005eec06c04b", bucket: "DINING", role: "main", note: "bar" },
  { id: "photo-1551882547-ff40c63fe5fa", bucket: "EXTERIOR", role: "main", note: "property exterior" },
  { id: "photo-1571896349842-33c89424de2d", bucket: "EXTERIOR", role: "main", note: "hotel grounds" },
];

interface Result {
  candidate: Candidate;
  ok: boolean;
  reason?: string;
  width?: number;
  height?: number;
  bytes?: number;
  sharpness?: number;
}

/**
 * A cheap focus measure: the standard deviation of a Laplacian-style edge pass.
 * Blurred photographs have far less edge energy than crisp ones.
 */
async function sharpness(buffer: Buffer): Promise<number> {
  const { data } = await sharp(buffer)
    .greyscale()
    .resize(512, 512, { fit: "inside" })
    .convolve({
      width: 3,
      height: 3,
      kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0],
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let sum = 0;
  for (const value of data) sum += value;
  const mean = sum / data.length;

  let variance = 0;
  for (const value of data) variance += (value - mean) ** 2;
  return Math.sqrt(variance / data.length);
}

const MIN_SHARPNESS = 8;

async function fetchOne(candidate: Candidate): Promise<Result> {
  const url = `https://images.unsplash.com/${candidate.id}${REQUEST}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(45_000) });
    if (!response.ok) {
      return { candidate, ok: false, reason: `HTTP ${response.status}` };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const meta = await sharp(buffer).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;

    if (width < MIN_WIDTH) {
      return { candidate, ok: false, reason: `only ${width}px wide`, width, height };
    }
    if (buffer.length < MIN_BYTES) {
      return { candidate, ok: false, reason: `only ${Math.round(buffer.length / 1024)} KB`, width, height };
    }

    const focus = await sharpness(buffer);
    if (focus < MIN_SHARPNESS) {
      return {
        candidate, ok: false, width, height, sharpness: focus,
        reason: `too soft (${focus.toFixed(1)})`,
      };
    }

    return {
      candidate, ok: true, width, height,
      bytes: buffer.length, sharpness: focus,
    };
  } catch (error) {
    return {
      candidate, ok: false,
      reason: error instanceof Error ? error.message.slice(0, 48) : "failed",
    };
  }
}

async function main() {
  console.log(`\nFetching ${CANDIDATES.length} candidates\n`);

  await rm(OUT, { recursive: true, force: true });

  const results: Result[] = [];
  // Modest concurrency: enough to be quick, not enough to get throttled.
  const queue = [...CANDIDATES];
  const workers = Array.from({ length: 5 }, async () => {
    for (;;) {
      const candidate = queue.shift();
      if (!candidate) return;
      const result = await fetchOne(candidate);
      results.push(result);
      console.log(
        result.ok
          ? `  ok     ${result.candidate.bucket.padEnd(10)} ${String(result.width).padStart(4)}x${String(result.height).padEnd(4)} focus ${result.sharpness!.toFixed(1).padStart(5)}  ${result.candidate.note}`
          : `  reject ${result.candidate.bucket.padEnd(10)} ${result.reason}  (${result.candidate.note})`,
      );
    }
  });
  await Promise.all(workers);

  // Write the keepers, numbered so the importer picks a stable cover.
  const byBucket = new Map<string, Result[]>();
  for (const result of results.filter((r) => r.ok)) {
    const list = byBucket.get(result.candidate.bucket) ?? [];
    list.push(result);
    byBucket.set(result.candidate.bucket, list);
  }

  console.log();
  for (const [bucket, list] of byBucket) {
    const dir = path.join(OUT, bucket);
    await mkdir(dir, { recursive: true });

    let index = 1;
    for (const result of list) {
      const url = `https://images.unsplash.com/${result.candidate.id}${REQUEST}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(45_000) });
      const buffer = Buffer.from(await response.arrayBuffer());
      const name = `${result.candidate.role}-${String(index).padStart(2, "0")}-${result.candidate.note.replace(/\s+/g, "-")}.jpg`;
      await writeFile(path.join(dir, name), buffer);
      index++;
    }
    console.log(`  ${bucket.padEnd(10)} ${list.length} kept`);
  }

  const kept = results.filter((r) => r.ok).length;
  console.log(`\n  ${kept} of ${CANDIDATES.length} passed, ${CANDIDATES.length - kept} rejected\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
