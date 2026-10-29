"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DUR, EASE } from "./bits";

const DISMISS_KEY = "afvar-home-cta-dismissed";
/** Hysteresis band so tiny scroll reversals around the threshold don't flicker the card. */
const HYSTERESIS_PX = 80;

function readDismissed() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * W9.1.4 / spec §16 — floating launch CTA. A compact macOS-notification-style
 * card (bottom-right on desktop, slim bottom banner on mobile) that appears
 * once the user scrolls past the hero stage and hides again while the
 * `#launch` queue section is on screen. Whole card links to /register; the ✕
 * dismisses it for the session.
 */
export function FloatingCta() {
  const [dismissed, setDismissed] = useState(readDismissed);
  const [pastHero, setPastHero] = useState(false);
  const [launchInView, setLaunchInView] = useState(false);
  const reduceMotion = useReducedMotion();

  // Single rAF-throttled scroll listener. "Past the hero" = the overview
  // section (first block after the hero) has reached the upper viewport — this
  // holds for the pinned desktop track, the reduced-motion hero and the taller
  // mobile hero alike. Fallback: the old viewport-multiple estimate.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const overview = document.getElementById("overview");
      const lg = window.matchMedia("(min-width: 1024px)").matches;
      const threshold = overview
        ? overview.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.6
        : window.innerHeight * (lg ? 2.4 : 0.9);
      const y = window.scrollY;
      setPastHero((prev) => (y > threshold ? true : y < threshold - HYSTERESIS_PX ? false : prev));
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll(); // initial position (state settles inside the rAF callback)
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // Hide while the launch-queue section (last section before the footer) is visible.
  useEffect(() => {
    const target = document.getElementById("launch");
    if (!target) return undefined;
    const io = new IntersectionObserver((entries) => {
      setLaunchInView(entries.some((e) => e.isIntersecting));
    });
    io.observe(target);
    return () => io.disconnect();
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* session-only dismissal still works via state */
    }
  }, []);

  const visible = pastHero && !launchInView && !dismissed;
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 };
  const shown = reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          key="floating-cta"
          aria-label="Launch queue reminder"
          initial={hidden}
          animate={shown}
          exit={hidden}
          transition={{ duration: DUR.panel, ease: EASE }}
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 sm:inset-x-auto sm:right-[max(1.5rem,env(safe-area-inset-right))] sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          {/* Spec §15 — solid dark notification-style surface, not glass. */}
          <div className="flex items-center gap-1 rounded-2xl border border-white/[.11] bg-[#111416] p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,.85)] sm:max-w-[360px]">
            <Link
              href="/register"
              className="group flex min-w-0 flex-1 items-baseline gap-x-2 rounded-xl px-3.5 py-2.5 text-[13.5px] leading-snug transition-colors duration-300 hover:bg-white/[.05]"
            >
              <span className="truncate font-medium text-[#F5F7F7]">Join the Launch Queue</span>
              <span className="shrink-0 text-[#A3AAAC]">—</span>
              <span className="shrink-0 font-semibold text-white underline-offset-4 group-hover:underline">Register now</span>
            </Link>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismiss}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[13px] leading-none text-[#A3AAAC] transition-colors duration-300 hover:bg-white/[.06] hover:text-[#F5F7F7]"
            >
              ✕
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/** Nav height (site nav: fixed `h-[72px]`). */
const NAV_PX = 72;

/**
 * Page progress line — a 1px green market line fixed under the nav that fills
 * left→right with scroll progress (transform scaleX only). Hidden while the hero
 * is pinned: progress starts once `#overview` reaches the nav. Sits below the nav
 * menus (z-30 < mobile menu z-40 < header z-50). Reduced motion: hidden.
 */
export function ScrollProgress() {
  const { scrollY } = useScroll();
  const start = useMotionValue(Number.POSITIVE_INFINITY);
  const end = useMotionValue(1);

  // Measure into motion values (not React state): no re-renders, no setState-in-effect.
  useEffect(() => {
    const measure = () => {
      const overview = document.getElementById("overview");
      start.set(overview ? overview.getBoundingClientRect().top + window.scrollY - NAV_PX : window.innerHeight);
      end.set(Math.max(1, document.documentElement.scrollHeight - window.innerHeight));
    };
    measure();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(document.body);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [start, end]);

  const scaleX = useTransform(() => {
    const from = start.get();
    const span = Math.max(1, end.get() - from);
    return Math.min(1, Math.max(0, (scrollY.get() - from) / span));
  });
  const opacity = useTransform(() => (scrollY.get() > start.get() ? 1 : 0));

  return (
    <motion.div
      aria-hidden="true"
      data-testid="scroll-progress"
      className="pointer-events-none fixed inset-x-0 top-[72px] z-30 h-px origin-left bg-[#00E676] motion-reduce:hidden"
      style={{ scaleX, opacity }}
    />
  );
}
