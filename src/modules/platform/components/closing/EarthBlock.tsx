"use client";

import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
// The star twinkle lives in the platform stylesheet; load it wherever the earth is used.
import "../../platform.css";
import { horizonStars } from "./horizonStars";

const EarthScene = dynamic(() => import("./EarthScene"), { ssr: false });

/** Top fade only: the earth must run unmasked down to the section's bottom edge (the footer's top border). */
const FADE = "linear-gradient(to bottom, transparent, black 24%)";

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
        {/* Keep the horizon above the glass footer in the same tones as the page. */}
        {inset > 0 && (
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ height: inset + 80, background: "radial-gradient(130% 150% at 50% 0%, color-mix(in srgb, var(--afvar-oxblood) 65%, transparent), color-mix(in srgb, var(--afvar-forest) 40%, transparent) 45%, transparent 78%)" }}
          />
        )}
        {near && webgl && (
          <motion.div className="absolute inset-0" data-earth-world="" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.9, delay: 0.3 }}>
            <EarthScene bottomInset={inset} onReady={() => setReady(true)} />
          </motion.div>
        )}
        {/* Stars live in the sky above the footer line, never behind the glass. */}
        <div className="absolute inset-x-0 top-0" style={{ bottom: inset }}>
          {horizonStars.map((star, i) => (
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
