"use client";

import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
// The star twinkle lives in the platform stylesheet; load it wherever the earth is used.
import "../../platform.css";

const EarthScene = dynamic(() => import("./EarthScene"), { ssr: false });

/** Top fade only: the earth must run unmasked down to the section's bottom edge (the footer's top border). */
const FADE = "linear-gradient(to bottom, transparent, black 24%)";

/**
 * Deterministic star field (same on server and client): x/y in %, size in px,
 * twinkle delay/duration in s. Shaped like a real sky: a magnitude distribution
 * (most stars faint and small, a handful bright), colour temperatures (cool
 * blue-whites dominate, with the odd warm orange and hot blue star), varied
 * base brightness, and a soft glow only on the bright ones.
 */
const STARS = Array.from({ length: 180 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  // Rounded so tiny Math.sin differences between Node and the browser cannot cause a hydration mismatch.
  const round = (v: number) => Math.round(v * 10) / 10;
  const m = r(3); // magnitude
  const size = m < 0.55 ? 1 : m < 0.85 ? 1.5 : m < 0.96 ? 2.5 : 3.5;
  const hue = r(6);
  const color = hue < 0.1 ? "#FFD9A8" : hue < 0.18 ? "#BFD4FF" : hue < 0.5 ? "#FFFFFF" : "#E7EDF6";
  return { x: round(r(1) * 100), y: round(r(2) * 52), size, color, alpha: round(4.5 + r(7) * 5.5) / 10, delay: round(r(4) * 6), duration: round(2.5 + r(5) * 4) };
});

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
const noSubscribe = () => () => {};

/**
 * Closing-block backdrop: twinkling stars over the 3D earth (lazy-loaded once
 * the section is near and WebGL works). No photo fallback: the earth fades in
 * once its first frame is ready; without WebGL only the stars show.
 *
 * Placed directly in a section, it fills it as before. Placed in a wrapper that
 * also holds the site footer (the glass-footer layout), it spans both: it finds
 * the sibling footer, measures it, and anchors the arc to the footer's top
 * border — so the globe's lower half runs on behind the glass.
 */
export function EarthBlock() {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { margin: "900px", once: true });
  const webgl = useSyncExternalStore(noSubscribe, hasWebGL, () => false);
  const [ready, setReady] = useState(false);

  // Height of the sibling footer (0 without one): the arc's anchor line.
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const footer = ref.current?.parentElement?.querySelector(":scope > footer");
    if (!footer) return;
    const measure = () => setInset(footer.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  // The whole backdrop rises a little as the section scrolls into view (parallax
  // under the fixed top fade). Scroll-driven values bypass MotionConfig, so
  // reduced motion is handled here directly.
  const still = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const rise = useTransform(scrollYProgress, [0, 0.65], [72, 0]);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" style={{ maskImage: FADE, WebkitMaskImage: FADE }}>
      <motion.div className="absolute inset-0" style={{ y: still ? 0 : rise }}>
        {/* A faint deep-blue glow across the band behind the glass footer, so the
            glass has something to frost and never reads as solid black. */}
        {inset > 0 && (
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ height: inset + 80, background: "radial-gradient(130% 150% at 50% 0%, rgba(44, 76, 148, 0.3), rgba(14, 24, 52, 0.14) 45%, transparent 78%)" }}
          />
        )}
        {near && webgl && (
          <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.9, delay: 0.3 }}>
            <EarthScene bottomInset={inset} onReady={() => setReady(true)} />
          </motion.div>
        )}
        {/* Stars live in the sky above the footer line, never behind the glass. */}
        <div className="absolute inset-x-0 top-0" style={{ bottom: inset }}>
          {STARS.map((star, i) => (
            <span
              key={i}
              className="pf-twinkle absolute rounded-full"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                background: star.color,
                opacity: star.alpha,
                boxShadow: star.size >= 2.5 ? `0 0 ${star.size * 2.5}px ${star.color}` : undefined,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
