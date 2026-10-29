// The ONLY file calling the auth and account endpoints.
import type { Plan } from "@/modules/billing";
import { ApiError, apiFetch } from "@/platform/api/client";
import type { AuthResponse, Device, MeResponse, OnboardingInput, ProfilePatch, RegisterInput, User } from "./types";

type DevLink<K extends string> = { [key in K]?: string };

/** A row of the Users sheet, minus the password hash (see server/sheets.ts). */
export interface SheetProfile {
  id: string;
  createdAt: string;
  email: string;
  displayName: string;
  country: string;
  edition: string;
  timezone: string;
  consentTermsVersion: string;
  consentRiskVersion: string;
}

/** `NEXT_PUBLIC_AUTH_STORE=sheets` keeps registrations and sign-ins in Google Sheets. */
const USE_SHEETS = process.env.NEXT_PUBLIC_AUTH_STORE === "sheets";

/**
 * Same-origin route that keeps credentials in Google Sheets. Resolves `null`
 * when the store is off or the server has no GOOGLE_* env, so the caller
 * falls back to the regular auth endpoints.
 */
async function sheetAuth(path: "/api/auth/register" | "/api/auth/login", body: unknown): Promise<SheetProfile | null> {
  if (!USE_SHEETS) return null;
  let response: Response;
  try {
    response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "offline");
  }
  const data = (await response.json().catch(() => ({}))) as { user?: SheetProfile; error?: string };
  if (response.status === 503 && data.error === "sheets_unconfigured") return null;
  if (!response.ok || !data.user) throw new ApiError(response.status, data.error ?? "request_failed", data);
  return data.user;
}

/** Opens an app session for a user the sheet just accepted. */
const sheetSession = (profile: SheetProfile) => apiFetch<AuthResponse>("POST", "/api/v1/auth/sheet-session", profile);

export const authApi = {
  register: async (input: RegisterInput): Promise<AuthResponse & DevLink<"dev_verify_url">> => {
    const profile = await sheetAuth("/api/auth/register", input);
    if (profile) return sheetSession(profile);
    return apiFetch("POST", "/api/v1/auth/register", input);
  },
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const profile = await sheetAuth("/api/auth/login", { email, password });
    if (profile) return sheetSession(profile);
    return apiFetch("POST", "/api/v1/auth/login", { email, password });
  },
  loginWithGoogle: () => apiFetch<AuthResponse>("POST", "/api/v1/auth/google", {}),
  logout: () => apiFetch<{ ok: true }>("POST", "/api/v1/auth/logout"),
  forgot: (email: string) =>
    apiFetch<{ ok: true } & DevLink<"dev_reset_url">>("POST", "/api/v1/auth/forgot", { email }),
  reset: (token: string, password: string) =>
    apiFetch<{ ok: true }>("POST", "/api/v1/auth/reset", { token, password }),
  verify: (token: string) => apiFetch<{ ok: true; user: User }>("POST", "/api/v1/auth/verify", { token }),
  resendVerification: () =>
    apiFetch<{ ok: true } & DevLink<"dev_verify_url">>("POST", "/api/v1/auth/verify/resend"),
  setPin: (pin: string, currentPin?: string) =>
    apiFetch<{ user: User }>("POST", "/api/v1/auth/pin", { pin, current_pin: currentPin }),
  verifyPin: (pin: string) => apiFetch<{ ok: true }>("POST", "/api/v1/auth/pin/verify", { pin }),

  me: () => apiFetch<MeResponse>("GET", "/api/v1/me"),
  updateProfile: (patch: ProfilePatch) => apiFetch<{ user: User }>("PATCH", "/api/v1/me", patch),
  completeOnboarding: (input: OnboardingInput) =>
    apiFetch<{ user: User }>("POST", "/api/v1/me/onboarding", input),
  exportData: () => apiFetch<Record<string, unknown>>("GET", "/api/v1/me/export"),
  deleteAccount: () => apiFetch<{ ok: true }>("DELETE", "/api/v1/me"),

  devices: () => apiFetch<{ devices: Device[] }>("GET", "/api/v1/devices"),
  removeDevice: (id: string) => apiFetch<{ ok: true }>("DELETE", `/api/v1/devices/${encodeURIComponent(id)}`),

  /** Dev-only: flips the plan without checkout so every gated state can be tested. */
  devSetPlan: (plan: Plan) => apiFetch<{ user: User }>("POST", "/api/v1/dev/plan", { plan }),
  devResetUsage: () =>
    apiFetch<{ usage: MeResponse["usage"]["ai_prompts"] }>("POST", "/api/v1/dev/reset-usage"),
};
