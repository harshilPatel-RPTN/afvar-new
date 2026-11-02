"use client";

// Page-level motion state for the Platform pages (docs/PLATFORM-SCROLL-MOTION-PLAN.md, D + E).
//
//   useMotionOn()     the layer is on: PLATFORM_MOTION and no reduced motion
//   useSplashGone()   the site's intro splash ([data-afvar-splash]) has gone
//   useReveal(...)    entrance status of the items in a container, from one
//                     IntersectionObserver: "static" (visible, never animated),
//                     "wait" (hidden until it enters) or "in" (entering, with a
//                     stagger delay). Items start "static", so the server HTML
//                     and the no-JS page show everything; only items that are
//                     off screen on mount get hidden, and they reveal once in view.
import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { PLATFORM_MOTION, useAfvarReducedMotion } from "@/modules/afvarOs";

export function useMotionOn(): boolean {
  const reduced = useAfvarReducedMotion();
  return PLATFORM_MOTION && !reduced;
}

const splashUp = () => document.querySelector("[data-afvar-splash]:not([hidden])") !== null;
function subscribeSplash(cb: () => void) {
  window.addEventListener("afvar:opened", cb);
  // The splash may also be removed without the event (skipped intro, timeouts).
  const poll = window.setInterval(() => {
    if (!splashUp()) {
      window.clearInterval(poll);
      cb();
    }
  }, 250);
  return () => {
    window.removeEventListener("afvar:opened", cb);
    window.clearInterval(poll);
  };
}

export function useSplashGone(): boolean {
  return useSyncExternalStore(subscribeSplash, () => !splashUp(), () => false);
}

export type RevealStatus = "static" | "wait" | "in";
export interface RevealState {
  s: RevealStatus;
  /** Entrance delay (s) of this item within the batch that entered with it. */
  d: number;
  /** When the whole batch has entered (s) — for marks that come last. */
  end: number;
}
const STATIC: RevealState = { s: "static", d: 0, end: 0 };

/**
 * Entrance status of every `[data-reveal="<i>"]` inside `root` (or of `root`
 * itself when it carries `data-reveal`). Items entering together are staggered
 * `step` seconds apart, in index order.
 */
export function useReveal(root: RefObject<HTMLElement | null>, step = 0.14) {
  const on = useMotionOn();
  const gone = useSplashGone();
  const [state, setState] = useState<Record<number, RevealState>>({});
  // Source of truth for the observer callbacks (written only there, never in render).
  const live = useRef<{ map: Record<number, RevealState>; batchAt: number; batchN: number }>({ map: {}, batchAt: -1e9, batchN: 0 });

  useEffect(() => {
    const el = root.current;
    if (!on || !el || typeof IntersectionObserver === "undefined") return;
    const items = el.hasAttribute("data-reveal") ? [el] : [...el.querySelectorAll<HTMLElement>("[data-reveal]")];
    if (!items.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const L = live.current;
        const next = { ...L.map };
        const entering: number[] = [];
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.reveal);
          if (!next[i]) {
            // First sight: off screen (or under the splash) → hidden until it enters.
            next[i] = !e.isIntersecting || !gone ? { s: "wait", d: 0, end: 0 } : STATIC;
          }
          if (e.isIntersecting && gone && next[i].s === "wait") entering.push(i);
        }
        if (entering.length) {
          entering.sort((a, b) => a - b);
          // Items that enter in quick succession share one stagger.
          const now = performance.now();
          const since = (now - L.batchAt) / 1000;
          const cont = since < 0.2;
          const base = cont ? Math.max(0, L.batchN * step - since) : 0;
          if (!cont) {
            L.batchAt = now;
            L.batchN = 0;
          }
          L.batchN += entering.length;
          const end = base + entering.length * step;
          entering.forEach((i, k) => (next[i] = { s: "in", d: base + k * step, end }));
        }
        L.map = next;
        setState(next);
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    items.forEach((it) => io.observe(it));
    return () => io.disconnect();
  }, [root, on, gone, step]);

  return (i: number): RevealState => (on ? (state[i] ?? STATIC) : STATIC);
}
