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
import { loginWithSheet, SheetsError } from "@/modules/auth/server/sheets";

export const runtime = "nodejs";

// 10 attempts a minute per address and per account, counted before the sheet is touched.
const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

export async function POST(request: Request) {
  const byIp = rateLimited(limiter, [`ip:${clientIp(request)}`]);
  if (byIp) return byIp;
  const read = await readJsonObject(request);
  if ("response" in read) return read.response;
  const { body } = read;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || email.length > MAX_EMAIL_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }
  const byEmail = rateLimited(limiter, [`email:${email}`]);
  if (byEmail) return byEmail;
  try {
    const user = await loginWithSheet(email, password, request.headers.get("user-agent") ?? "");
    const response = NextResponse.json({ user });
    const token = await signSessionToken(user.id);
    if (token) response.cookies.set(SESSION_TOKEN_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    const failure = error instanceof SheetsError ? error : new SheetsError(500, "unknown");
    return NextResponse.json({ error: failure.code }, { status: failure.status });
  }
}
