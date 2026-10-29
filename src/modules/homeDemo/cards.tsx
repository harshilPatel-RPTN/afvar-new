"use client";

// The demo's cards in the "/" card design and motion: a rounded raised panel
// that prints in like a candle (the body grows up from the bottom while a
// green wick flashes above it), an accent line that draws across the top, and
// on hover a small lift plus the "/" sparkline of six candles. Content stays
// the demo's own. In pinned chapters pass the card's scroll window (mv, at)
// so it prints when it fades in; elsewhere it prints on entering the view.
import { motion, useReducedMotion, type MotionValue } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { CandleCard, PANEL, drawX } from "@/modules/home/kit";
import { useShown } from "./kinetic";

export function PanelCard({
  children,
  mv,
  at,
  tone = "up",
  index = 0,
  className = "",
  bodyClassName = "p-5",
}: {
  children: ReactNode;
  mv?: MotionValue<number>;
  at?: readonly [number, number];
  /** Accent line colour: green for up / neutral facts, red for risk. */
  tone?: "up" | "down";
  index?: number;
  className?: string;
  bodyClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const shown = useShown(ref, mv, at);
  return (
    <motion.div ref={ref} className={className} initial="hidden" animate={shown ? "visible" : "hidden"}>
      <CandleCard index={index} delay={index * 0.08} className="h-full">
        <div className={`relative h-full overflow-hidden transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-white/[.2] ${PANEL} ${bodyClassName}`}>
          <motion.span
            aria-hidden="true"
            variants={drawX(reduce, 0.25 + index * 0.08, 0.7)}
            className={`absolute inset-x-0 top-0 h-[2px] origin-left ${tone === "up" ? "bg-[#00E676]" : "bg-[#FF3B3B]"}`}
          />
          {children}
        </div>
      </CandleCard>
    </motion.div>
  );
}
