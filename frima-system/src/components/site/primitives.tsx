"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Editorial primitives for the public site.
 *
 * The layout leans on two things: a wide-tracked uppercase label above a
 * large light heading, and generous whitespace between bands. These keep that
 * rhythm consistent instead of re-tuning spacing on every page.
 */

/** Fades a band up as it enters the viewport. Honours reduced-motion via CSS. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "header";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Without IntersectionObserver the content must still be readable. Set the
    // class straight on the node rather than through state, so this costs no
    // extra render and cannot mismatch what the server sent.
    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/** Small, wide-tracked, uppercase · the label that sits above a heading. */
export function Eyebrow({
  children,
  className = "",
  tone = "muted",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "muted" | "gold" | "light";
}) {
  const colour = {
    muted: "text-muted",
    gold: "text-[#9a7a12]",
    light: "text-white/55",
  }[tone];

  return (
    <p className={`eyebrow ${colour} ${className}`}>
      {children}
    </p>
  );
}

/** A thin rule used to separate bands without a heavy border. */
export function Rule({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t border-line ${className}`} />;
}

/** Standard page width. Bands that bleed full width opt out of this. */
export function Container({
  children,
  className = "",
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}) {
  const max = {
    narrow: "max-w-3xl",
    default: "max-w-6xl",
    wide: "max-w-[90rem]",
  }[size];

  return (
    <div className={`mx-auto w-full ${max} px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

/** Label + heading + optional standfirst, in the proportions used throughout. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  tone = "dark",
  action,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
  action?: React.ReactNode;
}) {
  const centered = align === "center";

  return (
    <div
      className={`flex flex-wrap items-end gap-6 ${centered ? "justify-center text-center" : "justify-between"}`}
    >
      <div className={centered ? "max-w-2xl" : "max-w-2xl"}>
        {eyebrow && (
          <Eyebrow tone={tone === "light" ? "light" : "gold"} className="mb-4">
            {eyebrow}
          </Eyebrow>
        )}
        <h2
          className={`display-md ${tone === "light" ? "text-white" : "text-navy"}`}
        >
          {title}
        </h2>
        {lede && (
          <p
            className={`mt-4 lede ${tone === "light" ? "text-white/70" : "text-muted"}`}
          >
            {lede}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Quiet outline button · the default call to action on the public site. */
export function GhostLink({
  children,
  tone = "dark",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "dark" | "light" | "gold";
  className?: string;
}) {
  const style = {
    dark: "border-navy/25 text-navy hover:bg-navy hover:text-white",
    light: "border-white/30 text-white hover:bg-white hover:text-navy-deep",
    gold: "border-transparent bg-gold text-navy-deep hover:bg-gold-soft",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-2.5 border px-6 py-3 text-[0.8125rem] font-medium tracking-[0.08em] uppercase transition-colors duration-300 ${style} ${className}`}
    >
      {children}
    </span>
  );
}
