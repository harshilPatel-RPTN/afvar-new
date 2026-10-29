"use client";

// Warms every chapter's 3D scene code once the page has settled: the chunks
// download while the browser is idle, so a scene that scrolls into view only
// has to create its canvas — not fetch and parse its code first. (Each chapter
// shows its poster underneath until the scene's first frame paints over it.)
import { useEffect } from "react";

const SCENES = [
  () => import("./OriginScene"),
  () => import("./MarketWorldScene"),
  () => import("./IntelligenceScene"),
  () => import("./ContextScene"),
  () => import("./AlertsScene"),
  () => import("./RiskScene"),
  () => import("./JournalScene"),
  () => import("./CommunityScene"),
  () => import("./WhyScene"),
  () => import("./DeskScene"),
];

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };

export function ScenePrefetch() {
  useEffect(() => {
    const w = window as IdleWindow;
    let i = 0;
    let handle: number | undefined;
    // One chunk per idle slot, so prefetching never competes with scrolling.
    const next = () => {
      if (i >= SCENES.length) return;
      void SCENES[i++]().catch(() => {});
      handle = w.requestIdleCallback ? w.requestIdleCallback(next, { timeout: 2000 }) : window.setTimeout(next, 300);
    };
    const start = window.setTimeout(next, 1500);
    return () => {
      window.clearTimeout(start);
      if (handle !== undefined) (w.cancelIdleCallback ?? window.clearTimeout)(handle);
    };
  }, []);
  return null;
}
