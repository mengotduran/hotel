import { prisma } from "@/lib/prisma";
import { readUpload } from "@/lib/media/storage";

export const runtime = "nodejs";

/** Serves an uploaded image by id. */
export async function GET(
  _request: Request,
  context: RouteContext<"/media/[id]">,
) {
  const { id } = await context.params;

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return new Response("Not found", { status: 404 });

  const bytes = await readUpload(media.id, media.mimeType);
  if (!bytes) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(bytes.length),
      // The id changes whenever the file does, so this can be cached hard.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
