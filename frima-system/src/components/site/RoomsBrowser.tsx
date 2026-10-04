"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { LiveRefresh } from "@/components/live/LiveRefresh";
import { RoomCard, type RoomCardData } from "./RoomCard";
import { Container, Eyebrow, Reveal } from "./primitives";
import { Pagination } from "./Pagination";
import type { MessageKey } from "@/lib/i18n/dictionaries";

const KINDS = ["ROOM", "STUDIO", "APARTMENT", "HALL"];

/** Underlined inputs rather than boxes · the filters stay out of the way. */
const field =
  "w-full border-0 border-b border-line bg-transparent px-0 py-2 text-sm text-foreground outline-none transition-colors focus:border-navy";

function StayFilters({
  range,
  kind,
  freeOnly,
}: {
  range: { checkIn: string; checkOut: string };
  kind: string;
  freeOnly: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="grid gap-x-8 gap-y-5 border-y border-line py-6 sm:grid-cols-2 sm:gap-x-10 sm:py-7 lg:grid-cols-4">
      <label className="block">
        <span className="eyebrow mb-2 block text-muted">{t("stay.checkIn")}</span>
        <input
          type="date"
          value={range.checkIn}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => set({ from: e.target.value })}
          className={field}
        />
      </label>
      <label className="block">
        <span className="eyebrow mb-2 block text-muted">{t("stay.checkOut")}</span>
        <input
          type="date"
          value={range.checkOut}
          min={range.checkIn}
          onChange={(e) => set({ to: e.target.value })}
          className={field}
        />
      </label>
      <label className="block">
        <span className="eyebrow mb-2 block text-muted">{t("room.kind")}</span>
        <select
          value={kind}
          onChange={(e) => set({ kind: e.target.value || null })}
          className={field}
        >
          <option value="">{t("site.rooms.filterAll")}</option>
          {KINDS.map((code) => (
            <option key={code} value={code}>
              {t(`room.kind.${code}` as MessageKey)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-end pb-2">
        <span className="flex items-center gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(e) => set({ free: e.target.checked ? "1" : null })}
            className="h-4 w-4 rounded-none border-line accent-[#1e3a5f]"
          />
          {t("site.rooms.freeOnly")}
        </span>
      </label>
    </div>
  );
}

export function RoomsBrowser({
  rooms,
  available,
  page,
  totalPages,
  range,
  kind,
  freeOnly,
}: {
  rooms: RoomCardData[];
  available: number;
  page: number;
  totalPages: number;
  range: { checkIn: string; checkOut: string; nights: number };
  kind: string;
  freeOnly: boolean;
}) {
  const { t } = useI18n();

  return (
    <main className="pb-20 pt-28 sm:pb-28 sm:pt-36 lg:pb-32 lg:pt-40">
      {/* Prices, photos and availability all arrive here without a refresh. */}
      <LiveRefresh topics={["rooms", "availability"]} />

      <Container size="wide">
        <Reveal>
          <Eyebrow tone="gold">{t("site.section.stay")}</Eyebrow>
          <h1 className="display-lg mt-5 max-w-3xl text-navy">
            {t("site.rooms.title")}
          </h1>
          <p className="lede mt-5 max-w-xl text-muted">{t("site.rooms.lead")}</p>
        </Reveal>

        <div className="mt-12">
          <Suspense fallback={null}>
            <StayFilters range={range} kind={kind} freeOnly={freeOnly} />
          </Suspense>
        </div>

        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.6875rem] tracking-[0.14em] uppercase text-muted">
          <span className="inline-flex items-center gap-2 text-positive">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-positive" />
            {t("live.liveBadge")}
          </span>
          <span>
            {available} {t("site.rooms.available")}
          </span>
          <span>
            {range.nights} {t("site.rooms.nights")}
          </span>
        </p>

        {rooms.length === 0 ? (
          <p className="mt-16 border border-dashed border-line py-24 text-center text-sm text-muted">
            {t("site.rooms.noneAvailable")}
          </p>
        ) : (
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:mt-12 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-16 lg:grid-cols-3">
            {rooms.map((room, index) => (
              <Reveal key={room.id} delay={(index % 3) * 90}>
                <RoomCard room={room} range={range} />
              </Reveal>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} />
      </Container>
    </main>
  );
}
