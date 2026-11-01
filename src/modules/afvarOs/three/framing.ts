import { CatmullRomCurve3, Vector3 } from "three";
import { easeInOut, ramp } from "../story/timeline";

export type CameraKey = { at: number; pos: readonly [number, number, number]; look: readonly [number, number, number] };

export function createCameraTrack(keys: readonly CameraKey[]) {
  return {
    keys,
    position: new CatmullRomCurve3(keys.map(key => new Vector3(...key.pos)), false, "centripetal"),
    look: new CatmullRomCurve3(keys.map(key => new Vector3(...key.look)), false, "centripetal"),
  };
}

export function sampleCameraTrack(track: ReturnType<typeof createCameraTrack>, progress: number, position: Vector3, look: Vector3) {
  let index = 0;
  while (index < track.keys.length - 2 && progress > track.keys[index + 1].at) index++;
  const t = easeInOut(ramp(progress, track.keys[index].at, track.keys[index + 1].at));
  const u = (index + t) / (track.keys.length - 1);
  track.position.getPoint(u, position);
  track.look.getPoint(u, look);
}

/** Shared by the live camera and its first-frame poster, including width caps. */
export function cameraViewport(width: number, height: number, belowHeader: boolean) {
  const landscape = width >= height * 1.2;
  const k = landscape ? Math.min(1, Math.max(0, (1680 - width) / 656)) : 0;
  return {
    zoom: Math.round((1 - .28 * k ** 1.5) * 1000) / 1000,
    shift: Math.round(width * .045 * Math.min(1, k * 1.6)),
    drop: !belowHeader && landscape ? Math.round(Math.min(28, Math.max(0, (900 - height) * .15))) : 0,
  };
}
