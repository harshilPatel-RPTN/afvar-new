// Real hourly closes → scene points. Prices are never invented: a line is
// drawn only from the closes the feed returned (live, delayed or the stored
// snapshot), scaled into a box.
import * as THREE from "three";
import { COLORS } from "@/modules/afvarOs";

export interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z?: number;
}

/** min/max of a series (a flat series gets a tiny range so it draws as a level line). */
export function rangeOf(closes: readonly number[]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const c of closes) {
    if (c < lo) lo = c;
    if (c > hi) hi = c;
  }
  if (!(hi > lo)) return [lo - 1, hi + 1];
  return [lo, hi];
}

/** The closes as points spread over [x0, x1], scaled into [y0, y1]. */
export function closesPoints(closes: readonly number[], box: Box): THREE.Vector3[] {
  const [lo, hi] = rangeOf(closes);
  const n = closes.length;
  return closes.map((c, i) => new THREE.Vector3(box.x0 + ((box.x1 - box.x0) * i) / Math.max(1, n - 1), box.y0 + ((c - lo) / (hi - lo)) * (box.y1 - box.y0), box.z ?? 0));
}

/** Green when the window closed higher than it opened, red when lower (the chart rule). */
export function dirColor(closes: readonly number[]): string {
  return closes.length > 1 && closes[closes.length - 1] < closes[0] ? COLORS.down : COLORS.up;
}
