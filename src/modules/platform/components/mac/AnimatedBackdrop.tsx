"use client";

// Living hero backdrops (drop-in for Backdrop, same framing props): the page's
// own artwork set in motion. Three effects, each built from the physics the
// image implies — layered copies, light and depth, never a generic wobble:
//   silk          — light travels across the silk waves; the weave breathes
//   aurora        — a counter-drifting interference layer makes the ribbons shimmer
//   constellation — bokeh depth layers drift and nodes pulse like live signals
// Scroll gives every variant gentle parallax; the pointer steers a soft key
// light (mouse only). Reduced motion renders the still image, nothing else.
import Image from "next/image";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef } from "react";

export type BackdropEffect = "silk" | "aurora" | "constellation";
export type BackdropTint = "warm" | "cool" | "market";

const TINT = {
  warm: { light: "185,246,202", star: "#ffffff" },
  cool: { light: "150,230,255", star: "#dff6ff" },
  market: { light: "0,230,118", star: "#e6fff2" },
} as const;

const EASE_SOFT = [0.37, 0, 0.63, 1] as const;

/** Deterministic pseudo-randoms (same on server and client — EarthBlock's trick). */
function seeded(count: number, salt: number) {
  return Array.from({ length: count }, (_, i) => {
    const r = (n: number) => {
      const x = Math.sin(i * 12.9898 + n * 78.233 + salt * 37.719) * 43758.5453;
      return Math.round((x - Math.floor(x)) * 1000) / 1000;
    };
    return { a: r(1), b: r(2), c: r(3), d: r(4), e: r(5) };
  });
}

const BOKEH_FAR = seeded(8, 1);
const BOKEH_NEAR = seeded(6, 2);
const PULSES = seeded(5, 3);
const STARS = seeded(14, 4);

export function AnimatedBackdrop({
  src,
  effect,
  className = "absolute inset-0",
  fade = "linear-gradient(to bottom, transparent, black 20%, black 70%, transparent)",
  opacity = 0.6,
  position = "center",
  priority = false,
  tint = "warm",
  natural = false,
}: {
  src: string;
  effect: BackdropEffect;
  className?: string;
  fade?: string;
  opacity?: number;
  position?: string;
  priority?: boolean;
  tint?: BackdropTint;
  /** Keep the artwork's own colours — opts out of the site shell's green recolour of backdrop images. */
  natural?: boolean;
}) {
  const still = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);

  // Scroll parallax: the scenery falls behind the copy as the page scrolls.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  // Pointer-steered key light, heavily smoothed so it reads as light, not a cursor.
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.35);
  const lightX = useSpring(pointerX, { stiffness: 28, damping: 16 });
  const lightY = useSpring(pointerY, { stiffness: 28, damping: 16 });
  const lightLeft = useTransform(lightX, (v) => `${v * 100}%`);
  const lightTop = useTransform(lightY, (v) => `${v * 100}%`);
  const keyLight = useMotionTemplate`radial-gradient(50% 40% at ${lightLeft} ${lightTop}, rgba(${TINT[tint].light},0.24), transparent 70%)`;
  // Depth layers lean a little toward the light.
  const leanFar = useTransform(lightX, [0, 1], [8, -8]);
  const leanNear = useTransform(lightX, [0, 1], [20, -20]);

  useEffect(() => {
    if (still) return;
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerX.set(event.clientX / window.innerWidth);
      pointerY.set(Math.min(1, event.clientY / window.innerHeight));
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => window.removeEventListener("pointermove", onPointer);
  }, [still, pointerX, pointerY]);

  return (
    <div ref={ref} aria-hidden="true" className={`pf-animated-backdrop pointer-events-none -z-10 overflow-hidden ${className}`} style={{ maskImage: fade, WebkitMaskImage: fade, opacity }}>
      {/* Base plate: the page's own image, slow Ken Burns + scroll parallax. */}
      <motion.div className="absolute inset-0" style={still ? undefined : { y: parallaxY, scale: parallaxScale }}>
        <motion.div
          className="absolute inset-0"
          animate={still ? undefined : { scale: [1.06, 1.16, 1.06], x: ["0%", "-2.2%", "0%"], y: ["0%", "1.2%", "0%"] }}
          transition={{ duration: 34, repeat: Infinity, ease: EASE_SOFT }}
        >
          <Image src={src} alt="" fill sizes="100vw" priority={priority} className="object-cover" style={{ objectPosition: position, ...(natural ? { filter: "none" } : null) }} />
        </motion.div>

        {effect === "aurora" && <AuroraLayers src={src} position={position} still={still} lean={leanFar} star={TINT[tint].star} natural={natural} />}
        {effect === "silk" && <SilkLight still={still} />}
        {effect === "constellation" && <ConstellationDepth still={still} leanFar={leanFar} leanNear={leanNear} />}
      </motion.div>

      {/* Pointer key light over everything, under the fade mask. */}
      {!still && <motion.div className="absolute inset-0" style={{ background: keyLight, mixBlendMode: "screen" }} />}
    </div>
  );
}

/* ------------------------------------------------------------------ silk */

/** Two light bands travel the silk at different periods, so the sweep never
 *  reads as a loop; a slow counter-breath in the shadows keeps the folds alive. */
function SilkLight({ still }: { still: boolean }) {
  if (still) return null;
  return (
    <>
      {[
        { duration: 15, delay: 0, width: "34%", tilt: "-14deg", peak: 0.7 },
        { duration: 25, delay: 5.5, width: "52%", tilt: "-10deg", peak: 0.45 },
        { duration: 10, delay: 2.5, width: "22%", tilt: "-18deg", peak: 0.38 },
      ].map((band) => (
        <motion.div
          key={band.duration}
          className="absolute inset-y-[-20%]"
          style={{
            width: band.width,
            rotate: band.tilt,
            mixBlendMode: "soft-light",
            background: "linear-gradient(90deg, transparent, rgba(205,255,225,0.9) 50%, transparent)",
          }}
          initial={{ left: "-60%", opacity: 0 }}
          animate={{ left: ["-60%", "120%"], opacity: [0, band.peak, band.peak, 0] }}
          transition={{ duration: band.duration, delay: band.delay, repeat: Infinity, repeatDelay: 2, ease: [0.3, 0, 0.5, 1], times: [0, 0.25, 0.75, 1] }}
        />
      ))}
      {/* the fabric itself breathes against the light */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(70% 55% at 30% 70%, rgba(0,0,0,0.35), transparent 70%)" }}
        animate={{ opacity: [0.6, 0.08, 0.6] }}
        transition={{ duration: 15, repeat: Infinity, ease: EASE_SOFT }}
      />
    </>
  );
}

/* ---------------------------------------------------------------- aurora */

/** A second copy of the artwork, enlarged, screen-blended and counter-drifting:
 *  the two prints interfere exactly the way aurora curtains shimmer. */
function AuroraLayers({ src, position, still, lean, star, natural }: { src: string; position: string; still: boolean; lean: MotionValue<number>; star: string; natural: boolean }) {
  return (
    <>
      <motion.div className="absolute inset-0" style={still ? undefined : { x: lean }}>
        <motion.div
          className="absolute inset-[-6%]"
          style={{ mixBlendMode: "screen", opacity: 0.58 }}
          animate={still ? undefined : { x: ["-4.5%", "4.5%", "-4.5%"], y: ["2.6%", "-2.6%", "2.6%"], scale: [1.1, 1.24, 1.1] }}
          transition={{ duration: 23, repeat: Infinity, ease: EASE_SOFT }}
        >
          <Image src={src} alt="" fill sizes="100vw" className="object-cover" style={{ objectPosition: position, ...(natural ? { filter: "none" } : null) }} />
        </motion.div>
      </motion.div>
      {/* the sky breathes: a broad darkness that thins as the curtains brighten */}
      <motion.div
        className="absolute inset-0 bg-black"
        animate={still ? { opacity: 0.18 } : { opacity: [0.4, 0.04, 0.3, 0.4] }}
        transition={{ duration: 18, repeat: Infinity, ease: EASE_SOFT }}
      />
      {STARS.map((dot, index) => (
        <span
          key={index}
          className="pf-twinkle absolute rounded-full"
          style={{
            background: star,
            left: `${dot.a * 100}%`,
            top: `${dot.b * 46}%`,
            width: dot.c < 0.85 ? 1.5 : 2.5,
            height: dot.c < 0.85 ? 1.5 : 2.5,
            animationDelay: `${dot.d * 6}s`,
            animationDuration: `${2.5 + dot.e * 4}s`,
          }}
        />
      ))}
    </>
  );
}

/* --------------------------------------------------------- constellation */

/** Out-of-focus lights on two depth planes, drifting like dust in an updraft,
 *  while network nodes pulse — the image's own bokeh, set in motion. */
function ConstellationDepth({ still, leanFar, leanNear }: { still: boolean; leanFar: MotionValue<number>; leanNear: MotionValue<number> }) {
  if (still) return null;
  const layer = (dots: ReturnType<typeof seeded>, lean: MotionValue<number>, size: [number, number], blur: number, drift: number) => (
    <motion.div className="absolute inset-0" style={{ x: lean }}>
      {dots.map((dot, index) => {
        const diameter = size[0] + dot.c * (size[1] - size[0]);
        const gold = dot.e < 0.72;
        return (
          <motion.span
            key={index}
            className="absolute rounded-full"
            style={{
              left: `${8 + dot.a * 84}%`,
              top: `${10 + dot.b * 70}%`,
              width: diameter,
              height: diameter,
              filter: `blur(${blur}px)`,
              background: gold ? "rgba(0,230,118,0.5)" : "rgba(105,240,174,0.4)",
            }}
            animate={{ y: [0, -drift * (0.6 + dot.d), 0], opacity: [0.15, 0.5 + dot.c * 0.3, 0.15] }}
            transition={{ duration: 14 + dot.d * 14, delay: -dot.a * 20, repeat: Infinity, ease: EASE_SOFT }}
          />
        );
      })}
    </motion.div>
  );
  return (
    <>
      {layer(BOKEH_FAR, leanFar, [5, 12], 3, 26)}
      {layer(BOKEH_NEAR, leanNear, [14, 30], 7, 44)}
      {/* nodes answering: soft rings bloom at fixed points, staggered forever */}
      {PULSES.map((pulse, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full border border-(--accent)/60"
          style={{ left: `${12 + pulse.a * 76}%`, top: `${16 + pulse.b * 56}%`, width: 10, height: 10, boxShadow: "0 0 18px rgba(0,230,118,0.5)" }}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: [0.4, 3.4 + pulse.c * 2], opacity: [0, 0.7, 0] }}
          transition={{ duration: 3.4, delay: pulse.d * 4, repeat: Infinity, repeatDelay: 3.5 + pulse.e * 5, ease: "easeOut", times: [0, 0.25, 1] }}
        />
      ))}
    </>
  );
}
