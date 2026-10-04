"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { LOCALES, type Locale } from "@/lib/i18n/config";

/**
 * A GTranslate-style float switcher: ONE white box (background, radius,
 * shadow and overflow-hidden all live on this outer box only), containing
 * two stacked block rows with no gap between them — the options list, then
 * the current-language bar. Because both rows are plain block children of
 * the same shrink-wrapped box, they are always exactly the same width; there
 * is no second card, no border between them, just one box with two rows.
 *
 * The options row is removed from the DOM when closed (display:none, not
 * absolute positioning) so the box's own size includes it only while it's
 * actually there. Opening mounts it, then on the next frame adds the
 * "expanded" styles so the opacity/transform transition actually runs from
 * its start state; closing reverses that immediately but only unmounts 200ms
 * later, matching the source widget's own show()/hide() timing.
 */

const FLAG: Record<Locale, string> = { fr: "/flags/fr.svg", en: "/flags/gb.svg" };
const NAME: Record<Locale, string> = { fr: "Français", en: "English" };

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [want, setWant] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Mirrors the original's show(): mount immediately, then add the open
  // class 10ms later so the transition has a start state to animate from.
  // A single requestAnimationFrame is not reliable here — it can still fire
  // before the browser paints the closed state in the same frame, in which
  // case the mount and the open style land in one paint with no visible
  // transition. A real macrotask (setTimeout) guarantees a paint happens
  // first, same as the reference implementation.
  function openPanel() {
    setWant(true);
    setRendered(true);
    window.setTimeout(() => setExpanded(true), 10);
  }

  // Mirrors hide(): drop the open class immediately (so it starts
  // transitioning back), then unmount 200ms later once that's had time to
  // play — this part genuinely is a delayed side effect, so it stays here.
  function closePanel() {
    setWant(false);
    setExpanded(false);
  }

  useEffect(() => {
    if (want || !rendered) return;
    const timeout = setTimeout(() => setRendered(false), 200);
    return () => clearTimeout(timeout);
  }, [want, rendered]);

  useEffect(() => {
    if (!want) return;

    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) closePanel();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [want]);

  const others = LOCALES.filter((code) => code !== locale);

  return (
    <div ref={ref} className="fixed bottom-4 left-4 z-50 sm:bottom-5 sm:left-5">
      <div className="inline-block overflow-hidden rounded-[2px] bg-white shadow-[0_5px_15px_rgba(0,0,0,0.15)]">
        {rendered && (
          <ul
            role="listbox"
            className={`block transition-[opacity,translate] duration-[800ms] ease-[cubic-bezier(0.3,1.1,0.4,1.1)] ${
              expanded ? "translate-x-0 opacity-100" : "translate-y-[-30px] opacity-0"
            }`}
          >
            {others.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    setLocale(code);
                    closePanel();
                  }}
                  className="block w-full whitespace-nowrap px-[15px] py-[10px] text-left text-sm text-[#444] transition-colors duration-300 hover:bg-[#6070a0] hover:text-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={FLAG[code]} alt="" width={33} height={22} className="mr-[5px] inline-block rounded-[3px] align-middle" />
                  {NAME[code]}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => (want ? closePanel() : openPanel())}
          aria-expanded={want}
          aria-haspopup="listbox"
          aria-label={`${NAME[locale]} — ${others.map((c) => NAME[c]).join(", ")}`}
          className="flex w-full items-center whitespace-nowrap bg-white px-[15px] py-[10px] text-left uppercase text-[#333]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={FLAG[locale]} alt="" width={33} height={22} className="mr-[5px] inline-block rounded-[3px] align-middle" />
          <span className="text-[0.8125rem] font-bold tracking-[0.02em]">{locale}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`ml-auto h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-300 ${
              want ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            <path d="M6 15l6-6 6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
