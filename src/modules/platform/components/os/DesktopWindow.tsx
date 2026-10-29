"use client";

import { animate, motion, useDragControls, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type RefObject } from "react";
import type { Capability } from "../../types";
import { Sketch } from "../capability/CapabilityPreview";
import type { Win } from "./desktop-state";

const TIMEFRAMES = ["1H", "4H", "1D", "1W"];

/**
 * A real macOS-style window on the demo desktop. Drag by the title bar only
 * (macos-web's `.app-window-drag-handle` pattern), focus on pointer down,
 * double-click the title bar to zoom, working traffic lights. Minimize "genies"
 * into the window's Dock icon; close shrinks and fades (macos-web's 300ms
 * scale/opacity close transition).
 */
export function DesktopWindow({
  capability: c,
  win,
  active,
  desktopRef,
  onFocus,
  onClose,
  onMinimize,
  onZoom,
}: {
  capability: Capability;
  win: Win;
  active: boolean;
  desktopRef: RefObject<HTMLDivElement | null>;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onZoom: () => void;
}) {
  const still = useReducedMotion() ?? false;
  const drag = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Start slightly small and transparent; the mode effect below settles them (entrance).
  const scale = useMotionValue(still ? 1 : 0.94);
  const opacity = useMotionValue(still ? 1 : 0);
  const ref = useRef<HTMLDivElement>(null);
  const saved = useRef({ x: 0, y: 0 });

  // Minimize / restore / zoom / arrange are imperative transforms on top of the frame.
  useEffect(() => {
    const t = still ? { duration: 0 } : { type: "spring" as const, stiffness: 320, damping: 32 };
    if (win.mode === "min") {
      saved.current = { x: x.get(), y: y.get() };
      const el = ref.current;
      const desk = desktopRef.current;
      const icon = desk?.querySelector<HTMLElement>(`[data-dock-app="${c.slug}"]`);
      if (el && icon) {
        const a = el.getBoundingClientRect();
        const b = icon.getBoundingClientRect();
        const dx = b.left + b.width / 2 - (a.left + a.width / 2);
        const dy = b.top + b.height / 2 - (a.top + a.height / 2);
        const genie = still ? { duration: 0 } : { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const };
        animate(x, x.get() + dx, genie);
        animate(y, y.get() + dy, genie);
        animate(scale, 0.06, genie);
        animate(opacity, 0, { ...genie, duration: still ? 0 : 0.4 });
      }
      return;
    }
    if (win.mode === "max") {
      animate(x, 0, t);
      animate(y, 0, t);
    } else if (scale.get() < 0.5) {
      // Coming back from the Dock: return to where it was minimized from.
      animate(x, saved.current.x, t);
      animate(y, saved.current.y, t);
    }
    animate(scale, 1, t);
    animate(opacity, 1, { duration: still ? 0 : 0.2 });
  }, [win.mode, c.slug, desktopRef, still, x, y, scale, opacity]);

  useEffect(() => {
    if (win.layout === 0) return;
    const t = still ? { duration: 0 } : { type: "spring" as const, stiffness: 300, damping: 32 };
    animate(x, 0, t);
    animate(y, 0, t);
  }, [win.layout, still, x, y]);

  const frame =
    win.mode === "max"
      ? { left: "0%", top: "26px", width: "100%", height: "calc(100% - 26px - 58px)" }
      : { left: `${win.frame.l}%`, top: `${win.frame.t}%`, width: `${win.frame.w}%`, height: `${win.frame.h}%` };
  const title = c.slug === "charts" ? `${win.instrument} · ${win.timeframe} — Sample` : `${c.title} — Sample`;

  return (
    <motion.div
      ref={ref}
      role="group"
      aria-label={`${c.title} window`}
      className="absolute"
      style={{ x, y, scale, opacity, zIndex: win.z + 1, pointerEvents: win.mode === "min" ? "none" : undefined }}
      initial={false}
      animate={frame}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: still ? 0 : 0.25, ease: "easeInOut" } }}
      transition={still ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32 }}
      drag={win.mode === "normal"}
      dragListener={false}
      dragControls={drag}
      dragConstraints={desktopRef}
      dragElastic={0}
      dragMomentum={false}
      onPointerDown={onFocus}
    >
      <div className={`pf-window flex h-full flex-col ${active ? "" : "pf-window-inactive"}`}>
        <div
          className="pf-window-toolbar !h-8 shrink-0 cursor-default select-none"
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            drag.start(e);
          }}
          onDoubleClick={onZoom}
        >
          <div className="pf-lights relative z-10 flex">
            <button type="button" aria-label={`Close ${c.title}`} onClick={onClose} className="pf-light pf-light-close">
              <svg viewBox="0 0 8 8" aria-hidden="true">
                <path d="M2 2l4 4M6 2 2 6" stroke="#4d0000" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
            <button type="button" aria-label={`Minimize ${c.title}`} onClick={onMinimize} className="pf-light pf-light-min">
              <svg viewBox="0 0 8 8" aria-hidden="true">
                <path d="M1.5 4h5" stroke="#5a3d00" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
            <button type="button" aria-label={`${win.mode === "max" ? "Restore" : "Zoom"} ${c.title}`} onClick={onZoom} className="pf-light pf-light-zoom">
              <svg viewBox="0 0 8 8" aria-hidden="true">
                <path d="M2 2.2v3.2l3.2-3.2zM6 5.8V2.6L2.8 5.8z" fill="#003d00" />
              </svg>
            </button>
          </div>
          <span className={`pointer-events-none absolute inset-x-0 truncate px-20 text-center text-[11.5px] font-semibold ${active ? "text-(--text-secondary)" : "text-(--text-muted)"}`}>
            {title}
          </span>
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden bg-(--mac-window) p-3.5">
          <Sketch
            slug={c.slug}
            focus={c.slug === "charts" ? TIMEFRAMES.indexOf(win.timeframe) : 0}
            animate={!still}
            interactive
            key={c.slug === "charts" ? `${win.instrument}-${win.timeframe}` : c.slug}
          />
        </div>
      </div>
    </motion.div>
  );
}
