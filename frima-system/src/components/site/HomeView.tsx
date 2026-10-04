"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { LiveRefresh } from "@/components/live/LiveRefresh";
import { HeroSlider, type HeroSlide } from "./HeroSlider";
import { Rail } from "./Rail";
import { RoomCard, type RoomCardData } from "./RoomCard";
import { ScrollFeature, type FeatureItem } from "./ScrollFeature";
import {
  Container, Eyebrow, GhostLink, Reveal, Rule, SectionHeading,
} from "./primitives";
import type { MessageKey } from "@/lib/i18n/dictionaries";

export interface HomePost {
  slug: string;
  titleFr: string;
  titleEn: string;
  excerptFr: string | null;
  excerptEn: string | null;
  category: string;
  publishedAt: string | null;
  coverId: string | null;
}

const SERVICES: { key: MessageKey; href: string; descKey: MessageKey }[] = [
  { key: "dept.HEB", href: "/rooms", descKey: "site.home.featuredLead" },
  { key: "dept.RES", href: "/dining", descKey: "site.dining.lead" },
  { key: "dept.ESP", href: "/events", descKey: "site.events.lead" },
];

export interface TourMedia {
  rooms: [string, string];
  dining: [string, string];
  events: [string, string];
  location: [string, string];
}

export function HomeView({
  rooms,
  posts,
  range,
  availableCount,
  heroSlides = [],
  stripImageIds = [],
  tourMedia,
  tourHalls = [],
}: {
  rooms: RoomCardData[];
  posts: HomePost[];
  range: { checkIn: string; checkOut: string; nights: number };
  availableCount: number;
  heroSlides?: HeroSlide[];
  stripImageIds?: string[];
  tourMedia?: TourMedia;
  tourHalls?: { name: string; capacity: number }[];
}) {
  const { t, locale, date } = useI18n();

  const tourItems: FeatureItem[] = tourMedia
    ? [
        {
          id: "tour-rooms",
          number: "01",
          tabLabel: locale === "fr" ? "Chambres & appartements" : "Rooms & apartments",
          title:
            locale === "fr"
              ? "Des unités pensées pour chaque séjour"
              : "Units built for every kind of stay",
          paragraph:
            locale === "fr"
              ? "Chambres pour une nuit de transit, studios et appartements meublés pour les séjours qui durent. Climatisation, Wi-Fi et salle d'eau privative dans chaque unité."
              : "Rooms for a night in transit, furnished studios and apartments for stays that last. Air conditioning, Wi-Fi and a private bathroom in every unit.",
          bullets:
            locale === "fr"
              ? [
                  "Chambres, studios et appartements meublés",
                  "Climatisation et Wi-Fi dans toutes les unités",
                  "Eau chaude et salle d'eau privative",
                  "Groupe électrogène de secours",
                ]
              : [
                  "Rooms, studios and furnished apartments",
                  "Air conditioning and Wi-Fi in every unit",
                  "Hot water and a private bathroom",
                  "Backup generator",
                ],
          ctaLabel: t("site.home.allRooms"),
          href: "/rooms",
          bgImageId: tourMedia.rooms[0],
          fgImageId: tourMedia.rooms[1],
          fgAlt: locale === "fr" ? "Chambre à FRIMA Guest Suites" : "A room at FRIMA Guest Suites",
        },
        {
          id: "tour-dining",
          number: "02",
          tabLabel: t("site.dining.title"),
          title:
            locale === "fr"
              ? "Un restaurant qui vit toute la journée"
              : "A restaurant that keeps its own hours",
          paragraph:
            locale === "fr"
              ? "Cuisine camerounaise et internationale préparée à la commande. Petit-déjeuner dès six heures, bar ouvert jusqu'en soirée."
              : "Cameroonian and international cooking, made to order. Breakfast from six, the bar open into the evening.",
          bullets:
            locale === "fr"
              ? [
                  "Petit-déjeuner buffet, 6h – 10h",
                  "Restaurant à la carte, 12h – 22h",
                  "Bar ouvert jusqu'à 23h",
                  "Service en chambre et plateaux-repas pour groupes",
                ]
              : [
                  "Breakfast buffet, 6am – 10am",
                  "À la carte restaurant, noon – 10pm",
                  "Bar open until 11pm",
                  "Room service and group catering",
                ],
          ctaLabel: locale === "fr" ? "Découvrir la carte" : "See the menu",
          href: "/dining",
          bgImageId: tourMedia.dining[0],
          fgImageId: tourMedia.dining[1],
          fgAlt: locale === "fr" ? "Restaurant de FRIMA Guest Suites" : "FRIMA Guest Suites restaurant",
        },
        {
          id: "tour-events",
          number: "03",
          tabLabel: t("site.events.title"),
          title:
            locale === "fr"
              ? "Des espaces modulables pour chaque réunion"
              : "Flexible spaces for every gathering",
          paragraph:
            locale === "fr"
              ? "Salle de conférence, salle de réunion et espace événementiel, équipés pour le travail comme pour la réception."
              : "A conference room, a meeting room and an event space, equipped for work and for receptions alike.",
          bullets: [
            tourHalls.length > 0
              ? tourHalls
                  .map((hall) =>
                    locale === "fr"
                      ? `${hall.name} (${hall.capacity} places)`
                      : `${hall.name} (${hall.capacity} seats)`,
                  )
                  .join(" · ")
              : locale === "fr"
                ? "Salles modulables sur demande"
                : "Modular spaces on request",
            locale === "fr"
              ? "Sonorisation, vidéoprojecteur et Wi-Fi"
              : "Sound system, projector and Wi-Fi",
            locale === "fr" ? "Climatisation dans tous les espaces" : "Air conditioning throughout",
            locale === "fr" ? "Groupe électrogène de secours inclus" : "Backup generator included",
          ],
          ctaLabel: locale === "fr" ? "Organiser un événement" : "Plan an event",
          href: "/events",
          bgImageId: tourMedia.events[0],
          fgImageId: tourMedia.events[1],
          fgAlt: locale === "fr" ? "Espace événementiel de FRIMA Guest Suites" : "FRIMA Guest Suites event space",
        },
        {
          id: "tour-location",
          number: "04",
          tabLabel: locale === "fr" ? "Emplacement" : "Location",
          title: locale === "fr" ? "À dix minutes de l'aéroport" : "Ten minutes from the airport",
          paragraph:
            locale === "fr"
              ? "Posé sur l'axe de l'aéroport international de Nsimalen, à Ntoun. Une étape naturelle pour les voyageurs en transit comme pour les séjours de travail à Yaoundé."
              : "On the road to Nsimalen International Airport, in Ntoun. A natural stop for travellers in transit and for work stays in Yaoundé.",
          bullets:
            locale === "fr"
              ? [
                  "10 minutes de l'aéroport de Nsimalen",
                  "Navette aéroport sur demande",
                  "Parking sécurisé",
                  "Réception ouverte 24h/24",
                ]
              : [
                  "10 minutes from Nsimalen airport",
                  "Airport shuttle on request",
                  "Secure parking",
                  "Reception open 24/7",
                ],
          ctaLabel: t("site.home.heroSecondary"),
          href: "/contact",
          bgImageId: tourMedia.location[0],
          fgImageId: tourMedia.location[1],
          fgAlt: locale === "fr" ? "FRIMA Guest Suites, Ntoun" : "FRIMA Guest Suites, Ntoun",
        },
      ]
    : [];

  return (
    <main>
      <LiveRefresh topics={["rooms", "availability", "blog"]} />

      {/* ----------------------------------------------------------------- */}
      {/* Hero                                                               */}
      {/* ----------------------------------------------------------------- */}
      <HeroSlider slides={heroSlides}>
        <Container size="wide" className="pb-24 pt-32 sm:pb-28 sm:pt-36">
          <Reveal>
            <Eyebrow tone="light" className="on-image-soft">
              {t("site.hero.coords")}
            </Eyebrow>
            <h1 className="display-xl on-image mt-5 max-w-4xl text-white sm:mt-6">
              {t("site.home.heroTitle")}
            </h1>
            <p className="lede on-image-soft mt-5 max-w-xl text-white/80 sm:mt-7">
              {t("site.home.heroLead")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-10">
              <Link href="/rooms">
                <GhostLink tone="gold">{t("site.home.heroCta")}</GhostLink>
              </Link>
              <Link href="/contact">
                <GhostLink tone="light">{t("site.home.heroSecondary")}</GhostLink>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={200}>
            {/* `contents` lets every label share one grid row and every value
                the next, so the figures line up however the labels wrap. */}
            <dl className="mt-10 grid max-w-3xl grid-cols-3 items-end gap-x-4 gap-y-2 border-t border-white/15 pt-6 sm:mt-14 sm:gap-x-8 sm:pt-8">
              {[
                { label: t("site.home.statRooms"), value: String(availableCount) },
                { label: t("site.home.statAirport"), value: `10 ${t("site.home.minutes")}` },
                { label: t("site.home.statReception"), value: "24/7" },
              ].map((stat) => (
                <div key={stat.label} className="contents">
                  <dt className="eyebrow on-image-soft row-start-1 self-end text-[0.5625rem] leading-relaxed text-white/60 sm:text-[0.6875rem]">
                    {stat.label}
                  </dt>
                  <dd className="display-md on-image row-start-2 text-white">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </Container>
      </HeroSlider>

      {/* ----------------------------------------------------------------- */}
      {/* Narrative                                                          */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-20 sm:py-28 lg:py-32">
        <Container size="narrow">
          <Reveal>
            <Eyebrow tone="gold">{t("site.section.house")}</Eyebrow>
            <p className="lede mt-7 text-foreground">
              {locale === "fr"
                ? "FRIMA Guest Suites est un établissement familial posé sur l'axe de l'aéroport de Nsimalen. Chambres pour une nuit de transit, studios et appartements meublés pour les séjours qui durent. Entre les deux, une cuisine, un bar et des salles de réunion qui vivent toute la journée."
                : "FRIMA Guest Suites is a family-run property on the road to Nsimalen airport. Rooms for a night in transit, furnished studios and apartments for stays that last. In between, a kitchen, a bar and meeting rooms that keep their own hours."}
            </p>
            <p className="copy mt-6 text-muted">
              {locale === "fr"
                ? "La réception est tenue jour et nuit : une arrivée à deux heures du matin ne surprend personne. Le petit-déjeuner commence à six heures, ce qui laisse le temps avant un vol matinal."
                : "Reception is staffed day and night, so a two-in-the-morning arrival surprises nobody. Breakfast starts at six, which leaves time before an early flight."}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Property tour, scroll-synced                                       */}
      {/* ----------------------------------------------------------------- */}
      {tourItems.length > 0 && (
        <ScrollFeature
          eyebrow={t("site.section.tour")}
          heading={t("site.home.tourHeading")}
          lede={t("site.home.tourLede")}
          items={tourItems}
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Accommodation, live                                               */}
      {/* ----------------------------------------------------------------- */}
      <section className="bg-surface-muted py-20 sm:py-28 lg:py-32">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              eyebrow={t("site.section.stay")}
              title={t("site.home.featured")}
              lede={t("site.home.featuredLead")}
              action={
                <Link href="/rooms">
                  <GhostLink>{t("site.home.allRooms")}</GhostLink>
                </Link>
              }
            />
          </Reveal>

          {rooms.length === 0 ? (
            <p className="mt-14 border border-dashed border-line py-20 text-center text-sm text-muted">
              {t("site.rooms.noneAvailable")}
            </p>
          ) : (
            <div className="mt-10 grid gap-x-6 gap-y-12 sm:mt-14 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
              {rooms.map((room, index) => (
                <Reveal key={room.id} delay={index * 90}>
                  <RoomCard room={room} range={range} />
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* A closer look                                                      */}
      {/* ----------------------------------------------------------------- */}
      {stripImageIds.length > 0 && (
        <section className="py-20 sm:py-28 lg:py-32">
          <Container size="wide">
            <Reveal>
              <Eyebrow tone="gold">{t("site.section.closerLook")}</Eyebrow>
            </Reveal>
          </Container>

          <Reveal className="mt-8 sm:mt-10">
            <Rail label={t("site.section.closerLook")}>
              {stripImageIds.map((id, index) => (
                <figure
                  key={id}
                  className={`shrink-0 overflow-hidden ${
                    index % 3 === 0
                      ? "aspect-[3/4] w-[72vw] sm:w-[20rem] lg:w-[23rem]"
                      : "aspect-[4/3] w-[84vw] sm:w-[27rem] lg:w-[32rem]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/media/${id}`}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="img-fade h-full w-full object-cover transition-transform duration-[1200ms] hover:scale-105"
                  />
                </figure>
              ))}
            </Rail>
          </Reveal>
        </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Pull quote                                                         */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-16 sm:py-24">
        <Container size="narrow">
          <Reveal>
            <blockquote className="text-center">
              <p className="font-display display-md italic text-navy">
                “{t("site.quote")}”
              </p>
              <footer className="eyebrow mt-8 text-muted">
                {t("site.quoteAuthor")}
              </footer>
            </blockquote>
          </Reveal>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Departments                                                        */}
      {/* ----------------------------------------------------------------- */}
      <section className="pb-20 sm:pb-28 lg:pb-32">
        <Container size="wide">
          <Rule className="mb-16 sm:mb-20" />
          <Reveal>
            <SectionHeading
              eyebrow={t("dept.title")}
              title={t("site.home.services")}
              lede={t("site.home.servicesLead")}
            />
          </Reveal>

          <div className="mt-10 grid gap-px overflow-hidden border border-line bg-line sm:mt-14 sm:grid-cols-3">
            {SERVICES.map((service, index) => (
              <Reveal key={service.href} delay={index * 110}>
                <Link
                  href={service.href}
                  className="group relative flex h-full flex-col overflow-hidden bg-surface p-8 transition-colors duration-500 hover:bg-navy-deep sm:p-10"
                >
                  <span className="eyebrow text-muted transition-colors duration-500 group-hover:text-gold">
                    0{index + 1}
                  </span>
                  <h3 className="display-md mt-6 text-navy transition-colors duration-500 group-hover:text-white">
                    {t(service.key)}
                  </h3>
                  <p className="copy mt-4 flex-1 text-muted transition-colors duration-500 group-hover:text-white/65">
                    {t(service.descKey)}
                  </p>
                  <span className="eyebrow mt-10 flex items-center gap-3 text-navy transition-colors duration-500 group-hover:text-gold">
                    {t("common.view")}
                    <span className="block h-px w-6 bg-current transition-all duration-500 group-hover:w-12" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* News                                                               */}
      {/* ----------------------------------------------------------------- */}
      {posts.length > 0 && (
        <section className="bg-surface-muted py-20 sm:py-28 lg:py-32">
          <Container size="wide">
            <Reveal>
              <SectionHeading
                eyebrow={t("drawer.group.news")}
                title={t("site.home.news")}
                lede={t("site.home.newsLead")}
                action={
                  <Link href="/blog">
                    <GhostLink>{t("site.home.allNews")}</GhostLink>
                  </Link>
                }
              />
            </Reveal>

            <div className="mt-10 grid gap-x-6 gap-y-12 sm:mt-14 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
              {posts.map((post, index) => (
                <Reveal key={post.slug} delay={index * 90}>
                  <Link href={`/blog/${post.slug}`} className="group block">
                    <div className="aspect-[16/10] overflow-hidden bg-surface">
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
                    <p className="eyebrow mt-6 text-[#9a7a12]">
                      {t(`site.blog.cat.${post.category}` as MessageKey)}
                      {post.publishedAt && (
                        <span className="ml-3 tracking-normal normal-case text-muted">
                          {date(post.publishedAt)}
                        </span>
                      )}
                    </p>
                    <h3 className="mt-3 text-xl font-light leading-snug text-navy transition-colors duration-300 group-hover:text-gold">
                      {locale === "fr" ? post.titleFr : post.titleEn}
                    </h3>
                    {(locale === "fr" ? post.excerptFr : post.excerptEn) && (
                      <p className="copy mt-3 line-clamp-2 text-muted">
                        {locale === "fr" ? post.excerptFr : post.excerptEn}
                      </p>
                    )}
                  </Link>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Closing call to action                                             */}
      {/* ----------------------------------------------------------------- */}
      <section className="bg-navy-deep py-20 text-white sm:py-28 lg:py-32">
        <Container size="narrow">
          <Reveal>
            <div className="text-center">
              <Eyebrow tone="light">{t("site.nav.book")}</Eyebrow>
              <h2 className="display-lg mt-6 text-white">{t("site.cta.title")}</h2>
              <p className="lede mx-auto mt-6 max-w-xl text-white/65">
                {t("site.cta.lede")}
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link href="/rooms">
                  <GhostLink tone="gold">{t("site.rooms.checkAvailability")}</GhostLink>
                </Link>
                <Link href="/contact">
                  <GhostLink tone="light">{t("site.nav.contact")}</GhostLink>
                </Link>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
