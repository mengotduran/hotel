"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { LiveRefresh } from "@/components/live/LiveRefresh";
import { RoomCard, type RoomCardData } from "./RoomCard";
import { Container, Eyebrow, GhostLink, Reveal, SectionHeading } from "./primitives";
import { Pagination } from "./Pagination";
import type { HomePost } from "./HomeView";
import type { MessageKey } from "@/lib/i18n/dictionaries";

const CATEGORIES = ["NEWS", "ROOMS", "OFFERS", "EVENTS"];

export function BlogIndex({
  posts,
  page,
  totalPages,
  rooms,
  range,
  category,
}: {
  posts: HomePost[];
  page: number;
  totalPages: number;
  rooms: RoomCardData[];
  range: { checkIn: string; checkOut: string; nights: number };
  category: string;
}) {
  const { t, locale, date } = useI18n();

  return (
    <main className="pb-20 pt-28 sm:pb-28 sm:pt-36 lg:pb-32 lg:pt-40">
      {/* Posts and the rooms feed both update themselves. */}
      <LiveRefresh topics={["blog", "rooms", "availability"]} />

      <Container size="wide">
      <Reveal>
        <Eyebrow tone="gold">{t("drawer.group.news")}</Eyebrow>
        <h1 className="display-lg mt-5 max-w-3xl text-navy">{t("site.blog.title")}</h1>
        <p className="lede mt-5 max-w-xl text-muted">{t("site.blog.lead")}</p>
      </Reveal>

      <nav className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-y border-line py-5">
        <Link
          href="/blog"
          className={`text-[0.6875rem] tracking-[0.14em] uppercase transition-colors ${
            category === "" ? "text-navy" : "text-muted hover:text-navy"
          }`}
        >
          {t("common.all")}
        </Link>
        {CATEGORIES.map((code) => (
          <Link
            key={code}
            href={`/blog?category=${code}`}
            className={`text-[0.6875rem] tracking-[0.14em] uppercase transition-colors ${
              category === code ? "text-navy" : "text-muted hover:text-navy"
            }`}
          >
            {t(`site.blog.cat.${code}` as MessageKey)}
          </Link>
        ))}
      </nav>

      {posts.length === 0 ? (
        <p className="mt-16 border border-dashed border-line py-24 text-center text-sm text-muted">
          {t("site.blog.empty")}
        </p>
      ) : (
        <div className="mt-10 grid gap-x-6 gap-y-12 sm:mt-14 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col"
            >
              <div className="aspect-[16/10] overflow-hidden bg-surface-muted">
                {post.coverId ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/media/${post.coverId}`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-xs text-muted">
                    {t(`site.blog.cat.${post.category}` as MessageKey)}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col pt-6">
                <p className="eyebrow text-[#9a7a12]">
                  {t(`site.blog.cat.${post.category}` as MessageKey)}
                  {post.publishedAt && (
                    <span className="ml-3 tracking-normal normal-case text-muted">
                      {date(post.publishedAt)}
                    </span>
                  )}
                </p>
                <h2 className="mt-3 text-xl font-light leading-snug text-navy transition-colors duration-300 group-hover:text-gold">
                  {locale === "fr" ? post.titleFr : post.titleEn}
                </h2>
                {(locale === "fr" ? post.excerptFr : post.excerptEn) && (
                  <p className="copy mt-3 line-clamp-3 text-muted">
                    {locale === "fr" ? post.excerptFr : post.excerptEn}
                  </p>
                )}
                <span className="eyebrow mt-auto pt-5 text-navy">
                  {t("site.blog.readMore")} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} />
      </Container>

      {/* The live rooms section: this is generated from the real inventory,
          not written by hand, so it can never drift from what reception sees. */}
      <section className="mt-20 bg-surface-muted py-20 sm:mt-28 sm:py-28 lg:py-32">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              eyebrow={t("live.liveBadge")}
              title={t("site.blog.roomsFeed")}
              lede={t("site.blog.roomsFeedLead")}
              action={
                <Link href="/rooms">
                  <GhostLink>{t("site.home.allRooms")}</GhostLink>
                </Link>
              }
            />
          </Reveal>

          <div className="mt-10 grid gap-x-6 gap-y-12 sm:mt-14 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-16 lg:grid-cols-3">
            {rooms.map((room, index) => (
              <Reveal key={room.id} delay={(index % 3) * 90}>
                <RoomCard room={room} range={range} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
