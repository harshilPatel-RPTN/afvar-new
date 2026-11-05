import { NextResponse } from "next/server";
import { clientIp, createRateLimiter, rateLimited, readJsonObject } from "@/modules/auth/server/guard";
import { parseEnquiry, saveEnquiry } from "@/modules/company/server/enquiries";
import { MongoNotConfiguredError } from "@/modules/company/server/mongo";

export const runtime = "nodejs";

// 5 enquiries per 10 minutes per address is plenty for a person, too few for a flood.
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

export async function POST(request: Request) {
  const limited = rateLimited(limiter, [`ip:${clientIp(request)}`]);
  if (limited) return limited;
  const read = await readJsonObject(request);
  if ("response" in read) return read.response;

  // Honeypot: a hidden field people never see. Bots that fill it get a quiet "ok".
  if (typeof read.body.website === "string" && read.body.website.trim()) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = parseEnquiry(read.body);
  if ("errors" in parsed) return NextResponse.json({ error: "invalid_request", fields: parsed.errors }, { status: 400 });

  try {
    await saveEnquiry(parsed.input);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof MongoNotConfiguredError) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 });
    }
    console.error("[contact] failed to save enquiry", error);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
