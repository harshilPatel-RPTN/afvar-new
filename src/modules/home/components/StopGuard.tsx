"use client";

// Phase 5 delight — the stop-loss guard for capability card 04 ("Review your trading").
// A small low-poly "faceted metal" sentinel in the beastArt style (graphite facets
// #14181b–#3b454b, thin green rim light, glowing visor slit) that steps in from the
// right when the Crypto exposure bar crosses the dashed limit and raises its shield
// in a "stop" pose. It only WARNS — it never reaches for the (disabled) Close
// position control. Drawn facing LEFT (toward the bar). Variant-driven from the
// card grid (hidden → visible); transform/opacity only; aria-hidden decoration.
// Reduced motion: zero-duration → the guard simply stands in the stop pose.
import { motion, type Variants } from "framer-motion";
import { playSfx } from "./sfx";

const UP = "#00E676";
const EASE = [0.16, 1, 0.3, 1] as const;

function v(reduce: boolean | null, hidden: Record<string, unknown>, visible: Record<string, unknown>, delay: number, duration: number, extra: Record<string, unknown> = {}): Variants {
  return { hidden, visible: { ...visible, transition: reduce ? { duration: 0 } : { duration, delay, ease: EASE, ...extra } } } as Variants;
}

/** Body (legs, torso, helmet) — static facets. viewBox 0 0 36 48. */
function GuardBody() {
  return (
    <svg viewBox="0 0 36 48" className="absolute inset-0 h-full w-full overflow-visible">
      {/* back arm (behind torso) */}
      <polygon points="23,19 27,21 27,31 24,32" fill="#14181b" />
      {/* legs */}
      <polygon points="13,33 18,33 17.5,45 13,45" fill="#1d2327" />
      <polygon points="19,33 24,33 24.5,45 20,45" fill="#14181b" />
      <polygon points="11.5,45 18,45 18,47.5 11,47.5" fill="#2a3237" />
      <polygon points="19.5,45 26,45 26.5,47.5 19.5,47.5" fill="#1d2327" />
      {/* torso: chest plate facets */}
      <polygon points="11,18 25,18 24,33 12,33" fill="#1d2327" />
      <polygon points="11,18 18,18 17,26 12,25" fill="#3b454b" />
      <polygon points="18,18 25,18 24,26 17,26" fill="#2a3237" />
      <polygon points="12,25 17,26 18,33 12,33" fill="#2a3237" />
      <polygon points="17,26 24,26 24,33 18,33" fill="#14181b" />
      {/* belt */}
      <polygon points="11.8,31 24.2,31 24,33.2 12,33.2" fill="#3b454b" />
      {/* neck + helmet (low-poly dome with a crest) */}
      <polygon points="15,16 21,16 21,18.5 15,18.5" fill="#14181b" />
      <polygon points="10,10 13,4 19,2 25,5 26,11 25,16 11,16" fill="#2a3237" />
      <polygon points="13,4 19,2 18,8 12,9" fill="#3b454b" />
      <polygon points="19,2 25,5 24,10 18,8" fill="#1d2327" />
      <polygon points="10,10 12,9 13,16 11,16" fill="#1d2327" />
      {/* crest */}
      <polygon points="17,2.4 21,1 24,2.6 19,3.4" fill="#3b454b" />
      {/* visor slit (faces left) — green glow */}
      <polygon points="10.4,10.3 15.5,9.9 15.5,11.2 10.7,11.6" fill={UP} />
      <polygon points="10.4,10.3 12.6,10.1 12.8,11.4 10.7,11.6" fill="#B8FFD9" opacity={0.8} />
      {/* rim light on the back edges (light from behind / right) */}
      <polyline points="19,2 25,5 26,11 25,16" fill="none" stroke={UP} strokeWidth={0.7} strokeOpacity={0.85} strokeLinejoin="round" />
      <polyline points="25,18 24,33" fill="none" stroke={UP} strokeWidth={0.7} strokeOpacity={0.7} />
      <polyline points="24,33 24.5,45 26.5,47.5" fill="none" stroke={UP} strokeWidth={0.6} strokeOpacity={0.55} strokeLinejoin="round" />
    </svg>
  );
}

/** Front arm + shield — rotates up around the shoulder into the "stop" pose. */
function GuardShield() {
  return (
    <svg viewBox="0 0 36 48" className="absolute inset-0 h-full w-full overflow-visible">
      {/* arm: shoulder (13,20) out to the hand at the shield */}
      <polygon points="11,19 15,20 9,24 6.5,22" fill="#2a3237" />
      {/* shield: faceted hexagon held up in front */}
      <polygon points="0.5,12 6,9.5 10.5,12 10.5,22 6,26.5 0.5,22" fill="#1d2327" />
      <polygon points="0.5,12 6,9.5 6,18 0.5,17" fill="#3b454b" />
      <polygon points="6,9.5 10.5,12 10.5,17 6,18" fill="#2a3237" />
      <polygon points="0.5,17 6,18 6,26.5 0.5,22" fill="#2a3237" />
      <polygon points="6,18 10.5,17 10.5,22 6,26.5" fill="#14181b" />
      {/* green rim + boss */}
      <polygon points="0.5,12 6,9.5 10.5,12 10.5,22 6,26.5 0.5,22" fill="none" stroke={UP} strokeWidth={0.8} strokeOpacity={0.9} strokeLinejoin="round" />
      <rect x={4.6} y={16.2} width={2.8} height={2.8} transform="rotate(45 6 17.6)" fill={UP} opacity={0.85} />
    </svg>
  );
}

/** The guard. `at` = seconds after the grid turns visible (the moment Crypto passes the limit);
 *  `left` = CSS left of its box (its shield lands on the over-limit bar's tip). */
export function StopGuard({ at, reduce, left }: { at: number; reduce: boolean | null; left: string }) {
  return (
    <motion.div
      aria-hidden="true"
      data-stop-guard=""
      className="pointer-events-none absolute -bottom-[9px] z-[2] h-[60px] w-[45px]"
      style={{ left }}
      variants={v(reduce, { x: 64, opacity: 0 }, { x: [64, 0], opacity: [0, 1] }, at, 0.5)}
    >
      {/* a tiny marching bob while stepping in, then planted */}
      <motion.div className="absolute inset-0" variants={v(reduce, { y: 0 }, { y: [0, -2, 0, -2, 0] }, at, 0.5, { ease: "easeInOut" })}>
        <GuardBody />
        <motion.div
          data-stop-shield=""
          className="absolute inset-0"
          style={{ transformOrigin: "36% 42%" }}
          variants={v(reduce, { rotate: -70 }, { rotate: [-70, 8, 0] }, at + 0.42, 0.42, { times: [0, 0.6, 1] })}
          onAnimationComplete={(definition) => {
            if (definition === "visible") playSfx("tick");
          }}
        >
          <GuardShield />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
