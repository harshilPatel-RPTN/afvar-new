"use client";

// Floating launch CTA: a small notification-style card that appears once the
// visitor is past Chapter 01 and hides while the launch queue or footer is on
// screen. Visibility follows position (IntersectionObserver), not scroll
// direction, so it never flickers on small scroll reversals. Dismissible for
// the session. Top-right like a system notification on desktop (clear of every
// chapter's captions, chips and honesty labels); a compact safe-area banner on
// mobile. It steps aside while the visitor is scrolling (the pinned chapters
// put captions under it) and returns once they pause.
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFilmOnScreen } from "./filmPresence";
import { HAIR, MONO, REGISTER_HREF } from "./ui";
import "./mobile-page.css";

const DISMISS_KEY = "afvar-demo-reminder-dismissed";

export function LaunchReminder() {
  const [pastHero, setPastHero] = useState(false);
  const [nearEnd, setNearEnd] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  // Hidden on first render either way (not past the hero yet), so reading
  // storage here can't cause a hydration mismatch.
  const [dismissed, setDismissed] = useState(() => {
    try {
      return typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false; // storage unavailable — the reminder simply shows
    }
  });

  useEffect(() => {
    const hero = document.getElementById("chapter-01");
    const heroIO = new IntersectionObserver(([entry]) => {
      setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    if (hero) heroIO.observe(hero);

    const visible = new Set<Element>();
    const endIO = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      setNearEnd(visible.size > 0);
    });
    for (const el of [document.getElementById("launch-queue"), document.querySelector("footer")]) {
      if (el) endIO.observe(el);
    }

    let idle: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      setScrolling(true);
      clearTimeout(idle);
      idle = setTimeout(() => setScrolling(false), 900);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      heroIO.disconnect();
      endIO.disconnect();
      window.removeEventListener("scroll", onScroll);
      clearTimeout(idle);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  // The home film carries its own Register buttons; the reminder waits until it is over.
  const filmOnScreen = useFilmOnScreen();
  const show = pastHero && !nearEnd && !dismissed && !scrolling && !filmOnScreen;

  return (
    <AnimatePresence>
      {show ? (
        <motion.aside
          key="reminder"
          aria-label="Launch queue reminder"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className={`hm-reminder fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 border ${HAIR} bg-(--afvar-panel) sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-[124px] sm:w-80`}
        >
          <div className="flex items-center gap-3 px-3 py-2.5 sm:items-start sm:p-4">
            <span className="hm-reminder-dot" aria-hidden="true" />
            <span className="hm-reminder-mark flex h-7 w-7 shrink-0 items-center justify-center bg-(--afvar-mint) text-sm font-bold text-(--afvar-forest) sm:mt-0.5 sm:h-8 sm:w-8" aria-hidden="true">
              A
            </span>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:block">
              <p className={`${MONO} hidden text-(--afvar-muted) sm:block`}>AFVAR · Pre-launch</p>
              <p className="hm-reminder-text text-[13px] leading-snug text-(--afvar-text) sm:mt-1 sm:text-sm">Join the Launch Queue</p>
              <Link
                href={REGISTER_HREF}
                className="hm-reminder-cta afvar-glass-button afvar-glass-primary inline-flex shrink-0 items-center rounded-full px-3.5 py-2 text-[13px] font-semibold sm:mt-2"
              >
                Register now
              </Link>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss reminder"
              className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center text-(--afvar-muted) transition-colors hover:text-(--afvar-text) focus-visible:outline-2 focus-visible:outline-(--afvar-mint)"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2 2l8 8M10 2 2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
