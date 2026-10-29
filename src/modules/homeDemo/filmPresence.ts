"use client";

// "Is the home film on screen?" — shared by the film (writer) and the page's
// floating extras (readers), so nothing floats over the film's captions.
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
