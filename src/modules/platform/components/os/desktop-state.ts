import type { CapabilitySlug } from "../../types";
import type { Instrument, Timeframe } from "./commands";

/**
 * Window manager state for the "Try AFVAR" desktop. Focus raises a window by
 * bumping a shared z counter, as macos-web (MIT, PuruVJ) does with
 * `active_z_index`; frames are percentages of the desktop so it scales.
 */
export type Mode = "normal" | "min" | "max";
export interface Frame {
  l: number;
  t: number;
  w: number;
  h: number;
}
export interface Win {
  open: boolean;
  mode: Mode;
  z: number;
  frame: Frame;
  instrument: Instrument;
  timeframe: Timeframe;
  /** Bumped by "arrange" so windows drop any drag offset. */
  layout: number;
}
export interface DesktopState {
  wins: Record<CapabilitySlug, Win>;
  top: number;
  active: CapabilitySlug | null;
}

export const APP_ORDER: CapabilitySlug[] = ["charts", "research", "alerts", "trade-review", "community"];

const FRAMES: Record<CapabilitySlug, Frame> = {
  charts: { l: 4, t: 9, w: 56, h: 60 },
  research: { l: 58, t: 8, w: 38, h: 44 },
  alerts: { l: 22, t: 16, w: 50, h: 56 },
  "trade-review": { l: 48, t: 50, w: 46, h: 36 },
  community: { l: 6, t: 40, w: 40, h: 44 },
};

const win = (open: boolean, z: number, app: CapabilitySlug): Win => ({
  open,
  mode: "normal",
  z,
  frame: FRAMES[app],
  instrument: "Gold",
  timeframe: "1D",
  layout: 0,
});

export const INITIAL: DesktopState = {
  wins: {
    charts: win(false, 0, "charts"),
    research: win(true, 1, "research"),
    alerts: win(false, 0, "alerts"),
    "trade-review": win(true, 2, "trade-review"),
    community: win(false, 0, "community"),
  },
  top: 2,
  active: "trade-review",
};

export type DesktopAction =
  | { type: "open"; app: CapabilitySlug; instrument?: Instrument; timeframe?: Timeframe }
  | { type: "close"; app: CapabilitySlug }
  | { type: "minimize"; app: CapabilitySlug }
  | { type: "toggleMax"; app: CapabilitySlug }
  | { type: "focus"; app: CapabilitySlug }
  | { type: "arrange" }
  | { type: "reset" };

const patch = (s: DesktopState, app: CapabilitySlug, w: Partial<Win>): DesktopState => ({
  ...s,
  wins: { ...s.wins, [app]: { ...s.wins[app], ...w } },
});

export function reducer(s: DesktopState, a: DesktopAction): DesktopState {
  switch (a.type) {
    case "open": {
      const w = s.wins[a.app];
      const next = patch(s, a.app, {
        open: true,
        mode: w.open && w.mode === "max" ? "max" : "normal",
        z: s.top + 1,
        frame: w.open ? w.frame : FRAMES[a.app],
        instrument: a.instrument ?? w.instrument,
        timeframe: a.timeframe ?? w.timeframe,
      });
      return { ...next, top: s.top + 1, active: a.app };
    }
    case "focus":
      if (s.active === a.app) return s;
      return { ...patch(s, a.app, { z: s.top + 1 }), top: s.top + 1, active: a.app };
    case "close":
      return { ...patch(s, a.app, { open: false, mode: "normal" }), active: topmost(s, a.app) };
    case "minimize":
      return { ...patch(s, a.app, { mode: "min" }), active: topmost(s, a.app) };
    case "toggleMax": {
      const w = s.wins[a.app];
      return { ...patch(s, a.app, { mode: w.mode === "max" ? "normal" : "max", z: s.top + 1 }), top: s.top + 1, active: a.app };
    }
    case "arrange": {
      const visible = APP_ORDER.filter((app) => s.wins[app].open && s.wins[app].mode !== "min");
      const cols = visible.length <= 2 ? visible.length : visible.length <= 4 ? 2 : 3;
      const rows = Math.max(1, Math.ceil(visible.length / Math.max(cols, 1)));
      const gap = 1.5;
      const top0 = 8;
      const areaH = 72;
      let next = s;
      visible.forEach((app, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const w = (100 - gap * (cols + 1)) / cols;
        const h = (areaH - gap * (rows - 1)) / rows;
        next = patch(next, app, {
          mode: "normal",
          frame: { l: gap + c * (w + gap), t: top0 + r * (h + gap), w, h },
          layout: s.wins[app].layout + 1,
        });
      });
      return next;
    }
    case "reset":
      return INITIAL;
  }
}

function topmost(s: DesktopState, except: CapabilitySlug): CapabilitySlug | null {
  const rest = APP_ORDER.filter((app) => app !== except && s.wins[app].open && s.wins[app].mode !== "min");
  rest.sort((a, b) => s.wins[b].z - s.wins[a].z);
  return rest[0] ?? null;
}
