// Shared timeline math for every /home-demo chapter: one progress value,
// pure functions, no per-frame allocation.

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0→1 inside [a,b]. */
export const ramp = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
/** In/out window from [inStart, inEnd, outStart, outEnd]. */
export const window4 = (p: number, [a, b, c, d]: readonly [number, number, number, number]) =>
  ramp(p, a, b) * (1 - ramp(p, c, d));
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
