"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Arrow } from "./HeroSlider";

/**
 * A horizontal strip that scrolls without a scrollbar.
 *
 * It keeps native momentum and snapping on touch, so a thumb flick works the
 * way it does everywhere else on a phone, and adds arrows plus a progress line
 * for pointer users. The browser's scrollbar is hidden by the `rail` class.
 */
export function Rail({
  children,
  label,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [progress, setProgress] = useState(0);
  const [overflows, setOverflows] = useState(false);

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;

    const max = node.scrollWidth - node.clientWidth;
    setOverflows(max > 8);
    setAtStart(node.scrollLeft <= 4);
    setAtEnd(node.scrollLeft >= max - 4);
    setProgress(max > 0 ? node.scrollLeft / max : 0);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Measure after layout settles rather than during the effect, so the
    // first paint is not followed by an immediate second render.
    const first = requestAnimationFrame(measure);
    node.addEventListener("scroll", measure, { passive: true });

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const child of Array.from(node.children)) observer.observe(child);

    return () => {
      cancelAnimationFrame(first);
      node.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [measure]);

  /** Steps by one card, so the snap points line up after the scroll. */
  const step = (direction: 1 | -1) => {
    const node = ref.current;
    if (!node) return;
    const first = node.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(node).columnGap || "0") || 16;
    const distance = first ? first.offsetWidth + gap : node.clientWidth * 0.8;
    node.scrollBy({ left: distance * direction, behavior: "smooth" });
  };

  return (
    <div className={className}>
      <div
        ref={ref}
        role="group"
        aria-label={label}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            step(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            step(-1);
          }
        }}
        // scroll-padding keeps snapping aligned to the page gutter rather than
        // to the raw scrollport edge, so the first card is never flush-cut.
        className="rail flex gap-3 overflow-x-auto px-4 scroll-pl-4 sm:gap-4 sm:px-6 sm:scroll-pl-6 lg:px-8 lg:scroll-pl-8"
      >
        {children}
      </div>

      {overflows && (
        <div className="mx-auto mt-5 flex max-w-[90rem] items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* A thin progress line replaces the scrollbar it is standing in for. */}
          <div className="h-px flex-1 bg-line">
            <div
              className="h-px bg-navy transition-[width,transform] duration-200"
              style={{
                width: "28%",
                transform: `translateX(${progress * (100 / 0.28 - 100)}%)`,
              }}
            />
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={atStart}
              aria-label="Previous"
              className="grid h-10 w-10 place-items-center border border-line text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white disabled:opacity-30 disabled:hover:border-line disabled:hover:bg-transparent disabled:hover:text-navy"
            >
              <Arrow className="h-4 w-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={atEnd}
              aria-label="Next"
              className="grid h-10 w-10 place-items-center border border-line text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white disabled:opacity-30 disabled:hover:border-line disabled:hover:bg-transparent disabled:hover:text-navy"
            >
              <Arrow className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
