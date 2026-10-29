"use client";

import { animate, motion, transform, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BearArt, BeastStyles } from "./beastArt";
import { usePauseOffscreen } from "./bits";
import { haptic, playSfx } from "./sfx";

const HIT = 0.8;
const CLAWS = [0, 1, 2] as const;

function reducedNow() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Bear moment (theatrical, not a market claim): a faceted-metal bear rises from
 * below the target's bottom edge on its right, scroll-linked
 * (`["start end", "center center"]` of the target):
 *   .30 → .60 rises, .60 → .76 raises the paw,
 *   .80       growl → ~170ms later the paw rakes DOWN: the target dips
 *             (+6px, slight rotate) and three red claw streaks draw then fade,
 *   +1s       the bear sinks back below the edge.
 * Re-arms after scrolling back out. Reduced motion: risen, static, silent.
 */
export function BearSwipe({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = usePauseOffscreen<HTMLDivElement>();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start end", "center center"] });
  const forced = useMotionValue(0);
  const p = useTransform<number, number>([scrollYProgress, forced], ([s, f]) => (f ? 1 : s));

  const swipe = useMotionValue(0);
  const sink = useMotionValue(0);
  const ty = useMotionValue(0);
  const tr = useMotionValue(0);
  const [burst, setBurst] = useState(0);
  const armed = useRef(true);
  const last = useRef<number | null>(null);
  const timers = useRef<number[]>([]);

  const y = useTransform<number, string>([p, sink], ([v, s]) => `${Math.max(transform(v, [0.3, 0.6], [104, 0]), s * 104)}%`);
  const paw = useTransform<number, number>([p, swipe], ([v, s]) => transform(v, [0.6, 0.76], [0, -30]) + s * 92);
  const head = useTransform<number, number>([p, swipe], ([v, s]) => transform(v, [0.4, 0.7], [-8, 3]) + s * 9);

  useEffect(() => {
    forced.set(reduce ? 1 : 0);
  }, [reduce, forced]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);

  const fire = () => {
    playSfx("growl");
    animate(swipe, [0, -0.28, 1], { duration: 0.34, times: [0, 0.5, 1], ease: ["easeOut", [0.5, 0, 0.9, 0.5]] });
    timers.current.push(
      window.setTimeout(() => {
        playSfx("swipe");
        haptic(20);
        setBurst((b) => b + 1);
        const k = { duration: 0.5, ease: "easeOut" as const };
        animate(ty, [0, 6, -1.5, 0.5, 0], k);
        animate(tr, [0, 1.3, -0.4, 0], k);
      }, 230),
      window.setTimeout(() => {
        animate(sink, 1, { duration: 0.8, ease: [0.5, 0, 0.75, 0] });
      }, 1250),
    );
  };

  useMotionValueEvent(p, "change", (v) => {
    const prev = last.current;
    last.current = v;
    if (reduce || reducedNow()) return;
    if (v < 0.2) {
      armed.current = true;
      swipe.set(0);
      sink.set(0);
      return;
    }
    if (prev === null) {
      // Mounted already past the moment (reload / symbol switch): stay hidden.
      if (v >= HIT) {
        armed.current = false;
        sink.set(1);
      }
      return;
    }
    if (armed.current && prev < HIT && v >= HIT) {
      armed.current = false;
      fire();
    }
  });

  return (
    <div ref={rootRef} data-bx-bear="" className="relative w-fit max-w-full">
      <BeastStyles />
      <motion.div className="relative" style={{ y: ty, rotate: tr, transformOrigin: "0% 100%" }}>
        {children}
      </motion.div>
      <div aria-hidden="true" className="pointer-events-none absolute right-[2%] top-[-6px] h-[calc(100%+12px)] w-[110px]">
        {burst > 0 &&
          CLAWS.map((i) => (
            <span
              key={`${burst}-${i}`}
              className="bx-claw"
              style={{ left: 58 + i * 15, top: 0 + i * 2, ["--r" as string]: "121deg", ["--w" as string]: `${66 - i * 4}px`, ["--d" as string]: `${i * 0.045}s` }}
            />
          ))}
      </div>
      <div ref={stageRef} aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 right-[-88px] top-[-66px] overflow-clip sm:right-[-168px] sm:top-[-178px]">
        <motion.div className="absolute bottom-0 right-0 w-[96px] sm:w-[196px]" style={{ y }}>
          <div style={{ transform: "scaleX(-1)" }}>
            <BearArt head={head} paw={paw} burst={burst} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
