"use client";

// Page-wide playful layer for /home-demo, mounted once by HomeDemoPage.
//
//   <AmbienceDirector>  picks the sound layer for what's on screen: a soft
//                       alert ping over Chapter 05, a slow heartbeat over
//                       Chapter 06 (risk); every other chapter is silent.
//   <RegisterCoins>     clicking any Register link rains currency coins into
//                       the button (with a clink), then follows the link.
//   <BeastEasterEgg>    type B-U-L-L and a bull stampedes across the screen;
//                       type B-E-A-R and a bear rakes it with its claws.
//
// All of it obeys reduced motion (OS or page toggle) and the sound opt-in.
import { animate, motion, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import { playCue, setAmbience, type Scene } from "./audio";
import { BearArt, BeastStyles, BullArt } from "./beastArt";
import { isMotionReduced } from "./motionPref";
import { REGISTER_HREF } from "./ui";

/* ------------------------------------------------------------- ambience */

const SCENES: readonly { label: string; scene: Scene }[] = [
  { label: "Chapter 05", scene: "alerts" },
  { label: "Chapter 06", scene: "risk" },
];

export function AmbienceDirector() {
  useEffect(() => {
    const onScreen = new Set<Scene>();
    const pick = () => setAmbience(onScreen.has("risk") ? "risk" : onScreen.has("alerts") ? "alerts" : "floor");
    // A thin band across the middle of the viewport decides the chapter.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const scene = (e.target as HTMLElement).dataset.ambience as Scene;
          if (e.isIntersecting) onScreen.add(scene);
          else onScreen.delete(scene);
        }
        pick();
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const { label, scene } of SCENES) {
      const el = document.querySelector<HTMLElement>(`section[aria-label^="${label}"]`);
      if (!el) continue;
      el.dataset.ambience = scene;
      io.observe(el);
    }
    pick();
    return () => {
      io.disconnect();
      setAmbience(null);
    };
  }, []);
  return null;
}

/* -------------------------------------------------------- register coins */

const GLYPHS = ["$", "€", "¥", "£", "₹", "₿"];
const COIN_COUNT = 12;
const COIN_MS = 650;

/** Drops one coin from above `box` into it; resolves when it lands. */
function dropCoin(layer: HTMLElement, box: DOMRect, i: number) {
  const coin = document.createElement("span");
  coin.textContent = GLYPHS[i % GLYPHS.length];
  coin.style.cssText =
    "position:fixed;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;" +
    "font:700 12px system-ui,sans-serif;color:#E8C547;background:#111416;border:2px solid #E8C547;pointer-events:none;";
  const x = box.left + box.width * (0.15 + Math.random() * 0.7) - 11;
  coin.style.left = `${x}px`;
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
      if (!a || a.getAttribute("href") !== REGISTER_HREF || isMotionReduced()) return;
      // Hold the navigation for the coin drop (Next's Link sees defaultPrevented and stands down).
      e.preventDefault();
      playCue("coins");
      a.setAttribute("data-filling", "");
      const box = a.getBoundingClientRect();
      const layer = document.createElement("div");
      layer.setAttribute("aria-hidden", "true");
      layer.style.cssText = "position:fixed;inset:0;z-index:70;pointer-events:none;perspective:400px";
      document.body.appendChild(layer);
      const drops = Array.from({ length: COIN_COUNT }, (_, i) => dropCoin(layer, box, i));
      void Promise.all(drops).then(() => {
        layer.remove();
        a.removeAttribute("data-filling");
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

/* ------------------------------------------------------ beast easter egg */

type Egg = { kind: "bull" | "bear"; id: number };
const WORDS = ["bull", "bear"] as const;
const EGG_MS = 2200;

export function BeastEasterEgg() {
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
  const reduce = isMotionReduced();

  useEffect(() => {
    playCue("bellow");
    const snort = window.setTimeout(() => playCue("snort"), 700);
    if (reduce) return () => window.clearTimeout(snort);
    const gallop = animate(leg, [0, -24, 18, 0], { duration: 0.3, repeat: Infinity });
    const bob = animate(head, [10, 16, 8, 10], { duration: 0.3, repeat: Infinity });
    // the ground shakes under it
    const main = document.querySelector("main");
    const shake = main?.animate(
      [0, -3, 3, -2, 2, -1, 0].map((y) => ({ transform: `translateY(${y}px)` })),
      { duration: 600, delay: 500, easing: "ease-out" },
    );
    return () => {
      window.clearTimeout(snort);
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
  const reduce = isMotionReduced();

  useEffect(() => {
    playCue("growl");
    const rake = window.setTimeout(() => {
      playCue("swipe");
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
