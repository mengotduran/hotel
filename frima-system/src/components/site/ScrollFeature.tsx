"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Container, Eyebrow, Reveal } from "./primitives";

/**
 * Scroll-synced feature tour: a sticky numbered rail on the left, one text
 * panel per item scrolling normally in the middle, and — on large screens —
 * a sticky image stage on the right that cross-fades to whichever panel is
 * centred in the viewport. Pattern taken from the "Everything your team
 * needs" section on sanity.io; this is an independent rebuild (not their
 * code) restyled in FRIMA's own navy/gold rather than their black/orange.
 *
 * Below xl, the stage disappears and each panel carries its own inline
 * image card instead; below md, the rail becomes a horizontal strip that
 * scrolls itself to keep the active tab in view.
 *
 * No ancestor here may use `overflow: hidden` — that silently breaks the
 * sticky rail and stage.
 */

export interface FeatureItem {
  id: string;
  number: string;
  tabLabel: string;
  title: string;
  paragraph: string;
  bullets: string[];
  ctaLabel: string;
  href: string;
  bgImageId: string;
  fgImageId: string;
  fgAlt: string;
}

const DOTS =
  "url(\"data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='0.75' cy='0.75' r='0.75' fill='%23ffffff' fill-opacity='0.3'/%3E%3C/svg%3E\")";

export function ScrollFeature({
  eyebrow,
  heading,
  lede,
  items,
}: {
  eyebrow: string;
  heading: string;
  lede?: string;
  items: FeatureItem[];
}) {
  const [active, setActive] = useState(0);
  const [parallax, setParallax] = useState(0);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const stripRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // The panel crossing the vertical middle of the viewport becomes active —
  // a 0px-tall trigger line pinned at 50%, not a scroll-position calculation.
  useEffect(() => {
    const panels = panelRefs.current.filter((p): p is HTMLElement => p !== null);
    if (panels.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = panelRefs.current.indexOf(entry.target as HTMLElement);
          if (index !== -1) setActive(index);
        });
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    panels.forEach((panel) => io.observe(panel));
    return () => io.disconnect();
  }, [items.length]);

  // Mobile/tablet: keep the active tab visible in the horizontal strip.
  useEffect(() => {
    const strip = stripRef.current;
    const tab = tabRefs.current[active];
    if (!strip || !tab || strip.scrollWidth <= strip.clientWidth) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({ left: tab.offsetLeft - 24, behavior: reduce ? "auto" : "smooth" });
  }, [active]);

  // Background parallax on the active layer only, while the stage is shown.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    const RANGE = 40;
    function update() {
      ticking = false;
      const stage = stageRef.current;
      const panel = panelRefs.current[active];
      if (!stage || !panel || getComputedStyle(stage).display === "none") return;
      const rect = panel.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight / 2 - rect.top) / rect.height));
      setParallax((0.5 - progress) * RANGE);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, [active]);

  return (
    <section className="bg-navy-deep py-20 text-white sm:py-28 lg:py-32" aria-labelledby="feature-tour-heading">
      <Container size="wide">
        <Reveal>
          <Eyebrow tone="light">{eyebrow}</Eyebrow>
          <h2 id="feature-tour-heading" className="display-lg mt-5 max-w-2xl text-white">
            {heading}
          </h2>
          {lede && <p className="lede mt-5 max-w-xl text-white/70">{lede}</p>}
        </Reveal>
      </Container>

      <div className="relative mt-14 sm:mt-16 md:grid md:grid-cols-12 md:gap-x-1 lg:mt-20">
        {/* 1. Tabs: horizontal sticky strip on mobile, sticky left rail on md+ */}
        <nav
          ref={stripRef}
          aria-label={eyebrow}
          className="sticky top-16 z-10 -mx-5 overflow-x-auto bg-navy-deep px-5 py-3 [scrollbar-width:none] sm:-mx-8 sm:px-8 md:col-span-3 md:mx-0 md:h-[calc(100vh-5rem)] md:border-r-[16px] md:border-navy-deep md:px-0 md:py-0 md:[background-clip:content-box] xl:col-span-2 [&::-webkit-scrollbar]:hidden"
          style={{ backgroundImage: DOTS, backgroundSize: "8px 8px" }}
        >
          <ul className="flex w-max list-none gap-6 md:w-full md:flex-col md:gap-0 md:py-3">
            {items.map((item, index) => (
              <li key={item.id} className="shrink-0 md:py-1">
                <a
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  href={`#${item.id}`}
                  aria-current={active === index ? "true" : undefined}
                  className="group flex w-fit items-start bg-navy-deep text-white no-underline"
                  onClick={(event) => {
                    event.preventDefault();
                    panelRefs.current[index]?.scrollIntoView({
                      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                        ? "auto"
                        : "smooth",
                      block: "start",
                    });
                  }}
                >
                  <span
                    className={`block px-2 py-2 font-mono text-[0.8125rem] uppercase leading-[1.3] transition-colors duration-200 ${
                      active === index ? "bg-white text-navy-deep" : "group-hover:bg-gold group-hover:text-navy-deep"
                    }`}
                  >
                    {item.number}
                  </span>
                  <span className="block w-max px-2 py-2 font-mono text-[0.8125rem] uppercase leading-[1.3] text-white/85 md:w-auto">
                    {item.tabLabel}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 2. Text panels */}
        <div className="mt-2 flex flex-col gap-24 md:col-span-9 md:mt-0 md:gap-32 xl:col-span-4 xl:gap-0">
          {items.map((item, index) => (
            <section
              key={item.id}
              id={item.id}
              ref={(el) => {
                panelRefs.current[index] = el;
              }}
              className="relative grid scroll-mt-16 gap-6 xl:min-h-[calc(100vh-5rem)]"
            >
              <div className="grid items-start gap-8 xl:grid-cols-1 xl:auto-rows-max xl:gap-8 xl:pr-12">
                <h3 className="mt-4 text-[1.75rem] font-light leading-[1.1] tracking-[-0.02em] text-white lg:text-[2.375rem]">
                  {item.title}
                </h3>
                <div className="grid gap-8 lg:grid-cols-2 lg:gap-6 xl:grid-cols-1 xl:gap-8">
                  <p className="text-lg leading-[1.3] tracking-[-0.01em] text-white/85">{item.paragraph}</p>
                  <ul className="flex flex-col gap-4 pl-4 text-[0.9375rem] leading-[1.3] text-white/65 [list-style:disc_outside]">
                    {item.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Link
                    href={item.href}
                    className="inline-flex items-center justify-center rounded-full border border-current px-3.5 py-2.5 font-mono text-[0.8125rem] uppercase leading-[1.3] text-white transition-colors duration-200 hover:border-gold hover:bg-gold hover:text-navy-deep"
                  >
                    {item.ctaLabel}
                  </Link>
                </div>

                {/* Inline media card: shown below xl, replaced by the sticky stage above it */}
                <div className="relative isolate flex aspect-[4/3] items-start overflow-hidden bg-gradient-to-br from-navy to-navy-deep pl-4 pt-8 xl:hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/media/${item.bgImageId}`} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/media/${item.fgImageId}`}
                    alt={item.fgAlt}
                    loading="lazy"
                    className="h-auto max-h-[50vh] w-full object-cover object-[top_right] sm:aspect-[3/4]"
                  />
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* 3. Sticky media stage, xl+ only. Decorative duplicate of the inline cards. */}
        <div
          ref={stageRef}
          aria-hidden="true"
          className="hidden xl:sticky xl:top-20 xl:col-span-6 xl:block xl:h-[calc(100vh-5rem)] 2xl:col-span-7"
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`absolute inset-0 flex items-center justify-end overflow-hidden border-b-[24px] border-navy-deep bg-gradient-to-br from-navy to-navy-deep transition-opacity duration-[600ms] ease-linear ${
                active === index ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/media/${item.bgImageId}`}
                alt=""
                loading="lazy"
                className="absolute inset-0 -z-10 h-full w-full scale-125 object-cover transition-transform duration-150 ease-linear"
                style={active === index ? { transform: `translateY(${parallax}px) scale(1.25)` } : undefined}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/media/${item.fgImageId}`}
                alt=""
                loading="lazy"
                className="h-auto max-h-[50vw] w-full translate-x-8 object-contain object-right"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
