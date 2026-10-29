import type { User } from "./types";

/**
 * A complete `User` for tests, from just the fields a test cares about.
 * Use it with `useAuthStore.setState({ user: testUser({ ... }) })`.
 */
export function testUser(fields: Partial<User> & Pick<User, "id" | "email" | "displayName">): User {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    emailVerifiedAt: now,
    authProvider: "email",
    avatarUrl: null,
    edition: "en",
    locale: "en-IN",
    timezone: "UTC",
    displayCurrency: "USD",
    country: "IN",
    onboardingCompletedAt: now,
    tourSeen: true,
    appPinSetAt: now,
    plan: "free",
    planSource: "free",
    entitlementsOverride: null,
    consentTermsVersion: null,
    consentRiskVersion: null,
    consentedAt: null,
    status: "active",
    createdAt: now,
    lastSeenAt: now,
    ...fields,
  };
}
