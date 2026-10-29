"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

const EASE = [0.37, 0, 0.63, 1] as const;

/** Deterministic candle field (same on server and client). */
const CANDLES = Array.from({ length: 34 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return Math.round((x - Math.floor(x)) * 1000) / 1000;
  };
  return { x: Math.round(r(1) * 1000) / 10, y: Math.round(r(2) * 1000) / 10, h: 14 + Math.round(r(3) * 34), up: r(4) > 0.42, o: 0.25 + r(5) * 0.5 };
});

/**
 * Living backdrop for the Resources pages, so the page is never a flat black:
 * green and red market glows that drift, trade places and brighten as the
 * reader scrolls, over a faint candle field with parallax.
 * Sticky inside a clip box that spans the page content, so it stays in view
 * while scrolling but never paints over the footer. Reduced motion: still.
 */
export function Ambience() {
  const still = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll();
  const p = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.6 });

  const greenX = useTransform(p, [0, 0.5, 1], ["-8%", "18%", "-4%"]);
  const greenY = useTransform(p, [0, 1], ["-6%", "38%"]);
  const greenO = useTransform(p, [0, 0.35, 0.7, 1], [0.95, 0.6, 0.85, 0.7]);
  const redX = useTransform(p, [0, 0.5, 1], ["10%", "-16%", "6%"]);
  const redY = useTransform(p, [0, 1], ["30%", "-10%"]);
  const redO = useTransform(p, [0, 0.35, 0.7, 1], [0.45, 0.85, 0.55, 0.8]);
  const fieldY = useTransform(p, [0, 1], ["0%", "-22%"]);
  const sweep = useTransform(p, [0, 1], ["-30%", "130%"]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-clip">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* lifted base so the page reads as deep graphite, not void */}
        <div className="absolute inset-0 bg-[radial-gradient(140%_90%_at_50%_0%,#0e1214_0%,#07090a_55%,#050607_100%)]" />

        {/* market glows */}
        <motion.div className="absolute -left-[10%] top-0 h-[75vh] w-[70vw] rounded-full blur-[90px]" style={still ? { opacity: 0.8 } : { x: greenX, y: greenY, opacity: greenO }}>
          <motion.div
            className="h-full w-full rounded-full bg-[radial-gradient(closest-side,rgba(0,230,118,0.20),rgba(0,230,118,0.06)_55%,transparent)]"
            animate={still ? undefined : { scale: [1, 1.12, 1], rotate: [0, 8, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: EASE }}
          />
        </motion.div>
        <motion.div className="absolute -right-[12%] top-[20%] h-[70vh] w-[62vw] rounded-full blur-[100px]" style={still ? { opacity: 0.6 } : { x: redX, y: redY, opacity: redO }}>
          <motion.div
            className="h-full w-full rounded-full bg-[radial-gradient(closest-side,rgba(255,59,59,0.16),rgba(255,59,59,0.05)_55%,transparent)]"
            animate={still ? undefined : { scale: [1.08, 0.96, 1.08], rotate: [0, -10, 0] }}
            transition={{ duration: 19, repeat: Infinity, ease: EASE }}
          />
        </motion.div>

        {/* faint candle field, parallax */}
        <motion.div className="absolute inset-x-0 -bottom-[30%] top-0" style={still ? undefined : { y: fieldY }}>
          {CANDLES.map((c, i) => (
            <span key={i} className="absolute w-[5px]" style={{ left: `${c.x}%`, top: `${c.y}%`, height: c.h, opacity: c.o * 0.16 }}>
              <span className="absolute inset-y-[-6px] left-[2px] w-px" style={{ background: c.up ? "#00E676" : "#FF3B3B" }} />
              <span className="absolute inset-0 rounded-[1px]" style={{ background: c.up ? "#00E676" : "#FF3B3B" }} />
            </span>
          ))}
        </motion.div>


        {/* a soft band of light that crosses as the page scrolls */}
        {!still && (
          <motion.div
            className="absolute inset-y-0 w-[40vw] bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.025),transparent)]"
            style={{ left: sweep }}
          />
        )}

        {/* fine grid for depth */}
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_50%_40%,black,transparent_75%)]" />
      </div>
    </div>
  );
}
