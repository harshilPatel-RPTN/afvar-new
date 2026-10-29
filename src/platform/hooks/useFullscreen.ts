"use client";

import { useSyncExternalStore, type RefObject } from "react";

type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
};
type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

const doc = () => document as WebkitDocument;
const fullscreenElement = () => doc().fullscreenElement ?? doc().webkitFullscreenElement ?? null;

function subscribe(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange);
  return () => {
    document.removeEventListener("fullscreenchange", onChange);
    document.removeEventListener("webkitfullscreenchange", onChange);
  };
}
const noopSubscribe = () => () => {};

/** `isSupported` is false where the API is missing (e.g. iPhone Safari). */
export function useFullscreen(target?: RefObject<HTMLElement | null>) {
  const isFullscreen = useSyncExternalStore(
    subscribe,
    () => Boolean(fullscreenElement()),
    () => false,
  );
  const isSupported = useSyncExternalStore(
    noopSubscribe,
    () => Boolean(doc().fullscreenEnabled ?? doc().webkitFullscreenEnabled),
    () => true,
  );

  /** Must run inside a user gesture. */
  const enter = async () => {
    const element = (target?.current ?? document.documentElement) as WebkitElement;
    const request = element.requestFullscreen ?? element.webkitRequestFullscreen;
    if (!request) return false;
    try {
      await request.call(element);
      return true;
    } catch {
      return false;
    }
  };

  const exit = async () => {
    if (!fullscreenElement()) return;
    try {
      await (doc().exitFullscreen ?? doc().webkitExitFullscreen)?.call(doc());
    } catch {
      // Already exited (e.g. via Esc).
    }
  };

  const toggle = () => {
    if (fullscreenElement()) void exit();
    else void enter();
  };

  return { isFullscreen, isSupported, enter, exit, toggle };
}
