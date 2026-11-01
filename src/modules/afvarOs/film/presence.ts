"use client";

// "Is a scroll film on screen?" — written by whichever film is playing (home,
// platform…), read by the page's floating extras (sound switch, launch
// reminder) so nothing floats over a film's captions.
import { useSyncExternalStore } from "react";

let onScreen = false;
const listeners = new Set<() => void>();

export function setFilmOnScreen(value: boolean) {
  if (value === onScreen) return;
  onScreen = value;
  listeners.forEach((l) => l());
}

export function useFilmOnScreen(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => onScreen,
    () => false,
  );
}
