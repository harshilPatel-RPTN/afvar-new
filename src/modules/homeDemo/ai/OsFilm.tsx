"use client";

// Act 06 — the AFVAR OS, as a scroll-driven film on a real (DOM) desktop.
// The camera has dived into the core; the OS boots around the AI:
//
//   boot      menu bar + dock rise, the AI orb wakes
//   apps      Chart, Research and Alerts open from the dock
//   windows   drag-resize the chart, drag it to the edge and it snaps; the
//             others snap with keyboard; markets live in tabs
//   ai        "Set up my London open" — the AI plans, then arranges the
//             desktop step by step in its panel, sets an alert, opens apps
//   memory    the layout is saved; switch to the New York space and back —
//             windows, sizes and tabs are exactly as you left them
//   focus     Risk Guardian breaks through, Focus mode holds the rest,
//             widgets take the side panel, the alert follows you to the phone
//
// Every position is a keyframe in this file (os-local fractions → master
// progress), so scrolling back plays the film in reverse.
import { motion, useTransform, type MotionValue } from "framer-motion";
import { type ReactNode } from "react";
import {
  AiOrb,
  AvatarOverlay,
  easeInOut,
  type AvatarFrame,
  AppGlyph,
  Dock,
  EYEBROW,
  H3,
  MenuBar,
  MiniChart,
  MONO,
  OsScreen,
  OsWindow,
  Pointer,
  SnapGhost,
  Spotlight,
  Toast,
  dockSlotX,
  ramp,
  sampleKeys,
  useBoxKeys,
  useStep,
  useTypedText,
  window4,
  type BoxKeyframe,
  type DockItem,
} from "@/modules/afvarOs";
import { fmtPrice } from "@/modules/home/kit";
import { AVATAR, DESKTOP_FILM } from "./aiConfig";
import { useNowMinute, sessionsNow, type Quotes } from "./cards";

const U = (u: number) => DESKTOP_FILM.at("os", u);
const W = (a: number, b: number, c: number, d: number) => [U(a), U(b), U(c), U(d)] as const;

/* --------------------------------------------------------------- beats */

export const OS_BEATS = [
  { id: "boot", at: W(0, 0.03, 0.085, 0.1), title: "A desktop built for trading.", body: "Your workspace opens around the AI, and the avatar takes its corner of the screen." },
  { id: "apps", at: W(0.1, 0.115, 0.19, 0.205), title: "Every tool is an app.", body: "Charts, research, alerts, calendar, risk and journal open like apps on any computer." },
  { id: "windows", at: W(0.205, 0.22, 0.345, 0.36), title: "Windows that behave.", body: "Drag to resize. Drag to the edge and it snaps. Keep every market in its own tab." },
  { id: "ai", at: W(0.36, 0.375, 0.545, 0.56), title: "Tell it what you need.", body: "Type or say it. The AI plans the work, arranges your desktop and shows every step it took." },
  { id: "memory", at: W(0.56, 0.575, 0.745, 0.76), title: "It remembers how you work.", body: "Layouts, window sizes and tabs are saved. Switch spaces, come back, everything is where you left it." },
  { id: "focus", at: W(0.76, 0.775, 0.96, 0.985), title: "Alerts, focus and widgets.", body: "Risk alerts break through, and the avatar walks over to tell you. Everything else waits." },
] as const;
const BEAT_NAMES = ["Boot", "Apps", "Windows", "AI", "Memory", "Focus"];

/* ------------------------------------------------------------ keyframes */

const DOCK_APPS: DockItem[] = [
  { id: "chart", label: "Charts", glyph: "chart" },
  { id: "research", label: "Research", glyph: "research" },
  { id: "alerts", label: "Alerts", glyph: "alerts" },
  { id: "calendar", label: "Calendar", glyph: "calendar" },
  { id: "risk", label: "Risk Guardian", glyph: "risk" },
  { id: "journal", label: "Journal", glyph: "journal" },
  { id: "news", label: "News", glyph: "news" },
  { id: "community", label: "Community", glyph: "community" },
  { id: "layouts", label: "Layouts", glyph: "layouts" },
];
const slot = (id: string) => dockSlotX(DOCK_APPS.findIndex((d) => d.id === id) + 1, DOCK_APPS.length);

type Box = [x: number, y: number, w: number, h: number];
const k = (u: number, [x, y, w, h]: Box, o = 1, s = 1): BoxKeyframe => ({ at: U(u), x, y, w, h, o, s });
const fromDock = (u: number, id: string): BoxKeyframe => k(u, [slot(id) - 110, 560, 220, 70], 0, 0.25);

const CHART_A: Box = [60, 60, 520, 330];
const CHART_BIG: Box = [60, 60, 700, 470];
const CHART_DRAG: Box = [-226, 185, 700, 470];
const LEFT_HALF: Box = [12, 40, 588, 540];
const CHART_LDN: Box = [12, 40, 560, 330];
const RESEARCH_A: Box = [430, 150, 420, 300];
const RIGHT_TOP: Box = [612, 40, 576, 265];
const RIGHT_BOTTOM: Box = [612, 315, 576, 265];
const RESEARCH_LDN: Box = [584, 40, 296, 540];
const ALERTS_A: Box = [760, 90, 380, 250];
const CAL_LDN: Box = [12, 380, 276, 200];
const RISK_LDN: Box = [296, 380, 276, 200];
const PANEL: Box = [892, 40, 296, 382];
const PANEL_OUT: Box = [1210, 40, 296, 382];

export const OS_KEYS = {
  chart: [fromDock(0.1, "chart"), k(0.135, CHART_A), k(0.235, CHART_A), k(0.27, CHART_BIG), k(0.285, CHART_BIG), k(0.31, CHART_DRAG), k(0.322, LEFT_HALF), k(0.4, LEFT_HALF), k(0.47, CHART_LDN)],
  research: [fromDock(0.14, "research"), k(0.17, RESEARCH_A), k(0.325, RESEARCH_A), k(0.345, RIGHT_TOP), k(0.4, RIGHT_TOP), k(0.47, RESEARCH_LDN)],
  alerts: [fromDock(0.17, "alerts"), k(0.2, ALERTS_A), k(0.34, ALERTS_A), k(0.36, RIGHT_BOTTOM), k(0.42, RIGHT_BOTTOM), { ...fromDock(0.46, "alerts") }],
  calendar: [fromDock(0.465, "calendar"), k(0.495, CAL_LDN)],
  risk: [fromDock(0.48, "risk"), k(0.51, RISK_LDN)],
  panel: [k(0.445, PANEL_OUT, 0), k(0.47, PANEL), k(0.86, PANEL), k(0.885, PANEL_OUT, 0)],
} satisfies Record<string, BoxKeyframe[]>;

/* Pointer: [u, x, y, opacity, pressed] */
const POINTER_RAW: readonly (readonly [number, number, number, number, number])[] = [
  [0.19, 470, 300, 0, 0],
  [0.21, 470, 300, 1, 0],
  [0.232, 576, 386, 1, 0],
  [0.236, 576, 386, 1, 1],
  [0.27, 756, 526, 1, 1],
  [0.274, 756, 526, 1, 0],
  [0.285, 300, 74, 1, 0],
  [0.288, 300, 74, 1, 1],
  [0.31, 14, 199, 1, 1],
  [0.318, 14, 199, 1, 0],
  [0.33, 14, 199, 0, 0],
  [0.645, 600, 320, 0, 0],
  [0.65, 600, 320, 1, 0],
  [0.66, 268, 15, 1, 0],
  [0.662, 268, 15, 1, 1],
  [0.666, 268, 15, 1, 0],
  [0.671, 300, 84, 1, 0],
  [0.673, 300, 84, 1, 1],
  [0.676, 300, 84, 1, 0],
  [0.69, 300, 84, 0, 0],
  [0.8, 700, 320, 0, 0],
  [0.805, 700, 320, 1, 0],
  [0.818, 893, 15, 1, 0],
  [0.821, 893, 15, 1, 1],
  [0.824, 893, 15, 1, 0],
  [0.84, 893, 15, 0, 0],
];
export const POINTER = POINTER_RAW.map(([u, x, y, o, d]) => ({ at: U(u), x, y, o, d }));

/* ----------------------------------------------------------- the film */

/** The desktop itself (screen only). Cinematic and stacked layouts both use it. */
export function OsDesktop({ mv, quotes, className = "" }: { mv: MotionValue<number>; quotes: Quotes; className?: string }) {
  // discrete states
  const tabStep = useStep(mv, [U(0.335), U(0.35), U(0.47)]);
  const chartTab = tabStep === 0 ? 1 : tabStep === 1 ? 2 : 0;
  const spaceStep = useStep(mv, [U(0.61), U(0.69)]);
  const space = spaceStep === 0 ? "Space 2 / 3 · New York" : "Space 1 / 3 · London";
  const openMenu = useStep(mv, [U(0.658), U(0.677)]) === 0 ? "Layouts" : null;
  const focusOn = useStep(mv, [U(0.822)]) >= 0;
  const riskHigh = useStep(mv, [U(0.765)]) >= 0;
  const running = useStep(mv, [U(0.13), U(0.16), U(0.19), U(0.46), U(0.495), U(0.51)]);
  const alertsAttention = useStep(mv, [U(0.46), U(0.52)]) === 0;

  const dockItems = DOCK_APPS.map((d) => ({
    ...d,
    running:
      (d.id === "chart" && running >= 0) ||
      (d.id === "research" && running >= 1) ||
      (d.id === "alerts" && running >= 2) ||
      (d.id === "calendar" && running >= 4) ||
      (d.id === "risk" && running >= 5),
    attention: d.id === "alerts" && alertsAttention,
  }));

  const chart = useBoxKeys(mv, OS_KEYS.chart);
  const research = useBoxKeys(mv, OS_KEYS.research);
  const alerts = useBoxKeys(mv, OS_KEYS.alerts);
  const calendar = useBoxKeys(mv, OS_KEYS.calendar);
  const risk = useBoxKeys(mv, OS_KEYS.risk);
  const panel = useBoxKeys(mv, OS_KEYS.panel);

  // chrome entrance
  // The desktop is already booting as the OS layer fades in: no empty frame.
  const barY = useTransform(mv, (p) => (1 - ramp(p, U(0), U(0.03))) * -32);
  const dockY = useTransform(mv, (p) => (1 - ramp(p, U(0.005), U(0.04))) * 90);
  const trackX = useTransform(mv, (p) => -1200 * (ramp(p, U(0.6), U(0.63)) * (1 - ramp(p, U(0.675), U(0.705)))));

  const ghost = useTransform(mv, (p) => window4(p, [U(0.296), U(0.305), U(0.316), U(0.322)]));
  const keyHint = useTransform(mv, (p) => window4(p, [U(0.33), U(0.337), U(0.355), U(0.362)]));
  const spot = useTransform(mv, (p) => window4(p, [U(0.362), U(0.372), U(0.444), U(0.452)]));
  const spotY = useTransform(spot, (o) => (1 - o) * -16);
  const typed = useTypedText(mv, "Set up my London open", [U(0.378), U(0.422)]);
  const plan = useStep(mv, [U(0.426), U(0.43), U(0.434), U(0.438), U(0.442)]);
  const menu = useTransform(mv, (p) => window4(p, [U(0.659), U(0.662), U(0.674), U(0.678)]));
  const londonPick = useStep(mv, [U(0.671)]) >= 0;

  const pScratch = { x: 0, y: 0, o: 0, d: 0 };
  const px = useTransform(mv, (p) => sampleKeys(POINTER, p, pScratch).x);
  const py = useTransform(mv, (p) => sampleKeys(POINTER, p, pScratch).y);
  const po = useTransform(mv, (p) => sampleKeys(POINTER, p, pScratch).o);
  const pd = useTransform(mv, (p) => 1 - 0.18 * sampleKeys(POINTER, p, pScratch).d);

  const t1 = useTransform(mv, (p) => window4(p, [U(0.562), U(0.572), U(0.61), U(0.62)]));
  const t2 = useTransform(mv, (p) => window4(p, [U(0.705), U(0.715), U(0.75), U(0.76)]));
  const t3 = useTransform(mv, (p) => window4(p, [U(0.765), U(0.775), U(0.87), U(0.882)]));
  const t4 = useTransform(mv, (p) => window4(p, [U(0.826), U(0.836), U(0.87), U(0.882)]));
  const t1y = useTransform(t1, (v) => (1 - v) * -10);
  const t2y = useTransform(t2, (v) => (1 - v) * -10);
  const t3y = useTransform(t3, (v) => (1 - v) * -10);
  const t4y = useTransform(t4, (v) => (1 - v) * -10);

  const widgets = useStep(mv, [U(0.885), U(0.9), U(0.915)]);
  const dim = useTransform(mv, (p) => 0.42 * stepForward(p));
  const pill = useTransform(mv, (p) => {
    const away = Math.max(stepForward(p), ramp(p, U(0.765), U(0.772)) * (1 - ramp(p, U(0.868), U(0.875))));
    return ramp(p, U(0.1), U(0.11)) * (1 - away) * (1 - ramp(p, U(0.975), U(0.985)));
  });

  // boot: the AI orb wakes in the middle of the screen, then settles into the dock
  const orbO = useTransform(mv, (p) => window4(p, [U(0), U(0.02), U(0.088), U(0.1)]));
  const orbMove = (p: number) => ramp(p, U(0.072), U(0.098));
  const orbX = useTransform(mv, (p) => (AVATAR_CORNER.x - 600) * orbMove(p));
  const orbY = useTransform(mv, (p) => (AVATAR_CORNER.y - 120 - 300) * orbMove(p));
  const orbS = useTransform(mv, (p) => 1 - 0.8 * orbMove(p));
  const bootText = useTransform(mv, (p) => window4(p, [U(0.008), U(0.022), U(0.07), U(0.078)]));

  return (
    <OsScreen className={className}>
      {/* desktop track: space 1 at x 0, space 2 at x 1200 */}
      <motion.div className="absolute inset-0" style={{ x: trackX }}>
        <SnapGhost style={{ left: 12, top: 40, width: 588, height: 540, opacity: ghost }} />

        <OsWindow title="Charts" glyph="chart" tabs={["XAU/USD · 1H", "EUR/USD · 15m", "BTC · 4H"]} activeTab={chartTab} focused z={14} aiOwned={false} style={chart}>
          <ChartBody quotes={quotes} sym={(["XAUUSD", "EURUSD", "BTC-USD"] as const)[chartTab]} />
        </OsWindow>
        <OsWindow title="Research · AI brief" glyph="research" z={12} dimmed={focusOn} style={research}>
          <ResearchBody />
        </OsWindow>
        <OsWindow title="Alerts" glyph="alerts" z={13} style={alerts}>
          <AlertsBody />
        </OsWindow>
        <OsWindow title="Calendar · today" glyph="calendar" z={11} dimmed={focusOn} style={calendar}>
          <CalendarBody />
        </OsWindow>
        <OsWindow title="Risk Guardian" glyph="risk" z={11} aiOwned={riskHigh && !focusOn} style={risk}>
          <RiskBody high={riskHigh} />
        </OsWindow>
        <OsWindow title="AFVAR AI" glyph="layouts" z={15} aiOwned dimmed={false} style={panel}>
          <AiPanel mv={mv} />
        </OsWindow>
        {widgets >= 0 ? <Widgets step={widgets} quotes={quotes} /> : null}

        {/* space 2 — New York */}
        <div className="absolute inset-0" style={{ left: 1200 }}>
          <OsWindow title="Charts" glyph="chart" tabs={["BTC · 4H", "NAS100 · 1H"]} focused style={{ left: 12, top: 40, width: 760, height: 540 }}>
            <ChartBody quotes={quotes} sym="BTC-USD" />
          </OsWindow>
          <OsWindow title="Journal" glyph="journal" style={{ left: 784, top: 40, width: 404, height: 260 }}>
            <JournalBody />
          </OsWindow>
          <OsWindow title="News" glyph="news" style={{ left: 784, top: 310, width: 404, height: 270 }}>
            <NewsBody />
          </OsWindow>
        </div>
      </motion.div>

      <motion.div className="absolute inset-x-0 top-0 z-40 h-[30px]" style={{ y: barY }}>
        <MenuBar space={space} openMenu={openMenu} focus={focusOn ? "London open" : null} clock={<UtcHm />} />
      </motion.div>

      {/* Layouts menu */}
      <motion.div className="absolute left-[238px] top-[30px] z-50 w-[230px] rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#14181A] p-1.5 text-[12px] shadow-xl" style={{ opacity: menu }}>
        {[
          ["London open", "saved · 6 windows"],
          ["New York", "current"],
          ["Asia morning", ""],
        ].map(([n, m], i) => (
          <div key={n} className={`flex items-center justify-between rounded-md px-2.5 py-1.5 ${i === 0 && londonPick ? "bg-[rgba(168,222,194,0.2)] text-[#F2F5F2]" : "text-[#C9CFD1]"}`}>
            <span>{n}</span>
            <span className="font-mono text-[9.5px] text-[#92A399]">{m}</span>
          </div>
        ))}
        <div className="mt-1 border-t border-[rgba(255,255,255,0.08)] px-2.5 pt-1.5 text-[#8A9295]">Save current layout…</div>
      </motion.div>

      <Spotlight typedRef={typed} style={{ opacity: spot, y: spotY }}>
        <p className={`${MONO} mb-2 text-[9.5px] text-[#A8DEC2]`}>AI plan · 5 steps</p>
        <ul className="space-y-1.5 text-[13px] text-[#C9CFD1]">
          {["Open Calendar with today's events", "Open Risk Guardian", "Arrange Chart · Research · AI side by side", "Alert: XAU/USD 1H close above 4,040", "Save as layout “London open”"].map((t, i) => (
            <li key={t} className={`flex items-center gap-2 transition-opacity duration-200 ${plan >= i ? "opacity-100" : "opacity-0"}`}>
              <span className="text-[#A8DEC2]">›</span>
              {t}
            </li>
          ))}
        </ul>
      </Spotlight>

      <motion.div className="absolute bottom-[86px] left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#14181A] px-3 py-2 text-[12px] text-[#C9CFD1]" style={{ opacity: keyHint }}>
        {["⌃", "⌥", "→"].map((c) => (
          <kbd key={c} className="rounded-md border border-[rgba(255,255,255,0.18)] bg-[#10231B] px-2 py-0.5 font-mono text-[12px] text-[#F2F5F2]">
            {c}
          </kbd>
        ))}
        <span className="ml-1">Snap to halves and quarters</span>
      </motion.div>

      <div className="absolute right-3 top-[40px] z-50">
        <Toast tone="ai" title="Layout saved · London open" meta="now" style={{ opacity: t1, y: t1y, position: "absolute", right: 0, top: 0 }}>
          6 windows, their sizes and tabs remembered.
        </Toast>
        <Toast tone="ok" title="Restored · London open" meta="now" style={{ opacity: t2, y: t2y, position: "absolute", right: 0, top: 0 }}>
          Exactly as you left it, tabs included.
        </Toast>
        <Toast tone="risk" title="Risk Guardian" meta="now" style={{ opacity: t3, y: t3y, position: "absolute", right: 0, top: 0 }}>
          You&apos;re at 80% of today&apos;s loss limit.
        </Toast>
        <Toast tone="ai" title="Focus on · London open" meta="until 15:00" style={{ opacity: t4, y: t4y, position: "absolute", right: 0, top: 78 }}>
          3 notifications held. Risk alerts still come through.
        </Toast>
      </div>

      <motion.div className="pointer-events-none absolute left-[540px] top-[240px] z-[45] flex h-[120px] w-[120px] items-center justify-center" style={{ opacity: orbO, x: orbX, y: orbY, scale: orbS }}>
        <AiOrb size={120} />
      </motion.div>
      <motion.p className={`${MONO} absolute left-1/2 top-[390px] z-[45] -translate-x-1/2 text-[11px] text-[#A8DEC2]`} style={{ opacity: bootText }}>
        AFVAR OS · the AI is awake
      </motion.p>

      <Dock items={dockItems} style={{ y: dockY }} />
      <Pointer style={{ x: px, y: py, opacity: po }} pressStyle={{ scale: pd }} />

      {/* the avatar's dock: control pill under its feet (hidden while it is away) */}
      <motion.div
        className="absolute z-[55] flex items-center gap-2.5 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(14,17,19,0.95)] px-2.5 py-1.5 text-[11px] text-[#C9CFD1]"
        style={{ left: AVATAR_CORNER.x - 78, top: AVATAR_CORNER.y + 10, opacity: pill }}
      >
        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0014 0M12 18v3" />
        </svg>
        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 9v6h4l5 4V5L8 9zM17 9a4 4 0 010 6" />
        </svg>
        <span>Text</span>
        <span className="relative h-3.5 w-6 rounded-full bg-[#A8DEC2]">
          <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-[#06110C]" />
        </span>
        <span className="tracking-[-0.1em] text-[#92A399]">⋮⋮</span>
        <span className="text-[10px] text-[#92A399]">Drag to move</span>
      </motion.div>
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[52] bg-(--afvar-charcoal)" style={{ opacity: dim }} />
      {STEP_FORWARD.map((sf, i) => (
        <SpeechBubble key={i} mv={mv} at={[sf.at[1], sf.at[2]]} place="forward" line={sf.line} />
      ))}
      {CORNER_LINES.map((c, i) => (
        <SpeechBubble key={`c${i}`} mv={mv} at={c.at} place={c.place} line={c.line} />
      ))}
    </OsScreen>
  );
}

/** The cinematic wrapper: beat captions, beat strip, phone handoff. */
export function OsFilm({ mv, quotes, avatarHere, avatarHost = avatarHere }: { mv: MotionValue<number>; quotes: Quotes; avatarHere: boolean; /** Keep the avatar canvas alive (paused, hidden) even while the rig is in the story scene. */ avatarHost?: boolean }) {
  const layer = useTransform(mv, (p) => ramp(p, U(0), U(0.035)) * (1 - ramp(p, U(0.955), U(0.99))));
  const screenScale = useTransform(mv, (p) => 0.94 + 0.06 * ramp(p, U(0), U(0.05)) - 0.04 * ramp(p, U(0.955), U(0.99)));
  const beat = useStep(
    mv,
    OS_BEATS.map((b) => b.at[0]),
  );
  const phone = useTransform(mv, (p) => window4(p, [U(0.935), U(0.945), U(0.975), U(0.99)]));
  const phoneY = useTransform(phone, (o) => (1 - o) * 40);

  return (
    <motion.div className="pointer-events-none absolute inset-0 z-20" style={{ opacity: layer }} data-act="os">
      <div className="home-os-bar absolute inset-x-0 top-[112px] flex items-end justify-between gap-8 px-[4vw]">
        <div className="home-os-captions relative h-[92px] min-w-0 flex-1">
          {OS_BEATS.map((b, i) => (
            <BeatCaption key={b.id} mv={mv} at={b.at} index={i} title={b.title} body={b.body} />
          ))}
        </div>
        <ol className="afvar-glass-track flex shrink-0 items-center gap-1.5 rounded-full pb-1" aria-label="OS chapters">
          {BEAT_NAMES.map((n, i) => (
            <li key={n} data-selected={i === beat} className={`afvar-glass-tab ${MONO} rounded-full px-2.5 py-1 text-[9.5px]`}>
              {n}
            </li>
          ))}
        </ol>
      </div>
      <motion.div className="home-os-screen absolute inset-x-[4vw] bottom-[3vh] top-[218px]" style={{ scale: screenScale }}>
        <OsDesktop mv={mv} quotes={quotes} className="h-full w-full" />
        {avatarHost || avatarHere ? <AvatarOverlay mv={mv} track={osAvatarTrack} here={avatarHere} build={AVATAR.buildSeconds} className="absolute inset-0" /> : null}
      </motion.div>
      <motion.div className="home-os-phone absolute bottom-[5vh] left-[7vw] z-30 w-[176px] rounded-[26px] border border-[rgba(255,255,255,0.18)] bg-[#06110C] p-2.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]" style={{ opacity: phone, y: phoneY }}>
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#2A2F33]" />
        <p className="text-center font-mono text-[22px] text-[#F2F5F2]">
          <UtcHm />
        </p>
        <div className="mt-3 rounded-xl border border-[rgba(255,107,107,0.5)] bg-[#141719] p-2">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-[#FF6B6B]">
            <AiOrb size={7} pulse={false} /> AFVAR · Risk Guardian
          </p>
          <p className="mt-1 text-[10.5px] leading-snug text-[#C9CFD1]">80% of today&apos;s loss limit. Your London open layout is waiting on desktop.</p>
        </div>
        <p className={`${MONO} mt-2 text-center text-[8.5px] text-[#92A399]`}>Desktop ↔ phone</p>
      </motion.div>
      <p className={`home-os-note ${MONO} absolute bottom-1 left-1/2 -translate-x-1/2 text-[9.5px] text-[#4E5659]`}>Illustration of the AFVAR OS · prices real, everything else sample</p>
    </motion.div>
  );
}

function BeatCaption({ mv, at, index, title, body }: { mv: MotionValue<number>; at: readonly [number, number, number, number]; index: number; title: string; body: string }) {
  const o = useTransform(mv, (p) => window4(p, at));
  const y = useTransform(o, (v) => (1 - v) * 12);
  return (
    <motion.div className="absolute inset-x-0 bottom-0" style={{ opacity: o, y }}>
      <p className={EYEBROW}>06 · The OS · {String(index + 1).padStart(2, "0")}</p>
      <div className="mt-2 flex items-baseline gap-6">
        <h2 className={`${H3} shrink-0`}>{title}</h2>
        <p className="max-w-[34rem] text-[14px] leading-snug text-[#B7C5BC]">{body}</p>
      </div>
    </motion.div>
  );
}

/** Where a bubble sits, by where the avatar is: stepped forward, in its corner (above its head, or
 *  beside it when the AI panel fills the space above), or beside its head at Risk Guardian, clear of the
 *  panel's own risk message. Corner bubbles grow upward. */
const BUBBLE = {
  forward: ["left-[800px] top-[140px] w-[330px] rounded-bl-sm", "text-[15px]"],
  corner: ["right-[14px] bottom-[244px] w-[270px] rounded-br-sm", "text-[13.5px]"],
  side: ["right-[162px] bottom-[118px] w-[250px] rounded-br-sm", "text-[13.5px]"],
  risk: ["left-[714px] bottom-[150px] w-[176px] rounded-bl-sm", "text-[13.5px]"],
} as const;
type BubblePlace = keyof typeof BUBBLE;

/** `at`: os-local [open, close]. */
function SpeechBubble({ mv, at, place, line }: { mv: MotionValue<number>; at: readonly [number, number]; place: BubblePlace; line: string }) {
  const o = useTransform(mv, (p) => window4(p, [U(at[0]), U(at[0] + 0.006), U(at[1] - 0.004), U(at[1] + 0.002)]));
  const typed = useTypedText(mv, line, [U(at[0] + 0.004), U(at[1] - 0.012)]);
  const [box, text] = BUBBLE[place];
  return (
    <motion.div className={`pointer-events-none absolute ${box} z-[56] rounded-2xl border border-[rgba(168,222,194,0.5)] bg-[rgba(16,19,21,0.97)] px-4 py-3`} style={{ opacity: o }}>
      <p className={`${MONO} mb-1 flex items-center gap-1.5 whitespace-nowrap text-[9.5px] text-[#A8DEC2]`}>
        <AiOrb size={7} pulse={false} /> AFVAR · speaking
      </p>
      <p className={`min-h-[2.8em] ${text} leading-snug text-[#F2F5F2]`}>
        <span ref={typed} />
      </p>
    </motion.div>
  );
}

function UtcHm() {
  const now = useNowMinute();
  return <>{now ? `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")} UTC` : "--:--"}</>;
}

/* ---------------------------------------------------------- app bodies */

const SYM_NAME: Record<string, string> = { XAUUSD: "XAU/USD", EURUSD: "EUR/USD", "BTC-USD": "BTC/USD" };

function ChartBody({ quotes, sym }: { quotes: Quotes; sym: "XAUUSD" | "EURUSD" | "BTC-USD" }) {
  const q = quotes[sym];
  if (!q) return null;
  const up = q.changePct >= 0;
  const last = q.last;
  const levels =
    sym === "XAUUSD"
      ? [
          { value: last * 1.0072, label: `AI · bullish above ${fmtPrice(last * 1.0072, q.decimals)}`, tone: "up" as const },
          { value: last * 0.9935, label: `AI · wrong below ${fmtPrice(last * 0.9935, q.decimals)}`, tone: "down" as const },
        ]
      : [];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-3 pt-2 font-mono text-[11px]">
        <span className="text-[#F2F5F2]">{SYM_NAME[sym]}</span>
        <span className="tabular-nums text-[#F2F5F2]">{fmtPrice(last, q.decimals)}</span>
        <span className={up ? "text-[#00E676]" : "text-[#FF6B6B]"}>
          {up ? "▲" : "▼"}
          {Math.abs(q.changePct).toFixed(2)}%
        </span>
        <span className="ml-auto text-[9.5px] uppercase tracking-wider text-[#92A399]">{q.status}</span>
      </div>
      <MiniChart closes={q.closes} levels={levels} className="mx-2 mb-2 mt-1 min-h-0 flex-1" />
    </div>
  );
}

function ResearchBody() {
  return (
    <div className="space-y-2 p-3 text-[12px] leading-snug text-[#C9CFD1]">
      <p className="flex items-center gap-1.5 font-semibold text-[#A8DEC2]">
        <AiOrb size={8} pulse={false} /> Gold · morning brief
      </p>
      <p>Gold held last week&apos;s high overnight. Payrolls at 12:30 UTC are the main risk today; a strong number has pushed gold lower on recent release days.</p>
      <p className="text-[#8A9295]">Levels the AI is watching are drawn on your chart.</p>
      <p className="flex gap-2 pt-1 font-mono text-[9.5px] text-[#92A399]">
        <span className="rounded bg-[#181C1F] px-1.5 py-0.5">MARKET</span>
        <span className="rounded bg-[#181C1F] px-1.5 py-0.5">MACRO</span>
        <span className="rounded bg-[#181C1F] px-1.5 py-0.5">NEWS</span>
        <span className="rounded bg-[#181C1F] px-1.5 py-0.5 text-[#A8DEC2]">3 SOURCES</span>
      </p>
    </div>
  );
}

function AlertsBody() {
  const rows = [
    ["XAU/USD 1H close above level", "armed", "text-[#A8DEC2]"],
    ["EUR/USD weekly high break", "fired 09:14", "text-[#00E676]"],
    ["BTC −3% within 1 hour", "armed", "text-[#A8DEC2]"],
  ];
  return (
    <ul className="divide-y divide-[rgba(255,255,255,0.06)] px-3 text-[12px]">
      {rows.map(([a, b, c]) => (
        <li key={a} className="flex items-center justify-between py-2">
          <span className="text-[#C9CFD1]">{a}</span>
          <span className={`font-mono text-[10px] uppercase ${c}`}>{b}</span>
        </li>
      ))}
    </ul>
  );
}

function CalendarBody() {
  const rows = [
    ["12:30", "US payrolls", "★★★"],
    ["14:00", "Fed speaker", "★★"],
    ["Thu", "ECB decision", "★★★"],
  ];
  return (
    <ul className="space-y-1.5 p-3 text-[12px]">
      {rows.map(([t, e, s]) => (
        <li key={e} className="flex items-center gap-3">
          <span className="w-10 font-mono text-[10.5px] text-[#8A9295]">{t}</span>
          <span className="flex-1 text-[#C9CFD1]">{e}</span>
          <span className="text-[10px] text-[#A8DEC2]">{s}</span>
        </li>
      ))}
    </ul>
  );
}

function RiskBody({ high }: { high: boolean }) {
  const used = high ? 80 : 40;
  return (
    <div className="space-y-2.5 p-3 text-[12px]">
      <div className="flex justify-between text-[#C9CFD1]">
        <span>Daily loss limit used</span>
        <span className={`font-mono ${high ? "text-[#FF6B6B]" : "text-[#F2F5F2]"}`}>{used}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#1E2326]">
        <div className={`h-full rounded-full transition-all duration-700 ${high ? "bg-[#FF6B6B]" : "bg-[#A8DEC2]"}`} style={{ width: `${used}%` }} />
      </div>
      <div className="flex justify-between text-[#8A9295]">
        <span>Open positions</span>
        <span className="font-mono text-[#C9CFD1]">2</span>
      </div>
      <div className="flex justify-between text-[#8A9295]">
        <span>Max risk per trade</span>
        <span className="font-mono text-[#C9CFD1]">1%</span>
      </div>
    </div>
  );
}

function JournalBody() {
  return (
    <ul className="space-y-2 p-3 text-[12px] text-[#C9CFD1]">
      <li>
        <span className="font-mono text-[10px] text-[#92A399]">MON</span> Followed plan · waited for the 15:00 close.
      </li>
      <li>
        <span className="font-mono text-[10px] text-[#92A399]">TUE</span> Entered before CPI. Stopped out. <span className="text-[#A8DEC2]">AI: avoid pre-release entries.</span>
      </li>
      <li>
        <span className="font-mono text-[10px] text-[#92A399]">WED</span> +1.2R on BTC breakout.
      </li>
    </ul>
  );
}

function NewsBody() {
  return (
    <ul className="space-y-2 p-3 text-[12px] text-[#C9CFD1]">
      {["US session opens · equities firm", "Oil steady ahead of inventories", "Crypto volumes rise into US hours"].map((h) => (
        <li key={h} className="flex gap-2">
          <AppGlyph name="news" size={12} color="#92A399" />
          {h}
        </li>
      ))}
      <li className={`${MONO} text-[9px] text-[#5E6669]`}>Sample headlines</li>
    </ul>
  );
}

const AI_STEPS = [
  { u: 0.47, text: "Arranged Chart · Research · AI side by side" },
  { u: 0.48, text: "Minimised Alerts to the dock" },
  { u: 0.495, text: "Opened Calendar · US payrolls 12:30 UTC" },
  { u: 0.51, text: "Opened Risk Guardian · 40% of limit used" },
  { u: 0.525, text: "Alert set · XAU/USD 1H close above level" },
  { u: 0.54, text: "Switched chart to XAU/USD · 1H" },
] as const;

function Msg({ show, children, tone = "ai" }: { show: boolean; children: ReactNode; tone?: "ai" | "risk" }) {
  return show ? (
    <div className={`rounded-lg border px-2.5 py-2 text-[12px] leading-snug ${tone === "risk" ? "border-[rgba(255,107,107,0.4)] text-[#F5D0D0]" : "border-[rgba(168,222,194,0.3)] text-[#E6E9EB]"} bg-[#14171A]`}>{children}</div>
  ) : null;
}

function AiPanel({ mv }: { mv: MotionValue<number> }) {
  // The steps tick in one by one with the scroll; the follow-ups wait for the last one.
  const shown = useStep(mv, AI_STEPS.map((s) => U(s.u))) + 1;
  const after = useStep(mv, [U(0.566), U(0.71), U(0.775)]);
  const later = shown >= AI_STEPS.length ? after + 1 : 0;
  return (
    <div className="flex h-full flex-col justify-end gap-2 p-3">
      <div className="ml-auto rounded-lg bg-[#1E2326] px-2.5 py-1.5 text-[12px] text-[#F2F5F2]">Set up my London open</div>
      <div className="rounded-lg border border-[rgba(168,222,194,0.3)] bg-[#14171A] p-2.5">
        <p className={`${MONO} mb-1.5 text-[9px] text-[#A8DEC2]`}>Done · step by step</p>
        <ul className="space-y-1">
          {AI_STEPS.map((s, i) => (
            <li key={s.text} className={`flex gap-2 text-[11.5px] leading-snug transition-opacity duration-200 ${shown > i ? "opacity-100" : "opacity-0"}`}>
              <span className="text-[#00E676]">✓</span>
              <span className="text-[#C9CFD1]">{s.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <Msg show={later >= 1}>Saved as layout “London open”. Window sizes and tabs remembered.</Msg>
      <Msg show={later >= 2}>Restored “London open” exactly as you left it.</Msg>
      <Msg show={later >= 3} tone="risk">
        You&apos;re at 80% of today&apos;s loss limit. Turn on Focus so only risk alerts reach you?
      </Msg>
      <div className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#10231B] px-2.5 py-1.5 text-[11px] text-[#92A399]">
        <AiOrb size={8} pulse={false} /> Ask or tell AFVAR…
      </div>
    </div>
  );
}

function Widget({ shown, title, children, h }: { shown: boolean; title: string; children: ReactNode; h: number }) {
  return (
    <div
      className={`rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(16,19,21,0.96)] p-3 transition-all duration-500 ${shown ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"}`}
      style={{ height: h }}
    >
      <p className={`${MONO} mb-2 text-[9px] text-[#8A9295]`}>{title}</p>
      {children}
    </div>
  );
}

function Widgets({ step, quotes }: { step: number; quotes: Quotes }) {
  const now = useNowMinute();
  const sessions = sessionsNow(now);
  return (
    <div className="absolute left-[892px] top-[40px] z-[16] flex w-[296px] flex-col gap-2.5">
      <Widget shown={step >= 0} title="Sessions" h={128}>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11.5px]">
          {sessions.map((s) => (
            <li key={s.name} className="flex justify-between">
              <span className="text-[#C9CFD1]">{s.name}</span>
              <span className={s.open ? "text-[#00E676]" : "text-[#5E6669]"}>{s.open ? "●" : "○"}</span>
            </li>
          ))}
        </ul>
      </Widget>
      <Widget shown={step >= 1} title="Daily loss limit" h={110}>
        <div className="flex items-center gap-3">
          <svg width="58" height="58" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#1E2326" strokeWidth="4" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="#FF6B6B" strokeWidth="4" strokeDasharray={`${0.8 * 94.2} 94.2`} transform="rotate(-90 18 18)" strokeLinecap="round" />
          </svg>
          <div>
            <p className="text-[18px] font-semibold text-[#FF6B6B]">80%</p>
            <p className="text-[11px] text-[#8A9295]">used · 2 positions open</p>
          </div>
        </div>
      </Widget>
      <Widget shown={step >= 2} title="Watchlist" h={110}>
        <ul className="space-y-1 font-mono text-[11px]">
          {(["XAUUSD", "EURUSD", "BTC-USD"] as const).map((s) => {
            const q = quotes[s];
            if (!q) return null;
            return (
              <li key={s} className="flex justify-between">
                <span className="text-[#C9CFD1]">{SYM_NAME[s]}</span>
                <span className="tabular-nums text-[#F2F5F2]">{fmtPrice(q.last, q.decimals)}</span>
                <span className={q.changePct >= 0 ? "text-[#00E676]" : "text-[#FF6B6B]"}>{q.changePct.toFixed(2)}%</span>
              </li>
            );
          })}
        </ul>
      </Widget>
    </div>
  );
}

/* ------------------------------------------------------- the OS avatar */

/** Where the avatar is docked: feet position and height, design px (control pill below its feet). */
export const AVATAR_CORNER = { x: 1105, y: 606, h: 150 };
/** Stepping forward to talk to you: big, waist-up, in front of the desktop. */
// Sized to leave most of the window visible around it.
const FOREGROUND = { x: 540, y: 680, h: 350 };
const RISK_SPOT = 655;
/** os-local windows [in start, in end, out start, out end] of the avatar stepping forward. */
export const STEP_FORWARD = [
  { at: [0.112, 0.126, 0.182, 0.198] as const, line: "Good morning. London is open, and I've pulled up your charts." },
  { at: [0.884, 0.898, 0.93, 0.944] as const, line: "Focus is on. I'll only interrupt you for risk." },
];
/** Lines spoken from the corner (or beside Risk Guardian): os-local [open, close] of each bubble. */
export const CORNER_LINES: { at: readonly [number, number]; place: BubblePlace; line: string }[] = [
  // as the chart is dragged to the edge (0.288) and snaps (0.322)
  { at: [0.286, 0.33], place: "corner", line: "Drag a window to the edge, and it snaps into place." },
  // the plan is up; the AI panel slides in above the avatar, so this one sits beside it
  { at: [0.445, 0.476], place: "side", line: "On it. I'll arrange your charts, check the calendar and watch your risk." },
  // London open just restored (picked at 0.671, back in view by 0.705)
  { at: [0.705, 0.748], place: "side", line: "Your London open layout is back, exactly as you left it." },
  // arrived beside Risk Guardian (0.79), before running back (0.85)
  { at: [0.79, 0.836], place: "risk", line: "Heads up. You've used 80% of today's loss limit." },
];

/** The avatar's part in the OS film (os-local fractions). */
const OS_GESTURES: [u: number, gesture: AvatarFrame["gesture"], emotion: string, aura: string, talk: number][] = [
  [0.0, "idle", "curious", "connecting", 0],
  [0.112, "wave", "happy", "idle", 0],
  [0.13, "talk", "happy", "speaking", 1],
  [0.182, "pointLeft", "focused", "idle", 0],
  [0.205, "look", "curious", "idle", 0],
  [0.286, "talk", "confident", "speaking", 1],
  [0.33, "look", "curious", "idle", 0],
  [0.36, "think", "thinking", "thinking", 0],
  [0.445, "explain", "confident", "speaking", 1],
  [0.555, "celebrate", "happy", "idle", 0],
  [0.6, "look", "curious", "idle", 0],
  [0.705, "explain", "happy", "speaking", 1],
  [0.748, "acknowledge", "happy", "idle", 0],
  [0.765, "idle", "concerned", "serious", 0],
  [0.79, "pointLeft", "concerned", "speaking", 1],
  [0.836, "acknowledge", "focused", "idle", 0],
  [0.85, "idle", "happy", "idle", 0],
  [0.886, "explain", "confident", "speaking", 1],
  [0.93, "idle", "happy", "idle", 0],
  [0.945, "wave", "happy", "idle", 0],
];
export const OS_G = OS_GESTURES.map(([u, ...rest]) => [U(u), ...rest] as const);

/** 0..1 how far the avatar has stepped into the foreground. */
export function stepForward(p: number): number {
  let w = 0;
  for (const s of STEP_FORWARD) w = Math.max(w, easeInOut(ramp(p, U(s.at[0]), U(s.at[1]))) * (1 - easeInOut(ramp(p, U(s.at[2]), U(s.at[3])))));
  return w;
}

function osAvatarTrack(p: number, t: number, out: AvatarFrame): AvatarFrame {
  out.visible = p >= U(0.085) && p < U(0.985);
  if (!out.visible) return out;
  let g = OS_G[0];
  for (const row of OS_G) if (p >= row[0]) g = row;
  out.gesture = g[1];
  out.emotion = g[2];
  out.aura = g[3];
  out.talk = g[4];
  out.explode = 1 - easeInOut(ramp(p, U(0.088), U(0.11)));
  // The run: corner → beside Risk Guardian → back to the corner.
  const go = easeInOut(ramp(p, U(0.765), U(0.79)));
  const back = easeInOut(ramp(p, U(0.85), U(0.875)));
  const runningOut = p > U(0.765) && p < U(0.79);
  const runningBack = p > U(0.85) && p < U(0.875);
  const running = runningOut || runningBack;
  const cornerX = AVATAR_CORNER.x + (RISK_SPOT - AVATAR_CORNER.x) * (go - back);
  const cornerY = AVATAR_CORNER.y - (running ? Math.abs(Math.sin(t * 13)) * 7 : 0);
  const enter = ramp(p, U(0.085), U(0.1));
  // Leaving at the end of the act it shrinks away (and breaks into parts, see AvatarOverlay `build`).
  const exit = 1 - easeInOut(ramp(p, U(0.96), U(0.985)));
  const cornerH = AVATAR_CORNER.h * (0.35 + 0.65 * enter);
  // Step forward: dock → foreground and back.
  const f = stepForward(p);
  out.x = cornerX + (FOREGROUND.x - cornerX) * f;
  out.y = cornerY + (FOREGROUND.y - cornerY) * f;
  out.scale = (cornerH + (FOREGROUND.h - cornerH) * f) * Math.max(0.001, exit);
  out.stage = enter * exit;
  out.lean = running ? 0.28 : 0;
  out.turn = runningOut ? -1.25 : runningBack ? 1.25 : -0.38 * (1 - f);
  if (running) out.gesture = "idle";
  return out;
}
