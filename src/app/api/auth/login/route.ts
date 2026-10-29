import { NextResponse } from "next/server";
import { loginWithSheet, SheetsError } from "@/modules/auth/server/sheets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  try {
    const user = await loginWithSheet(email, password, request.headers.get("user-agent") ?? "");
    return NextResponse.json({ user });
  } catch (error) {
    const failure = error instanceof SheetsError ? error : new SheetsError(500, "unknown");
    return NextResponse.json({ error: failure.code }, { status: failure.status });
  }
}
