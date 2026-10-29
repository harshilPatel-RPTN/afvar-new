import { ApiError } from "@/platform/api/client";
import type { MessageKey } from "@/platform/i18n";

export const COUNTRIES = [
  "IN", "AE", "SA", "QA", "KW", "OM", "BH", "EG", "PK", "BD", "LK", "NP",
  "SG", "MY", "ID", "HK", "JP", "AU", "NZ", "GB", "DE", "FR", "US", "CA", "ZA", "NG", "KE",
] as const;

export const CURRENCIES = ["INR", "USD", "AED", "SAR", "EUR", "GBP", "JPY", "SGD", "AUD", "NZD", "CAD", "PKR", "BDT"] as const;

/** Localised display name for an ISO code, falling back to the code itself. */
export function displayName(code: string, type: "region" | "currency", locale: string) {
  try {
    return new Intl.DisplayNames([locale], { type }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function timeZones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["UTC", "Asia/Kolkata", "Asia/Dubai", "Asia/Riyadh", "Europe/London", "America/New_York", "Asia/Singapore", "Asia/Tokyo"];
  }
}

export function detectedTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

const KNOWN_ERRORS = [
  "invalid_credentials",
  "email_taken",
  "validation_error",
  "consent_required",
  "invalid_token",
  "token_expired",
  "account_suspended",
  "wrong_pin",
  "pin_locked",
] as const;

/** Maps an API failure to a translated message key. */
export function errorKey(error: unknown): MessageKey {
  if (error instanceof ApiError) {
    if (error.isOffline) return "auth.error.offline";
    const known = KNOWN_ERRORS.find((code) => code === error.code);
    if (known) return `auth.error.${known}` as MessageKey;
  }
  return "auth.error.unknown";
}
