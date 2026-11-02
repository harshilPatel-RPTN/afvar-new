// The Pricing hero's tiers must stay whole on every desktop shape: wide
// screens keep the designed set, near-square and upright ones shrink it to fit
// between the copy and the right edge. Zoom and offset come from the real
// desktop framing, as the live camera uses them.
import { describe, expect, it } from "vitest";
import { cameraViewport } from "@/modules/afvarOs";
import { TIERS_X, tiersFit } from "../film/hero/tiersFit";

const FOV = 38;
// The set's reach either side of its origin at full size (plate + tiers, in perspective).
const LEFT = 1.99;
const RIGHT = 2.43;

function at(width: number, height: number) {
  const { zoom, shift } = cameraViewport(width, height, false);
  return tiersFit({ fov: FOV, zoom, width, height, offsetX: -shift });
}

describe("pricing tiers fit", () => {
  it.each([
    [1920, 1080],
    [1440, 900],
    [1280, 720],
    [1024, 768],
  ])("keeps the designed set on %i×%i", (w, h) => {
    expect(at(w, h)).toMatchObject({ fit: 1, x: TIERS_X });
  });

  it.each([
    [1024, 900],
    [1100, 1000],
    [1280, 1024],
    [1024, 1366],
  ])("shrinks the set inside the screen on %i×%i", (w, h) => {
    const { fit, x, edge } = at(w, h);
    expect(fit).toBeLessThan(1);
    expect(x + RIGHT * fit).toBeLessThanOrEqual(edge);
    // Clear of the copy column, which ends near the screen centre (x ≈ -1.45).
    expect(x - LEFT * fit).toBeGreaterThan(-1.5);
  });

  it("shrinks further as the screen gets taller", () => {
    const fits = [800, 900, 1024, 1366].map((h) => at(1024, h).fit);
    fits.slice(1).forEach((f, i) => expect(f).toBeLessThanOrEqual(fits[i]));
  });

  it("never collapses the set on extreme shapes", () => {
    expect(at(1024, 3000).fit).toBeGreaterThanOrEqual(0.45);
  });
});
