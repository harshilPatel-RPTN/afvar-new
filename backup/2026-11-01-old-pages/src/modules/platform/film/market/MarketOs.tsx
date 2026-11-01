"use client";

// The Market Data film's OS acts (desktop): the same AFVAR OS as the home film
// and the overview — caption on top, the screen below.
//
//   chart  ask for the range and trend on Gold; the AI draws them in gold on
//          the real chart, lists what the closes show, and the avatar in the
//          corner says how it was done; then the lines are checked
//   watch  the watchlist grows by asking; the heatmap and the market overview
//          open; the biggest move is named
//
// Every position is a keyframe (act fractions → master progress), so scrolling
// back plays it in reverse.
import { motion, useTransform, type MotionValue } from "framer-motion";
import type { ReactNode } from "react";
import {
  AiOrb,
  AvatarOverlay,
  Dock,
  MONO,
  MenuBar,
  OsScreen,
  OsWindow,
  Spotlight,
  Toast,
  easeInOut,
  ramp,
  useBoxKeys,
  useStep,
  useTypedText,
  window4,
  type AvatarFrame,
  type BoxKeyframe,
  type DockItem,
} from "@/modules/afvarOs";
import { fmtPrice, type HomeQuote } from "@/modules/home/kit";
import { LANE_KEYS, useNowMinute, type Quotes } from "@/modules/homeDemo/kit";
import { ChipStrip } from "../OverviewCopy";
import { OsCaption } from "../capability/ui";
import { STATUS_LABEL, asOfText, biggestMover, signedPct } from "./analysis";
import { AiChart, CHART_TEXT, HeatGrid, StatusChip, WATCH_TEXT, analysisRows, closesLabel, mixText, shortName } from "./MarketCopy";
import { CHART, CHART_ASK, CHART_SPEECH, MARKET_DESKTOP, WATCH, WATCH_ADDED, WATCH_ASK, WATCH_START } from "./marketFilm";

const F = MARKET_DESKTOP;
const C = (u: number) => F.at("chart", u);
const W = (u: number) => F.at("watch", u);

/* ------------------------------------------------------------- the layer */

export function MarketOs({ mv, quotes, avatarHere }: { mv: MotionValue<number>; quotes: Quotes; avatarHere: boolean }) {
  const layer = useTransform(mv, F.osIn);
  const scale = useTransform(mv, (p) => 0.95 + 0.05 * ramp(p, C(0), C(0.07)));
  const cC = useTransform(mv, (p) => window4(p, [C(0.01), C(0.06), C(0.94), C(0.995)]));
  const wC = useTransform(mv, (p) => window4(p, [W(0.005), W(0.05), W(0.93), W(0.99)]));
  return (
    <motion.div className="pointer-events-none absolute inset-0 z-20 bg-[#050607]" style={{ opacity: layer }} data-act="os">
      <div className="absolute inset-x-0 top-[112px] flex items-end justify-between gap-8 px-[4vw]">
        <div className="relative h-[96px] min-w-0 flex-1">
          <Caption o={cC}>
            <OsCaption text={CHART_TEXT} />
          </Caption>
          <Caption o={wC}>
            <OsCaption text={WATCH_TEXT} />
          </Caption>
        </div>
        <div className="relative h-[30px] w-[min(30rem,36vw)] shrink-0 max-xl:hidden">
          <Caption o={cC} right>
            <ChipStrip
              mv={mv}
              chips={[
                { label: "Ask", at: [C(CHART.ask[0]), C(CHART.high[0])] },
                { label: "Range", at: [C(CHART.high[0]), C(CHART.trend[0])] },
                { label: "Trend", at: [C(CHART.trend[0]), C(CHART.panel)] },
                { label: "Analysis", at: [C(CHART.panel), C(CHART.checked)] },
                { label: "Checked", at: [C(CHART.checked), C(0.995)] },
              ]}
            />
          </Caption>
          <Caption o={wC} right>
            <ChipStrip
              mv={mv}
              chips={[
                { label: "Add", at: [W(WATCH.ask[0]), W(WATCH.heat)] },
                { label: "Heatmap", at: [W(WATCH.heat), W(WATCH.overview)] },
                { label: "Overview", at: [W(WATCH.overview), W(WATCH.mover)] },
                { label: "Biggest move", at: [W(WATCH.mover), W(0.995)] },
              ]}
            />
          </Caption>
        </div>
      </div>
      <motion.div className="absolute inset-x-[4vw] bottom-[3vh] top-[218px]" style={{ scale }}>
        <MarketScreen mv={mv} quotes={quotes} className="h-full w-full" />
        {avatarHere ? <AvatarOverlay mv={mv} track={chartAvatarTrack} className="absolute inset-0" /> : null}
      </motion.div>
      <p className={`${MONO} absolute bottom-1 left-1/2 -translate-x-1/2 text-[9.5px] text-[#4E5659]`}>Illustration of the AFVAR OS · prices real and labelled, everything else sample</p>
    </motion.div>
  );
}

function Caption({ o, right = false, children }: { o: MotionValue<number>; right?: boolean; children: ReactNode }) {
  const y = useTransform(o, (v) => (1 - v) * 12);
  return (
    <motion.div className={`absolute bottom-0 ${right ? "right-0 flex justify-end" : "inset-x-0"}`} style={{ opacity: o, y }}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------- the screen */

const DOCK_APPS: DockItem[] = [
  { id: "chart", label: "Charts", glyph: "chart" },
  { id: "research", label: "Research", glyph: "research" },
  { id: "alerts", label: "Alerts", glyph: "alerts" },
  { id: "risk", label: "Risk Guardian", glyph: "risk" },
  { id: "community", label: "Community", glyph: "community" },
];

export function MarketScreen({ mv, quotes, className = "" }: { mv: MotionValue<number>; quotes: Quotes; className?: string }) {
  return (
    <OsScreen className={className}>
      <MarketDesk mv={mv} quotes={quotes} />
      <div className="absolute inset-x-0 top-0 z-40 h-[30px]">
        <MenuBar space="Space 1 / 1 · Markets" clock={<UtcHm />} />
      </div>
      <Dock items={DOCK_APPS.map((d) => ({ ...d, running: d.id === "chart" }))} />
    </OsScreen>
  );
}

function UtcHm() {
  const now = useNowMinute();
  return <>{now ? `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")} UTC` : "--:--"}</>;
}

type Box = [x: number, y: number, w: number, h: number];
const k = (at: number, [x, y, w, h]: Box, o = 1, s = 1): BoxKeyframe => ({ at, x, y, w, h, o, s });

/* One desk for both acts, so the chart → watchlist hand-off is continuous:
 * the chart steps to the right, the analysis slides away, the watchlist
 * slides in from the left, then the heatmap and the overview open over the chart. */
const CH_FULL: Box = [12, 40, 760, 540];
const CH_RIGHT: Box = [424, 40, 764, 540];
const PANEL_IN: Box = [784, 40, 404, 330];
const PANEL_OUT: Box = [1210, 40, 404, 330];
const LIST_IN: Box = [12, 40, 400, 540];
const LIST_OUT: Box = [-420, 40, 400, 540];

export const DESK_KEYS = {
  chart: [k(C(0), CH_FULL), k(W(WATCH.swap[0]), CH_FULL), k(W(WATCH.swap[1]), CH_RIGHT)],
  panel: [k(C(CHART.panel), PANEL_OUT, 0), k(C(CHART.panel + 0.04), PANEL_IN), k(W(0), PANEL_IN), k(W(WATCH.swap[1] - 0.03), PANEL_OUT, 0)],
  list: [k(W(WATCH.swap[0]), LIST_OUT, 0), k(W(WATCH.swap[1]), LIST_IN)],
  heat: [k(W(WATCH.heat), [424, 70, 764, 330], 0, 0.96), k(W(WATCH.heat + 0.04), [424, 40, 764, 330])],
  over: [k(W(WATCH.overview), [424, 412, 764, 168], 0, 0.96), k(W(WATCH.overview + 0.04), [424, 382, 764, 198])],
} satisfies Record<string, BoxKeyframe[]>;

function MarketDesk({ mv, quotes }: { mv: MotionValue<number>; quotes: Quotes }) {
  const q = quotes.XAUUSD;
  const chart = useBoxKeys(mv, DESK_KEYS.chart);
  const panel = useBoxKeys(mv, DESK_KEYS.panel);
  const list = useBoxKeys(mv, DESK_KEYS.list);
  const heat = useBoxKeys(mv, DESK_KEYS.heat);
  const over = useBoxKeys(mv, DESK_KEYS.over);

  // chart act
  const spotC = useTransform(mv, (p) => window4(p, [C(CHART.spot[0]), C(CHART.spot[1]), C(CHART.spot[2]), C(CHART.spot[3])]));
  const spotCy = useTransform(spotC, (o) => (1 - o) * -16);
  const typedC = useTypedText(mv, CHART_ASK, [C(CHART.ask[0]), C(CHART.ask[1])]);
  const typedDone = useStep(mv, [C(CHART.ask[1] + 0.01)]) >= 0;
  const owned = useStep(mv, [C(CHART.high[0] - 0.02), C(CHART.checked)]) === 0;
  const rows = useStep(
    mv,
    CHART.rows.map((r) => C(r)),
  );
  const bubble = useTransform(mv, (p) => window4(p, [C(CHART.speak[0] - 0.02), C(CHART.speak[0]), C(CHART.checked - 0.01), C(CHART.checked + 0.01)]));
  const said = useTypedText(mv, CHART_SPEECH, [C(CHART.speak[0]), C(CHART.speak[1])]);
  const toast = useTransform(mv, (p) => window4(p, [C(CHART.checked), C(CHART.checked + 0.02), C(0.98), W(0.02)]));
  const toastY = useTransform(toast, (v) => (1 - v) * -10);

  // watch act
  const spotW = useTransform(mv, (p) => window4(p, [W(WATCH.spot[0]), W(WATCH.spot[1]), W(WATCH.spot[2]), W(WATCH.spot[3])]));
  const spotWy = useTransform(spotW, (o) => (1 - o) * -16);
  const typedW = useTypedText(mv, WATCH_ASK, [W(WATCH.ask[0]), W(WATCH.ask[1])]);
  const added = useStep(
    mv,
    WATCH.added.map((a) => W(a)),
  );
  const fresh = useStep(mv, [W(WATCH.added[0]), W(WATCH.heat + 0.06)]) === 0;
  const mover = useStep(mv, [W(WATCH.mover)]) >= 0;
  const inWatch = useStep(mv, [W(0)]) >= 0;
  const big = biggestMover(
    quotes,
    LANE_KEYS.map(([key]) => key),
  );
  const ups = LANE_KEYS.filter(([key]) => (quotes[key]?.changePct ?? 0) >= 0).length;
  const sources = Array.from(new Set(LANE_KEYS.map(([key]) => quotes[key]).filter((x): x is HomeQuote => Boolean(x)).map((x) => `${x.source ?? "Stored values"}|${x.status}`))).map((s) => s.split("|") as [string, HomeQuote["status"]]);

  if (!q) return null;
  return (
    <>
      {/* ---- chart ---- */}
      <OsWindow
        title="Charts"
        glyph="chart"
        tabs={["Gold · 1H", "Silver · 1H"]}
        focused={!inWatch}
        z={inWatch ? 11 : 13}
        aiOwned={owned}
        style={chart}
        toolbar={
          <span className="flex items-center gap-2">
            <StatusChip status={q.status} small />
            <span className="font-mono text-[9.5px] text-[#6D7578]">{asOfText(q.asOf)}</span>
          </span>
        }
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-3 pt-2 font-mono text-[11px]">
            <span className="text-[#F5F7F7]">XAU/USD</span>
            <span className="tabular-nums text-[#F5F7F7]">{fmtPrice(q.last, q.decimals)}</span>
            <span className={q.changePct >= 0 ? "text-[#00E676]" : "text-[#FF6B6B]"}>{signedPct(q.changePct)}</span>
            <span className="ml-auto text-[9.5px] text-[#6D7578]">{q.source ?? "Stored values"}</span>
          </div>
          <AiChart mv={mv} quote={q} className="mx-2 mb-2 mt-1 min-h-0 flex-1" />
        </div>
      </OsWindow>

      <OsWindow title="Technical analysis · Gold 1H" glyph="research" z={14} aiOwned style={panel}>
        <div className="flex h-full flex-col p-4">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-[#F5F7F7]">
            <AiOrb size={10} pulse={rows < 2} /> What the closes show
          </p>
          <ul className="mt-3 space-y-2">
            {analysisRows(q).map((r, i) => (
              <li key={r.k} className={`rounded-lg border px-3 py-2 transition-opacity duration-300 ${rows >= i ? "opacity-100" : "opacity-0"} ${rows === i ? "border-[rgba(233,180,76,0.55)]" : "border-[rgba(255,255,255,0.07)]"}`}>
                <p className={`${MONO} text-[9px] text-[#8A9295]`}>{r.k}</p>
                <p className="mt-0.5 text-[13px] text-[#E6E9EB]">{r.v}</p>
              </li>
            ))}
          </ul>
          <p className="mt-auto font-mono text-[10px] text-[#6D7578]">
            From the {closesLabel(q)} · {STATUS_LABEL[q.status].toLowerCase()} · {asOfText(q.asOf)}
          </p>
        </div>
      </OsWindow>

      <Spotlight typedRef={typedC} style={{ opacity: spotC, y: spotCy }}>
        {typedDone ? (
          <div>
            <p className={`${MONO} text-[9.5px] text-[#E9B44C]`}>AFVAR will draw</p>
            <p className="mt-1.5 flex items-center gap-2 text-[14px] text-[#F5F7F7]">
              <span className="text-[#E9B44C]">›</span> Range high, range low, trend line · Gold 1H
            </p>
            <p className="mt-2 text-[12px] text-[#8A9295]">On your chart, in gold, from the closes it shows.</p>
          </div>
        ) : (
          <div>
            <p className={`${MONO} mb-1.5 text-[9.5px] text-[#8A9295]`}>Try</p>
            <ul className="space-y-1 text-[13px] text-[#C9CFD1]">
              <li>“Show Silver next to Gold”</li>
              <li>“Switch to the four-hour view”</li>
            </ul>
          </div>
        )}
      </Spotlight>

      {/* the avatar speaks once on this page: here, from its corner */}
      <motion.div className="absolute left-[690px] top-[430px] z-[56] w-[330px] rounded-2xl rounded-br-sm border border-[rgba(233,180,76,0.5)] bg-[rgba(16,19,21,0.97)] px-4 py-3" style={{ opacity: bubble }}>
        <p className={`${MONO} mb-1 flex items-center gap-1.5 text-[9.5px] text-[#E9B44C]`}>
          <AiOrb size={7} pulse={false} /> AFVAR · speaking
        </p>
        <p className="min-h-[2.8em] text-[15px] leading-snug text-[#F5F7F7]">
          <span ref={said} />
        </p>
      </motion.div>

      <div className="absolute right-3 top-[382px] z-50">
        <Toast tone="ok" title="Drawn and checked" meta="✓ verified" style={{ opacity: toast, y: toastY }}>
          Each line matches the closes it came from.
        </Toast>
      </div>

      {/* ---- watchlist ---- */}
      <OsWindow title="Watchlist · My markets" glyph="chart" focused={inWatch} z={13} aiOwned={fresh} style={list}>
        <div className="flex h-full flex-col">
          <ul className="divide-y divide-[rgba(255,255,255,0.05)] px-2 pt-1">
            {[...WATCH_START, ...WATCH_ADDED].map((key) => {
              const x = quotes[key];
              if (!x) return null;
              const i = (WATCH_ADDED as readonly string[]).indexOf(key);
              const shown = i < 0 || added >= i;
              const isNew = i >= 0 && fresh;
              return (
                <li key={key} className={`flex items-center gap-2 px-2 py-2 font-mono text-[11.5px] transition-[opacity,background-color] duration-300 ${shown ? "opacity-100" : "opacity-0"} ${isNew ? "bg-[rgba(233,180,76,0.08)]" : ""}`}>
                  <span className="w-[4.9rem] shrink-0 text-[#C9CFD1]">{shortName(key)}</span>
                  <span className="tabular-nums text-[#F5F7F7]">{fmtPrice(x.last, x.decimals)}</span>
                  <span className={`tabular-nums ${x.changePct >= 0 ? "text-[#00E676]" : "text-[#FF6B6B]"}`}>{signedPct(x.changePct)}</span>
                  <span className="ml-auto">{isNew ? <span className="text-[9px] uppercase tracking-wider text-[#E9B44C]">Added by AFVAR</span> : <StatusChip status={x.status} small />}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto border-t border-[rgba(255,255,255,0.06)] px-4 py-3">
            <p className={`${MONO} text-[9px] text-[#8A9295]`}>Sources in this list</p>
            <ul className="mt-1.5 space-y-1 font-mono text-[10.5px] text-[#C9CFD1]">
              {sources.map(([src, status]) => (
                <li key={src} className="flex items-center justify-between gap-3">
                  <span className="truncate">{src}</span>
                  <StatusChip status={status} small />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </OsWindow>

      <OsWindow title="Heatmap · since the previous close" glyph="layouts" z={14} style={heat}>
        <div className="h-full p-3">
          <HeatGrid quotes={quotes} mover={mover} />
        </div>
      </OsWindow>

      <OsWindow title="Market overview" glyph="research" z={14} aiOwned={mover} style={over}>
        <ul className="grid h-full grid-cols-3 divide-x divide-[rgba(255,255,255,0.06)] p-3 text-[12px]">
          <li className="px-3">
            <p className={`${MONO} text-[9px] text-[#8A9295]`}>Freshness</p>
            <p className="mt-2 text-[14px] text-[#F5F7F7]">{mixText(quotes)}</p>
          </li>
          <li className="px-3">
            <p className={`${MONO} text-[9px] text-[#8A9295]`}>Breadth</p>
            <p className="mt-2 text-[14px] text-[#F5F7F7]">
              {ups} up · {LANE_KEYS.length - ups} down
            </p>
          </li>
          <li className="px-3">
            <p className={`${MONO} text-[9px] transition-colors duration-300 ${mover ? "text-[#E9B44C]" : "text-[#8A9295]"}`}>Biggest move today</p>
            <p className={`mt-2 text-[14px] transition-colors duration-300 ${mover ? "text-[#F3DFAF]" : "text-[#F5F7F7]"}`}>{big ? `${shortName(big.key)} ${signedPct(big.quote.changePct)}` : "—"}</p>
            {big ? <p className="mt-1 font-mono text-[9.5px] text-[#6D7578]">{STATUS_LABEL[big.quote.status].toLowerCase()} · {asOfText(big.quote.asOf)}</p> : null}
          </li>
        </ul>
      </OsWindow>

      <Spotlight typedRef={typedW} style={{ opacity: spotW, y: spotWy }} />
    </>
  );
}

/* ---------------------------------------------- the avatar (chart act) */

const AVATAR_CORNER = { x: 1105, y: 606, h: 150 };

export function chartAvatarTrack(p: number, _t: number, out: AvatarFrame): AvatarFrame {
  out.visible = p >= C(0.03) && p < C(0.97);
  if (!out.visible) return out;
  out.explode = 1 - easeInOut(ramp(p, C(0.03), C(0.08)));
  out.x = AVATAR_CORNER.x;
  out.y = AVATAR_CORNER.y;
  out.scale = AVATAR_CORNER.h * (0.35 + 0.65 * ramp(p, C(0.03), C(0.07)));
  out.turn = -0.38;
  out.lean = 0;
  out.z = 0;
  out.talk = 0;
  if (p >= C(CHART.speak[0]) && p < C(CHART.speak[1])) {
    out.gesture = "explain";
    out.emotion = "happy";
    out.aura = "speaking";
    out.talk = 1;
  } else if (p >= C(CHART.high[0]) && p < C(CHART.panel)) {
    out.gesture = "pointLeft";
    out.emotion = "focused";
    out.aura = "thinking";
  } else if (p >= C(CHART.checked)) {
    out.gesture = "acknowledge";
    out.emotion = "happy";
    out.aura = "idle";
  } else {
    out.gesture = "listen";
    out.emotion = "curious";
    out.aura = "listening";
  }
  return out;
}
