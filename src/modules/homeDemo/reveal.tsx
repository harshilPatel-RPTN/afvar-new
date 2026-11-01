"use client";

// Shared DOM reveal primitives for chapter overlays — all driven by the same
// master scrollYProgress the scene reads, via windows from each chapter config.
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { ramp, window4 } from "./timeline";
import { MONO } from "./ui";

/** While a faded block is invisible, take it out of the tab order and the
 *  accessibility tree (`inert`) — so keyboard users never land on hidden CTAs. */
export function useInertWhileHidden(opacity: MotionValue<number>) {
  const ref = useRef<HTMLDivElement>(null);
  const apply = (o: number) => {
    const el = ref.current;
    if (!el) return;
    if (o < 0.05) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  };
  useMotionValueEvent(opacity, "change", apply);
  return { ref, apply };
}

/** Fades in and back out over a [inStart, inEnd, outStart, outEnd] window. */
export function WindowFade({
  mv,
  w,
  className,
  children,
}: {
  mv: MotionValue<number>;
  w: readonly [number, number, number, number];
  className?: string;
  children: ReactNode;
}) {
  const opacity = useTransform(mv, (p) => window4(p, w));
  const { ref } = useInertWhileHidden(opacity);
  return (
    <motion.div ref={ref} className={className} style={{ opacity }} inert={window4(mv.get(), w) < 0.05}>
      {children}
    </motion.div>
  );
}

/** Fades in over [a,b] and stays; `rise` adds a small upward settle. */
export function RampFade({
  mv,
  at,
  className,
  children,
  rise,
}: {
  mv: MotionValue<number>;
  at: readonly [number, number];
  className?: string;
  children: ReactNode;
  rise?: boolean;
}) {
  const opacity = useTransform(mv, (p) => ramp(p, at[0], at[1]));
  const y = useTransform(opacity, (o) => (rise ? (1 - o) * 26 : 0));
  const { ref } = useInertWhileHidden(opacity);
  return (
    <motion.div ref={ref} className={className} style={{ opacity, y }} inert={ramp(mv.get(), at[0], at[1]) < 0.05}>
      {children}
    </motion.div>
  );
}

/** Flat dark gradient on the left half that fades in with a chapter's closing
 *  copy, so scene lines never run behind the headline or CTAs. Not glass —
 *  a plain gradient to the page background. */
export function CopyScrim({ mv, at }: { mv: MotionValue<number>; at: readonly [number, number] }) {
  const opacity = useTransform(mv, (p) => ramp(p, at[0], at[1]));
  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-(--afvar-charcoal) from-35% via-[rgba(5,5,5,0.82)] via-60% to-transparent"
      style={{ opacity }}
    />
  );
}

/** A mono label that lights up (dim → full) in sync with its 3D counterpart. */
export function Chip({ mv, at, label }: { mv: MotionValue<number>; at: readonly [number, number]; label: string }) {
  const opacity = useTransform(mv, (p) => 0.25 + 0.75 * ramp(p, at[0], at[1]));
  return (
    <motion.span className={`${MONO} text-(--afvar-text)`} style={{ opacity }}>
      {label}
    </motion.span>
  );
}
