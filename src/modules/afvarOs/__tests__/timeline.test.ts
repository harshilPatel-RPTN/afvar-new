import { describe, expect, it } from "vitest";
import { defineStory, ramp, sampleKeys, window4 } from "../story/timeline";

describe("defineStory", () => {
  const story = defineStory([
    { id: "a", vh: 100, label: "A" },
    { id: "b", vh: 300, label: "B" },
  ] as const);

  it("splits progress by scroll length", () => {
    expect(story.range.a).toEqual([0, 0.25]);
    expect(story.range.b).toEqual([0.25, 1]);
    expect(story.totalVh).toBe(400);
  });

  it("maps act fractions and finds the act at p", () => {
    expect(story.at("b", 0.5)).toBeCloseTo(0.625);
    expect(story.actAt(0.1)).toBe("a");
    expect(story.actAt(0.9)).toBe("b");
    expect(story.local(0.625, "b")).toBeCloseTo(0.5);
  });

  it("starts the first act visible and keeps the last one", () => {
    expect(window4(0, story.copy.a)).toBe(1);
    expect(window4(1, story.copy.b)).toBe(1);
  });
});

describe("sampleKeys", () => {
  const keys = [
    { at: 0.2, x: 0 },
    { at: 0.6, x: 10 },
  ];
  it("clamps before and after the keys", () => {
    expect(sampleKeys(keys, 0).x).toBe(0);
    expect(sampleKeys(keys, 1).x).toBe(10);
  });
  it("interpolates between keys", () => {
    expect(sampleKeys(keys, 0.4).x).toBeCloseTo(5);
  });
});

describe("ramp", () => {
  it("is 0..1 inside the range", () => {
    expect(ramp(0.5, 0, 1)).toBe(0.5);
    expect(ramp(2, 0, 1)).toBe(1);
  });
});
