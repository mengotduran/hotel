"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { NavDrawer } from "./NavDrawer";
import { FrimaLogo } from "./Logo";
import { useScrollState } from "./useScrollState";

/**
 * The header sits transparent over a hero, retreats while a visitor reads
 * downward, and slides back as frosted glass the moment they scroll up.
 */
export function SiteHeader({ phone }: { phone: string }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { scrolled, hidden } = useScrollState();

  // Only the home page and unit pages lead with a full-bleed hero.
  const overHero = pathname === "/" || /^\/rooms\/[^/]+$/.test(pathname);
  const inverted = overHero && !scrolled;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[translate,background-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        } ${inverted ? "bg-transparent" : "glass"}`}
      >
        <div className="relative mx-auto flex max-w-[90rem] items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t("nav.menu")}
            aria-expanded={open}
            className={`group flex shrink-0 items-center gap-3 text-[0.75rem] tracking-[0.16em] uppercase transition-colors duration-500 sm:text-[0.8125rem] ${
              inverted ? "text-white/85 hover:text-white" : "text-muted hover:text-navy"
            }`}
          >
            <span className="flex w-5 flex-col gap-[5px]">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`block h-px transition-all duration-500 ${
                    i === 2 ? "w-3 group-hover:w-full" : "w-full"
                  } ${inverted ? "bg-white/80" : "bg-foreground"}`}
                />
              ))}
            </span>
            <span className="hidden sm:inline">{t("nav.menu")}</span>
          </button>

          <Link
            href="/"
            aria-label={t("app.name")}
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center"
          >
            <FrimaLogo priority invert={inverted} />
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
            <Link
              href="/rooms"
              className={`border px-2.5 py-1.5 text-[0.625rem] tracking-[0.08em] uppercase transition-colors duration-300 sm:px-6 sm:py-2.5 sm:text-[0.75rem] sm:tracking-[0.1em] ${
                inverted
                  ? "border-white/35 text-white hover:bg-white hover:text-navy-deep"
                  : "border-navy/25 text-navy hover:bg-navy hover:text-white"
              }`}
            >
              {t("site.nav.book")}
            </Link>
          </div>
        </div>
      </header>

      <NavDrawer open={open} onClose={() => setOpen(false)} phone={phone} />
    </>
  );
}
