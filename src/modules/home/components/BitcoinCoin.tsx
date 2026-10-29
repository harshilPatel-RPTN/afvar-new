"use client";

import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, type AnimationPlaybackControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { haptic, playSfx } from "./sfx";

/* ── COIN TOSS — a low-poly gold-orange ₿ coin flips up off the BTC-USD row
 * when the row scrolls into view: toss (rotateY flips, transform only) →
 * lands on its edge with a settling wobble → rests standing beside the symbol
 * name (measured free gap; never over the price / change pill). `coin` sfx at
 * toss start (its landing clink is timed to the 0.55s flight), haptic(15) on
 * landing. Re-armed once the row leaves the viewport (either side). Phones
 * (<640px) or no room: the coin fades after landing. Reduced motion: resting
 * coin only, no toss, no sound. Must sit in a `relative` row. */

const SIZE = 22;
const UP_T = 0.27;
const DOWN_T = 0.28; // lands at 0.55s — matches the clink inside sfx "coin"
const AT = 0.12; // fire once the row is this far into ["start end","end start"]

function reducedNow() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function BitcoinCoin() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start end", "end start"] });

  const [spot, setSpot] = useState<{ x: number; y: number; rest: boolean } | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    const row = root?.parentElement;
    if (!root || !row || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const button = row.querySelector<HTMLElement>("button");
      const price = button?.querySelector<HTMLElement>(".tabular-nums");
      const name = button?.children[1] as HTMLElement | undefined;
      if (!button || !price || !name || price.offsetParent !== row || name.offsetParent !== row) return;
      const gapL = name.offsetLeft + name.offsetWidth;
      const gapR = price.offsetLeft;
      const rest = gapR - gapL >= SIZE + 24 && window.innerWidth >= 640;
      const x = rest ? gapL + 10 : Math.max(gapL + 4, Math.min(gapR - SIZE - 4, gapL + 10));
      const y = button.offsetTop + button.offsetHeight / 2 + SIZE / 2; // coin bottom edge
      setSpot({ x: Math.round(x), y: Math.round(y), rest });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, []);

  const y = useMotionValue(0);
  const spin = useMotionValue(0);
  const rock = useMotionValue(0);
  const op = useMotionValue(0);
  const armed = useRef(true);
  const last = useRef<number | null>(null);
  const runs = useRef<AnimationPlaybackControls[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const spotRef = useRef(spot);
  useEffect(() => {
    spotRef.current = spot;
  }, [spot]);

  useEffect(
    () => () => {
      runs.current.forEach((r) => r.stop());
      window.clearTimeout(timer.current);
    },
    [],
  );

  const phase = (p: string) => rootRef.current?.setAttribute("data-phase", p);

  const rest = () => {
    y.set(0);
    spin.set(0);
    rock.set(0);
    op.set(spotRef.current?.rest === false ? 0 : 1);
    phase("resting");
  };

  // Reduced motion: the coin simply rests (only where there is room for it).
  useEffect(() => {
    if (!reduce) return;
    y.set(0);
    spin.set(0);
    rock.set(0);
    op.set(spot?.rest ? 1 : 0);
    rootRef.current?.setAttribute("data-phase", "resting");
  }, [reduce, spot, y, spin, rock, op]);

  const go = <T extends AnimationPlaybackControls>(run: T): T => {
    runs.current.push(run);
    return run;
  };

  const land = () => {
    haptic(15);
    phase("landed");
    // Settling coin: decaying rock about its contact point + a face wobble, two tiny hops.
    const k = { duration: 0.75, ease: "easeOut" as const };
    go(animate(rock, [0, -13, 9, -5, 2.5, 0], k));
    go(animate(spin, [0, 28, -18, 9, -3, 0], k));
    go(animate(y, [0, -5, 0, -1.5, 0], { duration: 0.45, ease: "easeOut" }));
    timer.current = window.setTimeout(() => {
      if (spotRef.current?.rest === false) go(animate(op, 0, { duration: 0.45 }));
      phase("resting");
    }, 780);
  };

  const toss = () => {
    runs.current.forEach((r) => r.stop());
    window.clearTimeout(timer.current);
    phase("toss");
    playSfx("coin");
    y.set(0);
    rock.set(0);
    spin.set(0);
    op.set(1);
    go(animate(spin, 1800, { duration: UP_T + DOWN_T, ease: [0.25, 0.6, 0.45, 1] }));
    go(animate(y, -92, { duration: UP_T, ease: [0.2, 0.7, 0.4, 1] })).then(() => {
      phase("spin");
      go(animate(y, 0, { duration: DOWN_T, ease: [0.6, 0, 0.9, 0.5] })).then(() => {
        spin.set(0);
        land();
      });
    });
  };

  // Wait for the row's own reveal (list rise-in) so the coin never leaves an invisible row.
  const tossWhenShown = (tries: number) => {
    const row = rootRef.current?.parentElement;
    const shown = !row || Number(getComputedStyle(row).opacity) >= 0.85;
    if (shown || tries >= 12) {
      toss();
      return;
    }
    timer.current = window.setTimeout(() => tossWhenShown(tries + 1), 120);
  };

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const prev = last.current;
    last.current = v;
    if (reduce || reducedNow()) return;
    if (v <= 0 || v >= 1) {
      if (!armed.current) {
        armed.current = true;
        runs.current.forEach((r) => r.stop());
        window.clearTimeout(timer.current);
        op.set(0);
      }
      return;
    }
    const inBand = v >= AT && v <= 1 - AT;
    if (prev === null && v >= 0.5) {
      // First reading is already deep into the row's pass (reload / jump): just rest.
      armed.current = false;
      rest();
      return;
    }
    if (armed.current && inBand) {
      armed.current = false;
      tossWhenShown(0);
    }
  });

  return (
    <div ref={rootRef} aria-hidden="true" data-btc-coin className="pointer-events-none absolute inset-0">
      {spot && (
        <div
          data-coin-spot={spot.rest ? "rest" : "fade"}
          className={`absolute ${spot.rest ? "max-sm:hidden" : ""}`}
          style={{ left: spot.x, top: spot.y - SIZE, width: SIZE, height: SIZE, perspective: 260 }}
        >
          <motion.div className="absolute inset-0" style={{ y, rotate: rock, opacity: op, transformOrigin: "50% 100%" }}>
            <motion.div className="absolute inset-0" style={{ rotateY: spin, transformStyle: "preserve-3d" }}>
              <CoinCore />
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/** Two faces + stacked edge discs (milled ridges) so the coin keeps a visible rim when edge-on. */
function CoinCore() {
  return (
    <>
      {[-1.2, -0.4, 0.4, 1.2].map((z) => (
        <svg key={z} viewBox="0 0 32 32" className="absolute inset-0 h-full w-full" style={{ transform: `translateZ(${z}px)` }}>
          <circle cx="16" cy="16" r="15" fill="#A85A0A" />
          <circle cx="16" cy="16" r="14.4" fill="none" stroke="#E68A14" strokeWidth="1.2" strokeDasharray="1.1 1.1" />
        </svg>
      ))}
      <div className="absolute inset-0" style={{ transform: "translateZ(1.6px)", backfaceVisibility: "hidden" }}>
        <CoinFace />
      </div>
      <div className="absolute inset-0" style={{ transform: "rotateY(180deg) translateZ(1.6px)", backfaceVisibility: "hidden" }}>
        <CoinFace />
      </div>
    </>
  );
}

// 12-gon geometry for the faceted face.
const ring = (r: number, off = 0) =>
  Array.from({ length: 12 }, (_, i) => {
    const a = ((i + off) / 12) * Math.PI * 2 - Math.PI / 2;
    return [16 + r * Math.cos(a), 16 + r * Math.sin(a)] as const;
  });
const OUTER = ring(15);
const INNER = ring(11.6, 0.5);
const FACET_FILLS = ["#FFB347", "#F7931A", "#E8850F", "#D97A0C", "#C46D0B", "#D97A0C", "#E8850F", "#F7931A", "#FBA43A", "#FFC266", "#FFB347", "#FBA43A"];
const pts = (list: readonly (readonly [number, number])[]) => list.map(([x, yy]) => `${x.toFixed(2)},${yy.toFixed(2)}`).join(" ");

function CoinFace() {
  return (
    <svg viewBox="0 0 32 32" className="block h-full w-full overflow-visible">
      <polygon points={pts(OUTER)} fill="#B8650F" />
      {/* milled rim facets */}
      {OUTER.map((p, i) => {
        const q = OUTER[(i + 1) % 12];
        const n = INNER[i];
        return <polygon key={`o${i}`} points={pts([p, q, n])} fill={FACET_FILLS[i]} opacity=".9" />;
      })}
      {/* inner faceted field */}
      {INNER.map((p, i) => {
        const q = INNER[(i + 1) % 12];
        return <polygon key={`i${i}`} points={pts([p, q, [16, 16]])} fill={FACET_FILLS[(i + 3) % 12]} />;
      })}
      <polygon points={pts(INNER)} fill="none" stroke="#FFE0A8" strokeWidth=".6" opacity=".75" />
      {/* ₿ mark */}
      <g fill="none" stroke="#FFF6E5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9.6h5.4a3 3 0 0 1 0 6H12M12 15.6h6.2a3.3 3.3 0 0 1 0 6.6H12M12.6 9.6v12.6" />
        <path d="M14 7.6v2M17 7.6v2M14 22.2v2M17 22.2v2" strokeWidth="1.5" />
      </g>
      <polygon points={pts(OUTER)} fill="none" stroke="#FFD27A" strokeWidth=".7" opacity=".8" />
    </svg>
  );
}
