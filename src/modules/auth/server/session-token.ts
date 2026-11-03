// HMAC-signed session token for the httpOnly `afwar_sid` cookie, set by
// /api/auth/login and /api/auth/register. Web Crypto only (no node:crypto) so
// the same code verifies in a proxy on any runtime.
//
// Token: base64url(JSON {sub, iat, exp}) + "." + base64url(HMAC-SHA256).
//
// Env: AUTH_SECRET — at least 32 random characters (`openssl rand -base64 32`).
// Required in production; without it no token is signed or accepted there.
// Development falls back to a fixed, PUBLIC string so local sign-in works
// out of the box. Never rely on that fallback outside `next dev`.

export const SESSION_TOKEN_COOKIE = "afwar_sid";
export const SESSION_TTL_SECONDS = 30 * 86_400;

const DEV_FALLBACK_SECRET = "afvar-dev-only-insecure-auth-secret-change-me";

export interface SessionClaims {
  sub: string;
  iat: number;
  exp: number;
}

function secret(): string | null {
  const configured = process.env.AUTH_SECRET;
  if (configured && configured.length >= 32) return configured;
  return process.env.NODE_ENV === "production" ? null : DEV_FALLBACK_SECRET;
}

const encoder = new TextEncoder();

function toBase64url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) return null;
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

const hmacKey = (key: string) =>
  crypto.subtle.importKey("raw", encoder.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

/** Signs a token for `userId`, or null when production has no AUTH_SECRET. */
export async function signSessionToken(userId: string, now = Date.now()): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const iat = Math.floor(now / 1000);
  const claims: SessionClaims = { sub: userId, iat, exp: iat + SESSION_TTL_SECONDS };
  const payload = toBase64url(encoder.encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(key), encoder.encode(payload));
  return `${payload}.${toBase64url(new Uint8Array(signature))}`;
}

/** The claims of a valid, unexpired token; null for anything else. */
export async function verifySessionToken(token: string | undefined | null, now = Date.now()): Promise<SessionClaims | null> {
  const key = secret();
  if (!key || !token || token.length > 1024) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const signatureBytes = fromBase64url(signature);
  if (!signatureBytes) return null;
  // crypto.subtle.verify compares in constant time.
  const valid = await crypto.subtle.verify("HMAC", await hmacKey(key), signatureBytes, encoder.encode(payload));
  if (!valid) return null;
  const payloadBytes = fromBase64url(payload);
  if (!payloadBytes) return null;
  try {
    const claims = JSON.parse(new TextDecoder().decode(payloadBytes)) as Partial<SessionClaims>;
    if (typeof claims.sub !== "string" || typeof claims.exp !== "number" || typeof claims.iat !== "number") return null;
    if (claims.exp * 1000 <= now) return null;
    return claims as SessionClaims;
  } catch {
    return null;
  }
}

/** Options for `response.cookies.set(SESSION_TOKEN_COOKIE, token, …)`. */
export const sessionCookieOptions = (maxAge = SESSION_TTL_SECONDS) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});
