"use client";

// /home-demo's playful moments, for any page:
//
//   <RegisterCoins>  clicking a Register / Join link rains currency coins into
//                    it (with a clink), then follows the link.
//   <TypedBeasts>    type B-U-L-L and a bull stampedes along the bottom of the
//                    screen; type B-E-A-R and a bear rakes it with its claws.
//   <BreadthStrip>   a tug-of-war line for a nav's bottom edge: green pulls
//                    from the left, red from the right, the knot sits at the
//                    real share of today's move that is up.
//
// All obey reduced motion (OS setting) and the "/" sound preference.
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { BearArt, BeastStyles, BullArt } from "./beastArt";
import { haptic, playSfx } from "./sfx";
import { useLiveMarket } from "./useLiveMarket";

const reducedNow = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* -------------------------------------------------------- register coins */

const GLYPHS = ["$", "€", "¥", "£", "₹", "₿"];
const COIN_COUNT = 12;
const COIN_MS = 650;

/** Register / launch-queue destinations (the app's Welcome, or /register). */
const isRegister = (a: HTMLAnchorElement) => /app\.afvar\.com|\/register\b/.test(a.href) || /\b(register|join)\b/i.test(a.textContent ?? "");

/** Drops one coin from above `box` into it; resolves when it lands. */
function dropCoin(layer: HTMLElement, box: DOMRect, i: number) {
  const coin = document.createElement("span");
  coin.textContent = GLYPHS[i % GLYPHS.length];
  coin.style.cssText =
    "position:fixed;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;" +
    "font:700 12px system-ui,sans-serif;color:#E8C547;background:#111416;border:2px solid #E8C547;pointer-events:none;";
  coin.style.left = `${box.left + box.width * (0.15 + Math.random() * 0.7) - 11}px`;
  coin.style.top = `${box.top + box.height / 2 - 11}px`;
  layer.appendChild(coin);
  const rise = 120 + Math.random() * 120;
  const spin = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360);
  const anim = coin.animate(
    [
      { transform: `translate(${(Math.random() - 0.5) * 80}px, ${-rise}px) rotateY(0deg)`, opacity: 0 },
      { opacity: 1, offset: 0.15 },
      { transform: `translate(0, 0) rotateY(${spin}deg) scale(.6)`, opacity: 1, offset: 0.85 },
      { transform: `translate(0, 0) rotateY(${spin}deg) scale(.2)`, opacity: 0 },
    ],
    { duration: COIN_MS, delay: i * 28, easing: "cubic-bezier(.5,0,.9,.6)", fill: "both" },
  );
  return anim.finished.finally(() => coin.remove());
}

export function RegisterCoins() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !isRegister(a) || reducedNow()) return;
      // Hold the navigation for the coin drop (Next's Link sees defaultPrevented and stands down).
      e.preventDefault();
      playSfx("coin");
      haptic(12);
      const box = a.getBoundingClientRect();
      const layer = document.createElement("div");
      layer.setAttribute("aria-hidden", "true");
      layer.style.cssText = "position:fixed;inset:0;z-index:70;pointer-events:none;perspective:400px";
      document.body.appendChild(layer);
      const drops = Array.from({ length: COIN_COUNT }, (_, i) => dropCoin(layer, box, i));
      void Promise.all(drops).then(() => {
        layer.remove();
        if (a.target === "_blank") window.open(a.href, "_blank", "noopener");
        else window.location.assign(a.href);
      });
    };
    // Capture: runs before React's handlers, so Link never navigates first.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}

/* ---------------------------------------------------------- typed beasts */

type Egg = { kind: "bull" | "bear"; id: number };
const WORDS = ["bull", "bear"] as const;
const EGG_MS = 2200;

export function TypedBeasts() {
  const [egg, setEgg] = useState<Egg | null>(null);

  useEffect(() => {
    let typed = "";
    let clear: number | undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable='true']")) return;
      typed = (typed + e.key.toLowerCase()).slice(-4);
      const hit = WORDS.find((w) => typed === w);
      if (!hit) return;
      typed = "";
      setEgg({ kind: hit, id: Date.now() });
      window.clearTimeout(clear);
      clear = window.setTimeout(() => setEgg(null), EGG_MS);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(clear);
    };
  }, []);

  if (!egg) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <BeastStyles />
      {egg.kind === "bull" ? <Stampede key={egg.id} /> : <Mauling key={egg.id} />}
    </div>
  );
}

/** The bull gallops across the bottom of the screen, kicking up dust. */
function Stampede() {
  const leg = useMotionValue(0);
  const head = useMotionValue(10);
  const dust = useMotionValue(0.9);
  const reduce = useReducedMotion();

  useEffect(() => {
    playSfx("snort");
    haptic([20, 40, 20]);
    if (reduce) return;
    const gallop = animate(leg, [0, -24, 18, 0], { duration: 0.3, repeat: Infinity });
    const bob = animate(head, [10, 16, 8, 10], { duration: 0.3, repeat: Infinity });
    // the ground shakes under it
    const shake = document.querySelector("main")?.animate(
      [0, -3, 3, -2, 2, -1, 0].map((y) => ({ transform: `translateY(${y}px)` })),
      { duration: 600, delay: 500, easing: "ease-out" },
    );
    return () => {
      gallop.stop();
      bob.stop();
      shake?.cancel();
    };
  }, [leg, head, reduce]);

  return (
    <motion.div
      className="absolute bottom-6 left-0 w-[280px] sm:w-[380px]"
      initial={reduce ? { x: "calc(50vw - 50%)", opacity: 0 } : { x: "-40vw" }}
      animate={reduce ? { opacity: [0, 1, 1, 0] } : { x: "110vw" }}
      transition={{ duration: 1.9, ease: reduce ? "linear" : [0.45, 0, 0.75, 1] }}
    >
      <BullArt head={head} leg={leg} dust={dust} burst={1} />
    </motion.div>
  );
}

const SLASHES = [
  { top: "22%", r: 28 },
  { top: "34%", r: 31 },
  { top: "46%", r: 34 },
] as const;

/** The bear rears up in the corner and rakes the whole screen. */
function Mauling() {
  const paw = useMotionValue(-34);
  const reduce = useReducedMotion();

  useEffect(() => {
    playSfx("growl");
    const rake = window.setTimeout(() => {
      playSfx("swipe");
      haptic(30);
      if (!reduce) animate(paw, [-34, 20, 4], { duration: 0.4, ease: "easeOut" });
    }, 550);
    return () => window.clearTimeout(rake);
  }, [paw, reduce]);

  return (
    <>
      <motion.div
        className="absolute bottom-0 right-4 w-[240px] sm:w-[320px]"
        initial={reduce ? { opacity: 0 } : { y: "100%" }}
        animate={reduce ? { opacity: [0, 1, 1, 0] } : { y: ["100%", "8%", "8%", "100%"] }}
        transition={{ duration: 2.1, times: [0, 0.2, 0.8, 1], ease: "easeOut" }}
      >
        <BearArt paw={paw} burst={1} />
      </motion.div>
      {!reduce &&
        SLASHES.map((s, i) => (
          <span
            key={s.top}
            className="bx-claw"
            style={{ left: "8%", top: s.top, height: 7, ["--w" as string]: "85vw", ["--r" as string]: `${s.r}deg`, ["--d" as string]: `${0.55 + i * 0.06}s` }}
          />
        ))}
    </>
  );
}

/* --------------------------------------------------------- breadth strip */

/** Share of today's move that is up (0..1) across the "/" lanes. */
function bullShare(changes: number[]) {
  const up = changes.reduce((a, c) => a + Math.max(0, c), 0);
  const all = changes.reduce((a, c) => a + Math.abs(c), 0);
  return all > 0 ? up / all : 0.5;
}

export function BreadthStrip() {
  const { quotes } = useLiveMarket();
  const share = bullShare(Object.values(quotes).map((q) => q.changePct));
  const at = `${(share * 100).toFixed(1)}%`;
  const b = Math.round(share * 100);
  return (
    <div
      role="img"
      aria-label={`Bull versus bear: ${b}% of today's move across the covered markets is up, ${100 - b}% is down.`}
      className="pointer-events-none absolute inset-x-0 -bottom-px h-[2px] bg-[#FF3B3B]"
    >
      <div className="h-full bg-[#00E676] transition-[width] duration-1000 ease-out motion-reduce:transition-none" style={{ width: at }} />
      <span
        className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-[#030405] bg-[#F5F7F7] transition-[left] duration-1000 ease-out motion-reduce:transition-none"
        style={{ left: at }}
      />
    </div>
  );
}
