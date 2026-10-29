"use client";

// MARKET TERRAIN, live: the hero's 3D scene (MarketTerrainScene) rendered in
// real time in `lite` mode — no image assets. Draws only when the timeline
// value u moves (intro / scroll), so an idle hero costs nothing. Until the
// lazily loaded scene has drawn its first frame the hero's dark background
// shows; then the canvas fades in and `onReady` tells the timeline owner (Hero)
// so the intro starts from a live canvas. `still` (reduced motion) renders one
// fixed establish frame. No WebGL → the dark background only.
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

// Lazy: three.js stays out of the main homepage bundle and loads after first paint.
const MarketTerrainScene = dynamic(() => import("./MarketTerrainScene"), { ssr: false });

let webgl: boolean | null = null;
function hasWebGL() {
  if (webgl === null) {
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") ?? c.getContext("webgl"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}
const noop = () => () => {};

export type HeroView = "desktop" | "mobile";

/**
 * Render-on-demand driver: request a frame whenever u moves (and once on start).
 * Uses R3F's GLOBAL invalidate (every live root) rather than a store-bound one:
 * under React StrictMode the Canvas mounts twice and a store-bound invalidate can
 * belong to the orphaned (inactive) root, which silently drops every request —
 * the canvas then freezes on its first frame. The fiber module is already part of
 * the lazily loaded scene chunk, so this import costs nothing extra.
 */
function useTimelineInvalidate(progressRef: RefObject<number>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let dead = false;
    let last = Number.NaN;
    import("@react-three/fiber").then(({ invalidate }) => {
      if (dead) return;
      const tick = () => {
        const u = progressRef.current ?? 0;
        if (u !== last) {
          last = u;
          invalidate();
        }
        raf = requestAnimationFrame(tick);
      };
      tick();
    });
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
    };
  }, [progressRef, enabled]);
}

export function HeroLive({
  progressRef,
  view,
  active,
  still = false,
  onReady,
}: {
  progressRef: RefObject<number>;
  view: HeroView;
  active: boolean;
  /** Reduced motion: one static establish frame, no timeline. */
  still?: boolean;
  /** Fired once, after the live canvas has drawn its first frame. */
  onReady?: () => void;
}) {
  const canRender = useSyncExternalStore(noop, hasWebGL, () => false);
  const [ready, setReady] = useState(false);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  const handleReady = useCallback(() => {
    setReady(true);
    onReadyRef.current?.();
  }, []);

  useTimelineInvalidate(progressRef, canRender && ready && active && !still);

  if (!canRender) return null;
  return (
    // Hidden until a real frame is on it, then a 700ms dissolve in from the dark background.
    <div className={`absolute inset-0 transition-opacity duration-700 ease-out ${ready ? "opacity-100" : "opacity-0"}`}>
      <MarketTerrainScene progress={progressRef} active={active && !still} still={still} lite view={view} onReady={handleReady} />
    </div>
  );
}
