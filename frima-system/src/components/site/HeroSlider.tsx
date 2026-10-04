"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface HeroSlide {
  id: string;
  alt: string;
}

/**
 * The home page hero.
 *
 * Slides cross-fade rather than sliding sideways, so the headline sitting on
 * top never has to move. Advances on its own, pauses when the tab is hidden or
 * the pointer is over the controls, and stops entirely under reduced-motion.
 */
export function HeroSlider({
  slides,
  interval = 6500,
  children,
}: {
  slides: HeroSlide[];
  interval?: number;
  children: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  const count = slides.length;
  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % count),
      interval,
    );
    return () => window.clearInterval(timer);
  }, [count, interval, paused]);

  // A slideshow running in a tab nobody is looking at is wasted work.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <section className="relative flex min-h-[88svh] items-end overflow-hidden bg-navy-deep sm:min-h-[92svh]">
      <div
        className="absolute inset-0"
        onTouchStart={(e) => {
          touchStart.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStart.current === null) return;
          const delta = e.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(delta) > 50) go(index + (delta < 0 ? 1 : -1));
          touchStart.current = null;
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/media/${slide.id}`}
              alt={i === index ? slide.alt : ""}
              fetchPriority={i === 0 ? "high" : "auto"}
              loading={i === 0 ? "eager" : "lazy"}
              className={`h-full w-full object-cover ${i === index ? "hero-pan" : ""}`}
            />
          </div>
        ))}

        {/* Two scrims: one lifts the whole frame off the bright sky, the
            other darkens the side the copy sits on so a pale photograph
            cannot swallow the headline. */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/50 to-navy-deep/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/70 via-navy-deep/25 to-transparent" />
      </div>

      <div className="relative w-full">{children}</div>

      {count > 1 && (
        <div
          className="absolute bottom-5 right-4 z-10 flex items-center gap-2 sm:bottom-7 sm:right-6 lg:right-8"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="mr-2 hidden items-center gap-1.5 sm:flex">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`${i + 1} / ${count}`}
                aria-current={i === index}
                className="group grid h-6 w-6 place-items-center"
              >
                <span
                  className={`block h-px transition-all duration-500 ${
                    i === index
                      ? "w-6 bg-gold"
                      : "w-3 bg-white/40 group-hover:w-5 group-hover:bg-white/70"
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous"
            className="glass-pill grid h-10 w-10 place-items-center text-navy transition-colors hover:text-gold"
          >
            <Arrow className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next"
            className="glass-pill grid h-10 w-10 place-items-center text-navy transition-colors hover:text-gold"
          >
            <Arrow className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}

export function Arrow({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
