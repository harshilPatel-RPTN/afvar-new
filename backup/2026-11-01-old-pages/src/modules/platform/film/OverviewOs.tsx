"use client";

// The /platform film's OS acts (desktop): the same AFVAR OS as the home film,
// now showing how it is used. Caption on top, the screen below — the home's
// OS-act layout — so the two pages read as one product.
//
//   ways       open the Gold chart by hand (move, resize, snap, minimise),
//              then by asking; the same window, the same verified result
//   stop       the AI opens three charts while the avatar speaks: "Stop
//              speaking" silences it and the work goes on; "Cancel task"
//              ends the remaining steps and keeps what is done
//   workspace  the layout is saved and restored across spaces, notes sit next
//              to the chart, connections are read-only, the OS switches to हिन्दी
//
// Every position is a keyframe (act fractions → master progress), so
// scrolling back plays it in reverse.
import { motion, useTransform, type MotionValue } from "framer-motion";
import type { ReactNode } from "react";
import {
  AiOrb,
  AvatarOverlay,
  Dock,
  MONO,
  MenuBar,
  MiniChart,
  OsScreen,
  OsWindow,
  Pointer,
  SnapGhost,
  Spotlight,
  Toast,
  dockSlotX,
  easeInOut,
  ramp,
  sampleKeys,
  useBoxKeys,
  useStep,
  useTypedText,
  window4,
  type AvatarFrame,
  type BoxKeyframe,
  type DockItem,
} from "@/modules/afvarOs";
import { fmtPrice } from "@/modules/home/kit";
import { useNowMinute, type Quotes } from "@/modules/homeDemo/kit";
import { OVERVIEW } from "../content";
import { STRINGS } from "../components/os/strings";
import { ChipStrip, OsCaption, STOP_TEXT, WAYS_TEXT, WORK_TEXT } from "./OverviewCopy";
import { OVERVIEW_DESKTOP, STOP, STOP_ITEMS, STOP_LINES, STOP_STATE, stopRows } from "./overviewFilm";

const F = OVERVIEW_DESKTOP;
const W = (u: number) => F.at("ways", u);
const S = (u: number) => F.at("stop", u);
const K = (u: number) => F.at("workspace", u);

/** The OS layer is up for ways → stop, and again for workspace. */
export const osIn = (p: number) => Math.max(window4(p, [W(0), W(0.06), S(0.95), S(1)]), window4(p, [K(0), K(0.06), K(0.95), K(1)]));
/** …and fully covers the 3D stage here (the 3D scene can rest). */
export const osCovers = (p: number) => (p > W(0.07) && p < S(0.94)) || (p > K(0.07) && p < K(0.94));

/* ------------------------------------------------------------ keyframes */

const DOCK_APPS: DockItem[] = [
  { id: "chart", label: "Charts", glyph: "chart" },
  { id: "research", label: "Research", glyph: "research" },
  { id: "alerts", label: "Alerts", glyph: "alerts" },
  { id: "risk", label: "Risk Guardian", glyph: "risk" },
  { id: "community", label: "Community", glyph: "community" },
];
const slot = (id: string) => dockSlotX(DOCK_APPS.findIndex((d) => d.id === id) + 1, DOCK_APPS.length);
const DOCK_Y = 618;

type Box = [x: number, y: number, w: number, h: number];
const k = (at: number, [x, y, w, h]: Box, o = 1, s = 1): BoxKeyframe => ({ at, x, y, w, h, o, s });
const dock = (at: number, id: string): BoxKeyframe => k(at, [slot(id) - 110, 560, 220, 70], 0, 0.25);

const CH_SMALL: Box = [330, 130, 470, 290];
const CH_MOVED: Box = [560, 90, 470, 290];
const CH_BIG: Box = [560, 90, 600, 400];
const CH_DRAG: Box = [-150, 160, 600, 400];
const LEFT_HALF: Box = [12, 40, 588, 540];
const TOP_LEFT: Box = [12, 40, 560, 330];
const TASK: Box = [584, 40, 604, 320];
const MINI_A: Box = [12, 380, 276, 200];
const MINI_B: Box = [296, 380, 276, 200];

export const OS_KEYS = {
  chart: [
    dock(W(0.14), "chart"),
    k(W(0.19), CH_SMALL),
    k(W(0.2), CH_SMALL),
    k(W(0.27), CH_MOVED),
    k(W(0.28), CH_MOVED),
    k(W(0.34), CH_BIG),
    k(W(0.35), CH_BIG),
    k(W(0.4), CH_DRAG),
    k(W(0.415), LEFT_HALF),
    k(W(0.49), LEFT_HALF),
    dock(W(0.535), "chart"),
    dock(W(0.69), "chart"),
    k(W(0.75), LEFT_HALF),
    k(S(0.02), LEFT_HALF),
    k(S(0.08), TOP_LEFT),
  ],
  task: [k(S(0.03), TASK, 0, 0.96), k(S(0.08), TASK)],
  dollar: [k(S(0.28), MINI_A, 0, 0.9), k(S(0.31), MINI_A), k(S(0.46), MINI_A), k(S(0.5), MINI_A, 0, 0.9)],
  yield: [k(S(0.38), MINI_B, 0, 0.9), k(S(0.41), MINI_B), k(S(0.46), MINI_B), k(S(0.5), MINI_B, 0, 0.9)],
  notes: [k(K(0.33), [1210, 40, 292, 330], 0), k(K(0.38), [896, 40, 292, 330])],
  connect: [k(K(0.54), [584, 700, 604, 200], 0), k(K(0.58), [584, 380, 604, 200])],
} satisfies Record<string, BoxKeyframe[]>;
const KEYS = OS_KEYS;

/* Pointer: [at, x, y, opacity, pressed] (design px). */
export const OS_POINTER = (
  [
    [W(0.1), 600, 330, 0, 0],
    [W(0.11), 600, 330, 1, 0],
    [W(0.135), slot("chart"), DOCK_Y, 1, 0],
    [W(0.14), slot("chart"), DOCK_Y, 1, 1],
    [W(0.145), slot("chart"), DOCK_Y, 1, 0],
    [W(0.195), 480, 145, 1, 0],
    [W(0.2), 480, 145, 1, 1],
    [W(0.27), 710, 105, 1, 1],
    [W(0.275), 710, 105, 1, 0],
    [W(0.28), 1026, 376, 1, 0],
    [W(0.282), 1026, 376, 1, 1],
    [W(0.34), 1156, 486, 1, 1],
    [W(0.345), 1156, 486, 1, 0],
    [W(0.35), 700, 105, 1, 0],
    [W(0.352), 700, 105, 1, 1],
    [W(0.4), 4, 175, 1, 1],
    [W(0.405), 4, 175, 1, 0],
    [W(0.415), 4, 175, 0, 0],
    [W(0.47), 300, 300, 0, 0],
    [W(0.475), 300, 300, 1, 0],
    [W(0.49), 42, 55, 1, 0],
    [W(0.495), 42, 55, 1, 1],
    [W(0.5), 42, 55, 1, 0],
    [W(0.53), 42, 55, 0, 0],
    [S(0.17), 900, 240, 0, 0],
    [S(0.18), 900, 240, 1, 0],
    [S(0.232), 658, 334, 1, 0],
    [S(0.24), 658, 334, 1, 1],
    [S(0.245), 658, 334, 1, 0],
    [S(0.27), 658, 334, 0, 0],
    [S(0.56), 900, 240, 0, 0],
    [S(0.57), 900, 240, 1, 0],
    [S(0.652), 778, 334, 1, 0],
    [S(0.66), 778, 334, 1, 1],
    [S(0.665), 778, 334, 1, 0],
    [S(0.7), 778, 334, 0, 0],
    [K(0.72), 700, 300, 0, 0],
    [K(0.73), 700, 300, 1, 0],
    [K(0.775), 790, 15, 1, 0],
    [K(0.78), 790, 15, 1, 1],
    [K(0.785), 790, 15, 1, 0],
    [K(0.82), 790, 15, 0, 0],
  ] as const
).map(([at, x, y, o, d]): { at: number; x: number; y: number; o: number; d: number } => ({ at, x, y, o, d }));

/* ------------------------------------------------------------- the layer */

export function OverviewOs({ mv, quotes, avatarHere }: { mv: MotionValue<number>; quotes: Quotes; avatarHere: boolean }) {
  const layer = useTransform(mv, osIn);
  const scale = useTransform(mv, (p) => 0.95 + 0.05 * Math.max(ramp(p, W(0.0), W(0.07)), ramp(p, K(0.0), K(0.07))));
  const wC = useTransform(mv, (p) => window4(p, [W(0.01), W(0.06), W(0.94), W(0.995)]));
  const sC = useTransform(mv, (p) => window4(p, [S(0.005), S(0.05), S(0.93), S(0.99)]));
  const kC = useTransform(mv, (p) => window4(p, [K(0.01), K(0.06), K(0.93), K(0.99)]));
  return (
    <motion.div className="pointer-events-none absolute inset-0 z-20 bg-[#050607]" style={{ opacity: layer }} data-act="os">
      <div className="absolute inset-x-0 top-[112px] flex items-end justify-between gap-8 px-[4vw]">
        <div className="relative h-[96px] min-w-0 flex-1">
          <Caption o={wC}>
            <OsCaption {...WAYS_TEXT} />
          </Caption>
          <Caption o={sC}>
            <OsCaption {...STOP_TEXT} />
          </Caption>
          <Caption o={kC}>
            <OsCaption {...WORK_TEXT} />
          </Caption>
        </div>
        <div className="relative h-[30px] w-[min(30rem,36vw)] shrink-0 max-xl:hidden">
          <Caption o={wC} right>
            <ChipStrip
              mv={mv}
              chips={[
                { label: "Move", at: [W(0.2), W(0.275)] },
                { label: "Resize", at: [W(0.28), W(0.345)] },
                { label: "Snap", at: [W(0.35), W(0.42)] },
                { label: "Minimize", at: [W(0.485), W(0.54)] },
                { label: "Ask", at: [W(0.55), W(0.995)] },
              ]}
            />
          </Caption>
          <Caption o={sC} right>
            <ChipStrip
              mv={mv}
              chips={[
                { label: "Stop speaking", at: [S(STOP.stopPress), S(STOP.reset[0])] },
                { label: "Cancel task", at: [S(STOP.cancelPress), S(0.995)] },
              ]}
            />
          </Caption>
          <Caption o={kC} right>
            <ChipStrip
              mv={mv}
              chips={OVERVIEW.workspace.items.map((it, i) => ({ label: it.title, at: [K([0.06, 0.31, 0.53, 0.73][i]), K([0.31, 0.53, 0.73, 0.995][i])] as const }))}
            />
          </Caption>
        </div>
      </div>
      <motion.div className="absolute inset-x-[4vw] bottom-[3vh] top-[218px]" style={{ scale }}>
        <OverviewScreen mv={mv} quotes={quotes} className="h-full w-full" />
        {avatarHere ? <AvatarOverlay mv={mv} track={stopAvatarTrack} className="absolute inset-0" /> : null}
      </motion.div>
      <p className={`${MONO} absolute bottom-1 left-1/2 -translate-x-1/2 text-[9.5px] text-[#4E5659]`}>Illustration of the AFVAR OS · prices real, everything else sample</p>
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

const HI_TITLES: Record<string, string> = { Charts: "चार्ट", Research: "रिसर्च", Journal: "जर्नल", Notes: "नोट्स", Connections: "कनेक्शन" };
/** Menu titles in both editions (Hindi strings are draft translations, as in the try-it desktop). */
const MENUS = { en: ["Workspace", "Apps", "Layouts", "Window", "Help"], hi: ["वर्कस्पेस", "ऐप्स", "लेआउट", "विंडो", "मदद"] } as const;

export function OverviewScreen({ mv, quotes, className = "" }: { mv: MotionValue<number>; quotes: Quotes; className?: string }) {
  const inWorkspace = useStep(mv, [F.at("verify", 0)]) >= 0;
  return <OsScreen className={className}>{inWorkspace ? <WorkspaceDesk mv={mv} quotes={quotes} /> : <WaysAndStopDesk mv={mv} quotes={quotes} />}</OsScreen>;
}

/** Pointer, driven by the shared POINTER keys. */
function FilmPointer({ mv }: { mv: MotionValue<number> }) {
  const scratch = { x: 0, y: 0, o: 0, d: 0 };
  const px = useTransform(mv, (p) => sampleKeys(OS_POINTER, p, scratch).x);
  const py = useTransform(mv, (p) => sampleKeys(OS_POINTER, p, scratch).y);
  const po = useTransform(mv, (p) => sampleKeys(OS_POINTER, p, scratch).o);
  const pd = useTransform(mv, (p) => 1 - 0.18 * sampleKeys(OS_POINTER, p, scratch).d);
  return <Pointer style={{ x: px, y: py, opacity: po }} pressStyle={{ scale: pd }} />;
}

function UtcHm() {
  const now = useNowMinute();
  return <>{now ? `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")} UTC` : "--:--"}</>;
}

/* ------------------------------------------------- acts 01–02: ways, stop */

function WaysAndStopDesk({ mv, quotes }: { mv: MotionValue<number>; quotes: Quotes }) {
  const chart = useBoxKeys(mv, KEYS.chart);
  const task = useBoxKeys(mv, KEYS.task);
  const dollar = useBoxKeys(mv, KEYS.dollar);
  const yieldBox = useBoxKeys(mv, KEYS.yield);
  const ghost = useTransform(mv, (p) => window4(p, [W(0.37), W(0.38), W(0.405), W(0.415)]));
  const spot = useTransform(mv, (p) => window4(p, [W(0.55), W(0.565), W(0.68), W(0.695)]));
  const spotY = useTransform(spot, (o) => (1 - o) * -16);
  const typed = useTypedText(mv, `${OVERVIEW.workWith.ai.examples[0]} 1D`, [W(0.58), W(0.65)]);
  const typedDone = useStep(mv, [W(0.655)]) >= 0;
  const aiOwned = useStep(mv, [W(0.69), S(0.08)]) === 0;
  const running = useStep(mv, [W(0.14), W(0.535), W(0.69)]);
  const chartRunning = running === 0 || running >= 2;
  const toastA = useTransform(mv, (p) => Math.max(window4(p, [W(0.42), W(0.435), W(0.475), W(0.49)]), window4(p, [W(0.77), W(0.785), W(0.97), W(0.995)])));
  const toastB = useTransform(mv, (p) => window4(p, [W(0.755), W(0.77), W(0.97), W(0.995)]));
  const toastAy = useTransform(toastA, (v) => (1 - v) * -10);
  const toastBy = useTransform(toastB, (v) => (1 - v) * -10);

  // stop act
  const marks = [STOP.run1[0][0], STOP.run1[0][1], STOP.stopPress, STOP.run1[1][1], STOP.run1[2][1], STOP.done1, STOP.reset[0], STOP.run2Gold[0], STOP.run2Gold[1], STOP.cancelPress];
  const step = useStep(mv, marks.map(S));
  const f = step < 0 ? 0 : marks[step];
  const stop = stopRows(f);
  const speechOff = f >= STOP.stopPress && f < STOP.reset[0];
  const pill = useTransform(mv, (p) => window4(p, [S(0.06), S(0.09), S(0.93), S(0.97)]));

  const dockItems = DOCK_APPS.map((d) => ({ ...d, running: d.id === "chart" ? chartRunning : false, attention: d.id === "chart" && running === 1 }));

  return (
    <>
      <SnapGhost style={{ left: 12, top: 40, width: 588, height: 540, opacity: ghost }} />
      <OsWindow title="Charts" glyph="chart" tabs={["Gold · 1D"]} focused z={14} aiOwned={aiOwned} style={chart}>
        <GoldChart quotes={quotes} />
      </OsWindow>
      <OsWindow title="Dollar Index" glyph="chart" z={12} style={dollar}>
        <SampleLine seed={3} label="DXY · sample" />
      </OsWindow>
      <OsWindow title="US 10-year yield" glyph="chart" z={12} style={yieldBox}>
        <SampleLine seed={7} label="US10Y · sample" />
      </OsWindow>
      <OsWindow title="AFVAR AI · task" glyph="layouts" z={15} aiOwned style={task}>
        <TaskBody rows={stop.rows} status={stop.status} caption={stop.caption} speechOff={speechOff} cancelled={stop.status === "Cancelled"} />
      </OsWindow>

      <motion.div className="absolute inset-x-0 top-0 z-40 h-[30px]">
        <MenuBar space="Space 1 / 2 · Gold morning" clock={<UtcHm />} />
      </motion.div>

      <Spotlight typedRef={typed} style={{ opacity: spot, y: spotY }}>
        {typedDone ? (
          <div>
            <p className={`${MONO} text-[9.5px] text-[#E9B44C]`}>{STRINGS.en.topHit}</p>
            <p className="mt-1.5 flex items-center gap-2 text-[14px] text-[#F5F7F7]">
              <span className="text-[#E9B44C]">›</span> Gold · 1D chart
            </p>
            <p className="mt-2 text-[12px] text-[#8A9295]">{STRINGS.en.local}</p>
          </div>
        ) : (
          <div>
            <p className={`${MONO} mb-1.5 text-[9.5px] text-[#8A9295]`}>{STRINGS.en.suggestions}</p>
            <ul className="space-y-1 text-[13px] text-[#C9CFD1]">
              {OVERVIEW.workWith.ai.examples.map((e) => (
                <li key={e}>“{e}”</li>
              ))}
            </ul>
          </div>
        )}
      </Spotlight>

      <div className="absolute right-3 top-[40px] z-50">
        <Toast tone="ok" title="Opened by hand · Gold 1D" meta="✓ verified" style={{ opacity: toastA, y: toastAy, position: "absolute", right: 0, top: 0 }}>
          Moved, resized and snapped with the manual controls.
        </Toast>
        <Toast tone="ai" title="Opened by asking · Gold 1D" meta="✓ verified" style={{ opacity: toastB, y: toastBy, position: "absolute", right: 0, top: 78 }}>
          Same window, same place, same check.
        </Toast>
      </div>

      <SpeechBubble mv={mv} at={[S(0.1), S(0.12), S(STOP.reset[0] - 0.02), S(STOP.reset[0])]} line={STOP_LINES[0]} type={[S(0.12), S(0.22)]} mutedAt={S(STOP.stopPress)} />
      <SpeechBubble mv={mv} at={[S(0.52), S(0.54), S(STOP.cancelPress), S(STOP.cancelPress + 0.02)]} line={STOP_LINES[1]} type={[S(0.54), S(0.62)]} />

      {/* the avatar's control pill under its feet (mic · speaker · text) */}
      <motion.div
        className="absolute z-[55] flex items-center gap-2.5 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(14,17,19,0.95)] px-2.5 py-1.5 text-[11px] text-[#C9CFD1]"
        style={{ left: AVATAR_CORNER.x - 78, top: AVATAR_CORNER.y + 10, opacity: pill }}
      >
        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0014 0M12 18v3" />
        </svg>
        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={speechOff ? "#E9B44C" : "currentColor"} strokeWidth="2" strokeLinecap="round">
          <path d="M4 9v6h4l5 4V5L8 9z" />
          {speechOff ? <path d="M17 9l4 6m0-6l-4 6" /> : <path d="M17 9a4 4 0 010 6" />}
        </svg>
        <span>{speechOff ? "Speech off" : "Text"}</span>
        <span className="tracking-[-0.1em] text-[#6D7578]">⋮⋮</span>
      </motion.div>

      <Dock items={dockItems} />
      <FilmPointer mv={mv} />
    </>
  );
}

function TaskBody({ rows, status, caption, speechOff, cancelled }: { rows: readonly ("pending" | "active" | "done" | "cancelled")[]; status: string; caption: string | null; speechOff: boolean; cancelled: boolean }) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-[#F5F7F7]">
          <AiOrb size={11} pulse={status === "Running"} /> Opening your selected charts
        </p>
        <span className={`${MONO} text-[10px] ${status === "Cancelled" ? "text-[#FF6B6B]" : status === "Complete" ? "text-[#00E676]" : "text-[#E9B44C]"}`}>Task · {status}</span>
      </div>
      <ol className="mt-3 space-y-1.5">
        {STOP_ITEMS.map((item, i) => {
          const r = rows[i];
          return (
            <li key={item} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-[13px] ${r === "active" ? "border-[rgba(233,180,76,0.55)] bg-[rgba(233,180,76,0.06)]" : "border-[rgba(255,255,255,0.07)]"}`}>
              <span className="flex items-center gap-2.5 text-[#E6E9EB]">
                <span className={`font-mono text-[11px] ${r === "done" ? "text-[#00E676]" : r === "cancelled" ? "text-[#FF6B6B]" : "text-[#6D7578]"}`}>{r === "done" ? "✓" : r === "cancelled" ? "✕" : String(i + 1)}</span>
                {item}
              </span>
              <span className={`font-mono text-[10.5px] ${r === "done" ? "text-[#00E676]" : r === "active" ? "text-[#E9B44C]" : r === "cancelled" ? "text-[#FF6B6B]" : "text-[#5E6669]"}`}>{STOP_STATE[r]}</span>
            </li>
          );
        })}
      </ol>
      <p className={`mt-3 min-h-[1.3em] text-[12.5px] ${caption ? "text-[#F3DFAF]" : "text-transparent"}`}>{caption ?? "·"}</p>
      <div className="mt-auto flex items-center gap-3">
        <span className={`rounded-full border px-4 py-1.5 text-[12px] ${speechOff ? "border-[#E9B44C] bg-[rgba(233,180,76,0.16)] text-[#F5F7F7]" : "border-[rgba(255,255,255,0.14)] text-[#C9CFD1]"}`}>Stop speaking</span>
        <span className={`rounded-full border px-4 py-1.5 text-[12px] ${cancelled ? "border-[#FF6B6B] bg-[rgba(255,77,77,0.14)] text-[#F5F7F7]" : "border-[rgba(255,255,255,0.14)] text-[#C9CFD1]"}`}>Cancel task</span>
        <span className="ml-auto font-mono text-[10px] text-[#5E6669]">Sample task</span>
      </div>
    </div>
  );
}

function SpeechBubble({ mv, at, line, type, mutedAt }: { mv: MotionValue<number>; at: readonly [number, number, number, number]; line: string; type: readonly [number, number]; mutedAt?: number }) {
  const o = useTransform(mv, (p) => window4(p, at));
  const typed = useTypedText(mv, line, mutedAt ? [type[0], Math.min(type[1], mutedAt)] : type);
  const muted = useStep(mv, [mutedAt ?? 2]) >= 0;
  return (
    <motion.div className="absolute left-[700px] top-[420px] z-[56] w-[330px] rounded-2xl rounded-br-sm border border-[rgba(233,180,76,0.5)] bg-[rgba(16,19,21,0.97)] px-4 py-3" style={{ opacity: o }}>
      <p className={`${MONO} mb-1 flex items-center gap-1.5 text-[9.5px] ${muted ? "text-[#6D7578]" : "text-[#E9B44C]"}`}>
        <AiOrb size={7} pulse={false} /> AFVAR · {muted ? "speech stopped" : "speaking"}
      </p>
      <p className={`min-h-[2.8em] text-[15px] leading-snug ${muted ? "text-[#8A9295]" : "text-[#F5F7F7]"}`}>
        <span ref={typed} />
      </p>
    </motion.div>
  );
}

/* ---------------------------------------------------- act 04: workspace */

function WorkspaceDesk({ mv, quotes }: { mv: MotionValue<number>; quotes: Quotes }) {
  const notes = useBoxKeys(mv, KEYS.notes);
  const connect = useBoxKeys(mv, KEYS.connect);
  const trackX = useTransform(mv, (p) => -1200 * (ramp(p, K(0.17), K(0.21)) * (1 - ramp(p, K(0.24), K(0.28)))));
  const hi = useStep(mv, [K(0.78)]) >= 0;
  const space2 = useStep(mv, [K(0.19), K(0.26)]) === 0;
  const t = (en: string) => (hi ? HI_TITLES[en] ?? en : en);
  const t1 = useTransform(mv, (p) => window4(p, [K(0.08), K(0.1), K(0.15), K(0.17)]));
  const t2 = useTransform(mv, (p) => window4(p, [K(0.28), K(0.29), K(0.33), K(0.35)]));
  const t3 = useTransform(mv, (p) => window4(p, [K(0.79), K(0.81), K(0.93), K(0.96)]));
  const pin = useTransform(mv, (p) => window4(p, [K(0.46), K(0.5), K(0.95), K(0.99)]));
  const typedNote = useTypedText(mv, "Plan · wait for the London close", [K(0.38), K(0.44)]);
  const files = useStep(mv, [K(0.44)]) >= 0;
  const connRow = useStep(mv, [K(0.58), K(0.62), K(0.66), K(0.7)]);
  const langIn = useTransform(mv, (p) => ramp(p, K(0.7), K(0.73)));

  return (
    <>
      <motion.div className="absolute inset-0" style={{ x: trackX }}>
        <OsWindow title={t("Charts")} glyph="chart" tabs={["Gold · 1D"]} focused z={13} style={{ left: 12, top: 40, width: 560, height: 330 }}>
          <GoldChart quotes={quotes} level />
        </OsWindow>
        <OsWindow title={t("Research")} glyph="research" z={11} style={{ left: 584, top: 40, width: 300, height: 330 }}>
          <div className="space-y-2 p-3 text-[12px] leading-snug text-[#C9CFD1]">
            <p className="flex items-center gap-1.5 font-semibold text-[#E9B44C]">
              <AiOrb size={8} pulse={false} /> Gold · morning context
            </p>
            <p>Overnight range held. The calendar is quiet until the US open.</p>
            <p className={`${MONO} text-[9px] text-[#5E6669]`}>Sample brief</p>
          </div>
        </OsWindow>
        <OsWindow title={t("Journal")} glyph="journal" z={11} style={{ left: 12, top: 380, width: 560, height: 200 }}>
          <ul className="space-y-1.5 p-3 text-[12px] text-[#C9CFD1]">
            {[
              ["MON", "Waited for the close, as planned."],
              ["TUE", "Skipped an entry before a data release."],
              ["WED", "Followed the plan; small win."],
            ].map(([d, l]) => (
              <li key={d}>
                <span className="font-mono text-[10px] text-[#6D7578]">{d}</span> {l}
              </li>
            ))}
          </ul>
        </OsWindow>
        <OsWindow title={t("Notes")} glyph="journal" z={14} aiOwned={false} style={notes}>
          <div className="space-y-2.5 p-3 text-[12.5px] text-[#E6E9EB]">
            <p className="min-h-[1.4em]">
              <span ref={typedNote} />
            </p>
            <div className={`flex flex-wrap gap-1.5 transition-opacity duration-300 ${files ? "opacity-100" : "opacity-0"}`}>
              {["gold-plan.pdf", "levels.png"].map((f) => (
                <span key={f} className="rounded-md border border-[rgba(255,255,255,0.12)] bg-[#14181A] px-2 py-0.5 font-mono text-[10px] text-[#C9CFD1]">
                  {f}
                </span>
              ))}
            </div>
            <p className={`${MONO} text-[9px] text-[#E9B44C] transition-opacity duration-300 ${files ? "opacity-100" : "opacity-0"}`}>Pinned to the Gold chart</p>
          </div>
        </OsWindow>
        <motion.svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-[15] h-full w-full" viewBox="0 0 1200 660" style={{ opacity: pin }}>
          <path d="M896 150 C 760 150, 700 205, 560 205" fill="none" stroke="#E9B44C" strokeWidth="1.5" strokeDasharray="5 5" />
          <circle cx="560" cy="205" r="4" fill="#E9B44C" />
        </motion.svg>
        <OsWindow title={t("Connections")} glyph="settings" z={14} style={connect}>
          <ul className="divide-y divide-[rgba(255,255,255,0.06)] px-3 text-[12.5px]">
            {[
              ["Broker account", "Read-only", "text-[#00E676]"],
              ["Market data", "Source + time on every view", "text-[#C9CFD1]"],
              ["Calendar & news", "Supported, as listed", "text-[#C9CFD1]"],
              ["Placing orders", "Not available", "text-[#FF6B6B]"],
            ].map(([a, b, c], i) => (
              <li key={a} className={`flex items-center justify-between py-2 transition-colors ${connRow === i ? "bg-[rgba(233,180,76,0.06)]" : ""}`}>
                <span className="flex items-center gap-2 text-[#C9CFD1]">
                  {i === 0 ? (
                    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2">
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V8a4 4 0 018 0v3" />
                    </svg>
                  ) : null}
                  {a}
                </span>
                <span className={`font-mono text-[10.5px] ${c}`}>{b}</span>
              </li>
            ))}
          </ul>
        </OsWindow>

        {/* space 2 */}
        <div className="absolute inset-0" style={{ left: 1200 }}>
          <OsWindow title="Community" glyph="community" focused style={{ left: 12, top: 40, width: 700, height: 540 }}>
            <ul className="space-y-2.5 p-4 text-[12.5px] text-[#C9CFD1]">
              <li className={`${MONO} text-[9.5px] text-[#8A9295]`}>#gold · sample room</li>
              <li>Watching the same level as yesterday.</li>
              <li>Shared a chart with two levels marked.</li>
            </ul>
          </OsWindow>
          <OsWindow title="Alerts" glyph="alerts" style={{ left: 724, top: 40, width: 464, height: 540 }}>
            <ul className="divide-y divide-[rgba(255,255,255,0.06)] px-3 text-[12px]">
              {["Gold above the weekly high", "EUR/USD session range break"].map((a) => (
                <li key={a} className="flex items-center justify-between py-2">
                  <span className="text-[#C9CFD1]">{a}</span>
                  <span className="font-mono text-[10px] uppercase text-[#E9B44C]">armed</span>
                </li>
              ))}
            </ul>
          </OsWindow>
        </div>
      </motion.div>

      <div className="absolute inset-x-0 top-0 z-40 h-[30px]">
        <MenuBar menus={MENUS[hi ? "hi" : "en"]} space={space2 ? (hi ? "स्पेस 2 / 2" : "Space 2 / 2 · Community") : hi ? "स्पेस 1 / 2" : "Space 1 / 2 · Gold morning"} clock={<UtcHm />} />
      </div>
      <motion.div className="absolute left-[742px] top-[5px] z-[45] flex overflow-hidden rounded-md border border-[rgba(255,255,255,0.14)] font-mono text-[10px]" style={{ opacity: langIn }}>
        <span className={`px-2 py-0.5 ${hi ? "text-[#6D7578]" : "bg-[rgba(233,180,76,0.2)] text-[#F5F7F7]"}`}>EN</span>
        <span className={`px-2 py-0.5 ${hi ? "bg-[rgba(233,180,76,0.2)] text-[#F5F7F7]" : "text-[#6D7578]"}`} lang="hi">
          हिन्दी
        </span>
      </motion.div>

      <div className="absolute right-3 top-[40px] z-50">
        <Toast tone="ai" title="Layout saved · Gold morning" meta="now" style={{ opacity: t1, position: "absolute", right: 0, top: 0 }}>
          Windows, sizes and tabs kept together.
        </Toast>
        <Toast tone="ok" title="Restored · Gold morning" meta="now" style={{ opacity: t2, position: "absolute", right: 0, top: 0 }}>
          Back from the Community space in one step.
        </Toast>
        <Toast tone="ai" title="भाषा · हिन्दी" meta="draft" style={{ opacity: t3, position: "absolute", right: 0, top: 0 }}>
          Menus and window titles switch with the edition.
        </Toast>
      </div>

      <Dock items={DOCK_APPS.map((d) => ({ ...d, running: d.id === "chart" || d.id === "research" || d.id === "community" || d.id === "alerts" }))} />
      <FilmPointer mv={mv} />
    </>
  );
}

/* ------------------------------------------------------------ app bodies */

function GoldChart({ quotes, level = false }: { quotes: Quotes; level?: boolean }) {
  const q = quotes.XAUUSD;
  if (!q) return null;
  const up = q.changePct >= 0;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-3 pt-2 font-mono text-[11px]">
        <span className="text-[#F5F7F7]">XAU/USD</span>
        <span className="tabular-nums text-[#F5F7F7]">{fmtPrice(q.last, q.decimals)}</span>
        <span className={up ? "text-[#00E676]" : "text-[#FF6B6B]"}>
          {up ? "▲" : "▼"}
          {Math.abs(q.changePct).toFixed(2)}%
        </span>
        <span className="ml-auto text-[9.5px] uppercase tracking-wider text-[#6D7578]">{q.status}</span>
      </div>
      <MiniChart closes={q.closes} levels={level ? [{ value: Math.max(...q.closes), label: "Note · plan level", tone: "gold" }] : []} className="mx-2 mb-2 mt-1 min-h-0 flex-1" />
    </div>
  );
}

/** A deterministic sample series (no market data). */
function sampleSeries(seed: number): number[] {
  const out: number[] = [];
  let x = seed;
  let v = 100;
  for (let i = 0; i < 40; i++) {
    x = (x * 16807) % 2147483647;
    v += ((x / 2147483647) - 0.5) * 2.4;
    out.push(v);
  }
  return out;
}

/** A deterministic sample line (no market data). */
function SampleLine({ seed, label }: { seed: number; label: string }) {
  const closes = sampleSeries(seed);
  return (
    <div className="flex h-full flex-col">
      <p className="px-3 pt-2 font-mono text-[10px] text-[#8A9295]">{label}</p>
      <MiniChart closes={closes} className="mx-2 mb-2 mt-1 min-h-0 flex-1" />
    </div>
  );
}

/* ----------------------------------------------------- the avatar (stop) */

const AVATAR_CORNER = { x: 1105, y: 606, h: 150 };

function stopAvatarTrack(p: number, _t: number, out: AvatarFrame): AvatarFrame {
  out.visible = p >= S(0.03) && p < S(0.97);
  if (!out.visible) return out;
  const f = F.story.local(p, "stop");
  const s = stopRows(f);
  out.explode = 1 - easeInOut(ramp(p, S(0.03), S(0.08)));
  out.x = AVATAR_CORNER.x;
  out.y = AVATAR_CORNER.y;
  out.scale = AVATAR_CORNER.h * (0.35 + 0.65 * ramp(p, S(0.03), S(0.07)));
  out.turn = -0.38;
  out.lean = 0;
  out.z = 0;
  if (s.speaking) {
    out.gesture = f < STOP.reset[0] ? "talk" : "explain";
    out.emotion = "happy";
    out.aura = "speaking";
    out.talk = 1;
  } else if (f >= STOP.stopPress && f < STOP.reset[0]) {
    out.gesture = "listen";
    out.emotion = "focused";
    out.aura = "idle";
    out.talk = 0;
  } else if (s.status === "Cancelled") {
    out.gesture = "acknowledge";
    out.emotion = "neutral";
    out.aura = "idle";
    out.talk = 0;
  } else {
    out.gesture = "idle";
    out.emotion = "curious";
    out.aura = "idle";
    out.talk = 0;
  }
  return out;
}
