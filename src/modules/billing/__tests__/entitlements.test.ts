import { describe, expect, it } from "vitest";
import { PLANS, can, dayKey, effectiveEntitlements, nextLocalMidnight, quota } from "../entitlements";

const free = { plan: "free" as const, entitlementsOverride: null, timezone: "Asia/Kolkata" };
const pro = { ...free, plan: "pro" as const };

describe("PLANS", () => {
  it("matches the owner-confirmed freemium table", () => {
    expect(PLANS.free).toEqual({
      ai_prompts_per_day: 1,
      voice_navigation: false,
      voice_answers: false,
      news_delay_minutes: 30,
      saved_layouts: 1,
      alerts_max: 3,
      community_post: true,
    });
    expect(PLANS.pro.ai_prompts_per_day).toBeNull();
    expect(PLANS.pro.news_delay_minutes).toBe(0);
  });
});

describe("can()", () => {
  it("gates boolean features by plan", () => {
    expect(can(free, "voice_navigation")).toBe(false);
    expect(can(pro, "voice_navigation")).toBe(true);
    expect(can(free, "community_post")).toBe(true);
  });

  it("treats a news delay as a restriction", () => {
    expect(can(free, "news_delay_minutes")).toBe(false);
    expect(can(pro, "news_delay_minutes")).toBe(true);
  });

  it("lets the per-user override win over the plan", () => {
    const trial = { ...free, entitlementsOverride: { voice_navigation: true, ai_prompts_per_day: 5 } };
    expect(can(trial, "voice_navigation")).toBe(true);
    expect(effectiveEntitlements(trial).ai_prompts_per_day).toBe(5);
    expect(effectiveEntitlements(trial).news_delay_minutes).toBe(30);
  });
});

describe("quota()", () => {
  it("counts down the free daily prompt and reports when it resets", () => {
    const now = new Date("2026-10-22T10:00:00Z"); // 15:30 in Kolkata
    expect(quota(free, "ai_prompts_per_day", 0, now)).toMatchObject({ limit: 1, used: 0, remaining: 1 });
    const spent = quota(free, "ai_prompts_per_day", 1, now);
    expect(spent.remaining).toBe(0);
    // Next local midnight in Kolkata is 18:30 UTC.
    expect(spent.resetsAt).toBe("2026-10-22T18:30:00.000Z");
  });

  it("is unlimited on Pro", () => {
    expect(quota(pro, "ai_prompts_per_day", 40)).toMatchObject({ limit: null, remaining: null });
    expect(quota(pro, "saved_layouts", 12).remaining).toBeNull();
  });

  it("caps layouts and alerts on Free", () => {
    expect(quota(free, "saved_layouts", 1).remaining).toBe(0);
    expect(quota(free, "alerts_max", 2).remaining).toBe(1);
    expect(quota(free, "alerts_max", 3).remaining).toBe(0);
    expect(quota(free, "alerts_max", 3).resetsAt).toBeNull();
  });
});

describe("local calendar day", () => {
  it("keys the prompt counter by the user's own day", () => {
    const instant = new Date("2026-10-22T20:00:00Z");
    expect(dayKey(instant, "Asia/Kolkata")).toBe("2026-10-23");
    expect(dayKey(instant, "America/New_York")).toBe("2026-10-22");
  });

  it("falls back to UTC for an unknown zone", () => {
    const now = new Date("2026-10-22T23:00:00Z");
    expect(nextLocalMidnight("Not/AZone", now).toISOString()).toBe("2026-10-23T00:00:00.000Z");
  });
});
