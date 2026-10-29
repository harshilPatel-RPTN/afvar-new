"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BearArt, BullArt, haptic, playSfx } from "@/modules/home/kit";

/** Timers for one move; cleared on unmount. */
function useTimers() {
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);
  return (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
}

const focusRing =
  "rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-(--mk-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--mk-page)";

/**
 * The footer bull beside the wordmark. Click (or Enter/Space): it snorts,
 * lowers its head and paws the ground, then DASHES at the wordmark — steam,
 * eye flare, impact sound — knocking it, and springs back. The home page's
 * BullCharge moment, on demand. Reduced motion: eye flare and sound only.
 */
export function FooterBull({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const later = useTimers();
  // swallows clicks while a move plays
  const busy = useRef(false);
  const head = useMotionValue(0);
  const leg = useMotionValue(0);
  const dust = useMotionValue(0);
  const x = useMotionValue(0);
  const kx = useMotionValue(0);
  const ky = useMotionValue(0);
  const kr = useMotionValue(0);
  const [burst, setBurst] = useState(0);
  const lean = useTransform(x, [-8, 0, 60], [2, 0, -4]);

  function charge() {
    if (busy.current) return;
    busy.current = true;
    playSfx("snort");
    if (reduce) {
      setBurst((b) => b + 1);
      later(() => {
        busy.current = false;
      }, 600);
      return;
    }
    // wind-up: head down, paw the ground twice, dust kicks
    animate(head, 17, { duration: 0.28, ease: "easeOut" });
    animate(leg, [0, 30, -6, 22, -4, 0], { duration: 0.5, ease: "easeInOut" });
    animate(dust, [0, 1, 0.3, 0.9, 0], { duration: 0.55 });
    animate(x, -8, { duration: 0.3, ease: "easeOut" });
    // DASH
    later(() => {
      animate(x, 58, { duration: 0.16, ease: [0.55, 0, 1, 0.6] });
      animate(head, [17, 6, 9], { duration: 0.4 });
    }, 520);
    // impact: steam + eye flare + the wordmark gets knocked
    later(() => {
      playSfx("impact");
      haptic([18, 30, 24]);
      setBurst((b) => b + 1);
      const k = { duration: 0.75, ease: "easeOut" as const };
      animate(kx, [0, 16, -6, 2.5, -1, 0], k);
      animate(ky, [0, -10, 3, -1.5, 0], k);
      animate(kr, [0, 3, -1.4, 0.5, 0], k);
      animate(x, 0, { type: "spring", stiffness: 160, damping: 14 });
      animate(head, 0, { duration: 0.7, ease: "easeOut" });
    }, 680);
    later(() => {
      busy.current = false;
    }, 1500);
  }

  return (
    <div className="flex items-center gap-4">
      <motion.button
        type="button"
        onClick={charge}
        aria-label="Make the bull charge"
        title="Click the bull"
        className={`relative w-16 shrink-0 cursor-pointer ${focusRing}`}
        style={{ x, rotate: lean, transformOrigin: "50% 100%" }}
        whileHover={reduce ? undefined : { y: -2 }}
        whileTap={reduce ? undefined : { scale: 0.96 }}
      >
        <BullArt head={head} leg={leg} dust={dust} burst={burst} />
      </motion.button>
      <motion.div style={{ x: kx, y: ky, rotate: kr, transformOrigin: "0% 100%" }}>{children}</motion.div>
    </div>
  );
}

const CLAWS = [0, 1, 2];

/**
 * The footer bear. Click (or Enter/Space): it growls, winds its paw back and
 * SWIPES — three red claw streaks rip across, eye flare, swipe sound — then
 * settles. The home page's BearSwipe moment, on demand.
 */
/** Pass positioning in `className` (it must include `absolute` or `relative` — the claw streaks anchor to it). */
export function FooterBear({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const later = useTimers();
  // swallows clicks while a move plays
  const busy = useRef(false);
  const swipe = useMotionValue(0);
  const shake = useMotionValue(0);
  const [burst, setBurst] = useState(0);
  const paw = useTransform(swipe, (s) => s * 92);
  const head = useTransform(swipe, (s) => s * 9);

  function scratch() {
    if (busy.current) return;
    busy.current = true;
    playSfx("growl");
    if (reduce) {
      setBurst((b) => b + 1);
      later(() => {
        busy.current = false;
      }, 600);
      return;
    }
    animate(swipe, [0, -0.28, 1], { duration: 0.34, times: [0, 0.5, 1], ease: ["easeOut", [0.5, 0, 0.9, 0.5]] });
    later(() => {
      playSfx("swipe");
      haptic(20);
      setBurst((b) => b + 1);
      animate(shake, [0, -4, 3, -1.5, 0], { duration: 0.45, ease: "easeOut" });
    }, 230);
    later(() => animate(swipe, 0, { duration: 0.6, ease: "easeInOut" }), 900);
    later(() => {
      busy.current = false;
    }, 1500);
  }

  return (
    <motion.button
      type="button"
      onClick={scratch}
      aria-label="Make the bear swipe"
      title="Click the bear"
      className={`cursor-pointer ${focusRing} ${className || "relative"}`}
      style={{ x: shake }}
      whileHover={reduce ? undefined : { y: -2 }}
      whileTap={reduce ? undefined : { scale: 0.96 }}
    >
      <div style={{ transform: "scaleX(-1)" }}>
        <BearArt head={head} paw={paw} burst={burst} />
      </div>
      {/* claw streaks rip across toward the content, on the paw's side */}
      <span aria-hidden="true" className="pointer-events-none absolute -left-16 top-1 h-full w-[110px]">
        {burst > 0 &&
          !reduce &&
          CLAWS.map((i) => (
            <span
              key={`${burst}-${i}`}
              className="bx-claw"
              style={{ left: 10 + i * 15, top: 4 + i * 6, ["--r" as string]: "121deg", ["--w" as string]: `${58 - i * 4}px`, ["--d" as string]: `${i * 0.045}s` }}
            />
          ))}
      </span>
    </motion.button>
  );
}
