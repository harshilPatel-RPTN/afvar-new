"use client";

// The home page's bull & bear moments, brought to /home-demo with the same
// faceted-metal artwork (./beastArt). Each takes an optional `p` (0..1): pass
// the chapter's own window when the target sits in a sticky stage (scroll
// doesn't move it there); omit it for normal-flow targets and the moment
// follows the target through the viewport instead.
//
//   <BullCharge side>   bull walks in, lowers its head and BELLOWS, paws the
//                       ground, then SNORTS steam and charges — the horns knock
//                       the heading (shove, squash, wobble) with a heavy IMPACT.
//   <BearSwipe>         bear rises from below, ROARS, rakes its paw down —
//                       red claw streaks and a SCRATCH — then sinks away.
//   <BullBearFaceoff>   bull and bear close in, both call out, and clash over a
//                       green/red balance line. No winner. Then it's yours:
//                       point at the bull and it lowers its head, paws and
//                       snorts; point at the bear and it rears its paw and
//                       roars; click anywhere on it and they clash again.
//
// Sounds are the demo's synthesised animal voices (opt-in). Reduced motion
// (OS or the page toggle): settled pose, no impact, silent.
import { animate, motion, transform, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform, useVelocity, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { playCue } from "./audio";
import { BearArt, BeastStyles, BullArt } from "./beastArt";
import { useMotionReduced } from "./motionPref";

/** Marks an element data-offscreen while it is out of view (pauses CSS loops). */
function usePauseOffscreen<T extends Element>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.removeAttribute("data-offscreen");
      else el.setAttribute("data-offscreen", "");
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** Progress source: the given `p`, or the target's own trip through the viewport. */
function useMomentProgress(rootRef: React.RefObject<HTMLDivElement | null>, p: MotionValue<number> | undefined, offset: ["start end", "center center"] | ["start end", "center 0.62"]) {
  const { scrollYProgress } = useScroll({ target: rootRef, offset });
  return p ?? scrollYProgress;
}

/** 0..1 from how fast the page is scrolling — a fling makes the bull furious,
 *  a slow read leaves it calm. Eases back down once scrolling stops. */
function useScrollRage(off: boolean) {
  const { scrollY } = useScroll();
  const speed = useVelocity(scrollY);
  const target = useTransform(speed, (v) => (off ? 0 : Math.min(1, Math.max(0, (Math.abs(v) - 600) / 2400))));
  return useSpring(target, { stiffness: 60, damping: 16 });
}

/* ------------------------------------------------------------- BullCharge */

const BULL_HIT = 0.78;
const BULL_CALL = 0.62;

export function BullCharge({ side, p: given, children }: { side: "left" | "right"; p?: MotionValue<number>; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = usePauseOffscreen<HTMLDivElement>();
  const reduce = useMotionReduced();
  const raw = useMomentProgress(rootRef, given, ["start end", "center center"]);
  const p = useTransform(raw, (s) => (reduce ? 1 : s));

  const charge = useMotionValue(0); // 0 rest · 1 full thrust · .3 settled
  const toss = useMotionValue(0);
  const kx = useMotionValue(0);
  const ky = useMotionValue(0);
  const kr = useMotionValue(0);
  const ks = useMotionValue(1);
  const [burst, setBurst] = useState(0);
  const armed = useRef(true);
  const called = useRef(false);
  const last = useRef<number | null>(null);
  const timers = useRef<number[]>([]);

  const dir = side === "right" ? 1 : -1;
  const x = useTransform<number, string>([p, charge], ([v, c]) => `${dir * (transform(v, [0, 0.6], [250, 22]) - c * 34)}%`);
  const y = useTransform(p, [0, 0.12, 0.24, 0.36, 0.48, 0.6], [6, 0, 5, 0, 4, 0]);
  const head = useTransform<number, number>([p, toss], ([v, t]) => transform(v, [0, 0.6, 0.75, 0.9, 1], [-2, 0, 17, 10, 8]) - t * 26);
  const leg = useTransform(p, [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.64, 0.68, 0.72, 0.75], [0, -20, 14, -20, 14, -12, 0, 30, -6, 22, 0]);
  const walkDust = useTransform(p, [0, 0.06, 0.16, 0.26, 0.36, 0.46, 0.58, 0.62, 0.67, 0.73, 0.8], [0, 0.9, 0.35, 0.9, 0.35, 0.8, 0.2, 0, 1, 0.9, 0]);
  const rage = useScrollRage(reduce);
  const dust = useTransform<number, number>([walkDust, rage], ([d, r]) => Math.min(1, d + r * 0.9));

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);

  // Horns land on the words, not on the heading's empty box (desktop beside-layout).
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      // Text glyphs only: a range over the title's elements would also return
      // the full-width h2 block box and park the bull at the container edge.
      const rects: DOMRect[] = [];
      const walker = document.createTreeWalker(root.querySelector("[data-bx-title]") ?? root, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent?.trim()) continue;
        range.selectNodeContents(n);
        for (const r of Array.from(range.getClientRects())) if (r.width > 0) rects.push(r);
      }
      const box = root.getBoundingClientRect();
      if (!rects.length) return;
      const gap = side === "right" ? box.right - Math.max(...rects.map((r) => r.right)) : Math.min(...rects.map((r) => r.left)) - box.left;
      const room = side === "right" ? document.documentElement.clientWidth - box.right - 6 : box.left - 6;
      root.style.setProperty("--bx-gap", `${Math.max(0, Math.round(gap))}px`);
      root.style.setProperty("--bx-room", `${Math.max(0, Math.floor(room))}px`);
      root.style.setProperty("--bx-rh", `${Math.round(box.height)}px`);
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
    playCue("snort");
    toss.set(0);
    animate(toss, [0, -0.35, 1, 0.1], { duration: 0.75, times: [0, 0.16, 0.34, 1], ease: "easeOut" });
    animate(charge, 1, { duration: 0.13, ease: [0.55, 0, 1, 0.6] }).then(() => animate(charge, 0.3, { type: "spring", stiffness: 170, damping: 13 }));
    timers.current.push(
      window.setTimeout(() => {
        playCue("impact");
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
      called.current = false;
      charge.set(0);
      return;
    }
    if (prev === null || reduce) {
      if (v >= BULL_HIT && armed.current) {
        armed.current = false;
        called.current = true;
        charge.set(0.3);
      }
      return;
    }
    // Head lowers: the bellow before the charge.
    if (!called.current && prev < BULL_CALL && v >= BULL_CALL) {
      called.current = true;
      playCue("bellow");
    }
    if (armed.current && prev < BULL_HIT && v >= BULL_HIT) {
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
            <BullArt head={head} leg={leg} dust={dust} rage={rage} burst={burst} idle={!reduce} />
          </div>
        </motion.div>
      </div>
      <motion.div data-bx-title="" className="relative" style={{ x: kx, y: ky, rotate: kr, scaleY: ks, transformOrigin: "50% 100%" }}>
        {children}
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------- BearSwipe */

const BEAR_HIT = 0.8;
const CLAWS = [0, 1, 2] as const;

export function BearSwipe({ p: given, children }: { p?: MotionValue<number>; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = usePauseOffscreen<HTMLDivElement>();
  const reduce = useMotionReduced();
  const raw = useMomentProgress(rootRef, given, ["start end", "center center"]);
  const p = useTransform(raw, (s) => (reduce ? 1 : s));

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
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);

  const fire = () => {
    playCue("growl");
    animate(swipe, [0, -0.28, 1], { duration: 0.34, times: [0, 0.5, 1], ease: ["easeOut", [0.5, 0, 0.9, 0.5]] });
    timers.current.push(
      window.setTimeout(() => {
        playCue("swipe");
        setBurst((b) => b + 1);
        const k = { duration: 0.5, ease: "easeOut" as const };
        animate(ty, [0, 6, -1.5, 0.5, 0], k);
        animate(tr, [0, 1.3, -0.4, 0], k);
      }, 380),
      window.setTimeout(() => {
        animate(sink, 1, { duration: 0.8, ease: [0.5, 0, 0.75, 0] });
      }, 1500),
    );
  };

  useMotionValueEvent(p, "change", (v) => {
    const prev = last.current;
    last.current = v;
    if (reduce) return;
    if (v < 0.2) {
      armed.current = true;
      swipe.set(0);
      sink.set(0);
      return;
    }
    if (prev === null) {
      if (v >= BEAR_HIT) {
        armed.current = false;
        sink.set(1);
      }
      return;
    }
    if (armed.current && prev < BEAR_HIT && v >= BEAR_HIT) {
      armed.current = false;
      fire();
    }
  });

  return (
    <div ref={rootRef} className="relative w-fit max-w-full">
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
            <BearArt head={head} paw={paw} burst={burst} idle={!reduce} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------- BullBearFaceoff */

const MEET = 0.78;
const CALLS = 0.5;
const SPARKS = [-150, -105, -60, -20, 25, 70, 115, 160] as const;

export function BullBearFaceoff({ p: given, className = "" }: { p?: MotionValue<number>; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pauseRef = usePauseOffscreen<HTMLDivElement>();
  const reduce = useMotionReduced();
  const raw = useMomentProgress(rootRef, given, ["start end", "center 0.62"]);
  const p = useTransform(raw, (s) => (reduce ? 1 : s));
  const push = useMotionValue(0);
  const [burst, setBurst] = useState(0);
  const armed = useRef(true);
  const called = useRef(false);
  const last = useRef<number | null>(null);
  // Pointer lean: -1 over the bull … +1 over the bear (0 when away).
  const leanRaw = useMotionValue(0);
  const lean = useSpring(leanRaw, { stiffness: 120, damping: 18 });
  const leg = useMotionValue(0);
  const zone = useRef<"bull" | "bear" | null>(null);

  const bullX = useTransform<number, number>([p, push], ([v, s]) => transform(v, [0, 0.75], [-300, -2]) + s);
  const bearX = useTransform<number, number>([p, push], ([v, s]) => transform(v, [0, 0.75], [300, 2]) + s);
  const bullHead = useTransform<number, number>([p, push, lean], ([v, s, l]) => transform(v, [0.3, 0.72], [0, 16]) + s * 0.5 + Math.max(0, -l) * 12);
  const bullDust = useTransform(lean, (l) => Math.max(0, -l) * 0.9);
  const bearHead = useTransform<number, number>([p, push, lean], ([v, s, l]) => transform(v, [0.3, 0.72], [-6, 4]) - s * 0.5 - Math.max(0, l) * 8);
  const bearPaw = useTransform<number, number>([p, push, lean], ([v, s, l]) => transform(v, [0.4, 0.72], [-34, 4]) - s * 1.2 - Math.max(0, l) * 38);

  const clash = (toward = 0) => {
    setBurst((b) => b + 1);
    playCue("impact");
    animate(push, [0, 11 + toward * 6, -13, 7, -3, 0], { duration: 1.4, ease: "easeInOut" });
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType === "touch") return;
    const box = e.currentTarget.getBoundingClientRect();
    const l = Math.max(-1, Math.min(1, ((e.clientX - box.left) / box.width - 0.5) * 2.4));
    leanRaw.set(l);
    const next = l < -0.25 ? "bull" : l > 0.25 ? "bear" : null;
    if (next === zone.current) return;
    zone.current = next;
    if (next === "bull") {
      playCue("snort");
      animate(leg, [0, -20, 14, -20, 14, 0], { duration: 0.9, ease: "easeInOut" });
    } else if (next === "bear") playCue("growl");
  };
  const onLeave = () => {
    zone.current = null;
    leanRaw.set(0);
  };

  useMotionValueEvent(p, "change", (v) => {
    const prev = last.current;
    last.current = v;
    if (v < 0.05) {
      armed.current = true;
      called.current = false;
      return;
    }
    if (prev === null || reduce) {
      if (v >= MEET) armed.current = false;
      return;
    }
    // Squaring up: the bull bellows, the bear roars back.
    if (!called.current && prev < CALLS && v >= CALLS) {
      called.current = true;
      playCue("bellow");
      window.setTimeout(() => playCue("growl"), 650);
    }
    if (armed.current && prev < MEET && v >= MEET) {
      armed.current = false;
      clash();
    }
  });

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={() => !reduce && clash(Math.sign(leanRaw.get()))}
      className={`relative h-[112px] cursor-crosshair select-none overflow-clip sm:h-[128px] ${className}`}
    >
      <BeastStyles />
      <div ref={pauseRef} className="absolute inset-0">
        <div className="absolute inset-x-0 bottom-[14px] h-px overflow-clip [mask-image:linear-gradient(90deg,transparent,#000_22%,#000_78%,transparent)]">
          <motion.div
            className="absolute inset-y-0 left-[-50%] w-[200%] bg-[linear-gradient(90deg,#0A8F5B,#00E676_49.9%,#FF3B3B_50.1%,#FF3B3B)]"
            style={{ x: push }}
          />
        </div>
        <motion.div className="absolute bottom-[12px] right-1/2 w-[112px] sm:w-[132px]" style={{ x: bullX }}>
          <BullArt head={bullHead} leg={leg} dust={bullDust} burst={burst} idle={!reduce} />
        </motion.div>
        <motion.div className="absolute bottom-[12px] left-1/2 w-[100px] sm:w-[116px]" style={{ x: bearX }}>
          <div style={{ transform: "scaleX(-1)" }}>
            <BearArt head={bearHead} paw={bearPaw} idle={!reduce} />
          </div>
        </motion.div>
        {burst > 0 && (
          <div key={burst} className="absolute bottom-[52px] left-1/2 sm:bottom-[60px]">
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

/** A moment window cut from a chapter's progress: covers the closing copy's
 *  reveal and a little after, so the charge lands once the words are in.
 *  Returns undefined without `mv` (normal-flow layouts follow scroll instead). */
export function useMomentWindow(mv: MotionValue<number> | undefined, at: readonly [number, number] | undefined) {
  const fallback = useMotionValue(0);
  const cut = useTransform(mv ?? fallback, (v) => (at ? Math.min(1, Math.max(0, (v - (at[0] - 0.02)) / (at[1] - at[0] + 0.07))) : v));
  return mv && at ? cut : undefined;
}
