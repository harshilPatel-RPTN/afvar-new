"use client";

// A page's hero: its own 3D centrepiece (the only 3D on the page) with the
// hero copy, one screen tall. The OS sections follow it. WebGL mounts after
// the splash + idle; until then (and without WebGL) the CSS poster shows.
//
// Motion layer (PLATFORM_MOTION; reduced motion = finished state):
//   A1 the copy enters as a staircase once the splash has gone,
//   A2 leaving the hero, the copy rises away and the 3D wrapper recedes,
//   A3 a small scroll cue that fades on the first 40 px of scroll.
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { MONO, PLATFORM_MOTION, Poster, afterSplash, useFilmMode, useMedia, useMotionOn, useSceneReady, useStory } from "@/modules/afvarOs";

export interface HeroSceneArgs {
  /** Fixed progress (the hero frame): scenes read it like a film's progress. */
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
  portrait: boolean;
  lite: boolean;
}

const EASE = "cubic-bezier(.22,1,.36,1)";

/** A1: eyebrow → headline wipe → mint line → body → CTAs → facts, 150 ms apart (~0.9 s each, rise 20 px), once. */
function useCopyStaircase(root: RefObject<HTMLElement | null>, on: boolean) {
  useEffect(() => {
    const host = root.current;
    // (No Web Animations API, e.g. a test DOM: the copy simply shows.)
    if (!host || !on || typeof host.animate !== "function") {
      host?.setAttribute("data-afv-enter", "run");
      return;
    }
    const anims: Animation[] = [];
    // Script is running: hold the copy (and the cue) hidden ourselves until the splash has gone,
    // so the CSS no-JS failsafe (5 s) can't show it under a splash that is still playing.
    const held = [...host.querySelectorAll("[data-afv-copy] > * > *"), ...(host.parentElement?.querySelectorAll("[data-afv-cue] > span") ?? [])];
    const holds = held.map((el) => el.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "forwards" }));
    host.setAttribute("data-afv-enter", "hold");
    const cancel = afterSplash(() => {
      holds.forEach((a) => a.cancel());
      host.querySelectorAll<HTMLElement>("[data-afv-copy]").forEach((box) => {
        const copy = box.firstElementChild;
        if (!copy) return;
        let i = 0;
        const step = (el: Element, keys: Keyframe[], duration = 900) => anims.push(el.animate(keys, { duration, delay: 150 + i++ * 150, easing: EASE, fill: "backwards" }));
        for (const el of Array.from(copy.children)) {
          if (el.tagName === "H1") {
            step(el, [{ clipPath: "inset(-0.2em 100% -0.2em 0)" }, { clipPath: "inset(-0.2em 0% -0.2em 0)" }], 1000);
            const mint = el.querySelector("span");
            if (mint) step(mint, [{ opacity: 0 }, { opacity: 1 }], 900);
          } else step(el, [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "none" }]);
        }
        if (box.offsetParent === null) return; // the hidden cut (desktop / compact) times nothing else
        // A3: the cue arrives last, then breathes (opacity only) three times and rests.
        const cue = host.parentElement?.querySelector("[data-afv-cue] > span");
        if (!cue) return;
        const at = 150 + i * 150 + 300;
        anims.push(cue.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: at, easing: EASE, fill: "backwards" }));
        anims.push(cue.animate([{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }], { duration: 2400, delay: at + 1400, iterations: 3, easing: "ease-in-out" }));
      });
      // The CSS that held the copy back until now (no flash before the splash goes).
      host.setAttribute("data-afv-enter", "run");
    });
    return () => {
      cancel();
      holds.forEach((a) => a.cancel());
      anims.forEach((a) => a.finish());
    };
  }, [root, on]);
}

/** Where a portrait scene draws its centrepiece, as fractions of the canvas height (CAM_P framing). */
const BAND = [0.13, 0.53] as const;
const NAV_H = 72;

/**
 * Phones and tablets (copy under the scene): the scene's box, so its centrepiece sits
 * between the navbar and the copy. A tall screen keeps the full-bleed canvas; a short
 * one (e.g. 320×568) gets a shorter box, so the camera frames the object smaller and
 * it never runs behind the eyebrow or headline. Null = full bleed.
 */
function useSceneBox(section: RefObject<HTMLElement | null>, copy: RefObject<HTMLElement | null>, on: boolean) {
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);
  useEffect(() => {
    const sec = section.current;
    const cp = copy.current;
    if (!on || !sec || !cp || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const H = sec.clientHeight;
      // The copy's layout box (offsetTop ignores the entrance / leave transforms).
      const copyTop = cp.offsetTop;
      const m = Math.max(8, Math.round(0.02 * H));
      const f0 = NAV_H + m;
      const f1 = copyTop - m;
      // Not a copy-under-scene layout (desktop, short landscape column): full bleed.
      if (H <= 0 || copyTop < H * 0.3 || f1 <= f0) return setBox(null);
      const need = (f1 - f0) / (BAND[1] - BAND[0]);
      if (need >= H) {
        // Fits at full size; lift it only if its foot would touch the copy.
        const lift = Math.min(0, Math.max(f0 - BAND[0] * H, f1 - BAND[1] * H));
        return setBox(lift === 0 ? null : { top: Math.round(lift), height: H });
      }
      const height = Math.round(need);
      setBox({ top: Math.round((f0 + f1) / 2 - ((BAND[0] + BAND[1]) / 2) * height), height });
    };
    // (An observer reports each target once on observe, so this also takes the first measure.)
    const ro = new ResizeObserver(fit);
    ro.observe(sec);
    ro.observe(cp);
    return () => ro.disconnect();
  }, [section, copy, on]);
  return on ? box : null;
}

export function HeroStage({ id, label, scene, copy, posterLeft = "64%" }: { id: string; label: string; scene: (a: HeroSceneArgs) => ReactNode; copy: (compact: boolean) => ReactNode; posterLeft?: string }) {
  const { mode, lite, reduced } = useFilmMode();
  // Below lg the copy is a full-width block under the scene in either
  // orientation, so landscape phones and tablets need the portrait framing too.
  const portrait = mode === "compact";
  const { trackRef, active, mounted, webgl } = useStory({ settledP: 0, minWidth: 0 });
  const sceneReady = useSceneReady();
  const zero = useRef(0);
  // Tall tablets (e.g. 1024×1366): a landscape camera would push the centrepiece's right side off
  // screen, so the scene is framed as portrait and the (desktop) copy sits at the bottom, as on phones.
  const tall = useMedia("(min-width: 1024px) and (orientation: portrait)") === true;
  const on = useMotionOn();
  const copyRef = useRef<HTMLDivElement>(null);
  useCopyStaircase(copyRef, on);
  const box = useSceneBox(trackRef, copyRef, portrait || tall);
  // A2: hand-off as the hero leaves (wrapper transforms only — the scene is untouched).
  const { scrollYProgress: leave, scrollY } = useScroll({ target: trackRef, offset: ["start start", "end start"] });
  const sceneY = useTransform(leave, [0, 1], ["0%", "-10%"]);
  const sceneScale = useTransform(leave, [0, 1], [1, 0.95]);
  const sceneO = useTransform(leave, [0, 1], [1, 0.55]);
  const copyY = useTransform(leave, [0, 0.5], [0, -40]);
  const copyO = useTransform(leave, [0.04, 0.5], [1, 0]);
  // A3: the cue goes on the first 40 px of scroll.
  const cueO = useTransform(scrollY, [0, 40], [1, 0]);
  // The 3D caption belongs to the hero: it goes before the next chapter scrolls up under it.
  const capO = useTransform(leave, [0.02, 0.3], [1, 0]);
  return (
    <section ref={trackRef} id={id} aria-label={label} className="relative h-svh min-h-[520px] overflow-hidden lg:min-h-[600px] bg-transparent text-[#F2F5F2] [@media(max-height:520px)_and_(orientation:landscape)_and_(max-width:1023px)]:min-h-[360px]">
      <motion.div className="absolute inset-0" style={on ? { y: sceneY, scale: sceneScale, opacity: sceneO } : { y: 0, scale: 1, opacity: 1 }}>
        <Poster left={posterLeft} />
        {webgl !== false && mounted && sceneReady ? <div className="absolute inset-x-0" style={box ? { top: box.top, height: box.height } : { top: 0, bottom: 0 }}>{scene({ progress: zero, active, still: reduced, portrait: portrait || tall, lite })}</div> : null}
      </motion.div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-[rgba(4,4,4,0.85)] from-35% via-[rgba(4,4,4,0.55)] via-65% to-transparent lg:hidden [@media(min-width:1024px)_and_(orientation:portrait)]:block [@media(max-height:520px)_and_(orientation:landscape)_and_(max-width:1023px)]:inset-y-0 [@media(max-height:520px)_and_(orientation:landscape)_and_(max-width:1023px)]:left-0 [@media(max-height:520px)_and_(orientation:landscape)_and_(max-width:1023px)]:right-auto [@media(max-height:520px)_and_(orientation:landscape)_and_(max-width:1023px)]:h-auto [@media(max-height:520px)_and_(orientation:landscape)_and_(max-width:1023px)]:w-[70%] [@media(max-height:520px)_and_(orientation:landscape)_and_(max-width:1023px)]:bg-gradient-to-r" />
      <div
        ref={copyRef}
        data-afv-enter={PLATFORM_MOTION ? "wait" : undefined}
        // Short landscape phones: a left column under the navbar, scaled to fit (spec §8); its links
        // are made taller first, so they stay ≥ 40 px tap targets after the .7 scale.
        className="absolute inset-x-5 bottom-8 sm:inset-x-8 lg:inset-x-auto lg:bottom-auto lg:left-16 lg:top-1/2 lg:w-[min(36rem,44vw)] lg:-translate-y-[44%] [@media(min-width:1024px)_and_(orientation:portrait)]:bottom-20 [@media(min-width:1024px)_and_(orientation:portrait)]:top-auto [@media(min-width:1024px)_and_(orientation:portrait)]:w-[min(40rem,70vw)] [@media(min-width:1024px)_and_(orientation:portrait)]:translate-y-0 [@media(max-height:520px)_and_(orientation:landscape)_and_(max-width:1023px)]:bottom-auto [@media(max-height:520px)_and_(orientation:landscape)_and_(max-width:1023px)]:right-auto [@media(max-height:520px)_and_(orientation:landscape)_and_(max-width:1023px)]:top-[80px] [@media(max-height:520px)_and_(orientation:landscape)_and_(max-width:1023px)]:w-[min(36rem,74vw)] [@media(max-height:520px)_and_(orientation:landscape)_and_(max-width:1023px)]:origin-top-left [@media(max-height:520px)_and_(orientation:landscape)_and_(max-width:1023px)]:scale-[.7] [@media(max-height:520px)_and_(orientation:landscape)_and_(max-width:1023px)]:[&_a]:min-h-[58px]"
      >
        <motion.div style={on ? { y: copyY, opacity: copyO } : { y: 0, opacity: 1 }}>
          <div data-afv-copy="" className="lg:hidden">
            {copy(true)}
          </div>
          <div data-afv-copy="" className="hidden lg:block">
            {copy(false)}
          </div>
        </motion.div>
      </div>
      {on ? (
        <motion.p aria-hidden="true" data-afv-cue="" style={{ opacity: cueO }} className={`${MONO} pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[9.5px] text-[#7E8F85] lg:bottom-9 lg:left-16 lg:translate-x-0`}>
          {/* The label is CSS content, so it never joins the page copy (tests read the text). */}
          <span className="flex items-center gap-2 after:content-['Scroll']">
            <span className="h-px w-6 bg-[#A8DEC2]" />
          </span>
        </motion.p>
      ) : null}
      <motion.p style={on ? { opacity: capO } : undefined} className={`${MONO} pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 text-[10px] text-[#7E8F85] lg:block`}>
        Illustrative 3D · prices real where labelled
      </motion.p>
    </section>
  );
}
