import { NextResponse } from "next/server";
import { registerInSheet, SheetsError } from "@/modules/auth/server/sheets";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (value: unknown) => (typeof value === "string" ? value : "");

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = str(body.email).trim();
  const password = str(body.password);
  const displayName = str(body.displayName).trim();
  if (!EMAIL_RE.test(email) || password.length < 8 || !displayName || displayName.length > 80) {
    return NextResponse.json({ error: "validation_error" }, { status: 422 });
  }
  if (!body.ageConfirmed || !body.consentTermsVersion || !body.consentPrivacyVersion || !body.consentRiskVersion) {
    return NextResponse.json({ error: "consent_required" }, { status: 422 });
  }
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
      consentTermsVersion: str(body.consentTermsVersion),
      consentPrivacyVersion: str(body.consentPrivacyVersion),
      consentRiskVersion: str(body.consentRiskVersion),
      ageConfirmed: true,
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const failure = error instanceof SheetsError ? error : new SheetsError(500, "unknown");
    return NextResponse.json({ error: failure.code }, { status: failure.status });
  }
}
