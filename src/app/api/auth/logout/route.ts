import { NextResponse } from "next/server";
import { sessionCookieOptions, SESSION_TOKEN_COOKIE } from "@/modules/auth/server/session-token";

export const runtime = "nodejs";

/** Clears the httpOnly session cookie, which the browser can't remove itself. */
export function POST() {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_TOKEN_COOKIE, "", sessionCookieOptions(0));
  return response;
}
