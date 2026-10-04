import "dotenv/config";
import { GET } from "../src/app/api/live/route";
import { publish, subscribe, type LiveEvent } from "../src/lib/live/bus";

/**
 * Proves the live-update path end to end inside one process: an admin
 * mutation calls publish(), the SSE route is subscribed to the same bus, and
 * the bytes a browser's EventSource would receive carry the event.
 */

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function eq(label: string, actual: unknown, expected: unknown) {
  check(label, Object.is(actual, expected), `got ${actual}, expected ${expected}`);
}

async function main() {
  console.log("\nLive update bus\n");

  // --- The bus itself -----------------------------------------------------
  const seen: LiveEvent[] = [];
  const unsubscribe = subscribe((event) => seen.push(event));

  publish("rooms", "price", "room-1");
  publish("availability", "stay");

  eq("both events delivered to the subscriber", seen.length, 2);
  eq("topic carried", seen[0].topic, "rooms");
  eq("action carried", seen[0].action, "price");
  eq("id carried", seen[0].id, "room-1");
  check("timestamped", typeof seen[0].at === "number" && seen[0].at > 0);

  unsubscribe();
  publish("rooms", "after-unsubscribe");
  eq("no delivery after unsubscribe", seen.length, 2);

  // --- The SSE route ------------------------------------------------------
  console.log("\nSSE route\n");

  const controller = new AbortController();
  const response = await GET(
    new Request("http://localhost/api/live", { signal: controller.signal }),
  );

  eq("responds 200", response.status, 200);
  eq(
    "declares the event-stream content type",
    response.headers.get("Content-Type"),
    "text/event-stream; charset=utf-8",
  );
  check(
    "disables proxy buffering",
    response.headers.get("X-Accel-Buffering") === "no",
  );

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  const readChunk = async () => decoder.decode((await reader.read()).value);

  const opening = (await readChunk()) + (await readChunk());
  check("sends a reconnect hint", opening.includes("retry: 3000"));
  check("announces it is ready", opening.includes("event: ready"));

  // A price change in the admin, seen by a connected browser.
  publish("rooms", "price", "room-42");
  const pushed = await readChunk();

  check("forwards the change as an SSE event", pushed.startsWith("event: change"));

  const payload = JSON.parse(
    pushed.slice(pushed.indexOf("data: ") + 6, pushed.indexOf("\n\n")),
  ) as LiveEvent;
  eq("payload topic", payload.topic, "rooms");
  eq("payload action", payload.action, "price");
  eq("payload id", payload.id, "room-42");

  // A guest watching the blog should not be woken by a bookings event.
  publish("bookings", "created", "req-1");
  const second = await readChunk();
  eq(
    "every topic is streamed; filtering happens client-side",
    (JSON.parse(second.slice(second.indexOf("data: ") + 6, second.indexOf("\n\n"))) as LiveEvent)
      .topic,
    "bookings",
  );

  controller.abort();
  await reader.cancel().catch(() => {});

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("\nLive test crashed:", error);
  process.exitCode = 1;
});
