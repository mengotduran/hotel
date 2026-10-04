"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import type { LiveTopic } from "@/lib/live/bus";

/**
 * Keeps the page in step with the admin. Subscribes to the SSE feed and
 * refreshes the server-rendered tree when a topic this page cares about
 * changes: prices, availability, photos and posts all update in place.
 */
export function LiveRefresh({ topics }: { topics: LiveTopic[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const [pulse, setPulse] = useState(false);

  // Joined so the effect re-runs only when the set of topics really changes,
  // not on every render that rebuilds the array literal.
  const topicKey = topics.join(",");

  useEffect(() => {
    // An always-open stream keeps automated browsers (Lighthouse, crawlers,
    // screenshot tools) waiting forever for the network to go quiet, so they
    // are allowed to opt out. Real visitors always connect.
    const automated =
      navigator.webdriver ||
      new URLSearchParams(window.location.search).has("nolive");
    if (automated) return;

    const watched = topicKey.split(",");
    const source = new EventSource("/api/live");
    let timer: number | undefined;

    const onChange = (event: MessageEvent<string>) => {
      let topic: string | undefined;
      try {
        topic = (JSON.parse(event.data) as { topic: LiveTopic }).topic;
      } catch {
        return;
      }
      if (!topic || !watched.includes(topic)) return;

      setPulse(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setPulse(false), 2200);
      router.refresh();
    };

    source.addEventListener("change", onChange as EventListener);
    return () => {
      window.clearTimeout(timer);
      source.removeEventListener("change", onChange as EventListener);
      source.close();
    };
  }, [router, topicKey]);

  if (!pulse) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-navy px-4 py-2 text-xs font-medium text-white shadow-lg"
    >
      <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gold align-middle" />
      {t("live.updated")}
    </div>
  );
}
