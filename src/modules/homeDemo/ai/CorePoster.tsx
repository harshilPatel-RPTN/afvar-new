"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { CORE_SIZE, cameraViewport, createCameraTrack, sampleCameraTrack, type CameraKey } from "@/modules/afvarOs";

/** Share of the orb box the lite still paints: the orbit dots ride a 9 % inset
 * and the glow breathes to 1.06× of its 72 % box, so ≈ 84 % of the box. */
const LITE_EXTENT = 0.86;
/** Breathing room kept between the art and the clipping edges, in px. */
const FIT_GAP = 8;

/** Contain-fit the orb box (centre x/y and size, in host px) inside the visible
 * part of `clip`, minus its mask fades. Shrinks only when it would be cut and
 * moves the centre only as far as needed, so roomy screens keep the camera framing. */
function containFit(host: HTMLElement, clip: HTMLElement, x: number, y: number, size: number) {
  const h = host.getBoundingClientRect();
  const c = clip.getBoundingClientRect();
  if (!c.width || !c.height) return { x, y, size };
  // The portrait art row fades its top 6 % and bottom 8 % (mask-image).
  const masked = getComputedStyle(clip).maskImage.includes("gradient");
  const left = c.left - h.left + FIT_GAP;
  const right = c.right - h.left - FIT_GAP;
  const top = c.top - h.top + FIT_GAP + (masked ? c.height * 0.05 : 0);
  const bottom = c.bottom - h.top - FIT_GAP - (masked ? c.height * 0.06 : 0);
  const room = Math.max(0, Math.min(right - left, bottom - top));
  const fitted = Math.min(size, room / LITE_EXTENT);
  const r = fitted * LITE_EXTENT / 2;
  const clamp = (v: number, lo: number, hi: number) => lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v));
  return { x: clamp(x, left + r, right - r), y: clamp(y, top + r, bottom - r), size: fitted };
}

/** A transparent capture of the live shader at phase zero. It uses the live
 * camera projection so lazy loading never changes the orb's size or center.
 * `lite` (phones, tablets, touch): no WebGL follows, so the still breathes with
 * CSS-only halo/orbit layers and the 2D avatar stands in for "Meet AFVAR". */
export function CorePoster({ ready, keys, progress, scale, fov, belowHeader, compact, lite = false, act, hostStyle }: {
  ready: boolean;
  keys: readonly CameraKey[];
  progress: number;
  scale: number;
  fov: number;
  belowHeader: boolean;
  compact: boolean;
  lite?: boolean;
  /** Current act, for the lite stand-in's tint and avatar beat. */
  act?: string;
  /** Placement override for the host (the portrait home centres it on the art row). */
  hostStyle?: CSSProperties;
}) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = host.current;
    if (!element || !ready) return;
    const camera = new PerspectiveCamera(fov);
    const look = new Vector3();
    const center = new Vector3();
    const viewCenter = new Vector3();
    const track = createCameraTrack(keys);
    const radius = CORE_SIZE.shell * scale;

    function frame() {
      if (!element) return;
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (!width || !height) return;
      const { zoom, shift, drop } = cameraViewport(width, height, belowHeader);
      camera.aspect = width / height;
      camera.zoom = zoom;
      sampleCameraTrack(track, progress, camera.position, look);
      camera.lookAt(look);
      camera.setViewOffset(width, height, -shift, -drop, width, height);
      camera.updateMatrixWorld();
      center.set(0, 0, 0).project(camera);
      viewCenter.set(0, 0, 0).applyMatrix4(camera.matrixWorldInverse);
      const depth = -viewCenter.z;
      const focalLength = height * zoom / (2 * Math.tan(fov * Math.PI / 360));
      // Perspective tangent bounds, including the off-axis desktop camera.
      const diameter = 2 * radius * Math.sqrt(depth ** 2 + viewCenter.x ** 2 - radius ** 2)
        / (depth ** 2 - radius ** 2) * focalLength;
      let x = (center.x + 1) * width / 2;
      let y = (1 - center.y) * height / 2;
      // The captured frame includes a transparent corona around the shell.
      let size = diameter * 1.65;
      // No live canvas follows the lite still, so it may leave the camera's
      // projection: contain-fit it inside the box that actually clips it (the
      // art row between the header and the caption, or the stacked intro card).
      if (lite && clip) {
        const fit = containFit(element, clip, x, y, size);
        x = fit.x;
        y = fit.y;
        size = fit.size;
      }
      element.style.setProperty("--core-poster-x", `${x}px`);
      element.style.setProperty("--core-poster-y", `${y}px`);
      element.style.setProperty("--core-poster-size", `${size}px`);
      element.dataset.framed = "true";
    }

    const clip = element.parentElement?.closest<HTMLElement>(".home-story-scene, .home-story-intro-art") ?? null;
    frame();
    const observer = new ResizeObserver(frame);
    observer.observe(element);
    // The portrait art row resizes with the caption under it while the host
    // keeps its full-screen height, so watch the clipping box as well.
    if (lite && clip) observer.observe(clip);
    return () => {
      observer.disconnect();
      delete element.dataset.framed;
    };
  }, [ready, keys, progress, scale, fov, belowHeader, lite]);

  const still = <Image src={compact ? "/home-core/hero-poster-compact.webp" : "/home-core/hero-poster.webp"}
    alt="" fill unoptimized loading="eager" sizes="100vw" />;
  return (
    <div ref={host} aria-hidden="true" className="home-core-poster absolute inset-0" style={hostStyle}
      data-lite={lite || undefined} data-core-act={lite ? act : undefined}>
      <div className="home-story-orb">
        {lite ? <>
          <i className="home-core-glow" />
          <i className="home-core-halo" />
        </> : null}
        {lite ? <div className="home-core-art">{still}</div> : still}
        {lite ? <>
          <i className="home-core-orbit"><b /><b /><b /></i>
          <div className="home-core-avatar">
            <i /><i />
            <Image src="/avatar/launcher.png" alt="" width={214} height={256} unoptimized />
          </div>
        </> : null}
      </div>
    </div>
  );
}
