"use client";

import { useEffect, useRef } from "react";
import { HeroSlider, type HeroSlide } from "./HeroSlider";

/**
 * Wraps the hero slideshow in a tall (230vh) scroll-through: the slideshow
 * stays pinned at the top of the viewport while the headline dissolves in
 * place (blur + fade, no movement, so it can never be cropped by the
 * stage's clipping edge), mist rises over it, and a solid layer in the
 * site's own background colour thickens in step with the mist — not after
 * it — so the two read as one continuous fog rather than two stacked
 * clouds. By the time normal scrolling resumes, the page has already
 * turned the same off-white as the section below it. There is no seam to
 * cross; the visitor just walks into cloud and the cloud turns out to
 * already be the next section.
 *
 * Ported from a reference demo (canvas cloud sprites + scroll-driven
 * progress), restyled to resolve into `var(--background)` instead of a
 * fixed snow colour, and without the reference's Lenis smooth-scroll layer
 * — the eased progress-follow below already smooths the motion; adding a
 * global smooth-scroll library would change the feel of every other page.
 */

interface Puff {
  x: number;
  yOff: number;
  depth: number;
  size: number;
  sprite: HTMLCanvasElement;
  phase: number;
  speed: number;
  side: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
const ease = (t: number) => t * t * (3 - 2 * t);

/** One soft cloud sprite: overlapping radial puffs, shaded underneath for volume. */
function makeSprite(): HTMLCanvasElement {
  const s = document.createElement("canvas");
  s.width = s.height = 256;
  const c = s.getContext("2d")!;
  for (let i = 0; i < 46; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.7) * 78;
    const x = 128 + Math.cos(a) * r * 1.25;
    const y = 136 + Math.sin(a) * r * 0.6;
    const rad = rand(26, 62);
    const g = c.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, "rgba(255,255,255,.26)");
    g.addColorStop(0.6, "rgba(250,252,253,.10)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, rad, 0, 7);
    c.fill();
  }
  c.globalCompositeOperation = "source-atop";
  const sh = c.createLinearGradient(0, 90, 0, 220);
  sh.addColorStop(0, "rgba(160,178,192,0)");
  sh.addColorStop(1, "rgba(150,168,184,.35)");
  c.fillStyle = sh;
  c.fillRect(0, 0, 256, 256);
  return s;
}

export function MistHero({
  slides,
  children,
}: {
  slides: HeroSlide[];
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mistRef = useRef<HTMLCanvasElement>(null);
  const whiteoutRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const mist = mistRef.current;
    const whiteout = whiteoutRef.current;
    const content = contentRef.current;
    if (!wrapper || !mist || !whiteout || !content) return;

    const mctx = mist.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let puffs: Puff[] = [];
    const sprites = [makeSprite(), makeSprite(), makeSprite(), makeSprite()];

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      mist!.width = W;
      mist!.height = H;
      const n = W < 600 ? 34 : 60;
      puffs = Array.from({ length: n }, () => {
        const depth = rand(0.4, 1.3);
        return {
          x: rand(-0.15, 1.15),
          yOff: rand(0, 0.7),
          depth,
          size: rand(0.45, 0.85) * Math.max(W, H * 1.1) * depth,
          sprite: sprites[(Math.random() * sprites.length) | 0],
          phase: rand(0, 6.28),
          speed: rand(0.05, 0.14),
          side: Math.random() < 0.5 ? -1 : 1,
        };
      }).sort((a, b) => a.depth - b.depth);
    }

    function progress() {
      const r = wrapper!.getBoundingClientRect();
      return clamp(-r.top / (r.height - window.innerHeight));
    }

    let p = progress();
    let raf = 0;

    function frame(t: number) {
      const target = progress();
      p += (target - p) * 0.09;
      if (Math.abs(target - p) < 0.0004) p = target;
      const s = t / 1000;

      const visible = wrapper!.getBoundingClientRect().bottom > 0;
      if (!visible) {
        raf = requestAnimationFrame(frame);
        return;
      }

      // Headline block: dissolves in place (blur + fade only, no movement)
      // so it can never be cropped by the stage's clipping edge regardless
      // of how tall the content block is — it is gone well before the mist
      // or the whiteout become dense enough to matter.
      const tp = range(p, 0.04, 0.34);
      content!.style.filter = `blur(${tp * 10}px)`;
      content!.style.opacity = String(1 - tp);

      // Mist puffs rise with scroll, near layers faster (parallax), plus idle
      // drift. Alpha is capped well under 1 so the canvas texture reads as
      // haze, not as its own solid cloud — the whiteout below is the one
      // layer that actually turns fully opaque, so the two never look like
      // two separate clouds stacking on top of each other.
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.clearRect(0, 0, W, H);
      const density = ease(range(p, 0.04, 0.5));
      for (const f of puffs) {
        const drift = reduce ? 0 : Math.sin(s * f.speed + f.phase) * 30 * f.depth;
        const x = f.x * W + drift + f.side * p * W * 0.06 * f.depth;
        const w = f.size * (1 + p * 0.25);
        const h = w * 0.62;
        const y = H * (1 + f.yOff * 0.5) + h * 0.45 - p * H * (1.5 + f.depth * 0.9);
        const a = clamp(density * (0.35 + f.depth * 0.25));
        if (a < 0.005 || y - h / 2 > H) continue;
        mctx.globalAlpha = a;
        mctx.drawImage(f.sprite, x - w / 2, y - h / 2, w, h);
      }
      mctx.globalAlpha = 1;

      // Solid layer, in the page's own background colour, starts climbing
      // as soon as the mist begins (not after it) so the two read as one
      // continuous thickening fog rather than a haze layer followed by a
      // separate white layer.
      //
      // It settles at exactly 0 rather than overshooting past it: the layer
      // is anchored to the stage's bottom edge, so travelling any further up
      // would lift its bottom edge clear of the stage and leave a strip of
      // bare hero showing underneath the fog.
      const wp = ease(range(p, 0.18, 0.72));
      whiteout!.style.translate = `0 ${(1 - wp) * 100}%`;

      raf = requestAnimationFrame(frame);
    }

    resize();
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative h-[200vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <HeroSlider slides={slides}>
          <div ref={contentRef} className="relative w-full will-change-[filter,opacity]">
            {children}
          </div>
        </HeroSlider>

        {/* Both fog layers sit above the slideshow's own arrows and dots
            (z-10), so the fog swallows them along with everything else
            rather than leaving controls floating over a white screen. */}
        <canvas ref={mistRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20" />
        <div
          ref={whiteoutRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[140%] will-change-[translate]"
          style={{
            translate: "0 100%",
            // Solid for the bottom 75% of a layer 140% as tall as the stage,
            // so once it has finished travelling the whole viewport is the
            // flat background colour — no residual gradient at the top for
            // the eye to catch against the section below. The remaining 25%
            // is the soft leading edge that reads as the cloud front.
            background:
              "linear-gradient(to top, var(--background) 0%, var(--background) 75%, color-mix(in srgb, var(--background) 0%, transparent) 100%)",
          }}
        />
      </div>
    </div>
  );
}
