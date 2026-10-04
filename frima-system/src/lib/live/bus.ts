import { EventEmitter } from "node:events";

/**
 * In-process broadcast bus. The public pages hold an EventSource open and
 * refresh themselves when something they display changes, so a price edit in
 * the admin lands on a guest's open tab without them touching anything.
 *
 * Single-process by design: it matches how this system is deployed (one Node
 * process beside one SQLite file). Running several instances behind a load
 * balancer would need Redis pub/sub or Postgres LISTEN/NOTIFY instead.
 */

export const LIVE_TOPICS = ["rooms", "availability", "blog", "bookings"] as const;
export type LiveTopic = (typeof LIVE_TOPICS)[number];

export interface LiveEvent {
  topic: LiveTopic;
  /** What changed, for logs and for clients that want to be selective. */
  action: string;
  id?: string;
  at: number;
}

const globalForBus = globalThis as unknown as { liveBus?: EventEmitter };

function createBus() {
  const emitter = new EventEmitter();
  // Every connected browser adds a listener; the default cap of 10 is far too low.
  emitter.setMaxListeners(0);
  return emitter;
}

export const liveBus: EventEmitter = globalForBus.liveBus ?? createBus();
globalForBus.liveBus = liveBus;

export function publish(topic: LiveTopic, action: string, id?: string): void {
  const event: LiveEvent = { topic, action, id, at: Date.now() };
  liveBus.emit("event", event);
}

export function subscribe(listener: (event: LiveEvent) => void): () => void {
  liveBus.on("event", listener);
  return () => liveBus.off("event", listener);
}
