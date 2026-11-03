import { NextResponse } from "next/server";
import {
  clientIp,
  createRateLimiter,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  rateLimited,
  readJsonObject,
} from "@/modules/auth/server/guard";
import { sessionCookieOptions, signSessionToken, SESSION_TOKEN_COOKIE } from "@/modules/auth/server/session-token";
import { registerInSheet, SheetsError } from "@/modules/auth/server/sheets";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (value: unknown) => (typeof value === "string" ? value : "");

// 10 sign-ups a minute per address and per email, counted before the sheet is touched.
const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

export async function POST(request: Request) {
  const byIp = rateLimited(limiter, [`ip:${clientIp(request)}`]);
  if (byIp) return byIp;
  const read = await readJsonObject(request);
  if ("response" in read) return read.response;
  const { body } = read;
  const email = str(body.email).trim();
  const password = str(body.password);
  const displayName = str(body.displayName).trim();
  if (
    !EMAIL_RE.test(email) ||
    email.length > MAX_EMAIL_LENGTH ||
    password.length < 8 ||
    password.length > MAX_PASSWORD_LENGTH ||
    !displayName ||
    displayName.length > 80
  ) {
    return NextResponse.json({ error: "validation_error" }, { status: 422 });
  }
  if (!body.ageConfirmed || !str(body.consentTermsVersion) || !str(body.consentPrivacyVersion) || !str(body.consentRiskVersion)) {
    return NextResponse.json({ error: "consent_required" }, { status: 422 });
  }
  const byEmail = rateLimited(limiter, [`email:${email.toLowerCase()}`]);
  if (byEmail) return byEmail;
  try {
    const user = await registerInSheet({
      email,
      password,
      displayName,
      phone: str(body.phone).slice(0, 32),
      country: str(body.country).slice(0, 2) || "IN",
      experience: str(body.experience).slice(0, 24),
      edition: str(body.edition).slice(0, 5) || "en",
      timezone: str(body.timezone).slice(0, 64) || "UTC",
      consentTermsVersion: str(body.consentTermsVersion).slice(0, 32),
      consentPrivacyVersion: str(body.consentPrivacyVersion).slice(0, 32),
      consentRiskVersion: str(body.consentRiskVersion).slice(0, 32),
      ageConfirmed: true,
    });
    const response = NextResponse.json({ user }, { status: 201 });
    const token = await signSessionToken(user.id);
    if (token) response.cookies.set(SESSION_TOKEN_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    const failure = error instanceof SheetsError ? error : new SheetsError(500, "unknown");
    return NextResponse.json({ error: failure.code }, { status: failure.status });
  }
}
