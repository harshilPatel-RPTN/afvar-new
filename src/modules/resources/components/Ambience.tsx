"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useAfvarReducedMotion } from "@/modules/afvarOs";

/** Deterministic candle field (same on server and client). */
const CANDLES = Array.from({ length: 34 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return Math.round((x - Math.floor(x)) * 1000) / 1000;
  };
  return { x: Math.round(r(1) * 1000) / 10, y: Math.round(r(2) * 1000) / 10, h: 14 + Math.round(r(3) * 34), up: r(4) > 0.42, o: 0.25 + r(5) * 0.5 };
});

/**
 * A faint candle field and scroll-linked reflection over the site's shared backdrop.
 * Sticky inside a clip box that spans the page content, so it stays in view
 * while scrolling but never paints over the footer. Reduced motion: still.
 */
export function Ambience() {
  const still = useAfvarReducedMotion();
  const { scrollYProgress } = useScroll();
  const p = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.6 });

  const fieldY = useTransform(p, [0, 1], ["0%", "-22%"]);
  const sweep = useTransform(p, [0, 1], ["-30%", "130%"]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-clip">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* faint candle field, parallax */}
        <motion.div className="absolute inset-x-0 -bottom-[30%] top-0" style={still ? undefined : { y: fieldY }}>
          {CANDLES.map((c, i) => (
            <span key={i} className="absolute w-[5px]" style={{ left: `${c.x}%`, top: `${c.y}%`, height: c.h, opacity: c.o * 0.16 }}>
              <span className="absolute inset-y-[-6px] left-[2px] w-px" style={{ background: c.up ? "var(--positive)" : "var(--negative)" }} />
              <span className="absolute inset-0 rounded-[1px]" style={{ background: c.up ? "var(--positive)" : "var(--negative)" }} />
            </span>
          ))}
        </motion.div>

        {/* a soft band of light that crosses as the page scrolls */}
        {!still && (
          <motion.div
            className="absolute inset-y-0 w-[40vw] motion-reduce:hidden bg-[linear-gradient(100deg,transparent,rgba(168,222,194,0.018),transparent)]"
            style={{ left: sweep }}
          />
        )}

        {/* fine grid for depth */}
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_50%_40%,black,transparent_75%)]" />
      </div>
    </div>
  );
}
