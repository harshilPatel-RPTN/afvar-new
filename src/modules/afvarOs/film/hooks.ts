"use client";

// Environment hooks every AFVAR scroll film shares (home, platform, …):
// which cut to play, when the 3D stage may start, the avatar warm-up, and the
// hand-off with the site's floating extras.
import type { MotionValue } from "framer-motion";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getAvatarRig, scheduleAvatarBuild } from "../avatar/rig";
import { useStep } from "../story/components";
import { useAfvarReducedMotion } from "../story/useStory";
import { setFilmOnScreen } from "./presence";

/** A media query as state; null while hydrating (server render). */
export function useMedia(query: string): boolean | null {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => null,
  );
}

/** True once the site's intro splash is gone (or 6 s passed) and the browser is idle. */
export function useSceneReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    let idle = 0;
    const started = performance.now();
    const go = () => setReady(true);
    const poll = window.setInterval(() => {
      if (document.querySelector("[data-afvar-splash]") && performance.now() - started < 6000) return;
      window.clearInterval(poll);
      idle = w.requestIdleCallback ? w.requestIdleCallback(go, { timeout: 1200 }) : window.setTimeout(go, 200);
    }, 200);
    return () => {
      window.clearInterval(poll);
      if (w.cancelIdleCallback) w.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);
  return ready;
}

export type FilmMode = "boot" | "desktop" | "compact" | "stacked";

/**
 * Which cut of a film to play:
 *   desktop (≥1024px) the full cut, with OS screens
 *   compact           phones and tablets — the same continuous film without OS screens
 *   stacked           reduced motion only — the same acts as plain sections
 *   boot              server render / first paint, before the client knows
 */
export function useFilmMode() {
  const reduced = useAfvarReducedMotion();
  const wide = useMedia("(min-width: 1024px)");
  const portraitMq = useMedia("(orientation: portrait)");
  const coarse = useMedia("(pointer: coarse)");
  const mode: FilmMode = wide === null ? "boot" : reduced ? "stacked" : wide ? "desktop" : "compact";
  const portrait = mode === "compact" && portraitMq === true;
  /** Lighter scene for small / touch GPUs. */
  const lite = mode === "compact" || coarse === true;
  return { mode, wide, portrait, lite, reduced };
}

/**
 * Builds the 292k-triangle avatar once, in idle time ~2 s after the 3D stage
 * starts, and guarantees it is built once the film passes `guaranteeAt`.
 */
export function useAvatarWarmup(enabled: boolean, mv: MotionValue<number>, guaranteeAt: number) {
  useEffect(() => {
    if (!enabled) return;
    let cancel = () => {};
    const id = window.setTimeout(() => (cancel = scheduleAvatarBuild(1500)), 2000);
    return () => {
      window.clearTimeout(id);
      cancel();
    };
  }, [enabled]);
  const near = useStep(mv, [guaranteeAt]) >= 0;
  useEffect(() => {
    if (enabled && near) getAvatarRig();
  }, [enabled, near]);
}

/**
 * Tells the site's floating extras that a film is playing (sound switch shrinks,
 * launch reminder waits) and moves the live-avatar launcher aside while `hideLauncher`.
 */
export function useFilmPresence(active: boolean, mode: FilmMode, hideLauncher: boolean) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("afvar:avatar", { detail: { launcher: hideLauncher ? "hide" : "show" } }));
  }, [hideLauncher]);
  useEffect(() => () => void window.dispatchEvent(new CustomEvent("afvar:avatar", { detail: { launcher: "show" } })), []);
  useEffect(() => {
    setFilmOnScreen(active && mode !== "stacked" && mode !== "boot");
    return () => setFilmOnScreen(false);
  }, [active, mode]);
}
