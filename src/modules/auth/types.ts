import type { Entitlements, Plan } from "@/modules/billing";
import type { Edition } from "@/platform/i18n";

export interface User {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  authProvider: "email" | "google";
  displayName: string;
  avatarUrl: string | null;

  // localisation
  edition: Edition;
  locale: string; // e.g. 'en-IN'
  timezone: string; // IANA, e.g. 'Asia/Kolkata'
  displayCurrency: string; // ISO 4217, e.g. 'INR'
  country: string; // ISO 3166-1 alpha-2

  // onboarding
  onboardingCompletedAt: string | null;
  tourSeen: boolean;

  // app lock — when the user last set their app PIN; null = no PIN yet
  appPinSetAt: string | null;

  // plan
  plan: Plan;
  planSource: "free" | "stripe" | "manual" | "trial";
  entitlementsOverride: Partial<Entitlements> | null;

  // legal
  consentTermsVersion: string | null;
  consentRiskVersion: string | null;
  consentedAt: string | null;

  status: "active" | "suspended" | "deleted";
  createdAt: string;
  lastSeenAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  provider: "stripe" | "razorpay";
  providerCustomerId: string;
  providerSubscriptionId: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid";
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  graceUntil: string | null;
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  platform: string;
  lastSeenAt: string;
  pushToken: string | null;
  isCurrent: boolean;
}

export interface AiUsage {
  id: string;
  userId: string;
  at: string;
  kind: "chat" | "navigation" | "voice";
  counted: boolean; // navigation = false
  credits: number;
  cacheHit: boolean;
}

/** `GET /api/v1/me` */
export interface MeResponse {
  user: User;
  entitlements: Entitlements;
  usage: { ai_prompts: { used: number; limit: number | null; resets_at: string } };
}

/** `POST /api/v1/auth/login` and `/register` */
export interface AuthResponse {
  access_token: string;
  user: User;
  first_login: boolean;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  country: string;
  consentTermsVersion: string;
  consentPrivacyVersion: string;
  consentRiskVersion: string;
  ageConfirmed: boolean;
  edition: Edition;
  timezone: string;
  /** Collected by the multi-step form and stored in the Google Sheet. */
  phone?: string;
  experience?: "new" | "intermediate" | "experienced";
}

export interface OnboardingInput {
  edition: Edition;
  timezone: string;
  displayCurrency: string;
  watchlist: string[];
  pin: string;
}

export type ProfilePatch = Partial<
  Pick<User, "displayName" | "edition" | "locale" | "timezone" | "displayCurrency" | "country" | "tourSeen">
>;

/** Current legal document versions; a bump re-asks for consent. */
export const LEGAL_VERSIONS = {
  terms: "2026-10-01",
  privacy: "2026-10-01",
  risk: "2026-10-01",
} as const;
