"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import type { PublicRoom } from "@/lib/availability";

const DOT: Record<string, string> = {
  AVAILABLE: "bg-positive",
  BOOKED: "bg-warning",
  UNAVAILABLE: "bg-muted",
};

const STATUS_KEY: Record<string, MessageKey> = {
  AVAILABLE: "site.rooms.available",
  BOOKED: "site.rooms.booked",
  UNAVAILABLE: "site.rooms.unavailable",
};

/** The availability marker · a dot and a word, nothing heavier. */
export function AvailabilityBadge({
  availability,
  freeFrom,
  tone = "dark",
}: {
  availability: string;
  freeFrom?: string | null;
  tone?: "dark" | "light";
}) {
  const { t, date } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-2 text-[0.6875rem] tracking-[0.14em] uppercase ${
        tone === "light" ? "on-image-soft text-white" : "text-muted"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${DOT[availability] ?? DOT.UNAVAILABLE} ${
          availability === "AVAILABLE" ? "animate-pulse" : ""
        }`}
      />
      {t(STATUS_KEY[availability] ?? "site.rooms.unavailable")}
      {availability === "BOOKED" && freeFrom && (
        <span className="tracking-normal normal-case opacity-70">
          · {date(freeFrom)}
        </span>
      )}
    </span>
  );
}

export interface RoomCardData extends Omit<PublicRoom, "freeFrom"> {
  freeFrom: string | null;
}

export function RoomCard({
  room,
  range,
}: {
  room: RoomCardData;
  range: { checkIn: string; checkOut: string; nights: number };
}) {
  const { t, locale, money } = useI18n();

  const name = room.name ?? room.number;
  const headline = locale === "fr" ? room.headlineFr : room.headlineEn;
  const isHall = room.kind === "HALL";
  const cover = room.images[0];
  const query = `?from=${range.checkIn}&to=${range.checkOut}`;

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={`/rooms/${room.slug}${query}`}
        className="relative block aspect-[4/5] overflow-hidden bg-surface-muted"
      >
        {cover ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/media/${cover.id}`}
            alt={(locale === "fr" ? cover.altFr : cover.altEn) ?? name}
            loading="lazy"
            className="img-fade h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-xs text-muted">
            {t("site.rooms.noPhoto")}
          </span>
        )}

        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
        <span className="absolute bottom-4 left-4">
          <AvailabilityBadge
            availability={room.availability}
            freeFrom={room.freeFrom}
            tone="light"
          />
        </span>
      </Link>

      <div className="flex flex-1 flex-col pt-6">
        <p className="eyebrow text-muted">
          {t(`room.kind.${room.kind}` as MessageKey)} ·{" "}
          {t(isHall ? "site.rooms.seats" : "site.rooms.capacity").replace(
            "{n}",
            String(room.capacity),
          )}
        </p>

        <h3 className="mt-3 text-2xl font-light tracking-tight text-navy">
          <Link
            href={`/rooms/${room.slug}${query}`}
            className="link-underline transition-colors duration-300 hover:text-gold"
          >
            {name}
          </Link>
        </h3>

        {headline && (
          <p className="copy mt-3 line-clamp-2 text-muted">{headline}</p>
        )}

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-line pt-5">
          <p>
            <span className="tabular text-lg font-light text-navy">
              {money(room.baseRate)}
            </span>
            <span className="ml-1.5 text-xs text-muted">
              {t(isHall ? "site.rooms.perDay" : "site.rooms.perNight")}
            </span>
          </p>

          <Link
            href={
              room.availability === "AVAILABLE"
                ? `/rooms/${room.slug}/book${query}`
                : `/rooms/${room.slug}${query}`
            }
            className="text-[0.6875rem] tracking-[0.14em] uppercase text-navy underline-offset-4 transition-colors duration-300 hover:text-gold hover:underline"
          >
            {room.availability === "AVAILABLE"
              ? t("site.rooms.bookNow")
              : t("site.rooms.viewDetails")}
          </Link>
        </div>
      </div>
    </article>
  );
}
