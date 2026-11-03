"use client";

// The sticky-stage wiring every scroll story shares: environment detection
// (desktop, WebGL, reduced motion), one deterministic scrollYProgress over the
// story track, and a ref copy of it for the WebGL scene (no re-renders).
//
//   const s = useStory({ settledP: 0.02 });
//   <section ref={s.trackRef} style={s.cinematic ? { height: `${story.totalVh}vh` } : undefined}>
//     <div className="sticky top-0 h-svh">…scene(progress={s.progressRef}) + overlays(mv={s.progress})…</div>
//   </section>
import { useInView, useMotionValueEvent, useReducedMotion, useScroll, type MotionValue } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/* ------------------------------------------------------- motion preference */

// The site's own "reduce motion" switch mirrors itself onto
// <html data-reduce-motion="true">; the OS setting comes from the media query.
function subscribeHtmlFlag(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-reduce-motion"] });
  return () => mo.disconnect();
}
const readHtmlFlag = () => document.documentElement.dataset.reduceMotion === "true";

/** True when motion should be reduced — OS setting or the site switch. False while hydrating. */
export function useAfvarReducedMotion(): boolean {
  const os = useReducedMotion();
  const site = useSyncExternalStore(subscribeHtmlFlag, readHtmlFlag, () => false);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return hydrated && (Boolean(os) || site);
}

/** Non-React read, for click handlers. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return readHtmlFlag() || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ---------------------------------------------------------------- stage */

export interface StoryStage {
  trackRef: RefObject<HTMLElement | null>;
  /** Raw master progress for WebGL (read in useFrame). */
  progressRef: RefObject<number>;
  /** Raw master progress for DOM overlays. */
  progress: MotionValue<number>;
  /** Scroll storytelling runs on lg+ without reduced motion. */
  cinematic: boolean;
  /** Render loop may run (track near the viewport). */
  active: boolean;
  /** The WebGL scene should exist (about a screen ahead / behind). */
  mounted: boolean;
  /** null until probed; false → CSS poster fallback. */
  webgl: boolean | null;
  reduced: boolean;
  /** Stacked layout: attach to the scene box; its reveal plays once in view. */
  revealRef: RefObject<HTMLDivElement | null>;
}

/** WebGL support, probed once per page load. The probe context is released
 *  right away so per-stage probes never pile up toward the browser's
 *  live-context limit ("Too many active WebGL contexts"). */
let webglProbe: boolean | null = null;
function probeWebGL(): boolean {
  if (webglProbe === null) {
    try {
      const probe = document.createElement("canvas");
      const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
      webglProbe = Boolean(gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webglProbe = false;
    }
  }
  return webglProbe;
}

export function useStory({
  settledP,
  revealSpan = 0.3,
  minWidth = 1024,
  persist = false,
}: {
  settledP: number;
  revealSpan?: number;
  minWidth?: number;
  /** Once the scene has mounted, keep it mounted (paused by `active`) instead of tearing the WebGL root down out of view. */
  persist?: boolean;
}): StoryStage {
  const trackRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef(0);
  const reduced = useAfvarReducedMotion();
  const [desktop, setDesktop] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useIsoLayoutEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    setWebgl(probeWebGL());
    return () => mq.removeEventListener("change", update);
  }, [minWidth]);

  const cinematic = desktop && !reduced;
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (cinematic) progressRef.current = v;
  });

  const revealRef = useRef<HTMLDivElement | null>(null);
  const revealed = useInView(revealRef, { once: true, amount: 0.35 });
  useEffect(() => {
    if (cinematic) progressRef.current = scrollYProgress.get();
    else progressRef.current = reduced || revealed ? settledP : Math.max(0, settledP - revealSpan);
  }, [cinematic, scrollYProgress, settledP, reduced, revealed, revealSpan]);

  const active = useInView(trackRef, { margin: "300px" });
  const near = useInView(trackRef, { margin: "120% 0px 120% 0px" });
  // A persistent stage latches: scrolling back must never rebuild the renderer
  // (new root, shader compile, buffer upload). Off screen it only pauses.
  const [kept, setKept] = useState(false);
  if (persist && near && !kept) setKept(true);
  const mounted = near || kept;

  return { trackRef, progressRef, progress: scrollYProgress, cinematic, active, mounted, webgl, reduced, revealRef };
}
