// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createRateLimiter, MAX_BODY_BYTES, rateLimited, readJsonObject } from "../server/guard";
import { signSessionToken, verifySessionToken } from "../server/session-token";

const post = (body: string, type = "application/json", headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/auth/login", { method: "POST", headers: { "content-type": type, ...headers }, body });

describe("readJsonObject", () => {
  it("accepts a JSON object", async () => {
    const read = await readJsonObject(post('{"email":"a@b.co"}', "application/json; charset=utf-8"));
    expect(read).toEqual({ body: { email: "a@b.co" } });
  });

  it("rejects non-JSON content types with 415", async () => {
    const read = await readJsonObject(post('{"email":"a@b.co"}', "text/plain"));
    expect("response" in read && read.response.status).toBe(415);
  });

  it("rejects malformed JSON and non-objects with 400", async () => {
    for (const body of ["{nope", "null", "[]", '"x"', ""]) {
      const read = await readJsonObject(post(body));
      expect("response" in read && read.response.status).toBe(400);
    }
  });

  it("rejects oversized bodies with 413, by header and by actual size", async () => {
    const big = JSON.stringify({ email: "x".repeat(MAX_BODY_BYTES) });
    const byHeader = await readJsonObject(post("{}", "application/json", { "content-length": String(MAX_BODY_BYTES + 1) }));
    expect("response" in byHeader && byHeader.response.status).toBe(413);
    const bySize = await readJsonObject(post(big));
    expect("response" in bySize && bySize.response.status).toBe(413);
  });
});

describe("rate limiter", () => {
  it("allows `limit` hits per window, then asks to retry later", () => {
    const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
    for (let index = 0; index < 10; index++) expect(limiter.hit("ip:1", 1_000 + index)).toBe(0);
    expect(limiter.hit("ip:1", 2_000)).toBe(59);
    // Other keys are independent.
    expect(limiter.hit("ip:2", 2_000)).toBe(0);
    // The window slides: the first hit expires after 60s.
    expect(limiter.hit("ip:1", 61_001)).toBe(0);
  });

  it("returns a 429 with Retry-After", async () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(rateLimited(limiter, ["email:a@b.co"])).toBeNull();
    const response = rateLimited(limiter, ["email:a@b.co"]);
    expect(response?.status).toBe(429);
    expect(Number(response?.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(await response?.json()).toEqual({ error: "rate_limited" });
  });

  it("stays bounded under a flood of distinct keys", () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: 60_000, maxKeys: 100 });
    for (let index = 0; index < 1_000; index++) limiter.hit(`ip:${index}`, 1_000);
    // Old keys were evicted, so an early key starts fresh.
    expect(limiter.hit("ip:0", 1_000)).toBe(0);
  });
});

describe("session token", () => {
  it("round-trips and rejects tampering or expiry", async () => {
    const token = await signSessionToken("usr_1", 0);
    expect(token).toBeTruthy();
    expect((await verifySessionToken(token, 1_000))?.sub).toBe("usr_1");

    const [payload, signature] = token!.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "usr_2", iat: 0, exp: 9e9 })).toString("base64url");
    expect(await verifySessionToken(`${forged}.${signature}`, 1_000)).toBeNull();
    expect(await verifySessionToken(`${payload}.${signature.slice(0, -2)}xx`, 1_000)).toBeNull();
    expect(await verifySessionToken("usr_1", 1_000)).toBeNull();
    expect(await verifySessionToken(token, 31 * 86_400_000)).toBeNull();
  });
});
