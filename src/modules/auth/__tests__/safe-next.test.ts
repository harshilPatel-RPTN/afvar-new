import { describe, expect, it } from "vitest";
import { safeNext } from "../components/AuthCard";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/markets?x=1")).toBe("/markets?x=1");
  });

  it("rejects anything that could leave the site", () => {
    for (const next of ["//evil.com", "/\\evil.com", "/\\/evil.com", "https://evil.com", "evil.com", "/ok\\..\\x", null]) {
      expect(safeNext(next, "/fallback"), String(next)).toBe("/fallback");
    }
  });
});
