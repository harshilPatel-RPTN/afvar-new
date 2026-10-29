"use client";

import { animate, motion, transform, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BeastStyles, BullArt } from "./beastArt";
import { usePauseOffscreen } from "./bits";
import { haptic, playSfx } from "./sfx";

/** Scroll progress at which the bull charges (one-shot, re-armed on full exit). */
const HIT = 0.78;

function reducedNow() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Bull moment: a faceted-metal bull slides in beside a heading as it scrolls up
 * (`["start end", "center center"]` of the heading):
 *   0 → .60  slide in from the `side`, gait bob, hoof dust
 *   .60 → .75 lowers its head, paws the ground once
 *   .78      CHARGE — snort + nostril steam + eye flare, ~120ms later the horns
 *            hit: the heading is knocked (shove, squash, letters jump UP) and
 *            springs back with a damped wobble; then the bull settles and breathes.
 * Reverse scroll retreats along the same path; the charge re-arms once the bull
 * has fully left. Reduced motion: settled pose, no impact, no sound.
 * The heading itself stays real HTML — it is only wrapped in a motion element.
 */
export function BullCharge({ side, children }: { side: "left" | "right"; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = usePauseOffscreen<HTMLDivElement>();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start end", "center center"] });
  const forced = useMotionValue(0);
  const p = useTransform<number, number>([scrollYProgress, forced], ([s, f]) => (f ? 1 : s));

  const charge = useMotionValue(0); // 0 rest · 1 full thrust · .3 settled
  const toss = useMotionValue(0); // head hook: + = toss up
  const kx = useMotionValue(0);
  const ky = useMotionValue(0);
  const kr = useMotionValue(0);
  const ks = useMotionValue(1);
  const [burst, setBurst] = useState(0);
  const armed = useRef(true);
  const last = useRef<number | null>(null);
  const timers = useRef<number[]>([]);

  // dir: +1 bull on the right (enters from the right, knocks the heading left).
  const dir = side === "right" ? 1 : -1;
  const x = useTransform<number, string>([p, charge], ([v, c]) => `${dir * (transform(v, [0, 0.6], [250, 22]) - c * 34)}%`);
  const y = useTransform(p, [0, 0.12, 0.24, 0.36, 0.48, 0.6], [6, 0, 5, 0, 4, 0]);
  const head = useTransform<number, number>([p, toss], ([v, t]) => transform(v, [0, 0.6, 0.75, 0.9, 1], [-2, 0, 17, 10, 8]) - t * 26);
  const leg = useTransform(p, [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.64, 0.68, 0.72, 0.75], [0, -20, 14, -20, 14, -12, 0, 30, -6, 22, 0]);
  const dust = useTransform(p, [0, 0.06, 0.16, 0.26, 0.36, 0.46, 0.58, 0.62, 0.67, 0.73, 0.8], [0, 0.9, 0.35, 0.9, 0.35, 0.8, 0.2, 0, 1, 0.9, 0]);

  useEffect(() => {
    forced.set(reduce ? 1 : 0);
  }, [reduce, forced]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);

  // Measure the gap between the box edge and the real text edge so the horns
  // land on the words, not on empty heading box (desktop beside-layout only).
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const range = document.createRange();
      range.selectNodeContents(root.querySelector("[data-bx-title]") ?? root);
      const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0);
      const box = root.getBoundingClientRect();
      if (!rects.length) return;
      const gap = side === "right" ? box.right - Math.max(...rects.map((r) => r.right)) : Math.min(...rects.map((r) => r.left)) - box.left;
      const room = side === "right" ? document.documentElement.clientWidth - box.right - 6 : box.left - 6;
      root.style.setProperty("--bx-gap", `${Math.max(0, Math.round(gap))}px`);
      root.style.setProperty("--bx-room", `${Math.max(0, Math.floor(room))}px`);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    window.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [side]);

  const fire = () => {
    setBurst((b) => b + 1);
    playSfx("snort");
    toss.set(0);
    animate(toss, [0, -0.35, 1, 0.1], { duration: 0.75, times: [0, 0.16, 0.34, 1], ease: "easeOut" });
    animate(charge, 1, { duration: 0.13, ease: [0.55, 0, 1, 0.6] }).then(() => animate(charge, 0.3, { type: "spring", stiffness: 170, damping: 13 }));
    timers.current.push(
      window.setTimeout(() => {
        playSfx("impact");
        haptic([18, 30, 24]);
        const k = { duration: 0.58, ease: "easeOut" as const };
        animate(kx, [0, -dir * 20, dir * 8, -dir * 3.5, dir * 1.2, 0], k);
        animate(ky, [0, -13, 4, -2.5, 1, 0], k);
        animate(kr, [0, -dir * 2.4, dir * 1.1, -dir * 0.45, 0], k);
        animate(ks, [1, 0.86, 1.06, 0.98, 1.01, 1], k);
      }, 120),
    );
  };

  useMotionValueEvent(p, "change", (v) => {
    const prev = last.current;
    last.current = v;
    if (v < 0.04) {
      armed.current = true;
      charge.set(0);
      return;
    }
    if (prev === null || reduce || reducedNow()) {
      // First measurement already past the hit point (deep link / reload): just settle.
      if (v >= HIT && armed.current) {
        armed.current = false;
        charge.set(0.3);
      }
      return;
    }
    if (armed.current && prev < HIT && v >= HIT) {
      armed.current = false;
      fire();
    }
  });

  return (
    <div ref={rootRef} className="relative">
      <BeastStyles />
      <div ref={stageRef} className="bx-stage" data-side={side} aria-hidden="true">
        <motion.div className="bx-art" style={{ x, y }}>
          <div style={side === "right" ? { transform: "scaleX(-1)" } : undefined}>
            <BullArt head={head} leg={leg} dust={dust} burst={burst} />
          </div>
        </motion.div>
      </div>
      <motion.div data-bx-title="" className="relative" style={{ x: kx, y: ky, rotate: kr, scaleY: ks, transformOrigin: "50% 100%" }}>
        {children}
      </motion.div>
    </div>
  );
}
