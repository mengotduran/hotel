import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";

/**
 * Uploaded files live on disk next to the database, not in `public/`, so they
 * survive a rebuild and can be backed up with the same copy that takes the
 * database. They are served through /media/[id].
 */

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

export function extensionFor(mimeType: string): string | null {
  return ALLOWED_IMAGE_TYPES[mimeType] ?? null;
}

export function storedName(id: string, mimeType: string): string {
  return `${id}.${extensionFor(mimeType) ?? "bin"}`;
}

export async function saveUpload(
  id: string,
  mimeType: string,
  bytes: Buffer,
): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, storedName(id, mimeType)), bytes);
}

export async function readUpload(
  id: string,
  mimeType: string,
): Promise<Buffer | null> {
  try {
    return await readFile(path.join(UPLOAD_DIR, storedName(id, mimeType)));
  } catch {
    return null;
  }
}

export async function removeUpload(id: string, mimeType: string): Promise<void> {
  try {
    await unlink(path.join(UPLOAD_DIR, storedName(id, mimeType)));
  } catch {
    /* already gone */
  }
}

/**
 * Pulls intrinsic dimensions straight out of the file header. Enough for
 * PNG, JPEG, GIF and WebP, which covers what a phone or camera produces,
 * and avoids pulling in an image library for two numbers.
 */
export function imageSize(
  buffer: Buffer,
): { width: number; height: number } | null {
  // PNG: IHDR is always the first chunk.
  if (
    buffer.length > 24 &&
    buffer.toString("ascii", 1, 4) === "PNG"
  ) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  // GIF: logical screen descriptor, little-endian.
  if (buffer.length > 10 && buffer.toString("ascii", 0, 3) === "GIF") {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }

  // WebP (VP8X / VP8 / VP8L).
  if (
    buffer.length > 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    const format = buffer.toString("ascii", 12, 16);
    if (format === "VP8X") {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
    if (format === "VP8 ") {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (format === "VP8L") {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
  }

  // JPEG: walk the segment markers to the first start-of-frame.
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      // SOF0..SOF15, skipping the non-frame markers in that range.
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + buffer.readUInt16BE(offset + 2);
    }
  }

  return null;
}
