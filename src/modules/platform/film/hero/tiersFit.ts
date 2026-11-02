// Fit of the Pricing hero's tiers on desktop framing. cameraViewport is tuned
// for wide screens, so near-square or upright desktops (1024×900, 1280×1024,
// 1024×1366) would crop the right tier. From the camera's live fov, zoom and
// view offset, find where the screen's right edge lands at z = 0, then shrink
// the set and slide it left to sit between the copy (screen centre,
// x ≈ -1.45) and that edge. Wide screens keep the set as designed.

/** The set's designed x; the copy column ends near the screen centre. */
export const TIERS_X = 0.45;
const CENTRE = -1.45;
const DIST = 8.2;

export function tiersFit({ fov, zoom, width, height, offsetX = 0 }: { fov: number; zoom: number; width: number; height: number; offsetX?: number }) {
  const half = ((DIST * Math.tan((fov * Math.PI) / 360)) / zoom) * (width / height);
  const edge = CENTRE + half * (1 + (2 * offsetX) / width);
  const fit = Math.max(0.45, Math.min(1, (edge + 1.2) / 4.25));
  const x = fit < 1 ? Math.min(TIERS_X, edge - 0.15 - 2.43 * fit) : TIERS_X;
  return { fit, x, edge };
}
