"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { LiveRefresh } from "@/components/live/LiveRefresh";
import { Container, Eyebrow, GhostLink, Reveal, SectionHeading } from "./primitives";
import { Rail } from "./Rail";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export interface PriceItem {
  code: string;
  nameFr: string;
  nameEn: string;
  unitPrice: number;
  unit: string;
  category: string | null;
}

/**
 * Shared layout for the editorial pages. Price lists are read from the service
 * items the admin already maintains, so a tariff change in the back office
 * shows here with no second place to edit.
 */
export function ContentPage({
  titleKey,
  leadKey,
  intro,
  highlights,
  items,
  ctaHref,
  ctaKey,
  itemsTitleKey,
  imageIds = [],
}: {
  titleKey: MessageKey;
  leadKey: MessageKey;
  intro: string[];
  highlights: { titleKey: MessageKey; body: string }[];
  items?: PriceItem[];
  ctaHref?: string;
  ctaKey?: MessageKey;
  itemsTitleKey?: MessageKey;
  imageIds?: string[];
}) {
  const { t, n, money } = useI18n();

  const grouped = new Map<string, PriceItem[]>();
  for (const item of items ?? []) {
    const key = item.category ?? "—";
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return (
    <main className="pb-20 pt-28 sm:pb-28 sm:pt-36 lg:pb-32 lg:pt-40">
      <LiveRefresh topics={["rooms"]} />

      <Container size="wide">
        <Reveal>
          <Eyebrow tone="gold">{t("site.section.house")}</Eyebrow>
          <h1 className="display-lg mt-5 max-w-3xl text-navy">{t(titleKey)}</h1>
          <p className="lede mt-5 max-w-xl text-muted">{t(leadKey)}</p>
        </Reveal>
      </Container>

      {imageIds.length > 0 && (
        <Reveal className="mt-12 sm:mt-16">
          <Rail label={t(titleKey)}>
            {imageIds.map((id, index) => (
              <figure
                key={id}
                className={`shrink-0 overflow-hidden ${
                  index % 2 === 0
                    ? "aspect-[4/3] w-[84vw] sm:w-[30rem] lg:w-[34rem]"
                    : "aspect-[3/4] w-[70vw] sm:w-[20rem] lg:w-[22rem]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/media/${id}`}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="img-fade h-full w-full object-cover"
                />
              </figure>
            ))}
          </Rail>
        </Reveal>
      )}

      <Container size="wide" className="mt-16 sm:mt-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <Reveal>
            <div className="space-y-6">
              {intro.map((para, index) => (
                <p
                  key={index}
                  className={
                    index === 0 ? "lede text-foreground" : "copy text-muted"
                  }
                >
                  {para}
                </p>
              ))}
            </div>

            {ctaHref && ctaKey && (
              <Link href={ctaHref} className="mt-10 inline-block">
                <GhostLink>{t(ctaKey)}</GhostLink>
              </Link>
            )}
          </Reveal>

          <Reveal delay={140}>
            <dl className="border-t border-line">
              {highlights.map((highlight) => (
                <div key={highlight.titleKey} className="border-b border-line py-6">
                  <dt className="eyebrow text-[#9a7a12]">{t(highlight.titleKey)}</dt>
                  <dd className="copy mt-3 text-muted">{highlight.body}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </Container>

      {items && items.length > 0 && (
        <Container size="wide" className="mt-20 sm:mt-28 lg:mt-32">
          <Reveal>
            <SectionHeading
              eyebrow={t("site.menu.from")}
              title={t(itemsTitleKey ?? titleKey)}
            />
          </Reveal>

          <div className="mt-10 grid gap-x-10 gap-y-10 sm:mt-12 sm:grid-cols-2 lg:gap-x-16">
            {[...grouped.entries()].map(([group, groupItems], index) => (
              <Reveal key={group} delay={index * 90}>
                <h3 className="eyebrow border-b border-line pb-4 text-muted">
                  {group}
                </h3>
                <ul>
                  {groupItems.map((item) => (
                    <li
                      key={item.code}
                      className="flex items-baseline justify-between gap-6 border-b border-line/60 py-4"
                    >
                      <span className="text-base">{n(item)}</span>
                      <span className="shrink-0 text-right">
                        <span className="tabular text-base text-navy">
                          {money(item.unitPrice)}
                        </span>
                        <span className="ml-1.5 text-xs text-muted">/ {item.unit}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </Container>
      )}
    </main>
  );
}
