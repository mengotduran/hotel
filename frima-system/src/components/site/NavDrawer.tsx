"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { MessageKey } from "@/lib/i18n/dictionaries";

/**
 * The drawer navigation: a floating panel inset from the viewport, with the
 * page blurred and dimmed behind it. Links are grouped under italic serif
 * headings and the call to action is pinned to the bottom of the panel.
 */

interface DrawerLink {
  href: string;
  labelKey: MessageKey;
  viewAll?: boolean;
}

interface DrawerGroup {
  titleKey?: MessageKey;
  links: DrawerLink[];
}

interface DrawerTab {
  id: string;
  labelKey: MessageKey;
  groups: DrawerGroup[];
}

const TABS: DrawerTab[] = [
  {
    id: "stay",
    labelKey: "drawer.tab.stay",
    groups: [
      { links: [{ href: "/", labelKey: "site.nav.home" }] },
      {
        titleKey: "drawer.group.rooms",
        links: [
          { href: "/rooms?kind=ROOM", labelKey: "room.kind.ROOM" },
          { href: "/rooms?kind=STUDIO", labelKey: "room.kind.STUDIO" },
          { href: "/rooms?kind=APARTMENT", labelKey: "room.kind.APARTMENT" },
          { href: "/rooms", labelKey: "drawer.viewAll", viewAll: true },
        ],
      },
      {
        titleKey: "drawer.group.booking",
        links: [
          { href: "/rooms", labelKey: "drawer.availability" },
          { href: "/booking", labelKey: "drawer.track" },
        ],
      },
    ],
  },
  {
    id: "services",
    labelKey: "drawer.tab.services",
    groups: [
      {
        titleKey: "drawer.group.dining",
        links: [{ href: "/dining", labelKey: "site.nav.dining" }],
      },
      {
        titleKey: "drawer.group.events",
        links: [
          { href: "/events", labelKey: "site.nav.events" },
          { href: "/rooms?kind=HALL", labelKey: "drawer.hallAvailability" },
        ],
      },
    ],
  },
  {
    id: "hotel",
    labelKey: "drawer.tab.hotel",
    groups: [
      { links: [{ href: "/about", labelKey: "site.nav.about" }] },
      {
        titleKey: "drawer.group.news",
        links: [
          { href: "/blog?category=ROOMS", labelKey: "drawer.liveRooms" },
          { href: "/blog?category=OFFERS", labelKey: "drawer.offers" },
          { href: "/blog", labelKey: "drawer.viewAll", viewAll: true },
        ],
      },
      { links: [{ href: "/contact", labelKey: "site.nav.contact" }] },
    ],
  },
];

export function NavDrawer({
  open,
  onClose,
  phone,
}: {
  open: boolean;
  onClose: () => void;
  phone: string;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState(TABS[0].id);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      // Keep focus inside the panel while it is the only thing on screen.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const active = TABS.find((candidate) => candidate.id === tab) ?? TABS[0];

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
    >
      {/* The page stays visible behind the panel, pushed back out of focus. */}
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label={t("nav.closeMenu")}
        onClick={onClose}
        className={`absolute inset-0 w-full cursor-default bg-navy-deep/45 backdrop-blur-xl transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.menu")}
        className={`absolute inset-y-3 left-3 flex w-[min(21rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl bg-surface shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:inset-y-4 sm:left-4 ${
          open
            ? "translate-x-0 opacity-100"
            : "-translate-x-6 opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 p-3">
          <div className="flex flex-1 gap-1.5" role="tablist" aria-label={t("nav.menu")}>
            {TABS.map((candidate) => {
              const selected = candidate.id === active.id;
              return (
                <button
                  key={candidate.id}
                  type="button"
                  role="tab"
                  tabIndex={open ? 0 : -1}
                  aria-selected={selected}
                  onClick={() => setTab(candidate.id)}
                  className={`flex-1 rounded-md px-3 py-2 text-[0.8125rem] transition-colors duration-200 ${
                    selected
                      ? "bg-gold font-medium text-navy-deep"
                      : "bg-surface-muted text-muted hover:text-foreground"
                  }`}
                >
                  {t(candidate.labelKey)}
                </button>
              );
            })}
          </div>
          <button
            ref={closeRef}
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={onClose}
            aria-label={t("nav.closeMenu")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 pb-6 pt-3" role="tabpanel">
          {active.groups.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className={
                groupIndex > 0 ? "mt-8 border-t border-line pt-8" : ""
              }
            >
              {group.titleKey && (
                <p className="font-display mb-4 text-base italic text-muted">
                  {t(group.titleKey)}
                </p>
              )}
              <ul className="space-y-[0.9rem]">
                {group.links.map((link) => (
                  <li key={`${link.href}-${link.labelKey}`}>
                    <Link
                      href={link.href}
                      tabIndex={open ? 0 : -1}
                      onClick={onClose}
                      className={`link-underline inline-block text-base leading-snug transition-colors duration-200 hover:text-gold ${
                        link.viewAll ? "text-muted" : "text-foreground"
                      }`}
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <Link
            href="/rooms"
            tabIndex={open ? 0 : -1}
            onClick={onClose}
            className="block rounded-lg bg-surface-muted px-4 py-4 text-center text-[0.8125rem] tracking-[0.06em] text-foreground transition-colors duration-300 hover:bg-navy hover:text-white"
          >
            {t("drawer.cta")}
          </Link>
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              tabIndex={open ? 0 : -1}
              className="mt-2 block text-center text-xs text-muted transition-colors hover:text-navy"
            >
              {t("drawer.callUs")} · {phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
