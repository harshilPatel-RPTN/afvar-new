"use client";

import { AnimatePresence, animate, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AppIcon, PIcon, type IconTone, type PlatformIcon } from "@/modules/platform/kit";

export type WindowState = "open" | "min" | "closed" | "full";

const SAMPLE_TAIL = " — Sample";

const SPRING = { type: "spring", stiffness: 260, damping: 30 } as const;

/** Exit motion depends on why the window is leaving: minimise pours it down into the dock (genie-like), close just fades. */
const exitFor = (to: WindowState) =>
  to === "min"
    ? { opacity: 0, scaleX: 0.22, scaleY: 0.06, y: 140, transition: { duration: 0.42, ease: [0.55, 0, 0.45, 1] as const } }
    : { opacity: 0, scale: 0.94, transition: { duration: 0.2 } };

/**
 * A macOS window whose traffic lights work: close, minimise (into a dock pill)
 * and full screen (Esc to leave). Self-managed by default; pass `state` +
 * `onStateChange` with `managed` to let a desktop own it (the overview's
 * Mac desktop puts minimised/closed windows in its own Dock).
 */
export function Window({
  title,
  size = "md",
  icon = "app",
  tone = "slate",
  toolbar,
  className = "",
  bodyClassName = "",
  fullBodyClassName,
  fill = false,
  managed = false,
  state: controlled,
  onStateChange,
  children,
}: {
  title?: string;
  size?: "md" | "sm";
  icon?: PlatformIcon;
  tone?: IconTone;
  toolbar?: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Body classes while full screen (defaults to bodyClassName in a scrolling, full-height body). */
  fullBodyClassName?: string;
  /** Stretch to the parent's height (desktop windows). */
  fill?: boolean;
  managed?: boolean;
  state?: WindowState;
  onStateChange?: (state: WindowState) => void;
  children: ReactNode;
}) {
  const [own, setOwn] = useState<WindowState>("open");
  const state = controlled ?? own;
  const [leaving, setLeaving] = useState<WindowState>("closed");
  const [hold, setHold] = useState<number | null>(null);
  const slot = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const from = useRef<DOMRect | null>(null);
  const lifted = useRef<{ el: HTMLElement; z: string; position: string }[]>([]);

  /**
   * A fixed, full-screen window can only rise as high as its nearest stacking
   * context (sticky tour, animated wrappers…), which would leave its title bar
   * under the site nav. Lift those ancestors above the nav while full screen.
   */
  function liftAncestors() {
    let el = slot.current?.parentElement ?? null;
    while (el && el !== document.body) {
      const cs = getComputedStyle(el);
      const stacks =
        cs.position === "sticky" ||
        cs.position === "fixed" ||
        (cs.position !== "static" && cs.zIndex !== "auto") ||
        cs.transform !== "none" ||
        cs.filter !== "none" ||
        cs.isolation === "isolate" ||
        Number(cs.opacity) < 1 ||
        cs.willChange.includes("transform");
      if (stacks) {
        lifted.current.push({ el, z: el.style.zIndex, position: el.style.position });
        if (cs.position === "static") el.style.position = "relative";
        el.style.zIndex = "125";
      }
      el = el.parentElement;
    }
  }

  function go(next: WindowState) {
    // Full screen ⇄ window is animated by hand (FLIP): remember where the frame is now.
    if ((next === "full") !== (state === "full") && frame.current) from.current = frame.current.getBoundingClientRect();
    if (next === "full") {
      setHold(slot.current?.offsetHeight ?? null);
      liftAncestors();
    }
    if (next === "min" || next === "closed") setLeaving(next);
    onStateChange?.(next);
    if (controlled === undefined) setOwn(next);
  }

  const full = state === "full";

  // FLIP: start the frame where it was, then spring it to its new box. Framer's own
  // `layout` can't follow an element that switches to position: fixed on a scrolled page.
  useLayoutEffect(() => {
    const el = frame.current;
    const a = from.current;
    from.current = null;
    if (!el || !a) return;
    const b = el.getBoundingClientRect();
    if (!b.width || !b.height) return;
    el.style.transformOrigin = "0 0";
    const controls = animate(
      el,
      { x: [a.left - b.left, 0], y: [a.top - b.top, 0], scaleX: [a.width / b.width, 1], scaleY: [a.height / b.height, 1] },
      { type: "spring", stiffness: 300, damping: 32 },
    );
    return () => controls.stop();
  }, [full]);

  useEffect(() => {
    if (!full) return;
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onStateChange?.("open");
      if (controlled === undefined) setOwn("open");
    };
    window.addEventListener("keydown", onKey);
    const raised = lifted.current;
    return () => {
      html.style.overflow = before;
      window.removeEventListener("keydown", onKey);
      // put lifted ancestors back once the window has flown home
      window.setTimeout(() => {
        raised.splice(0).forEach(({ el, z, position }) => {
          el.style.zIndex = z;
          el.style.position = position;
        });
      }, 450);
    };
  }, [full, controlled, onStateChange]);

  const sm = size === "sm";
  const shown = state === "open" || full;

  return (
    <div ref={slot} className={`${fill ? "h-full" : ""} ${className}`} style={full && hold ? { height: hold } : undefined}>
      <AnimatePresence>
        {full && (
          <motion.div
            key="scrim"
            aria-hidden="true"
            className="fixed inset-0 z-[118] bg-black/65 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => go("open")}
          />
        )}
        {full && (
          <motion.button
            key="exit"
            type="button"
            onClick={() => go("open")}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }}
            exit={{ opacity: 0 }}
            className="pf-vibrant fixed bottom-5 left-1/2 z-[122] flex min-h-10 -translate-x-1/2 items-center gap-2 rounded-full py-2 pl-3 pr-2 text-[12.5px] text-(--text-secondary) hover:text-(--text-primary)"
          >
            <PIcon name="close" size={12} />
            Exit full screen
            <kbd className="rs-kbd !h-5 !text-[10.5px]">esc</kbd>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="popLayout" custom={leaving}>
        {shown ? (
          <motion.div
            key="window"
            custom={leaving}
            initial={{ opacity: 0, scaleX: 0.22, scaleY: 0.06, y: 140 }}
            animate={{ opacity: 1, scaleX: 1, scaleY: 1, y: 0 }}
            variants={{ leave: exitFor }}
            exit="leave"
            transition={SPRING}
            style={{ originY: 1 }}
            role={full ? "dialog" : undefined}
            aria-modal={full || undefined}
            aria-label={full ? title : undefined}
            className={full ? "fixed inset-3 z-[120] sm:inset-8" : fill ? "h-full" : ""}
          >
            <div ref={frame} className={`pf-window ${sm ? "pf-window-sm" : ""} flex flex-col ${full || fill ? "h-full" : ""}`}>
            <div
              className="pf-window-toolbar shrink-0"
              onDoubleClick={(event) => {
                if ((event.target as HTMLElement).closest("button, input, select, a, label")) return;
                go(full ? "open" : "full");
              }}
            >
              <Lights full={full} onClose={() => go("closed")} onMin={() => go("min")} onZoom={() => go(full ? "open" : "full")} />
              {title && (
                <span
                  className={`pointer-events-none absolute inset-x-0 truncate text-center font-semibold text-(--text-secondary) ${
                    sm ? "px-16 text-[11px] max-sm:hidden" : "px-28 text-[13px] max-sm:static max-sm:min-w-0 max-sm:flex-1 max-sm:px-0 max-sm:text-left max-sm:text-[12px]"
                  }`}
                >
                  {/* On a phone the SAMPLE chip beside the title already carries the label, so the title drops its "— Sample" tail to stay whole. */}
                  {title.endsWith(SAMPLE_TAIL) && !sm ? (
                    <>
                      {title.slice(0, -SAMPLE_TAIL.length)}
                      <span className="max-sm:hidden">{SAMPLE_TAIL}</span>
                    </>
                  ) : (
                    title
                  )}
                </span>
              )}
              {toolbar && <div className="relative ml-auto flex items-center gap-2">{toolbar}</div>}
            </div>
            <div className={full ? `min-h-0 flex-1 overflow-auto ${fullBodyClassName ?? bodyClassName}` : fill ? `min-h-0 flex-1 overflow-auto ${bodyClassName}` : bodyClassName}>{children}</div>
            </div>
          </motion.div>
        ) : managed ? null : state === "min" ? (
          <motion.div key="min" className="flex justify-center py-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }} exit={{ opacity: 0 }}>
            <button
              type="button"
              onClick={() => go("open")}
              className="pf-vibrant group flex items-center gap-3 rounded-2xl py-2 pl-2 pr-4 text-left transition-colors hover:bg-white/[.06]"
            >
              <motion.span whileHover={{ y: -3 }} className="relative">
                <AppIcon icon={icon} tone={tone} size={36} />
                <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/70" />
              </motion.span>
              <span>
                <span className="block text-[13px] font-semibold">{title ?? "Window"}</span>
                <span className="block text-[11.5px] text-(--text-muted)">Minimised · click to restore</span>
              </span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="closed"
            className="pf-vibrant flex items-center gap-3 rounded-2xl px-4 py-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
            exit={{ opacity: 0 }}
          >
            <AppIcon icon={icon} tone={tone} size={30} />
            <span className="min-w-0 flex-1 truncate text-[13.5px] text-(--text-secondary)">
              <span className="font-semibold text-(--text-primary)">{title ?? "Window"}</span> is closed
            </span>
            <button type="button" onClick={() => go("open")} className="afvar-glass-button rs-ghost !h-10 !text-[12.5px]">
              Reopen
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Working traffic lights: glyphs appear when the group is hovered, as on macOS. They are
 * mock-window chrome (9 px, too small to be real targets), so they stay pointer-only —
 * out of the tab order and the accessibility tree.
 */
export function Lights({ full = false, onClose, onMin, onZoom }: { full?: boolean; onClose: () => void; onMin: () => void; onZoom: () => void }) {
  const base = "pf-light grid cursor-default place-items-center border-0 p-0 outline-none focus-visible:ring-2 focus-visible:ring-white/60";
  return (
    <div className="pf-lights relative z-10" aria-hidden="true">
      <button type="button" tabIndex={-1} aria-label="Close window" title="Close" onClick={onClose} className={`${base} pf-light-close`}>
        <svg viewBox="0 0 8 8" aria-hidden="true">
          <path d="M2 2l4 4M6 2 2 6" stroke="#4d0000" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
      <button type="button" tabIndex={-1} aria-label="Minimise window" title="Minimise" onClick={onMin} disabled={full} className={`${base} pf-light-min disabled:!bg-[#3a4350]`}>
        <svg viewBox="0 0 8 8" aria-hidden="true">
          <path d="M1.5 4h5" stroke="#5a3d00" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
      <button type="button" tabIndex={-1} aria-label={full ? "Exit full screen" : "Enter full screen"} title={full ? "Exit full screen" : "Full screen"} onClick={onZoom} className={`${base} pf-light-zoom`}>
        <svg viewBox="0 0 8 8" aria-hidden="true">
          {full ? <path d="M1.6 4.4h2v2zM6.4 3.6h-2v-2z" fill="#003d00" /> : <path d="M2 2.2v3.2l3.2-3.2zM6 5.8V2.6L2.8 5.8z" fill="#003d00" />}
        </svg>
      </button>
    </div>
  );
}
