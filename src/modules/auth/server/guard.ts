// Request guards shared by /api/auth/register and /api/auth/login: a capped
// JSON body reader and an in-memory sliding-window rate limit. Both run
// before anything touches the Google Sheet.
import { NextResponse } from "next/server";

/** Auth payloads are a handful of short strings; anything bigger is not a form. */
export const MAX_BODY_BYTES = 16 * 1024;
/** scrypt cost grows with input; nobody types more than this. */
export const MAX_PASSWORD_LENGTH = 256;
export const MAX_EMAIL_LENGTH = 254;

const fail = (status: number, error: string, headers?: HeadersInit) => NextResponse.json({ error }, { status, headers });

/**
 * Reads a JSON object body, or returns the response to send instead:
 * 415 for a non-JSON content type, 413 past `maxBytes` (checked against
 * Content-Length and again while streaming, so a lying header can't sneak a
 * large body in), 400 for malformed JSON or a non-object.
 */
export async function readJsonObject(
  request: Request,
  maxBytes = MAX_BODY_BYTES,
): Promise<{ body: Record<string, unknown> } | { response: NextResponse }> {
  const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (type !== "application/json") return { response: fail(415, "unsupported_media_type") };
  const declared = Number(request.headers.get("content-length"));
  if (declared > maxBytes) return { response: fail(413, "payload_too_large") };

  let text = "";
  if (request.body) {
    const reader = request.body.getReader();
    const decoder = new TextDecoder();
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { response: fail(413, "payload_too_large") };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { response: fail(400, "invalid_json") };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { response: fail(400, "invalid_request") };
  return { body: parsed as Record<string, unknown> };
}

/**
 * Best-effort client address. x-real-ip is set by the hosting proxy and can't be spoofed by the
 * client; in x-forwarded-for only the right-most entry was added by our proxy, as a client can
 * prepend any values it likes.
 */
export function clientIp(request: Request) {
  const real = request.headers.get("x-real-ip")?.trim();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return real || forwarded || "unknown";
}

export interface RateLimiter {
  /** Records a hit for `key`; returns seconds to wait when over the limit, else 0. */
  hit: (key: string, now?: number) => number;
  reset: () => void;
}

/**
 * Sliding-window log per key, in process memory. Good enough for a single
 * Node instance; several instances each keep their own window (move this to
 * Redis or similar before scaling out).
 */
export function createRateLimiter({ limit, windowMs, maxKeys = 10_000 }: { limit: number; windowMs: number; maxKeys?: number }): RateLimiter {
  const hits = new Map<string, number[]>();

  const prune = (now: number) => {
    for (const [key, times] of hits) {
      if (times[times.length - 1] <= now - windowMs) hits.delete(key);
    }
    // Still full (a flood of distinct keys): drop the oldest entries.
    for (const key of hits.keys()) {
      if (hits.size < maxKeys) break;
      hits.delete(key);
    }
  };

  return {
    hit: (key, now = Date.now()) => {
      const recent = (hits.get(key) ?? []).filter((time) => time > now - windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
      }
      recent.push(now);
      if (!hits.has(key) && hits.size >= maxKeys) prune(now);
      hits.set(key, recent);
      return 0;
    },
    reset: () => hits.clear(),
  };
}

/** 429 with Retry-After, or null when every key is under its limit. Every key is counted. */
export function rateLimited(limiter: RateLimiter, keys: string[]) {
  const wait = Math.max(0, ...keys.map((key) => limiter.hit(key)));
  return wait ? fail(429, "rate_limited", { "Retry-After": String(wait) }) : null;
}
