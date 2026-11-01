"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { CORE_SIZE, cameraViewport, createCameraTrack, sampleCameraTrack, type CameraKey } from "@/modules/afvarOs";

/** A transparent capture of the live shader at phase zero. It uses the live
 * camera projection so lazy loading never changes the orb's size or center. */
export function CorePoster({ ready, keys, progress, scale, fov, belowHeader, compact }: {
  ready: boolean;
  keys: readonly CameraKey[];
  progress: number;
  scale: number;
  fov: number;
  belowHeader: boolean;
  compact: boolean;
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
      element.style.setProperty("--core-poster-x", `${(center.x + 1) * width / 2}px`);
      element.style.setProperty("--core-poster-y", `${(1 - center.y) * height / 2}px`);
      // The captured frame includes a transparent corona around the shell.
      element.style.setProperty("--core-poster-size", `${diameter * 1.65}px`);
      element.dataset.framed = "true";
    }

    frame();
    const observer = new ResizeObserver(frame);
    observer.observe(element);
    return () => {
      observer.disconnect();
      delete element.dataset.framed;
    };
  }, [ready, keys, progress, scale, fov, belowHeader]);

  return (
    <div ref={host} aria-hidden="true" className="home-core-poster absolute inset-0">
      <div className="home-story-orb">
        <Image src={compact ? "/home-core/hero-poster-compact.webp" : "/home-core/hero-poster.webp"}
          alt="" fill unoptimized loading="eager" sizes="100vw" />
      </div>
    </div>
  );
}
