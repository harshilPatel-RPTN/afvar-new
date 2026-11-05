import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions } from "@/modules/company/server/admin-session";

export const runtime = "nodejs";

// A plain <form method="post"> posts here; 303 sends the browser to the sign-in page.
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  response.cookies.set(ADMIN_COOKIE, "", adminCookieOptions(0));
  return response;
}
