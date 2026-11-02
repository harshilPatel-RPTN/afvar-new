"use client";

// Words and cards of the Market Data film. Every price is real (the home
// market feed, labelled live / delayed / stored); every line the AI adds is
// worked out from the closes on screen. No sentence repeats the home film,
// the overview, or another act of this page.
import { motion, useTransform, type MotionValue } from "framer-motion";
import Link from "next/link";
import { createContext, useContext } from "react";
import { AiOrb, BODY, CARD, CARD_AI, EYEBROW, GHOST_LINK, GOLD_CTA, H1, HAIR, HeroTitle, MONO, ramp, useStep, useTypedText } from "@/modules/afvarOs";
import { fmtPrice, type HomeQuote } from "@/modules/home/kit";
import { LANE_KEYS, sessionsNow, useNowMinute, type Quotes } from "@/modules/homeDemo/kit";
import { getCapability } from "../../content";
import { REGISTER_URL } from "../../routes";
import type { CapFilm } from "../capability/factory";
import type { ActText } from "../capability/ui";
import { STATUS_LABEL, asOfText, biggestMover, lastMovePct, rangeOf, signedPct, swingLine, trendOf } from "./analysis";
import { CHART, CHART_ASK, CHART_SPEECH, INSIGHT_AT, INSIGHT_CHECKED, LANE_AT, WATCH, type MarketAct } from "./marketFilm";

const CAP = getCapability("charts")!;

/* ----------------------------------------------------------- film context */

export const MarketUi = createContext<CapFilm<MarketAct> | null>(null);
export function useMarketFilm(): CapFilm<MarketAct> {
  const f = useContext(MarketUi);
  if (!f) throw new Error("MarketUi missing");
  return f;
}

/* -------------------------------------------------------------- the words */

export const FEED_TEXT: ActText = {
  id: "feed",
  label: "Sources",
  title: "Every quote arrives labelled.",
  soft: "Live, delayed or stored.",
  body: "Four public feeds stream into the Market core. Each price carries its source and time, so a delayed number is never shown as live.",
};
export const CHART_TEXT: ActText = {
  id: "chart",
  label: "Charts",
  title: "Ask for the levels.",
  soft: "Drawn in gold.",
  body: "Your own lines stay white. Anything AFVAR adds is gold, named, and built only from the closes on the chart.",
};
export const WATCH_TEXT: ActText = {
  id: "watch",
  label: "Watchlists",
  title: "Your markets.",
  soft: "All at a glance.",
  body: "Ask AFVAR to add what you follow, then open the heatmap: every lane on one screen, coloured by today's move.",
};
export const INSIGHT_TEXT: ActText = {
  id: "insight",
  label: "Insight",
  title: "One instrument, explained.",
  soft: "Each line with its source and time.",
  body: "Instrument insight gathers what matters about one market. The Verify core checks every line against its source first.",
};

/* ------------------------------------------------------------------ hero */

export function HeroCopy({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <p className={EYEBROW}>AFVAR Platform · Market data</p>
      <HeroTitle twin={compact} className={compact ? "mt-3 text-[clamp(2.05rem,8.8vw,3rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-[#F2F5F2]" : `mt-5 ${H1}`}>
        {CAP.title}. <span className="text-[#A8DEC2]">Every number shows its source.</span>
      </HeroTitle>
      <p className={compact ? "mt-3 text-[14.5px] leading-relaxed text-[#B7C5BC]" : `mt-6 max-w-[31rem] ${BODY}`}>
        {compact ? "Quotes, charts and watchlists in one workspace." : "Quotes, charts, watchlists and heatmaps in one workspace. Ask in plain words and the chart or the watchlist changes to match."}
      </p>
      <div className={`${compact ? "mt-5" : "mt-8"} flex flex-nowrap items-center gap-2.5 sm:gap-5`}>
        <Link href={REGISTER_URL} prefetch={false} className={GOLD_CTA}>
          Register Now
        </Link>
        <a href="#features" className={GHOST_LINK}>
          See the features
        </a>
      </div>
      <div className={`${compact ? "mt-5 pt-3" : "mt-10 pt-5"} flex flex-wrap items-center gap-x-6 gap-y-2 border-t ${HAIR}`}>
        <span className={`${MONO} flex items-center gap-2 text-[#A8DEC2]`}>
          <AiOrb size={8} /> Metals · energy · forex · crypto
        </span>
        <span className={`${MONO} text-[#92A399]`}>8 coverage lanes</span>
        {compact ? null : <span className={`${MONO} text-[#92A399]`}>Live and delayed, labelled</span>}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- status */

const DOT: Record<HomeQuote["status"], string> = { live: "bg-[#00E676]", delayed: "bg-[#F6B94A]", snapshot: "bg-[#92A399]" };

export function StatusChip({ status, small = false }: { status: HomeQuote["status"]; small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.12)] font-mono uppercase tracking-wider text-[#C9CFD1] ${small ? "px-1.5 py-px text-[8.5px]" : "px-2 py-0.5 text-[9.5px]"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** "3 live · 5 delayed" over the lanes on screen. */
export function mixText(quotes: Quotes): string {
  const mix = { live: 0, delayed: 0, snapshot: 0 };
  for (const [key] of LANE_KEYS) {
    const q = quotes[key];
    if (q) mix[q.status] += 1;
  }
  return [mix.live ? `${mix.live} live` : "", mix.delayed ? `${mix.delayed} delayed` : "", mix.snapshot ? `${mix.snapshot} stored` : ""].filter(Boolean).join(" · ");
}

/* ------------------------------------------------------------ act: feed */

/** The eight lanes as they arrive now; the reading highlight follows the 3D packets. */
export function LaneCard({ mv, quotes, compact = false }: { mv: MotionValue<number>; quotes: Quotes; compact?: boolean }) {
  const film = useMarketFilm();
  const step = useStep(
    mv,
    LANE_AT.map((a) => film.at("feed", a)),
  );
  return (
    <div className={`${CARD} ${compact ? "p-3" : "p-4"}`} aria-label="Coverage lanes now">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#F2F5F2]">Coverage lanes · now</p>
        <span className={`${MONO} text-[9.5px] text-[#A8DEC2]`}>Market core</span>
      </div>
      <ul className={`mt-2 ${compact ? "grid grid-cols-2 gap-x-3" : ""}`}>
        {LANE_KEYS.map(([key, sym], i) => {
          const q = quotes[key];
          if (!q) return null;
          const on = step === i;
          return (
            <li
              key={key}
              className={`flex items-center gap-2 rounded-md px-1.5 font-mono transition-colors ${compact ? "py-[3px] text-[10.5px]" : "py-1 text-[11.5px] [@media(max-height:820px)]:py-0.5"} ${on ? "bg-[rgba(168,222,194,0.1)] text-[#F2F5F2]" : "text-[#C9CFD1]"}`}
            >
              <span className={`${compact ? "w-[3.6rem]" : "w-[4.6rem]"} shrink-0 ${on ? "text-[#A8DEC2]" : "text-[#8A9295]"}`}>{sym}</span>
              <span className="tabular-nums">{fmtPrice(q.last, q.decimals)}</span>
              {compact ? null : <span className={`tabular-nums ${q.changePct >= 0 ? "text-[#00E676]" : "text-[#FF6B6B]"}`}>{signedPct(q.changePct)}</span>}
              <span className="ml-auto">
                {compact ? <span className={`inline-block h-1.5 w-1.5 rounded-full ${DOT[q.status]}`} aria-label={STATUS_LABEL[q.status]} /> : <StatusChip status={q.status} small />}
              </span>
            </li>
          );
        })}
      </ul>
      <p className={`mt-2 border-t pt-2 font-mono text-[10px] text-[#8A9295] ${HAIR}`}>{mixText(quotes)} · source and time kept on every price</p>
    </div>
  );
}

/* ----------------------------------------------------------- act: chart */

/**
 * A real Gold chart with what the AI adds drawn in gold: the range high and
 * low, then the trend line — each drawn over its window of the chart act.
 */
export function AiChart({ mv, quote, className = "" }: { mv: MotionValue<number>; quote: HomeQuote; className?: string }) {
  const film = useMarketFilm();
  const C = (u: number) => film.at("chart", u);
  const closes = quote.closes;
  const r = rangeOf(closes);
  const swing = swingLine(closes);
  const pad = (r.high - r.low) * 0.14 || 1;
  const lo = r.low - pad;
  const hi = r.high + pad;
  const y = (v: number) => 100 - ((v - lo) / (hi - lo)) * 100;
  const x = (i: number) => (i / Math.max(1, closes.length - 1)) * 100;
  const line = closes.map((v, i) => `${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const up = closes[closes.length - 1] >= closes[0];
  const stroke = up ? "#00E676" : "#FF4D4D";

  const drawHigh = useTransform(mv, (p) => Math.max(0.0001, ramp(p, C(CHART.high[0]), C(CHART.high[1]))));
  const drawLow = useTransform(mv, (p) => Math.max(0.0001, ramp(p, C(CHART.low[0]), C(CHART.low[1]))));
  const tagHigh = useTransform(drawHigh, (k) => ramp(k, 0.6, 1));
  const tagLow = useTransform(drawLow, (k) => ramp(k, 0.6, 1));
  const drawTrend = useTransform(mv, (p) => ramp(p, C(CHART.trend[0]), C(CHART.trend[1])));
  // The trend line runs through the two swing points and on to the last close.
  const t0 = swing ? { x: x(swing.i0), y: y(swing.v0) } : null;
  const slope = swing ? (swing.v1 - swing.v0) / Math.max(1, swing.i1 - swing.i0) : 0;
  const tEnd = swing ? { x: 100, y: y(Math.min(hi, Math.max(lo, swing.v0 + slope * (closes.length - 1 - swing.i0)))) } : null;
  const x2 = useTransform(drawTrend, (k) => (t0 && tEnd ? t0.x + (tEnd.x - t0.x) * k : 0));
  const y2 = useTransform(drawTrend, (k) => (t0 && tEnd ? t0.y + (tEnd.y - t0.y) * k : 0));
  const tagTrend = useTransform(drawTrend, (k) => ramp(k, 0.7, 1));
  const fmt = (v: number) => fmtPrice(v, quote.decimals);

  return (
    <div className={`relative ${className}`}>
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="afv-md-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={stroke} stopOpacity="0.2" />
            <stop offset="1" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[20, 40, 60, 80].map((g) => (
          <line key={g} x1="0" x2="100" y1={g} y2={g} stroke="rgba(255,255,255,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <polygon points={`0,100 ${line} 100,100`} fill="url(#afv-md-fill)" />
        <polyline points={line} fill="none" stroke={stroke} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {t0 ? <motion.line x1={t0.x} y1={t0.y} x2={x2} y2={y2} stroke="#A8DEC2" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" /> : null}
      </svg>
      {/* range high / low: drawn left → right */}
      <motion.div aria-hidden="true" className="absolute inset-x-0 h-0 origin-left border-t border-dashed border-[#A8DEC2]" style={{ top: `${y(r.high)}%`, scaleX: drawHigh }} />
      <motion.div aria-hidden="true" className="absolute inset-x-0 h-0 origin-left border-t border-dashed border-[#A8DEC2]" style={{ top: `${y(r.low)}%`, scaleX: drawLow }} />
      <motion.span className="absolute left-2 -translate-y-full pb-0.5 font-mono text-[9.5px] tracking-[0.06em] text-[#A8DEC2]" style={{ top: `${y(r.high)}%`, opacity: tagHigh }}>
        AI · range high {fmt(r.high)}
      </motion.span>
      <motion.span className="absolute left-2 pt-0.5 font-mono text-[9.5px] tracking-[0.06em] text-[#A8DEC2]" style={{ top: `${y(r.low)}%`, opacity: tagLow }}>
        AI · range low {fmt(r.low)}
      </motion.span>
      {swing && tEnd ? (
        <motion.span className="absolute right-14 -translate-y-[130%] font-mono text-[9.5px] tracking-[0.06em] text-[#A8DEC2]" style={{ top: `${tEnd.y}%`, opacity: tagTrend }}>
          AI · trend · {swing.kind}
        </motion.span>
      ) : null}
      <span className="absolute right-1.5 rounded px-1 py-0.5 font-mono text-[10px] text-[#040404]" style={{ top: `calc(${y(closes[closes.length - 1])}% - 8px)`, background: stroke }}>
        {fmt(closes[closes.length - 1])}
      </span>
    </div>
  );
}

/** What the closes show, one row at a time (OS analysis window and the phone card). */
export function analysisRows(quote: HomeQuote): { k: string; v: string }[] {
  const closes = quote.closes;
  const t = trendOf(closes);
  const r = rangeOf(closes);
  const fmt = (v: number) => fmtPrice(v, quote.decimals);
  return [
    { k: "Trend", v: `${t.trend[0].toUpperCase()}${t.trend.slice(1)} · ${signedPct(t.pct)} first third to last` },
    { k: "Range", v: `${fmt(r.low)} – ${fmt(r.high)} · ${r.widthPct.toFixed(1)}% wide` },
    { k: "Last 5 closes", v: signedPct(lastMovePct(closes, 5)) },
  ];
}

export const closesLabel = (q: HomeQuote) => (q.status === "snapshot" ? `${q.closes.length} stored closes` : `last ${q.closes.length} hourly closes`);

/** Phones: the ask, the chart, the gold lines, and what the avatar says. */
export function ChartCard({ mv, quotes }: { mv: MotionValue<number>; quotes: Quotes }) {
  const film = useMarketFilm();
  const C = (u: number) => film.at("chart", u);
  const q = quotes.XAUUSD;
  const asked = useTypedText(mv, CHART_ASK, [C(CHART.ask[0]), C(CHART.ask[1])]);
  const said = useTypedText(mv, CHART_SPEECH, [C(CHART.speak[0]), C(CHART.speak[1])]);
  const speaking = useStep(mv, [C(CHART.speak[0]), C(CHART.speak[1])]) === 0;
  if (!q) return null;
  return (
    <div className={`${CARD_AI} p-3`} aria-label="Gold chart with the lines AFVAR drew">
      <div className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.08)] px-2.5 py-1.5">
        <AiOrb size={9} pulse={false} />
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-[#F2F5F2]">
          <span ref={asked} />
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[10.5px]">
        <span className="text-[#F2F5F2]">XAU/USD · 1H</span>
        <StatusChip status={q.status} small />
      </div>
      <AiChart mv={mv} quote={q} className="mt-1 h-[7.5rem] [@media(max-height:700px)]:h-24" />
      <p className={`mt-2 min-h-[2.6em] text-[12px] leading-snug ${speaking ? "text-[#F2F5F2]" : "text-[#B7C5BC]"}`}>
        <span className={`${MONO} mr-1.5 text-[9px] text-[#A8DEC2]`}>AFVAR</span>
        <span ref={said} />
      </p>
    </div>
  );
}

/* ----------------------------------------------------------- act: watch */

const SHORT: Record<string, string> = { XAUUSD: "Gold", XAGUSD: "Silver", WTI: "Crude", EURUSD: "EUR/USD", USDJPY: "USD/JPY", GBPUSD: "GBP/USD", NZDUSD: "NZD/USD", "BTC-USD": "Bitcoin" };
export const shortName = (key: string) => SHORT[key] ?? key;

/** Every lane as a tile, coloured by its move since the previous close. */
export function HeatGrid({ quotes, mover, dense = false }: { quotes: Quotes; mover: boolean; dense?: boolean }) {
  const big = biggestMover(
    quotes,
    LANE_KEYS.map(([k]) => k),
  );
  return (
    <ul className={`grid h-full grid-cols-4 ${dense ? "gap-1" : "gap-1.5"}`} aria-label="Heatmap of the eight lanes">
      {LANE_KEYS.map(([key]) => {
        const q = quotes[key];
        if (!q) return null;
        const k = Math.min(1, Math.abs(q.changePct) / 3);
        const bg = q.changePct >= 0 ? `rgba(0,230,118,${0.08 + 0.32 * k})` : `rgba(255,77,77,${0.08 + 0.32 * k})`;
        const ring = mover && big?.key === key;
        return (
          <li key={key} className={`relative flex flex-col justify-between rounded-lg border ${dense ? "p-1.5" : "p-2.5"} transition-shadow ${ring ? "border-[#A8DEC2] shadow-[0_0_0_2px_rgba(168,222,194,0.45)]" : "border-[rgba(255,255,255,0.06)]"}`} style={{ background: bg }}>
            <span className={`flex items-center justify-between font-mono ${dense ? "text-[9px]" : "text-[10.5px]"} text-[#F2F5F2]`}>
              {shortName(key)}
              <span className={`h-1.5 w-1.5 rounded-full ${DOT[q.status]}`} aria-label={STATUS_LABEL[q.status]} />
            </span>
            <span className={`font-mono tabular-nums ${dense ? "text-[10px]" : "text-[13px]"} font-semibold text-[#F2F5F2]`}>{signedPct(q.changePct)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Phones: the heatmap, then the biggest move named. */
export function HeatCard({ mv, quotes }: { mv: MotionValue<number>; quotes: Quotes }) {
  const film = useMarketFilm();
  const step = useStep(mv, [film.at("watch", WATCH.heat), film.at("watch", WATCH.mover)]);
  const big = biggestMover(
    quotes,
    LANE_KEYS.map(([k]) => k),
  );
  return (
    <div className={`${CARD} p-3`}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#F2F5F2]">Heatmap · since the previous close</p>
        <span className={`${MONO} text-[9px] text-[#8A9295]`}>{mixText(quotes)}</span>
      </div>
      <div className={`mt-2 h-[6.6rem] transition-opacity duration-300 ${step >= 0 ? "opacity-100" : "opacity-40"}`}>
        <HeatGrid quotes={quotes} mover={step >= 1} dense />
      </div>
      <p className={`mt-2 text-[12px] transition-opacity duration-300 ${step >= 1 && big ? "text-[#F3DFAF] opacity-100" : "opacity-0"}`}>
        Biggest move today: {big ? `${shortName(big.key)} ${signedPct(big.quote.changePct)}` : "—"}
      </p>
    </div>
  );
}

/* --------------------------------------------------------- act: insight */

/** One instrument, line by line; each line names its source and time, then the Verify core checks it. */
export function InsightCard({ mv, quotes, compact = false }: { mv: MotionValue<number>; quotes: Quotes; compact?: boolean }) {
  const film = useMarketFilm();
  const step = useStep(mv, [...INSIGHT_AT, INSIGHT_CHECKED].map((a) => film.at("insight", a)));
  const now = useNowMinute();
  const q = quotes.XAUUSD;
  if (!q) return null;
  const r = rangeOf(q.closes);
  const fmt = (v: number) => fmtPrice(v, q.decimals);
  const open = sessionsNow(now)
    .filter((s) => s.name !== "Crypto" && s.open)
    .map((s) => s.name);
  const lines = [
    { k: "Price", v: `${fmt(q.last)}, ${signedPct(q.changePct)} since the previous close`, src: `${q.source ?? "Stored values"} · ${asOfText(q.asOf)}` },
    { k: "Range", v: `Between ${fmt(r.low)} and ${fmt(r.high)} over the ${closesLabel(q)}`, src: "Same feed · hourly bars" },
    { k: "Sessions", v: now ? (open.length ? `Open now: ${open.join(", ")}` : "The main forex sessions are closed") : "Session clock loading", src: "Session clock · UTC" },
  ];
  const checked = step >= 3;
  return (
    <div className={`${CARD_AI} ${compact ? "p-3" : "p-4"}`} aria-label="Gold instrument insight">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[13.5px] font-semibold text-[#F2F5F2]">
          <AiOrb size={10} pulse={!checked} /> Gold · instrument insight
        </p>
        <StatusChip status={q.status} small />
      </div>
      <ol className={compact ? "mt-2 space-y-1.5" : "mt-3 space-y-2.5"}>
        {lines.map((l, i) => (
          <li key={l.k} className={`rounded-lg border px-2.5 transition-[opacity,border-color] duration-300 ${compact ? "py-1.5" : "py-2"} ${step >= i ? "opacity-100" : "opacity-25"} ${step === i ? "border-[rgba(168,222,194,0.55)]" : "border-[rgba(255,255,255,0.07)]"}`}>
            <p className="flex items-baseline gap-2">
              <span className={`${MONO} w-[4.4rem] shrink-0 text-[9px] text-[#8A9295]`}>{l.k}</span>
              <span className={`text-[12.5px] leading-snug text-[#E6E9EB] ${compact ? "line-clamp-1" : ""}`}>{l.v}</span>
              <span className={`ml-auto font-mono text-[10.5px] ${checked ? "text-[#00E676]" : "text-transparent"}`} aria-hidden={!checked}>
                ✓
              </span>
            </p>
            {compact ? null : <p className="mt-0.5 pl-[4.9rem] font-mono text-[9.5px] text-[#92A399]">{l.src}</p>}
          </li>
        ))}
      </ol>
      <p className={`mt-2.5 font-mono text-[10px] ${checked ? "text-[#00E676]" : "text-[#A8DEC2]"}`}>{checked ? "3 of 3 lines checked · Verify core" : "Checking each line against its source"}</p>
    </div>
  );
}
