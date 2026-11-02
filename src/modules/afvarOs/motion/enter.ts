"use client";

// Entrance primitives for the Platform scroll-motion layer
// (docs/PLATFORM-SCROLL-MOTION-PLAN.md). Everything here is a no-op when
// PLATFORM_MOTION is off or the visitor prefers reduced motion: callers render
// their finished state. Transform / opacity / clip-path only.
import { inView } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { useAfvarReducedMotion } from "../story/useStory";
import { PLATFORM_MOTION } from "./flag";

/**
 * "Reading focus" for stacked OS cards (plan C2): the card nearest the middle of
 * the screen at full ink, the others slightly receded. Off until reviewed.
 */
export const PLATFORM_READING_FOCUS = false;

/**
 * Entrance values start at 0 while the motion layer is on (also in the server render).
 * When it turns out to be off (reduced motion after hydration), finish them at 1.
 */
export function useSettle(on: boolean, ...values: MotionValue<number>[]) {
  useEffect(() => {
    if (!on) for (const v of values) v.set(1);
  });
}

/** True when the motion layer should play (flag on, no reduced-motion preference). */
export function useMotionOn(): boolean {
  const reduced = useAfvarReducedMotion();
  return PLATFORM_MOTION && !reduced;
}

const splashUp = () => typeof document !== "undefined" && document.querySelector("[data-afvar-splash]:not([hidden])") !== null;

/** Runs `cb` once the site's intro splash has gone (at once if there is none). Returns a cancel function. */
export function afterSplash(cb: () => void): () => void {
  if (!splashUp()) {
    cb();
    return () => {};
  }
  let done = false;
  const go = () => {
    if (done || splashUp()) return;
    done = true;
    window.clearInterval(poll);
    window.removeEventListener("afvar:opened", onOpen);
    // Let the splash's own fade finish before anything enters.
    window.setTimeout(cb, 120);
  };
  const onOpen = () => window.setTimeout(go, 0);
  const poll = window.setInterval(go, 200);
  window.addEventListener("afvar:opened", onOpen);
  return () => {
    done = true;
    window.clearInterval(poll);
    window.removeEventListener("afvar:opened", onOpen);
  };
}

/** True once the splash is gone (false during server render and while it plays). */
export function useSplashGone(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const id = window.setInterval(cb, 250);
      window.addEventListener("afvar:opened", cb);
      return () => {
        window.clearInterval(id);
        window.removeEventListener("afvar:opened", cb);
      };
    },
    () => !splashUp(),
    () => false,
  );
}

/**
 * A small scheduler so things that enter together go in order, `gap` ms apart
 * (or after the previous one's `hold`, e.g. while an Ask is typing).
 */
export interface EnterQueue {
  /** Delay (ms) for the next entrance; the one after waits at least `hold` ms more. */
  claim(hold?: number): number;
}
export function createEnterQueue(gap = 130): EnterQueue {
  let free = 0;
  return {
    claim(hold = gap) {
      const now = performance.now();
      const start = Math.max(now, free);
      free = start + hold;
      return start - now;
    },
  };
}
/** One queue per component instance. */
export function useEnterQueue(gap = 130): EnterQueue {
  const [q] = useState(() => createEnterQueue(gap));
  return q;
}

/**
 * Calls `onEnter` once, when the element first scrolls into view (and the splash
 * has gone). Nothing fires while `enabled` is false.
 */
export function useOnEnter(ref: RefObject<Element | null>, enabled: boolean, onEnter: () => void, amount: number | "some" | "all" = 0.25, margin = "0px 0px -20% 0px") {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === "undefined") return;
    let cancel = () => {};
    const stop = inView(
      el,
      () => {
        stop();
        cancel = afterSplash(onEnter);
      },
      { amount, margin: margin as never },
    );
    return () => {
      stop();
      cancel();
    };
    // onEnter is read once per element; re-subscribing on every render would replay it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ref]);
}
