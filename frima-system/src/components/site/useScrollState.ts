"use client";

import { useEffect, useState } from "react";

export interface ScrollState {
  /** Past the hero, so the header needs a surface behind it. */
  scrolled: boolean;
  /** Hide the header while reading downward, bring it back on the way up. */
  hidden: boolean;
}

/**
 * Tracks position and direction in one rAF-throttled listener.
 *
 * The header disappears while a visitor reads downward and slides back as
 * frosted glass the moment they scroll up, which is the behaviour on the
 * reference site.
 */
export function useScrollState(revealAfter = 64): ScrollState {
  const [state, setState] = useState<ScrollState>({
    scrolled: false,
    hidden: false,
  });

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const delta = y - last;

      // Ignore rubber-banding and sub-pixel jitter.
      if (Math.abs(delta) < 6) return;

      setState({
        scrolled: y > 24,
        hidden: delta > 0 && y > revealAfter,
      });
      last = y;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    // Deferred so the initial reading does not cause a second render pass
    // immediately after hydration.
    const first = requestAnimationFrame(() =>
      setState({ scrolled: window.scrollY > 24, hidden: false }),
    );
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener("scroll", onScroll);
    };
  }, [revealAfter]);

  return state;
}
