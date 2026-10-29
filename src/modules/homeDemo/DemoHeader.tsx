"use client";

// /home-demo's 8-lane market ticker, pinned under the site-wide navbar.
// Ticker values come from the existing data layer; its LIVE / SNAPSHOT state
// is shown exactly as reported. Flat surfaces only — no glass.

import { useState } from "react";
import { useLiveMarket, type HomeQuote, type QuoteStatus } from "@/modules/home/kit";
import { useMotionReduced } from "./motionPref";
import { HAIR, MONO } from "./ui";

const TICKER_ORDER = [
  "XAUUSD",
  "XAGUSD",
  "WTI",
  "EURUSD",
  "USDJPY",
  "GBPUSD",
  "NZDUSD",
  "BTC-USD",
] as const;

/**
 * The demo's market ticker, pinned directly under the site-wide navbar
 * (SiteNav, 72px — rendered by the page, identical to every other page).
 */
export function DemoHeader() {
  return (
    <div className="fixed inset-x-0 top-[72px] z-40">
      <Ticker />
    </div>
  );
}

/* ------------------------------------------------------------------ ticker */

const fmt = (q: HomeQuote) =>
  q.last.toLocaleString("en-US", {
    minimumFractionDigits: q.decimals,
    maximumFractionDigits: q.decimals,
  });

/** Per-lane freshness: green live, amber delayed, grey stored snapshot. Text says it too. */
const STATUS_DOT: Record<QuoteStatus, string> = {
  live: "bg-[#00E676]",
  delayed: "bg-[#FFB020]",
  snapshot: "bg-[#6D7578]",
};
const STATUS_WORD: Record<QuoteStatus, string> = {
  live: "live",
  delayed: "delayed",
  snapshot: "stored snapshot",
};

const asOfText = (q: HomeQuote) =>
  q.asOf
    ? `${STATUS_WORD[q.status]} · as of ${new Date(q.asOf).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · ${q.source ?? ""}`
    : STATUS_WORD[q.status];

function Ticker() {
  const { quotes, mix } = useLiveMarket();
  const reduced = useMotionReduced();
  const [paused, setPaused] = useState(false);
  const moving = !reduced && !paused;
  const anyReal = mix.live + mix.delayed > 0;
  const lanes = TICKER_ORDER.map((symbol) => ({
    symbol,
    q: quotes[symbol],
  })).filter((l) => l.q);
  const bulls = bullShare(lanes.map((l) => l.q.changePct));

  const row = (hidden: boolean) => (
    <ul
      className={`flex shrink-0 items-center ${hidden ? "hidden md:flex" : "flex"}`}
      aria-hidden={hidden || undefined}
    >
      {lanes.map(({ symbol, q }) => {
        const up = q.changePct >= 0;
        return (
          <li
            key={symbol}
            title={asOfText(q)}
            className="flex shrink-0 items-baseline gap-2 px-5 font-mono text-[12px] tabular-nums"
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 self-center rounded-full ${STATUS_DOT[q.status]}`}
              aria-hidden="true"
            />
            <span className="text-[#A3AAAC]">{symbol}</span>
            <span className="sr-only">({STATUS_WORD[q.status]})</span>
            <span className="text-[#F5F7F7]">{fmt(q)}</span>
            <span className={up ? "text-[#00E676]" : "text-[#FF3B3B]"}>
              {up ? "▲" : "▼"}
              {Math.abs(q.changePct).toFixed(2)}%
            </span>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      className={`relative flex h-9 items-stretch border-b ${HAIR} bg-[#08080A]`}
      role="region"
      aria-label="Market ticker"
    >
      <style>{`@keyframes afvarTicker { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      {/* state badge — exactly what the data layer reports */}
      <div
        className={`flex shrink-0 items-center gap-3 border-r ${HAIR} bg-[#08080A] px-4`}
      >
        {anyReal ? (
          <>
            {mix.live > 0 && (
              <span
                className={`${MONO} flex items-center gap-1.5 text-[#00E676]`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT.live}`}
                  aria-hidden="true"
                />
                {mix.live} Live
              </span>
            )}
            {mix.delayed > 0 && (
              <span
                className={`${MONO} flex items-center gap-1.5 text-[#FFB020]`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT.delayed}`}
                  aria-hidden="true"
                />
                {mix.delayed} Delayed
              </span>
            )}
          </>
        ) : (
          <span className={`${MONO} flex items-center gap-1.5 text-[#A3AAAC]`}>
            <span
              className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT.snapshot}`}
              aria-hidden="true"
            />
            Snapshot
          </span>
        )}
      </div>
      {/* desktop: slow marquee that pauses on hover (none under reduced motion); mobile: swipe to scroll */}
      <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] md:overflow-hidden [&::-webkit-scrollbar]:hidden">
        <div
          className={`flex h-full w-max items-center ${moving ? "md:animate-[afvarTicker_48s_linear_infinite] md:hover:[animation-play-state:paused]" : ""}`}
        >
          {row(false)}
          {row(true)}
        </div>
      </div>
      <TugMeter bulls={bulls} />
      {/* WCAG 2.2.2: moving content can be paused */}
      {!reduced ? (
        <button
          type="button"
          onClick={() => setPaused((v) => !v)}
          aria-pressed={paused}
          aria-label={paused ? "Play market ticker" : "Pause market ticker"}
          className={`hidden shrink-0 items-center justify-center border-l ${HAIR} px-3 text-[#A3AAAC] hover:text-[#F5F7F7] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#69F0AE] md:flex`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            {paused ? (
              <path d="M3 2l7 4-7 4z" fill="currentColor" />
            ) : (
              <path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" />
            )}
          </svg>
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------- bull vs bear tug */

/** Share of the day's move that is up (0..1): the summed size of the gainers'
 *  % change over the summed size of every move. Flat tape → 0.5. */
function bullShare(changes: number[]) {
  const up = changes.reduce((a, c) => a + Math.max(0, c), 0);
  const all = changes.reduce((a, c) => a + Math.abs(c), 0);
  return all > 0 ? up / all : 0.5;
}

/** Labelled read-out of the same tug on wide screens. */
function TugMeter({ bulls }: { bulls: number }) {
  const b = Math.round(bulls * 100);
  return (
    <div
      className={`hidden shrink-0 items-center gap-2 border-l ${HAIR} px-4 xl:flex`}
      title="Share of today's ticker move that is up (bulls) vs down (bears)"
    >
      <span className="sr-only">Bull versus bear: {b}% of today&apos;s ticker move is up, {100 - b}% is down.</span>
      <span aria-hidden="true" className={`${MONO} text-[10px] text-[#00E676]`}>Bulls {b}</span>
      <span aria-hidden="true" className="relative h-1 w-16 overflow-hidden bg-[#FF3B3B]">
        <span className="absolute inset-y-0 left-0 bg-[#00E676] transition-[width] duration-1000 ease-out motion-reduce:transition-none" style={{ width: `${b}%` }} />
      </span>
      <span aria-hidden="true" className={`${MONO} text-[10px] text-[#FF3B3B]`}>{100 - b} Bears</span>
    </div>
  );
}
