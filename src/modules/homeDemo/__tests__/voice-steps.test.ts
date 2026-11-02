// Narrated step lists: a line's envelope is split into its sentences at the longest pauses,
// so each step can tick in exactly as the avatar starts talking about it.
import { describe, expect, it } from "vitest";
import { splitEnvelope } from "../ai/voice";

const FPS = 30;
// Six voiced runs (sentences) with short dips inside them and longer pauses between them.
const sentence = (n: number) => "5".repeat(n) + "1" + "6".repeat(n) + "0" + "4".repeat(n);
const runs = [8, 5, 9, 6, 7, 4].map(sentence);
const pauses = ["000", "0110", "00000", "0001", "010"];
const env = "00000" + runs.map((r, i) => r + (pauses[i] ?? "")).join("") + "0000000000";
const starts = runs.map((_, i) => 5 + runs.slice(0, i).reduce((n, r, k) => n + r.length + pauses[k].length, 0));

describe("splitEnvelope", () => {
  it("starts each of six sentences on its first voiced frame", () => {
    expect(splitEnvelope(env, 6)).toEqual(starts.map((f) => f / FPS));
  });

  it("cuts only at the longest pauses when asked for fewer parts", () => {
    // The longest pause ("00000") comes before sentence 4; of the tie ("0110" / "0001") the earlier wins, before sentence 3.
    expect(splitEnvelope(env, 3)).toEqual([starts[0], starts[2], starts[3]].map((f) => f / FPS));
  });

  it("never starts parts it has no pause for, and an empty envelope starts none", () => {
    expect(splitEnvelope("0055500", 2)).toEqual([2 / FPS, Infinity]);
    expect(splitEnvelope("", 6)).toEqual(Array(6).fill(Infinity));
  });
});
