"use client";

// Motion preference for /home-demo: the OS "reduce motion" setting OR the
// in-page toggle (WCAG 2.3.3 — motion from interactions can be turned off
// without changing system settings). Remembered per visitor; mirrored onto
// <html data-reduce-motion> so CSS-only motion (ticker, CTA fills) obeys too.
import { useReducedMotion } from "framer-motion";
import { useSyncExternalStore } from "react";

const KEY = "afvar-demo-reduce-motion";
let forced = false;
let wired = false;
const listeners = new Set<() => void>();

function wire() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  try {
    forced = localStorage.getItem(KEY) === "on";
  } catch {
    forced = false;
  }
  document.documentElement.dataset.reduceMotion = String(forced);
}

function subscribe(cb: () => void) {
  wire();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setMotionReduced(on: boolean) {
  wire();
  forced = on;
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* session only */
  }
  document.documentElement.dataset.reduceMotion = String(on);
  listeners.forEach((l) => l());
}

/** The page toggle alone: [forced, set]. */
export function useMotionToggle(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, () => forced, () => false);
  return [on, setMotionReduced];
}

const noopSubscribe = () => () => {};

/** True when motion should be reduced — OS preference or page toggle.
 *  Reports false while hydrating (the server can't know the OS setting), so
 *  server and first client render always match; it updates right after. */
export function useMotionReduced(): boolean {
  const os = useReducedMotion();
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [on] = useMotionToggle();
  return (hydrated && Boolean(os)) || on;
}

/** Non-React read (audio engine). */
export function isMotionReduced(): boolean {
  if (typeof window === "undefined") return false;
  wire();
  return forced || Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}
