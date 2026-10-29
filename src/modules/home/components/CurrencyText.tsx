"use client";

// Phase 2 "trader delight": copy that briefly speaks currency. Selected letters
// slot through currency glyphs (S→$, E→€, Y→¥ …) and settle back to the real
// letter. The real letters are always in the DOM (accessible name = real text);
// glyphs are aria-hidden overlays positioned absolutely, so layout never shifts.
// Transform/opacity/colour only. Reduced motion: plain text, nothing runs.
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Fragment, useEffect, useRef, useState, type RefObject } from "react";
import { playSfx } from "./sfx";

/** Letter → currency glyph (case-insensitive). */
export const CURRENCY_GLYPHS: Record<string, string> = {
  s: "$", e: "€", y: "¥", l: "£", r: "₹", c: "¢", b: "₿", f: "₣", w: "₩",
};
const CYCLE = ["$", "€", "¥", "£", "₹", "¢", "₿", "₣", "₩"];

const VIEW_ONCE = { once: true, margin: "0px 0px -8% 0px" } as const;
const UP = "#00E676";
const DOWN = "#FF3B3B";
/** Every Nth eligible letter (in DOM order) scrambles — ~1 in 4. */
const PICK_EVERY = 4;
const STAGGER = 25; // ms between chosen letters
const START = 100; // ms after entering view (words are mid candle-rise)
const FRAME = 60; // ms per slot frame
const FRAMES = 5; // glyph frames before the true glyph holds
const HOLD = 90; // ms the mapped glyph holds (fading to heading colour)
const FADE = 90; // ms crossfade back to the real letter

/** Static markup: eligible letters get a relative wrapper + an empty aria-hidden glyph overlay. */
export function CurrencyLetters({ text }: { text: string }) {
  return [...text].map((char, index) => {
    const glyph = CURRENCY_GLYPHS[char.toLowerCase()];
    if (!glyph) return <Fragment key={index}>{char}</Fragment>;
    return (
      <span key={index} data-cx={glyph} className="relative">
        <span data-cx-real="">{char}</span>
        <span
          aria-hidden="true"
          data-cx-glyph=""
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 select-none whitespace-nowrap opacity-0"
        />
      </span>
    );
  });
}

/** Runs the scramble once over every `[data-cx]` letter inside `rootRef` when `active` flips true.
 *  DOM-driven (refs + rAF), so React never re-renders mid-animation. */
export function useCurrencyScramble(rootRef: RefObject<HTMLElement | null>, active: boolean, { tick = false } = {}) {
  const reduce = useReducedMotion();
  const played = useRef(false);
  useEffect(() => {
    const root = rootRef.current;
    if (!active || reduce || played.current || !root) return;
    played.current = true;
    const eligible = [...root.querySelectorAll<HTMLElement>("[data-cx]")];
    const picked = eligible.filter((_, index) => index % PICK_EVERY === 1);
    const chosen = (picked.length ? picked : eligible.slice(0, 1)).map((wrap, k) => ({
        real: wrap.querySelector<HTMLElement>("[data-cx-real]")!,
        glyph: wrap.querySelector<HTMLElement>("[data-cx-glyph]")!,
        target: wrap.dataset.cx!,
        color: k % 3 === 2 ? DOWN : UP,
        start: START + k * STAGGER,
        seed: k * 3,
        done: false,
      }));
    if (!chosen.length) return;

    const scrambleEnd = FRAMES * FRAME;
    const end = scrambleEnd + HOLD + FADE;
    let raf = 0;
    let t0 = 0;
    const reset = (item: (typeof chosen)[number]) => {
      item.glyph.textContent = "";
      item.glyph.style.opacity = "";
      item.glyph.style.color = "";
      item.glyph.style.transition = "";
      item.real.style.opacity = "";
      delete item.glyph.dataset.cxOn;
    };
    const step = (now: number) => {
      if (!t0) t0 = now;
      const elapsed = now - t0;
      let remaining = 0;
      for (const item of chosen) {
        if (item.done) continue;
        const local = elapsed - item.start;
        if (local < 0) {
          remaining++;
          continue;
        }
        if (local >= end) {
          reset(item);
          item.done = true;
          continue;
        }
        remaining++;
        if (local < scrambleEnd) {
          const frame = Math.floor(local / FRAME);
          const glyph = frame === FRAMES - 1 ? item.target : CYCLE[(item.seed + frame * 4) % CYCLE.length];
          if (item.glyph.textContent !== glyph) item.glyph.textContent = glyph;
          if (!item.glyph.dataset.cxOn) {
            item.glyph.dataset.cxOn = "";
            item.glyph.style.color = item.color;
            item.glyph.style.opacity = "1";
            item.real.style.opacity = "0";
          }
        } else if (local < scrambleEnd + HOLD) {
          if (item.glyph.textContent !== item.target) item.glyph.textContent = item.target;
          if (!item.glyph.style.transition) {
            item.glyph.style.transition = `color ${HOLD}ms ease-out, opacity ${FADE}ms ease-out`;
            item.glyph.style.color = "currentColor";
          }
        } else if (item.glyph.style.opacity !== "0") {
          item.glyph.style.opacity = "0";
          item.real.style.transition = `opacity ${FADE}ms ease-out`;
          item.real.style.opacity = "1";
        }
      }
      if (remaining > 0) raf = requestAnimationFrame(step);
      else {
        for (const item of chosen) item.real.style.transition = "";
        if (tick) playSfx("tick");
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      for (const item of chosen) {
        reset(item);
        item.real.style.transition = "";
      }
    };
  }, [active, reduce, rootRef, tick]);
}

/** Standalone: `<CurrencyText text="International markets. Covered deeply." />` — scrambles once on view. */
export function CurrencyText({ text, className, tick = false }: { text: string; className?: string; tick?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, VIEW_ONCE);
  useCurrencyScramble(ref, inView, { tick });
  return (
    <span ref={ref} className={className}>
      {/* Absolutely-positioned glyph overlays make Chrome split the accessible name
          ("S e e"), so screen readers get a clean visually-hidden copy instead. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        <CurrencyLetters text={text} />
      </span>
    </span>
  );
}

/* ── FX pair symbol flip (Markets rows) ── */

export const FX_GLYPHS: Record<string, string> = {
  EURUSD: "€/$",
  USDJPY: "$/¥",
  GBPUSD: "£/$",
  NZDUSD: "NZ$/$",
  XAUUSD: "Au/$",
  XAGUSD: "Ag/$",
  WTI: "OIL/$",
  "BTC-USD": "₿/$",
};

/** The symbol card-flips (rotateX) to its currency glyphs for 1s when the closest
 *  row button is hovered/focused, then flips back. Real symbol stays the accessible text. */
export function FxSymbol({ symbol, className }: { symbol: string; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [flipped, setFlipped] = useState(false);
  const glyphs = FX_GLYPHS[symbol];

  useEffect(() => {
    const row = ref.current?.closest("button");
    if (!row || !glyphs || reduce) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flip = () => {
      if (timer) return; // one flip per visit
      setFlipped(true);
      timer = setTimeout(() => {
        setFlipped(false);
        timer = setTimeout(() => (timer = undefined), 450);
      }, 1000);
    };
    row.addEventListener("pointerenter", flip);
    row.addEventListener("focus", flip);
    return () => {
      row.removeEventListener("pointerenter", flip);
      row.removeEventListener("focus", flip);
      if (timer) clearTimeout(timer);
    };
  }, [glyphs, reduce]);

  if (!glyphs) return <span className={className}>{symbol}</span>;
  return (
    <span ref={ref} className={`${className ?? ""} relative [perspective:400px]`} data-fx-flipped={flipped || undefined}>
      <motion.span
        className="relative block origin-center [transform-style:preserve-3d]"
        initial={false}
        animate={{ rotateX: flipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="block [backface-visibility:hidden]">{symbol}</span>
        <span
          aria-hidden="true"
          className="absolute inset-0 block whitespace-nowrap text-[#00E676] [backface-visibility:hidden] [transform:rotateX(180deg)]"
        >
          {glyphs}
        </span>
      </motion.span>
    </span>
  );
}
