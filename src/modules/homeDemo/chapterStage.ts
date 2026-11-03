"use client";

// Shared environment + master-timeline wiring for every chapter's sticky
// stage: reduced-motion, desktop and WebGL detection, and one deterministic
// scrollYProgress over the chapter track that feeds both the scene (via ref,
// no re-renders) and the DOM reveal windows.
import { useInView, useMotionValueEvent, useScroll, type MotionValue } from "framer-motion";
import { useMotionReduced } from "./motionPref";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface ChapterStage {
  trackRef: RefObject<HTMLElement | null>;
  progressRef: RefObject<number>;
  scrollYProgress: MotionValue<number>;
  /** Scroll storytelling runs only on lg+ without reduced motion. */
  cinematic: boolean;
  /** Render loop may run (chapter near viewport). */
  active: boolean;
  /** The WebGL scene should exist at all — about one screen ahead and behind.
   *  Far-away chapters drop their canvas so only ~2 GPU contexts are alive. */
  mounted: boolean;
  /** null until probed; false → CSS poster fallback. */
  webgl: boolean | null;
  /** prefers-reduced-motion: scenes render one composed static frame. */
  reduced: boolean;
  /** Mobile / tablet: attach to the scene box. When it scrolls into view the
   *  chapter's closing beat plays once (~1 s, via the progress damper). */
  revealRef: RefObject<HTMLDivElement | null>;
}

/** WebGL support, probed once per page load. The probe context is released
 *  right away: each chapter used to keep its own until GC, pushing the page
 *  past the browser's live-context limit ("Too many active WebGL contexts"). */
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

/** How much of the story the one-time mobile reveal replays before settling. */
const REVEAL_SPAN = 0.3;

export function useChapterStage(settledP: number): ChapterStage {
  const trackRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef(0);

  const reduceHint = useMotionReduced();
  const [still, setStill] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  useIsoLayoutEffect(() => setStill(Boolean(reduceHint)), [reduceHint]);
  useIsoLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    setWebgl(probeWebGL());
    return () => mq.removeEventListener("change", update);
  }, []);

  const cinematic = desktop && !still;

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (cinematic) progressRef.current = value;
  });
  // Non-cinematic: hold just before the settled frame until the scene box is
  // in view, then target the settled frame — the damper turns that into a
  // short, touch-friendly reveal. Reduced motion goes straight to settled.
  const revealRef = useRef<HTMLDivElement | null>(null);
  const revealed = useInView(revealRef, { once: true, amount: 0.35 });
  useEffect(() => {
    if (cinematic) progressRef.current = scrollYProgress.get();
    else progressRef.current = still || revealed ? settledP : Math.max(0, settledP - REVEAL_SPAN);
  }, [cinematic, scrollYProgress, settledP, still, revealed]);

  const active = useInView(trackRef, { margin: "300px" });
  const mounted = useInView(trackRef, { margin: "120% 0px 120% 0px" });

  return { trackRef, progressRef, scrollYProgress, cinematic, active, mounted, webgl, reduced: still, revealRef };
}
