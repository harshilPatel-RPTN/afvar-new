"use client";

import { animate, motion, transform, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BearArt, BeastStyles, BullArt } from "./beastArt";
import { usePauseOffscreen } from "./bits";
import { playSfx } from "./sfx";

const MEET = 0.78;
const SPARKS = [-150, -105, -60, -20, 25, 70, 115, 160] as const;

function reducedNow() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Footer-top strip: bull (left, green rim) and bear (right, red rim) close in as
 * the footer scrolls up (`["start end", "center .62"]`), meet at .78 with a small
 * white spark + impact, then shove back and forth once over a green/red balance
 * line — no winner, no label. Reduced motion: met, static, silent.
 */
export function BullBearFaceoff() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pauseRef = usePauseOffscreen<HTMLDivElement>();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start end", "center 0.62"] });
  const forced = useMotionValue(0);
  const p = useTransform<number, number>([scrollYProgress, forced], ([s, f]) => (f ? 1 : s));
  const push = useMotionValue(0);
  const [burst, setBurst] = useState(0);
  const armed = useRef(true);
  const last = useRef<number | null>(null);

  const bullX = useTransform<number, number>([p, push], ([v, s]) => transform(v, [0, 0.75], [-300, -2]) + s);
  const bearX = useTransform<number, number>([p, push], ([v, s]) => transform(v, [0, 0.75], [300, 2]) + s);
  const bullHead = useTransform<number, number>([p, push], ([v, s]) => transform(v, [0.3, 0.72], [0, 16]) + s * 0.5);
  const bearHead = useTransform<number, number>([p, push], ([v, s]) => transform(v, [0.3, 0.72], [-6, 4]) - s * 0.5);
  const bearPaw = useTransform<number, number>([p, push], ([v, s]) => transform(v, [0.4, 0.72], [-34, 4]) - s * 1.2);

  useEffect(() => {
    forced.set(reduce ? 1 : 0);
  }, [reduce, forced]);

  useMotionValueEvent(p, "change", (v) => {
    const prev = last.current;
    last.current = v;
    if (v < 0.05) {
      armed.current = true;
      return;
    }
    if (prev === null || reduce || reducedNow()) {
      if (v >= MEET) armed.current = false;
      return;
    }
    if (armed.current && prev < MEET && v >= MEET) {
      armed.current = false;
      setBurst((b) => b + 1);
      playSfx("impact");
      animate(push, [0, 11, -13, 7, -3, 0], { duration: 1.4, ease: "easeInOut" });
    }
  });

  return (
    <div ref={rootRef} data-bx-faceoff="" aria-hidden="true" className="pointer-events-none relative -mt-2 mb-8 h-[112px] overflow-clip sm:h-[128px]">
      <BeastStyles />
      <div ref={pauseRef} className="absolute inset-0">
        {/* green | red balance line — the split rides the shove */}
        <div className="absolute inset-x-0 bottom-[14px] h-px overflow-clip [mask-image:linear-gradient(90deg,transparent,#000_22%,#000_78%,transparent)]">
          <motion.div
            className="absolute inset-y-0 left-[-50%] w-[200%] bg-[linear-gradient(90deg,#00A85A,#00E676_49.9%,#FF3B3B_50.1%,#FF3B3B)]"
            style={{ x: push }}
          />
        </div>
        <motion.div className="absolute bottom-[12px] right-1/2 w-[112px] sm:w-[132px]" style={{ x: bullX }}>
          <BullArt head={bullHead} />
        </motion.div>
        <motion.div className="absolute bottom-[12px] left-1/2 w-[100px] sm:w-[116px]" style={{ x: bearX }}>
          <div style={{ transform: "scaleX(-1)" }}>
            <BearArt head={bearHead} paw={bearPaw} />
          </div>
        </motion.div>
        {burst > 0 && (
          <div key={burst} className="absolute left-1/2 bottom-[52px] sm:bottom-[60px]">
            <span className="bx-flash" />
            {SPARKS.map((r, i) => (
              <span
                key={r}
                className="bx-spark"
                style={{ background: i % 2 ? "#FF6464" : "#00E676", ["--r" as string]: `${r}deg`, ["--d" as string]: `${(i % 3) * 0.03}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
