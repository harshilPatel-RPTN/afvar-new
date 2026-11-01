"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Timing of the wordmark loop, in seconds. */
const LETTER_STAGGER = 0.16;
const CYCLE = 7;
/** Points in each letter's cycle: in · arrived · start leaving · gone · (rest until the next cycle). */
// Short gone gap: ~0.5 s to drift away, ~0.35 s rest before the letter returns.
const CYCLE_TIMES = [0, 0.08, 0.88, 0.95, 1];
/** Aurora palette the glow flows through, letter after letter. */
const AURORA = ["#F2F5F2", "#A8DEC2", "#EAD1C7", "#B9E6CC", "#F2F5F2"];
const auroraGlow = (hex: string) => `0 0 16px ${hex}cc, 0 0 2px ${hex}`;

/**
 * The brand name as a continuous loop. Letters arrive one by one (flip up out
 * of a blur and spring into place), float in a gentle wave while an aurora
 * glow flows across them, then drift away one by one and arrive again.
 *
 * Each letter carries its own colour: a gradient clipped on the wrapper would
 * paint every letter at once and hide the entrance.
 */
export function AnimatedWordmark({ text, delay = 0, className = "" }: { text: string; delay?: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  const letters = [...text];

  if (reduceMotion) {
    return <span className={`inline-flex text-white ${className}`}>{text}</span>;
  }

  return (
    // `role="img"` lets the label name the word (letters are aria-hidden).
    <span role="img" aria-label={text} className={`inline-flex [perspective:500px] ${className}`}>
      {letters.map((letter, index) => {
        const start = delay + index * LETTER_STAGGER;
        const loop = { duration: CYCLE, times: CYCLE_TIMES, delay: start, repeat: Infinity, ease: "easeInOut" } as const;
        return (
          // Outer layer: the arrive / leave loop, staggered so letters come and go one by one.
          <motion.span
            key={index}
            aria-hidden="true"
            className="inline-block origin-bottom"
            initial={{ opacity: 0, y: 22, scale: 0.4, rotateX: -80, filter: "blur(8px)" }}
            animate={{
              opacity: [0, 1, 1, 0, 0],
              y: [22, 0, 0, -18, -18],
              scale: [0.4, 1, 1, 1.15, 1.15],
              rotateX: [-80, 0, 0, 45, 45],
              filter: ["blur(8px)", "blur(0px)", "blur(0px)", "blur(10px)", "blur(10px)"],
            }}
            transition={loop}
          >
            {/* Inner layer: always-on wave and aurora glow, phase-shifted per letter. */}
            <motion.span
              className="inline-block"
              initial={{ y: 0, color: AURORA[0], textShadow: auroraGlow(AURORA[0]) }}
              animate={{ y: [0, -4, 0, 2, 0], color: AURORA, textShadow: AURORA.map(auroraGlow) }}
              transition={{
                y: { duration: 2.6, delay: index * 0.18, repeat: Infinity, ease: "easeInOut" },
                color: { duration: 5, delay: index * 0.35, repeat: Infinity, ease: "easeInOut" },
                textShadow: { duration: 5, delay: index * 0.35, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              {letter}
            </motion.span>
          </motion.span>
        );
      })}
    </span>
  );
}

