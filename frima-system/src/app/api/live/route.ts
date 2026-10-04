import { subscribe, type LiveEvent } from "@/lib/live/bus";

export const dynamic = "force-dynamic";
// Node runtime: the bus is an in-process EventEmitter.
export const runtime = "nodejs";

/** Server-sent events feed consumed by <LiveRefresh> on the public pages. */
export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let open = true;

      const send = (payload: string) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          open = false;
        }
      };

      send(`retry: 3000\n\n`);
      send(`event: ready\ndata: {"at":${Date.now()}}\n\n`);

      const unsubscribe = subscribe((event: LiveEvent) => {
        send(`event: change\ndata: ${JSON.stringify(event)}\n\n`);
      });

      // Proxies drop idle connections; a comment line keeps it warm.
      const heartbeat = setInterval(() => send(`: ping\n\n`), 25_000);

      const close = () => {
        if (!open) return;
        open = false;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Nginx buffers SSE into uselessness without this.
      "X-Accel-Buffering": "no",
    },
  });
}
