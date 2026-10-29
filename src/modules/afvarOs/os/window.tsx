"use client";

// AFVAR OS surfaces: windows (chrome, tabs, resize grip), the AI spotlight,
// notification toasts, the pointer, and the snap ghost. Position/size come in
// as motion styles so a scroll timeline (or real interaction later) drives them.
import { motion, type MotionStyle } from "framer-motion";
import type { ReactNode, RefObject } from "react";
import { AiOrb, AppGlyph, type AppGlyphName } from "./chrome";

/* ----------------------------------------------------------------- window */

export function OsWindow({
  title,
  glyph,
  tabs,
  activeTab = 0,
  focused = false,
  dimmed = false,
  aiOwned = false,
  style,
  z = 10,
  toolbar,
  children,
}: {
  title: string;
  glyph: AppGlyphName;
  tabs?: readonly string[];
  activeTab?: number;
  focused?: boolean;
  /** Focus mode: pushed back, desaturated. */
  dimmed?: boolean;
  /** Window the AI is acting on right now (gold ring). */
  aiOwned?: boolean;
  style?: MotionStyle;
  z?: number;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.div
      role="group"
      aria-label={`${title} window`}
      className={`absolute flex origin-bottom flex-col overflow-hidden rounded-xl border bg-[#101315] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] ${
        aiOwned ? "border-[rgba(233,180,76,0.75)] ring-1 ring-[rgba(233,180,76,0.35)]" : focused ? "border-[rgba(255,255,255,0.2)]" : "border-[rgba(255,255,255,0.1)]"
      }`}
      style={{ zIndex: z, ...style }}
    >
      <div className="flex h-[30px] shrink-0 items-center gap-2 border-b border-[rgba(255,255,255,0.08)] bg-[#14181A] px-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className={`h-2.5 w-2.5 rounded-full ${focused ? "bg-[#E9B44C]" : "bg-[#3A3F42]"}`} />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3A3F42]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3A3F42]" />
        </span>
        <span className="ml-1 text-[#8A9295]">
          <AppGlyph name={glyph} size={13} />
        </span>
        <span className="truncate text-[12px] font-medium text-[#C9CFD1]">{title}</span>
        {aiOwned ? (
          <span className="ml-1 flex items-center gap-1 rounded bg-[rgba(233,180,76,0.16)] px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.1em] text-[#E9B44C]">
            <AiOrb size={7} /> AI
          </span>
        ) : null}
        <span className="ml-auto flex items-center gap-2">{toolbar}</span>
      </div>
      {tabs && tabs.length ? (
        <div className="flex h-[28px] shrink-0 items-end gap-1 border-b border-[rgba(255,255,255,0.06)] bg-[#0D1012] px-2">
          {tabs.map((t, i) => (
            <span
              key={t}
              className={`truncate rounded-t-md px-2.5 py-1 font-mono text-[10.5px] tracking-[0.04em] ${
                i === activeTab ? "bg-[#101315] text-[#F5F7F7] shadow-[inset_0_1px_0_#E9B44C]" : "text-[#6D7578]"
              }`}
            >
              {t}
            </span>
          ))}
          <span className="px-1.5 pb-1 text-[12px] text-[#4A5256]">+</span>
        </div>
      ) : null}
      <div className="relative min-h-0 flex-1">{children}</div>
      <span aria-hidden="true" className="absolute bottom-1 right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-[rgba(255,255,255,0.25)]" />
      {dimmed ? <div aria-hidden="true" className="absolute inset-0 bg-[rgba(5,6,7,0.62)] backdrop-grayscale" /> : null}
    </motion.div>
  );
}

/* -------------------------------------------------------------- spotlight */

export function Spotlight({
  typedRef,
  placeholder = "Ask AFVAR or type a command",
  shortcut = "⌘K",
  style,
  children,
}: {
  /** Span the typed query is written into (useTypedText). */
  typedRef: RefObject<HTMLSpanElement | null>;
  placeholder?: string;
  shortcut?: string;
  style?: MotionStyle;
  children?: ReactNode;
}) {
  return (
    <motion.div
      className="absolute left-1/2 top-[120px] z-50 w-[560px] -translate-x-1/2 rounded-2xl border border-[rgba(233,180,76,0.55)] bg-[rgba(16,19,21,0.98)] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]"
      style={style}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <AiOrb size={16} />
        <span className="min-w-0 flex-1 truncate text-[17px] text-[#F5F7F7]">
          <span ref={typedRef} />
          <span className="afv-caret" />
        </span>
        <span className="font-mono text-[11px] text-[#6D7578]">{shortcut}</span>
      </div>
      <span className="sr-only">{placeholder}</span>
      {children ? <div className="border-t border-[rgba(255,255,255,0.08)] px-4 py-3">{children}</div> : null}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ toast */

export function Toast({
  tone = "ai",
  title,
  children,
  meta,
  style,
}: {
  tone?: "ai" | "risk" | "info" | "ok";
  title: string;
  children?: ReactNode;
  meta?: string;
  style?: MotionStyle;
}) {
  const border = tone === "risk" ? "border-[rgba(255,107,107,0.55)]" : tone === "ai" ? "border-[rgba(233,180,76,0.5)]" : tone === "ok" ? "border-[rgba(0,230,118,0.45)]" : "border-[rgba(255,255,255,0.12)]";
  const head = tone === "risk" ? "text-[#FF6B6B]" : tone === "ai" ? "text-[#E9B44C]" : tone === "ok" ? "text-[#00E676]" : "text-[#C9CFD1]";
  return (
    <motion.div role="status" className={`w-[300px] rounded-xl border ${border} bg-[rgba(18,21,23,0.98)] px-3.5 py-3 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.9)]`} style={style}>
      <div className="flex items-center gap-2">
        {tone === "ai" ? <AiOrb size={9} pulse={false} /> : null}
        <p className={`text-[12px] font-semibold ${head}`}>{title}</p>
        {meta ? <span className="ml-auto font-mono text-[10px] text-[#6D7578]">{meta}</span> : null}
      </div>
      {children ? <div className="mt-1 text-[12px] leading-snug text-[#C9CFD1]">{children}</div> : null}
    </motion.div>
  );
}

/* ---------------------------------------------------------------- pointer */

export function Pointer({ style, pressStyle }: { style?: MotionStyle; pressStyle?: MotionStyle }) {
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-[60]" style={style}>
      <motion.svg width="22" height="22" viewBox="0 0 24 24" style={pressStyle}>
        <path d="M4 2l15 9.5-6.6 1.4L16 20l-3 1.4-3.6-7.2L4 19z" fill="#F5F7F7" stroke="#050607" strokeWidth="1.3" strokeLinejoin="round" />
      </motion.svg>
    </motion.div>
  );
}

/** Translucent gold rectangle showing where a window will snap. */
export function SnapGhost({ style }: { style?: MotionStyle }) {
  return <motion.div aria-hidden="true" className="absolute z-[5] rounded-xl border border-[rgba(233,180,76,0.6)] bg-[rgba(233,180,76,0.08)]" style={style} />;
}
