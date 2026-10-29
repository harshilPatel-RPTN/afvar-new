"use client";

import { useSyncExternalStore } from "react";

/**
 * Minute-resolution local clock. `null` on the server and first hydration
 * pass, so nothing time-dependent mismatches the server HTML.
 */
const subscribe = (notify: () => void) => {
  const t = setInterval(notify, 30_000);
  return () => clearInterval(t);
};
const snapshot = () => Math.floor(Date.now() / 60_000);
const serverSnapshot = () => null;

export function useMinute(): Date | null {
  const minute = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return minute === null ? null : new Date(minute * 60_000);
}

/**
 * Dynamic wallpaper phases, following macos-web's (MIT, PuruVJ) hour-keyed
 * timestamps: the wallpaper changes with the visitor's local time of day.
 */
export type Phase = "dawn" | "day" | "dusk" | "night";

const PHASES: [number, Phase][] = [
  [5, "dawn"],
  [8, "day"],
  [17, "dusk"],
  [19, "night"],
];

export function phaseAt(date: Date | null): Phase {
  if (!date) return "night";
  const h = date.getHours();
  let phase: Phase = "night";
  for (const [from, p] of PHASES) if (h >= from) phase = p;
  return phase;
}
