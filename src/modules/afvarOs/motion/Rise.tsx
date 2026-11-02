"use client";

// Small entrance pieces for page sections (plan D1 / D4 / D6): an item that
// rises in once (in order with its neighbours) and a section rule that draws
// from the left. Finished state when the motion layer is off or reduced.
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useRef, type ReactNode, type RefObject } from "react";
import { useMotionOn, useOnEnter, useSettle, type EnterQueue } from "./enter";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Rises `y` px (and optionally scales from `from`) and fades in once, when it scrolls into view. */
export function Rise({
  as = "div",
  queue,
  y = 10,
  from = 1,
  duration = 0.9,
  amount = 0.2,
  className,
  children,
}: {
  as?: "div" | "li";
  /** Shared queue → neighbours that enter together go in order. */
  queue?: EnterQueue;
  y?: number;
  /** Starting scale (1 = none). */
  from?: number;
  duration?: number;
  amount?: number;
  className?: string;
  children: ReactNode;
}) {
  const on = useMotionOn();
  const ref = useRef<HTMLElement>(null);
  const t = useMotionValue(on ? 0 : 1);
  useOnEnter(ref, on, () => void animate(t, 1, { delay: (queue?.claim() ?? 0) / 1000, duration, ease: EASE }), amount);
  const ty = useTransform(t, [0, 1], [y, 0]);
  const sc = useTransform(t, [0, 1], [from, 1]);
  useSettle(on, t);
  const style = { opacity: t, y: ty, scale: sc };
  if (as === "li")
    return (
      <motion.li ref={ref as RefObject<HTMLLIElement>} className={className} style={style}>
        {children}
      </motion.li>
    );
  return (
    <motion.div ref={ref as RefObject<HTMLDivElement>} className={className} style={style}>
      {children}
    </motion.div>
  );
}

/** A 1 px section rule that draws from the left as the section enters (replaces a `border-t`). */
export function RuleDraw({ className = "" }: { className?: string }) {
  const on = useMotionOn();
  const ref = useRef<HTMLSpanElement>(null);
  const t = useMotionValue(on ? 0 : 1);
  useOnEnter(ref, on, () => void animate(t, 1, { duration: 1.2, ease: EASE }), "some", "0px 0px -20% 0px");
  useSettle(on, t);
  return (
    <span ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-x-0 top-0 h-px ${className}`}>
      <motion.span className="absolute inset-0 origin-left bg-[rgba(255,255,255,0.06)]" style={{ scaleX: t }} />
    </span>
  );
}
