import { NextResponse } from "next/server";
import { clientIp, createRateLimiter, rateLimited, readJsonObject } from "@/modules/auth/server/guard";
import { ADMIN_COOKIE, adminCookieOptions, signAdminToken, verifyAdminCredentials } from "@/modules/company/server/admin-session";
import { MongoNotConfiguredError } from "@/modules/company/server/mongo";

export const runtime = "nodejs";

// 5 attempts a minute per address.
const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

export async function POST(request: Request) {
  const limited = rateLimited(limiter, [`ip:${clientIp(request)}`]);
  if (limited) return limited;

  const read = await readJsonObject(request);
  if ("response" in read) return read.response;
  const username = typeof read.body.username === "string" ? read.body.username.trim().slice(0, 256) : "";
  const password = typeof read.body.password === "string" ? read.body.password.slice(0, 256) : "";
  if (!username || !password) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

  let admin: string | null;
  try {
    admin = await verifyAdminCredentials(username, password);
  } catch (error) {
    if (error instanceof MongoNotConfiguredError) return NextResponse.json({ error: "not_configured" }, { status: 503 });
    console.error("[admin] sign-in lookup failed", error);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  if (!admin) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

  const token = await signAdminToken(admin);
  if (!token) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
  return response;
}
