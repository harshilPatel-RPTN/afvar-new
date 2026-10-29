"use client";

/**
 * Markets motion kit (new-age interactions, all transform/opacity/filter only):
 *   Tilt       — cards lift under the cursor; a spotlight and a glowing border follow it
 *                (2D lift only: a 3D tilt would rasterise the text and blur it)
 *   Magnetic   — buttons lean toward the cursor
 *   ScrollStage — a 3D stage rises, scales and fades in as it scrolls into view
 *   CountUp    — numbers count up when first seen
 * Reduced motion: transforms collapse (SSR-safe media query), content stays visible.
 */
import { animate, motion, useInView, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useMediaQuery } from "@/platform/hooks/useMediaQuery";

const REDUCED = "(prefers-reduced-motion: reduce)";
const SPRING = { stiffness: 220, damping: 22, mass: 0.6 };

export function Tilt({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useMediaQuery(REDUCED);
  const lift = useSpring(0, SPRING);

  function onMove(event: PointerEvent<HTMLDivElement>) {
    const el = event.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (event.clientX - r.left) / r.width;
    const py = (event.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    if (!reduced) lift.set(-6);
  }
  function onLeave() {
    lift.set(0);
  }

  return (
    <motion.div onPointerMove={onMove} onPointerLeave={onLeave} style={{ y: lift }} className={`mk-spot h-full ${className}`}>
      {children}
    </motion.div>
  );
}

export function Magnetic({ children, strength = 0.28 }: { children: ReactNode; strength?: number }) {
  const reduced = useMediaQuery(REDUCED);
  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);
  return (
    <motion.span
      className="inline-flex"
      style={{ x, y }}
      onPointerMove={(event) => {
        if (reduced) return;
        const r = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - (r.left + r.width / 2)) * strength);
        y.set((event.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

export function ScrollStage({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useMediaQuery(REDUCED);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [0.94, 1]);
  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [70, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], reduced ? [1, 1] : [0, 1]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ scale, y, opacity }}>{children}</motion.div>
    </div>
  );
}

export function CountUp({ value, className = "" }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "-10% 0px" });
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!seen) return;
    const controls = animate(0, value, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [seen, value]);
  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}
