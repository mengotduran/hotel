"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Container, Eyebrow, GhostLink, Reveal } from "./primitives";

export function ContactView({
  hotel,
}: {
  hotel: {
    name: string;
    address: string;
    city: string;
    country: string;
    phones: string;
    email: string;
  };
}) {
  const { t } = useI18n();
  const mapsQuery = encodeURIComponent(
    `${hotel.name}, ${hotel.address}, ${hotel.city}, ${hotel.country}`,
  );

  return (
    <main className="pb-20 pt-28 sm:pb-28 sm:pt-36 lg:pb-32 lg:pt-40">
      <Container size="wide">
      <Reveal>
        <Eyebrow tone="gold">{t("site.section.practical")}</Eyebrow>
        <h1 className="display-lg mt-5 text-navy">{t("site.contact.title")}</h1>
        <p className="lede mt-5 max-w-xl text-muted">{t("site.contact.lead")}</p>
      </Reveal>

      <div className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:mt-16 lg:grid-cols-2">
        <section className="bg-surface p-8 sm:p-10">
          <h2 className="eyebrow text-muted">
            {t("site.contact.address")}
          </h2>
          <address className="mt-3 space-y-0.5 text-base not-italic leading-relaxed">
            <p className="font-semibold text-navy">{hotel.name}</p>
            <p>{hotel.address}</p>
            <p>
              {hotel.city}, {hotel.country}
            </p>
          </address>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block"
          >
            <GhostLink>{t("site.contact.openInMaps")} ↗</GhostLink>
          </a>
        </section>

        <section className="bg-surface p-8 sm:p-10">
          <h2 className="eyebrow text-muted">
            {t("site.contact.phones")}
          </h2>
          <ul className="mt-3 space-y-2">
            {hotel.phones
              .split("·")
              .map((phone) => phone.trim())
              .filter(Boolean)
              .map((phone) => (
                <li key={phone}>
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="text-base font-medium text-navy transition-colors hover:text-gold"
                  >
                    {phone}
                  </a>
                </li>
              ))}
          </ul>

          {hotel.email && (
            <>
              <h2 className="eyebrow mt-8 text-muted">
                {t("common.email")}
              </h2>
              <a
                href={`mailto:${hotel.email}`}
                className="mt-2 block text-base text-navy transition-colors hover:text-gold"
              >
                {hotel.email}
              </a>
            </>
          )}

          <p className="mt-8 border-t border-line pt-6 text-sm text-muted">
            {t("site.footer.hours")}
          </p>
        </section>
      </div>
      </Container>

      <section className="mt-20 bg-navy-deep py-16 text-white sm:mt-24 sm:py-20 lg:py-24">
        <Container size="narrow">
          <Reveal>
            <div className="text-center">
              <Eyebrow tone="light">{t("site.nav.book")}</Eyebrow>
              <h2 className="display-md mt-5 text-white">{t("site.home.heroCta")}</h2>
              <p className="lede mx-auto mt-5 max-w-lg text-white/65">
                {t("site.book.payOnArrival")}
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link href="/rooms">
                  <GhostLink tone="gold">{t("site.nav.rooms")}</GhostLink>
                </Link>
                <Link href="/booking">
                  <GhostLink tone="light">{t("site.book.trackTitle")}</GhostLink>
                </Link>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
