"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Container, Eyebrow } from "./primitives";
import { FrimaLogo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";
import type { MessageKey } from "@/lib/i18n/dictionaries";

const EXPLORE: { href: string; key: MessageKey }[] = [
  { href: "/rooms?kind=ROOM", key: "room.kind.ROOM" },
  { href: "/rooms?kind=STUDIO", key: "room.kind.STUDIO" },
  { href: "/rooms?kind=APARTMENT", key: "room.kind.APARTMENT" },
  { href: "/dining", key: "site.nav.dining" },
  { href: "/events", key: "site.nav.events" },
];

const HOTEL: { href: string; key: MessageKey }[] = [
  { href: "/about", key: "site.nav.about" },
  { href: "/blog", key: "site.nav.blog" },
  { href: "/contact", key: "site.nav.contact" },
  { href: "/booking", key: "drawer.track" },
];

export function SiteFooter({
  hotel,
}: {
  hotel: { name: string; tagline: string; address: string; city: string; phones: string };
}) {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const phones = hotel.phones.split("·").map((p) => p.trim()).filter(Boolean);

  return (
    <footer className="border-t border-white/10 bg-navy-deep text-white/65">
      <Container size="wide" className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:gap-10">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              {t("site.footer.newsletterTitle")}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/55">
              {t("site.footer.newsletterLead")}
            </p>
            <NewsletterForm />
          </div>

          <div>
            <Eyebrow tone="light">{t("site.footer.findUs")}</Eyebrow>
            <address className="mt-5 space-y-1 text-base not-italic leading-relaxed">
              <p>{hotel.address}</p>
              <p className="text-white/45">{hotel.city}</p>
            </address>
            <ul className="mt-5 space-y-2">
              {phones.map((phone) => (
                <li key={phone}>
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="text-base transition-colors duration-300 hover:text-gold"
                  >
                    {phone}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-white/35">{t("site.footer.hours")}</p>
          </div>

          <div>
            <Eyebrow tone="light">{t("site.footer.groupExplore")}</Eyebrow>
            <ul className="mt-5 space-y-3">
              {EXPLORE.map((link) => (
                <li key={`${link.href}-${link.key}`}>
                  <Link
                    href={link.href}
                    className="text-base transition-colors duration-300 hover:text-gold"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Eyebrow tone="light">{t("drawer.tab.hotel")}</Eyebrow>
            <ul className="mt-5 space-y-3">
              {HOTEL.map((link) => (
                <li key={`${link.href}-${link.key}`}>
                  <Link
                    href={link.href}
                    className="text-base transition-colors duration-300 hover:text-gold"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-10 sm:mt-16 sm:pt-12">
          <FrimaLogo size="footer" />
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container size="wide">
          <div className="flex flex-wrap items-center justify-between gap-3 py-6 text-[0.6875rem] tracking-[0.1em] uppercase text-white/35">
            <p>
              © {year} {hotel.name} · {t("site.footer.rights")}
            </p>
            <Link href="/admin" className="transition-colors hover:text-gold">
              {t("site.nav.adminLink")}
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}
