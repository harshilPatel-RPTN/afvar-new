"use client";

// Motion pieces for /about 05–07 (Principles, Company, Build status) — Agent C's files.
// All of them render the finished state when PLATFORM_MOTION is off or motion is
// reduced (the kit's `useWinReveal` is then undefined / `on` is false).
// Transform / opacity only; the text content never changes (only wrapped in spans).
import { animate, motion, stagger, useInView, useMotionValue, useMotionValueEvent } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { afterSplash, ramp, useCardEntered, useSection, useWinReveal } from "@/modules/afvarOs";

export const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * True once the window / card around the caller has opened (desk: as the scroll opens
 * the window; stacked: once the card has entered). Null when the motion layer is off.
 */
export function useWinOpened(): boolean | null {
  const reveal = useWinReveal(0.07, 900);
  const fallback = useMotionValue(0);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(reveal ?? fallback, "change", (v) => {
    if (v >= 0.5) setOpen(true);
  });
  // Arrived with the window already open (reload mid-page): start after the splash.
  useEffect(() => {
    if (!reveal || reveal.get() < 0.5) return;
    return afterSplash(() => setOpen(true));
  }, [reveal]);
  return reveal ? open : null;
}

/**
 * A fact that types itself in, character by character (opacity only), `dur` seconds
 * long, starting `delay` seconds after `go`. `go === null`: plain text.
 */
export function Typed({ text, go, delay = 0, dur = 0.6 }: { text: string; go: boolean | null; delay?: number; dur?: number }) {
  if (go === null) return text;
  const chars = [...text];
  const step = dur / Math.max(1, chars.length);
  return chars.map((c, i) => (
    <span key={i} style={{ opacity: go ? 1 : 0, transition: go ? `opacity 90ms linear ${(delay + i * step).toFixed(3)}s` : "none" }}>
      {c}
    </span>
  ));
}

/** A label or value that slides / pops in `delay` seconds after `go` (opacity + transform). */
export function Arrive({ go, delay = 0, pop = false, children }: { go: boolean | null; delay?: number; pop?: boolean; children: ReactNode }) {
  if (go === null) return children;
  const from = pop ? "scale(0.85)" : "translateX(-10px)";
  return (
    <span
      className="inline-block max-w-full"
      style={{
        opacity: go ? 1 : 0,
        transform: go ? "none" : from,
        transformOrigin: pop ? "100% 50%" : "0% 50%",
        transition: go ? `opacity 0.6s ease-out ${delay}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s` : "none",
      }}
    >
      {children}
    </span>
  );
}

/**
 * The rows of a steps list arrive one by one, so each line is there just before its
 * tick. Desk: scroll-linked, row i arrives over [at[i] − .08, at[i] − .02] of the
 * section. Stacked: once the card enters, 300 ms apart (in step with ScrollSteps' ticks).
 */
export function ArrivingRows({ at, onStart, children }: { at: readonly number[]; onStart?: () => void; children: ReactNode }) {
  const { p, mode, on } = useSection();
  const ref = useRef<HTMLDivElement>(null);
  const rows = () => [...(ref.current?.querySelectorAll<HTMLElement>(":scope > div > div") ?? [])];
  const place = (v: number) => {
    rows().forEach((r, i) => {
      const a = at[Math.min(i, at.length - 1)] ?? 0;
      const k = ramp(v, a - 0.08, a - 0.02);
      r.style.opacity = String(k);
      r.style.transform = k >= 1 ? "" : `translateY(${(1 - k) * 10}px)`;
    });
  };
  useMotionValueEvent(p, "change", (v) => {
    if (on && mode === "desk") place(v);
  });
  useEffect(() => {
    if (on && mode === "desk") place(p.get());
    else rows().forEach((r) => ((r.style.opacity = ""), (r.style.transform = "")));
    // place/rows read the DOM; only the mode switch matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, mode]);
  useCardEntered(() => {
    if (!on || mode !== "stack") return;
    onStart?.();
    const r = rows();
    if (r.length) animate(r, { opacity: [0, 1], y: [10, 0] }, { duration: 0.55, ease: EASE, delay: stagger(0.3, { startDelay: 0.1 }) });
  });
  return <div ref={ref}>{children}</div>;
}

/**
 * Stacked only: a card held back until step `i` of the list above it has ticked
 * (ScrollSteps ticks at 400 + 300·i ms after its card entered), then it rises in.
 * If the steps were never seen (jumped past), it shows 1.6 s after it scrolls into view.
 */
export function AfterStep({ i, started, children }: { i: number; started: boolean; children: ReactNode }) {
  const { mode, on } = useSection();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const [late, setLate] = useState(false);
  useEffect(() => {
    if (!seen || started) return;
    const t = window.setTimeout(() => setLate(true), 1600);
    return () => window.clearTimeout(t);
  }, [seen, started]);
  if (mode !== "stack" || !on) return children;
  const show = started || late;
  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={show ? { duration: 0.9, ease: EASE, delay: started ? 0.75 + i * 0.3 : 0 } : { duration: 0 }}
    >
      {children}
    </motion.div>
  );
}

/** A principle's body, shown whole (no scroll-linked word-by-word lighting). */
export function DeskWordLight({ text, className }: { text: string; from: number; to: number; className: string }) {
  return <p className={className}>{text}</p>;
}
