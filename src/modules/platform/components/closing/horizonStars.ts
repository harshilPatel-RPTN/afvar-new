/**
 * Deterministic star field (same on server and client): x/y in %, size in px,
 * twinkle delay/duration in s. Shaped like a real sky: a magnitude distribution
 * (most stars faint and small, a handful bright), colour temperatures (cool
 * blue-whites dominate, with the odd warm orange and hot blue star), varied
 * base brightness, and a soft glow only on the bright ones.
 */
export const horizonStars = Array.from({ length: 180 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  // Rounded so tiny Math.sin differences between Node and the browser cannot cause a hydration mismatch.
  const round = (v: number) => Math.round(v * 10) / 10;
  const m = r(3); // magnitude
  const size = m < 0.55 ? 1 : m < 0.85 ? 1.5 : m < 0.96 ? 2.5 : 3.5;
  const hue = r(6);
  const color = hue < 0.1 ? "#FFD9A8" : hue < 0.18 ? "#BFD4FF" : hue < 0.5 ? "#FFFFFF" : "#E7EDF6";
  return { x: round(r(1) * 100), y: round(r(2) * 52), size, color, alpha: round(4.5 + r(7) * 5.5) / 10, delay: round(r(4) * 6), duration: round(2.5 + r(5) * 4) };
});
