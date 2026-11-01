"use client";

// AFVAR OS chrome: the screen (a fixed design canvas scaled to fit, so the
// OS reads the same at every size), the menu bar, the dock and app glyphs.
import { motion, type MotionStyle } from "framer-motion";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/* ----------------------------------------------------------------- glyphs */

export type AppGlyphName = "chart" | "research" | "alerts" | "calendar" | "risk" | "journal" | "community" | "news" | "layouts" | "settings" | "phone";

const PATHS: Record<AppGlyphName, ReactNode> = {
  chart: <path d="M4 18l5-6 4 3 7-9M4 21h16" />,
  research: (
    <>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M9 10h6M9 14h6M9 18h4" />
    </>
  ),
  alerts: (
    <>
      <path d="M6 16V11a6 6 0 1112 0v5l2 2H4z" />
      <path d="M10 20a2 2 0 004 0" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  risk: <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" />,
  journal: (
    <>
      <path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z" />
      <path d="M9 9h6M9 13h5" />
    </>
  ),
  community: (
    <>
      <circle cx="9" cy="9" r="3" />
      <circle cx="17" cy="10" r="2.4" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 20c0-2.2 1-4 3-4.6" />
    </>
  ),
  news: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 9h6M7 13h10M7 16h8" />
    </>
  ),
  layouts: (
    <>
      <rect x="3" y="4" width="8" height="16" rx="1.5" />
      <rect x="13" y="4" width="8" height="7" rx="1.5" />
      <rect x="13" y="13" width="8" height="7" rx="1.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
};

export function AppGlyph({ name, size = 16, color = "currentColor" }: { name: AppGlyphName; size?: number; color?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  );
}

/** The AI's mark everywhere in the OS: a small mint orb. */
export function AiOrb({ size = 14, pulse = true }: { size?: number; pulse?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,#EEF9F2,#D8F3E4_25%,#A8DEC2_55%,#315947)] ${pulse ? "afv-orb" : ""}`}
      style={{ width: size, height: size }}
    />
  );
}

/* ----------------------------------------------------------------- screen */

/**
 * A fixed-size OS design canvas (default 1200×660) scaled to fit its box.
 * Lay out children in design pixels; they stay crisp (DOM, not an image).
 */
export function OsScreen({
  width = 1200,
  height = 660,
  label = "AFVAR OS, illustration",
  className = "",
  style,
  children,
}: {
  width?: number;
  height?: number;
  label?: string;
  className?: string;
  style?: MotionStyle;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width: cw, height: ch } = e.contentRect;
      setScale(Math.min(cw / width, ch / height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  return (
    <motion.div ref={box} className={`relative ${className}`} style={style}>
      <section
        aria-label={label}
        className="afvar-os-desktop-frame absolute left-1/2 top-1/2 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.14)] bg-[#07090A] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9),0_0_0_1px_rgba(0,0,0,0.6)]"
        style={{ width, height, transform: `translate(-50%, -50%) scale(${scale})`, visibility: scale ? "visible" : "hidden" }}
      >
        <Wallpaper />
        {children}
      </section>
    </motion.div>
  );
}

function Wallpaper() {
  return (
    <div aria-hidden="true" className="afvar-os-wallpaper absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_115%,rgba(168,222,194,0.16),transparent_55%),radial-gradient(ellipse_at_15%_0%,rgba(255,255,255,0.05),transparent_45%)]" />
      <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:40px_40px]" />
    </div>
  );
}

/* --------------------------------------------------------------- menu bar */

export function MenuBar({
  menus = ["Workspace", "Apps", "Layouts", "Window", "Help"],
  openMenu,
  space,
  focus,
  status = "AI awake",
  clock,
}: {
  menus?: readonly string[];
  /** Highlight one menu title (e.g. while its dropdown is open). */
  openMenu?: string | null;
  space: string;
  focus?: string | null;
  status?: string;
  clock?: ReactNode;
}) {
  return (
    <div className="absolute inset-x-0 top-0 z-40 flex h-[30px] items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-[rgba(9,11,12,0.94)] px-4 text-[12px] text-[#C9CFD1]">
      <div className="flex items-center gap-5">
        <span className="font-semibold tracking-[0.22em] text-[#A8DEC2]">AFVAR</span>
        {menus.map((m) => (
          <span key={m} className={`rounded px-1.5 py-0.5 ${openMenu === m ? "bg-[rgba(168,222,194,0.18)] text-[#F2F5F2]" : ""}`}>
            {m}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4 font-mono text-[10.5px] tracking-[0.08em]">
        {focus ? <span className="rounded-full border border-[rgba(168,222,194,0.5)] px-2 py-0.5 text-[#A8DEC2]">◐ FOCUS · {focus}</span> : null}
        <span className="flex items-center gap-1.5 text-[#A8DEC2]">
          <AiOrb size={8} />
          {status.toUpperCase()}
        </span>
        <span>{space.toUpperCase()}</span>
        {clock ? <span className="tabular-nums text-[#F2F5F2]">{clock}</span> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- dock */

export interface DockItem {
  id: string;
  label: string;
  glyph: AppGlyphName;
  running?: boolean;
  /** Draw attention (e.g. just minimised into the dock). */
  attention?: boolean;
}

export const DOCK_ITEM = 44;
export const DOCK_GAP = 10;

/** Centre x (design px) of the dock slot `index` (AI orb is slot 0). */
export function dockSlotX(index: number, count: number, screenWidth = 1200) {
  const total = (count + 1) * DOCK_ITEM + count * DOCK_GAP + 24;
  return screenWidth / 2 - total / 2 + 12 + index * (DOCK_ITEM + DOCK_GAP) + DOCK_ITEM / 2;
}

export function Dock({ items, style }: { items: readonly DockItem[]; style?: MotionStyle }) {
  return (
    <motion.nav
      aria-label="Dock"
      className="absolute bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-end gap-[10px] rounded-[18px] border border-[rgba(255,255,255,0.12)] bg-[rgba(14,17,19,0.94)] px-3 py-2"
      style={style}
    >
      <span title="AFVAR AI" className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1A1408] ring-1 ring-[rgba(168,222,194,0.5)]">
        <AiOrb size={22} />
      </span>
      {items.map((it) => (
        <span key={it.id} title={it.label} className="relative flex flex-col items-center">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
              it.attention ? "border-[rgba(168,222,194,0.7)] bg-[#10231B] text-[#A8DEC2]" : "border-[rgba(255,255,255,0.1)] bg-[#181C1F] text-[#C9CFD1]"
            }`}
          >
            <AppGlyph name={it.glyph} size={20} />
          </span>
          <span className={`absolute -bottom-1.5 h-1 w-1 rounded-full ${it.running ? "bg-[#A8DEC2]" : "bg-transparent"}`} />
        </span>
      ))}
    </motion.nav>
  );
}
