"use client";

// A tiny candle chart of the visitor's OWN scroll (not market data — labelled "your
// scroll"). Every ~300ms of scrolling closes one candle: open/close/high/low are scroll
// positions, so scrolling down prints a GREEN candle (body ∝ distance) and scrolling up a
// RED one; a velocity spike stretches the wick. Last 14 candles, newest on the right,
// sliding left. Fed by the shared scroll bus (one rAF-throttled listener). Hidden on the
// hero pin (appears once #overview is reached), below 640px and under reduced motion.
import { useEffect, useRef, useState } from "react";
import { softTick, subscribeScroll } from "./marketMotion";

type Candle = { id: number; o: number; c: number; h: number; l: number };

const MAX = 14;
const WINDOW_MS = 300;
const W = 112;
const H = 27;
const SLOT = W / MAX;
const BODY = 4;

export function ScrollCandleMeter() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  // Candle ids outlive the effect: a re-run (StrictMode / HMR) keeps the candles in
  // state, so a per-run counter would restart at 1 and collide with their keys.
  const seqRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let lastY = window.scrollY;
    const seq = seqRef;
    let timer = 0;
    let win: { o: number; c: number; h: number; l: number; peak: number } | null = null;

    const close = () => {
      timer = 0;
      const w = win;
      win = null;
      if (!w || (Math.abs(w.c - w.o) < 3 && w.h - w.l < 6)) return;
      // Velocity peak (px/ms) stretches the wick beyond the traded range, capped.
      const ext = Math.min(160, w.peak * 40);
      const candle: Candle = { id: ++seq.current, o: w.o, c: w.c, h: w.h + ext, l: w.l - ext };
      setCandles((prev) => [...prev.slice(-(MAX - 1)), candle]);
      if (Math.abs(w.c - w.o) > 1100) softTick(); // only big moves — rare
    };

    const unsub = subscribeScroll((y, dt) => {
      // Show after the hero pin: once the overview's top passes mid-screen.
      const overview = document.getElementById("overview");
      const show = overview ? overview.getBoundingClientRect().top < window.innerHeight * 0.5 : y > window.innerHeight;
      root.toggleAttribute("data-show", show);

      const prev = lastY;
      lastY = y;
      if (y === prev) return;
      const v = Math.abs(y - prev) / Math.max(8, dt);
      if (!win) {
        win = { o: prev, c: y, h: Math.max(prev, y), l: Math.min(prev, y), peak: v };
        timer = window.setTimeout(close, WINDOW_MS);
      } else {
        win.c = y;
        win.h = Math.max(win.h, y);
        win.l = Math.min(win.l, y);
        win.peak = Math.max(win.peak, v);
      }
    });
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, []);

  // Auto-scaled y-domain over the visible candles (like a real chart). Deeper = higher.
  const lo = candles.length ? Math.min(...candles.map((c) => c.l)) : 0;
  const hi = candles.length ? Math.max(...candles.map((c) => c.h)) : 1;
  const span = Math.max(240, hi - lo);
  const mid = (hi + lo) / 2;
  const yOf = (v: number) => H / 2 - ((v - mid) / span) * (H - 2);

  return (
    <>
    <style href="afvar-mkt-meter" precedence="default">
      {METER_CSS}
    </style>
    <div
      ref={rootRef}
      aria-hidden="true"
      data-testid="scroll-candle-meter"
      className="mkc-meter pointer-events-none fixed left-4 z-40 hidden h-[44px] w-[120px] rounded-lg border border-white/[.11] bg-(--afvar-panel) px-1 pt-1 shadow-[0_10px_30px_-12px_rgba(0,0,0,.9)] sm:left-6 sm:block motion-reduce:!hidden"
      style={{ bottom: "calc(max(1rem, env(safe-area-inset-bottom)) + 46px)" }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block overflow-visible">
        <line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke="rgba(255,255,255,.05)" strokeWidth={1} />
        {candles.map((candle, index) => {
          const up = candle.c >= candle.o;
          const color = up ? "#00E676" : "#FF3B3B";
          const x = (MAX - candles.length + index) * SLOT + (SLOT - BODY) / 2;
          const top = yOf(Math.max(candle.o, candle.c));
          const bodyH = Math.max(1, yOf(Math.min(candle.o, candle.c)) - top);
          const wTop = yOf(candle.h);
          const wickH = Math.max(1, yOf(candle.l) - wTop);
          return (
            <g key={candle.id} className="mkc-meter-c" style={{ transform: `translateX(${x.toFixed(2)}px)` }}>
              <g className="mkc-meter-in">
                <rect x={BODY / 2 - 0.5} y={0} width={1} height={1} fill={color} opacity={0.75} className="mkc-meter-r" style={{ transform: `translateY(${wTop.toFixed(2)}px) scaleY(${wickH.toFixed(2)})` }} />
                <rect x={0} y={0} width={BODY} height={1} fill={color} className="mkc-meter-r" style={{ transform: `translateY(${top.toFixed(2)}px) scaleY(${bodyH.toFixed(2)})` }} />
              </g>
            </g>
          );
        })}
      </svg>
      <p className="mt-[2px] whitespace-nowrap px-0.5 text-[9px] leading-none text-[#6D7578]">your scroll</p>
    </div>
    </>
  );
}

/** Meter CSS (show/hide fade, candle slide-left, new-candle print). */
const METER_CSS = [
  ".mkc-meter{opacity:0;visibility:hidden;transform:translateY(6px);transition:opacity .24s cubic-bezier(.16,1,.3,1),transform .24s cubic-bezier(.16,1,.3,1),visibility 0s .24s}",
  ".mkc-meter[data-show]{opacity:1;visibility:visible;transform:none;transition-delay:0s}",
  ".mkc-meter-c{transition:transform .24s cubic-bezier(.16,1,.3,1)}",
  ".mkc-meter-r{transform-box:view-box;transform-origin:0 0;transition:transform .24s cubic-bezier(.16,1,.3,1)}",
  ".mkc-meter-in{transform-box:fill-box;transform-origin:50% 100%;animation:mkc-meter-in .24s cubic-bezier(.16,1,.3,1) both}",
  "@keyframes mkc-meter-in{from{opacity:0;transform:scaleY(.2)}to{opacity:1;transform:none}}",
].join("");
