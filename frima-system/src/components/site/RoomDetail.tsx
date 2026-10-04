"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { LiveRefresh } from "@/components/live/LiveRefresh";
import { AvailabilityBadge, RoomCard, type RoomCardData } from "./RoomCard";
import { RoomGallery } from "./RoomGallery";
import {
  Container, Eyebrow, GhostLink, Reveal, SectionHeading,
} from "./primitives";
import { AmenityIcon } from "@/components/ui/AmenityIcons";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export function RoomDetail({
  room,
  others,
  range,
}: {
  room: RoomCardData;
  others: RoomCardData[];
  range: { checkIn: string; checkOut: string; nights: number };
}) {
  const { t, locale, money, date } = useI18n();

  const name = room.name ?? room.number;
  const headline = locale === "fr" ? room.headlineFr : room.headlineEn;
  const description = locale === "fr" ? room.descriptionFr : room.descriptionEn;
  const isHall = room.kind === "HALL";
  const query = `?from=${range.checkIn}&to=${range.checkOut}`;
  const estimate = room.baseRate * (isHall ? 1 : range.nights);
  const hero = room.images[0];

  return (
    <main>
      <LiveRefresh topics={["rooms", "availability"]} />

      {/* ----------------------------------------------------------------- */}
      {/* Hero                                                               */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative flex min-h-[70svh] items-end overflow-hidden bg-navy-deep sm:min-h-[78svh]">
        <div className="absolute inset-0">
          {hero ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`/media/${hero.id}`}
              alt={(locale === "fr" ? hero.altFr : hero.altEn) ?? name}
              className="hero-pan img-fade h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-navy" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/45 to-navy-deep/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/65 via-navy-deep/20 to-transparent" />
        </div>

        <Container size="wide" className="relative pb-12 pt-32 sm:pb-14 sm:pt-36">
          <Reveal>
            <Eyebrow tone="light" className="on-image-soft">
              {t(`room.kind.${room.kind}` as MessageKey)} · {room.number}
            </Eyebrow>
            <h1 className="display-xl on-image mt-5 max-w-3xl text-white">{name}</h1>
            {headline && (
              <p className="lede on-image-soft mt-6 max-w-xl text-white/80">{headline}</p>
            )}
            <div className="mt-8">
              <AvailabilityBadge
                availability={room.availability}
                freeFrom={room.freeFrom}
                tone="light"
              />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Narrative + gallery, side by side; booking sits under the gallery  */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-16 sm:py-24 lg:py-28">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
            <Reveal>
              <Eyebrow tone="gold">{t("site.section.theRoom")}</Eyebrow>
              {description && (
                <div className="mt-8 space-y-6">
                  {description
                    .split("\n")
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i} className={i === 0 ? "lede text-foreground" : "copy text-muted"}>
                        {para}
                      </p>
                    ))}
                </div>
              )}

              {room.availability === "AVAILABLE" && (
                <Link href={`/rooms/${room.slug}/book${query}`} className="mt-8 inline-block">
                  <GhostLink tone="gold">{t("site.rooms.bookNow")}</GhostLink>
                </Link>
              )}

              {room.amenities.length > 0 && (
                <div className="mt-14">
                  <Eyebrow tone="gold">{t("site.rooms.amenities")}</Eyebrow>
                  <ul className="mt-7 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4">
                    {room.amenities.map((code) => (
                      <li key={code} className="flex flex-col items-center gap-2.5 text-center">
                        <span className="grid h-12 w-12 place-items-center rounded-full border border-line text-navy">
                          <AmenityIcon code={code} className="h-5 w-5" />
                        </span>
                        <span className="text-xs leading-snug text-muted">
                          {t(`amenity.${code}` as MessageKey)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Reveal>

            <Reveal delay={150}>
              <RoomGallery images={room.images} name={name} />

              <div className="mt-10 border border-line bg-surface p-8">
                <Eyebrow tone="gold">{t("site.nav.book")}</Eyebrow>

                <p className="mt-5 flex items-baseline gap-2">
                  <span className="tabular display-md text-navy">
                    {money(room.baseRate)}
                  </span>
                  <span className="text-sm text-muted">
                    {t(isHall ? "site.rooms.perDay" : "site.rooms.perNight")}
                  </span>
                </p>

                <dl className="mt-8 space-y-3 border-t border-line pt-6 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{t("stay.checkIn")}</dt>
                    <dd>{date(range.checkIn)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{t("stay.checkOut")}</dt>
                    <dd>{date(range.checkOut)}</dd>
                  </div>
                  {!isHall && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">{t("common.nights")}</dt>
                      <dd className="tabular">{range.nights}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3 border-t border-line pt-3 text-base text-navy">
                    <dt>{t("site.rooms.estimate")}</dt>
                    <dd className="tabular">{money(estimate)}</dd>
                  </div>
                </dl>

                {room.availability === "AVAILABLE" ? (
                  <Link href={`/rooms/${room.slug}/book${query}`} className="mt-8 block">
                    <GhostLink tone="gold" className="w-full justify-center">
                      {t("site.rooms.bookNow")}
                    </GhostLink>
                  </Link>
                ) : (
                  <p className="mt-8 border border-line bg-surface-muted px-4 py-4 text-center text-sm text-muted">
                    {room.availability === "BOOKED" && room.freeFrom
                      ? `${t("site.rooms.booked")} · ${date(room.freeFrom)}`
                      : t("site.rooms.unavailable")}
                  </p>
                )}

                <p className="mt-4 text-center text-xs leading-relaxed text-muted">
                  {t("site.book.payOnArrival")}
                </p>
              </div>

              <Link
                href={`/rooms${query}`}
                className="mt-6 block text-center text-[0.6875rem] tracking-[0.14em] uppercase text-muted transition-colors hover:text-navy"
              >
                ← {t("site.nav.rooms")}
              </Link>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Other rooms                                                        */}
      {/* ----------------------------------------------------------------- */}
      {others.length > 0 && (
        <section className="bg-surface-muted py-20 sm:py-28 lg:py-32">
          <Container size="wide">
            <Reveal>
              <SectionHeading
                eyebrow={t("site.section.alsoAvailable")}
                title={t("site.rooms.otherRooms")}
                action={
                  <Link href={`/rooms${query}`}>
                    <GhostLink>{t("site.home.allRooms")}</GhostLink>
                  </Link>
                }
              />
            </Reveal>

            <div className="mt-10 grid gap-x-6 gap-y-12 sm:mt-14 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
              {others.map((other, index) => (
                <Reveal key={other.id} delay={index * 90}>
                  <RoomCard room={other} range={range} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}
    </main>
  );
}
