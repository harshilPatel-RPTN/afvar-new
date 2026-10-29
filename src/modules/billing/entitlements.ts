/**
 * Plans and what they allow — the single source of truth for gating.
 * The FastAPI backend will read the same shape. Never add an "is premium"
 * flag anywhere: every check goes through `can()` or `quota()`.
 */
import type { User } from "@/modules/auth";

export type Plan = "free" | "pro";

export interface Entitlements {
  ai_prompts_per_day: number | null; // null = unlimited
  voice_navigation: boolean;
  voice_answers: boolean;
  news_delay_minutes: number;
  saved_layouts: number | null;
  alerts_max: number | null;
  community_post: boolean;
}

export type Feature = keyof Entitlements;

export const PLANS: Record<Plan, Entitlements> = {
  free: {
    ai_prompts_per_day: 1,
    voice_navigation: false,
    voice_answers: false,
    news_delay_minutes: 30,
    saved_layouts: 1,
    alerts_max: 3,
    community_post: true,
  },
  pro: {
    ai_prompts_per_day: null,
    voice_navigation: true,
    voice_answers: true,
    news_delay_minutes: 0,
    saved_layouts: null,
    alerts_max: null,
    community_post: true,
  },
};

/** Display order of the pricing table. */
export const FEATURE_ORDER: Feature[] = [
  "ai_prompts_per_day",
  "voice_navigation",
  "voice_answers",
  "news_delay_minutes",
  "saved_layouts",
  "alerts_max",
  "community_post",
];

type EntitlementSubject = Pick<User, "plan" | "entitlementsOverride">;

/** The plan's entitlements with the per-user override applied (override wins). */
export function effectiveEntitlements(user: EntitlementSubject): Entitlements {
  return { ...PLANS[user.plan], ...(user.entitlementsOverride ?? {}) };
}

/**
 * Whether the user has the feature at all. Count limits count as available
 * while their limit is unlimited or above zero; use `quota()` for "one more?".
 * A news delay is always "available" — the delay itself is the restriction.
 */
export function can(user: EntitlementSubject, feature: Feature): boolean {
  const value = effectiveEntitlements(user)[feature];
  if (typeof value === "boolean") return value;
  if (feature === "news_delay_minutes") return value === 0;
  return value === null || value > 0;
}

export interface Quota {
  limit: number | null;
  used: number;
  remaining: number | null;
  resetsAt: string | null;
}

/**
 * Remaining allowance for a counted feature. Daily prompt quotas reset at
 * midnight in the user's own time zone; other limits never reset.
 */
export function quota(
  user: EntitlementSubject & Pick<User, "timezone">,
  feature: Feature,
  used = 0,
  now: Date = new Date(),
): Quota {
  const value = effectiveEntitlements(user)[feature];
  const limit = typeof value === "boolean" ? (value ? null : 0) : value;
  return {
    limit,
    used,
    remaining: limit === null ? null : Math.max(0, limit - used),
    resetsAt: feature === "ai_prompts_per_day" ? nextLocalMidnight(user.timezone, now).toISOString() : null,
  };
}

function zonedParts(timeZone: string, date: Date) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
  } catch {
    return zonedParts("UTC", date);
  }
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

/** Calendar day (YYYY-MM-DD) in the given IANA zone — the prompt counter's key. */
export function dayKey(date: Date, timeZone: string): string {
  const { year, month, day } = zonedParts(timeZone, date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** The next midnight in the given IANA zone. */
export function nextLocalMidnight(timeZone: string, now: Date = new Date()): Date {
  const { hour, minute, second } = zonedParts(timeZone, now);
  const secondsIntoDay = hour * 3600 + minute * 60 + second;
  const next = new Date(now.getTime() + (86_400 - secondsIntoDay) * 1000);
  next.setMilliseconds(0);
  return next;
}
