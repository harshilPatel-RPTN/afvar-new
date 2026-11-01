// The centrepieces draw real closes only: these helpers must keep every close,
// scale it into the box without inventing values, and colour by direction.
import { describe, expect, it } from "vitest";
import { COLORS } from "@/modules/afvarOs";
import { closesPoints, dirColor, rangeOf } from "../film/parts/closes";

describe("closes → scene points", () => {
  const closes = [4010, 4025.5, 4002, 4037.2];
  const box = { x0: -2, x1: 2, y0: 0.5, y1: 1.5, z: -0.3 };

  it("keeps one point per close, spread over the box, lowest and highest on its edges", () => {
    const pts = closesPoints(closes, box);
    expect(pts).toHaveLength(closes.length);
    expect(pts[0].x).toBeCloseTo(-2);
    expect(pts[pts.length - 1].x).toBeCloseTo(2);
    expect(Math.min(...pts.map((p) => p.y))).toBeCloseTo(0.5);
    expect(Math.max(...pts.map((p) => p.y))).toBeCloseTo(1.5);
    expect(pts.every((p) => p.z === -0.3)).toBe(true);
  });

  it("keeps the order of the closes (no smoothing, no resampling)", () => {
    const ys = closesPoints(closes, box).map((p) => p.y);
    const [lo, hi] = rangeOf(closes);
    closes.forEach((c, i) => expect(ys[i]).toBeCloseTo(0.5 + ((c - lo) / (hi - lo)) * 1));
  });

  it("draws a flat series as a level line instead of failing", () => {
    const pts = closesPoints([1.1, 1.1, 1.1], box);
    expect(pts.every((p) => Number.isFinite(p.y))).toBe(true);
    expect(new Set(pts.map((p) => p.y.toFixed(6))).size).toBe(1);
  });

  it("is green when the window closed higher and red when lower", () => {
    expect(dirColor([1, 2])).toBe(COLORS.up);
    expect(dirColor([2, 1])).toBe(COLORS.down);
  });
});
