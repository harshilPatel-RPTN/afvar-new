// Admin sign-in for /admin (contact enquiries). Accounts live in MongoDB
// (collection `admin_users`: username, scrypt passwordHash, passwordUpdatedAt),
// created with `scripts/create-admin.mjs`. Sessions are kept apart from member
// sessions: their own httpOnly cookie, their own subject ("admin:<username>",
// which no member id can collide with — those are usr_…), and an 8-hour lifetime.
// A session stops working once its account is deleted or its password changes.
//
// Env: MONGODB_URI, AUTH_SECRET.
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import type { Collection } from "mongodb";
import { signSessionToken, verifySessionToken } from "@/modules/auth/server/session-token";
import { getDb } from "./mongo";

export const ADMIN_COOKIE = "afvar_admin";
export const ADMIN_TTL_SECONDS = 8 * 3_600;
const SUBJECT_PREFIX = "admin:";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

interface AdminUserDoc {
  username: string;
  passwordHash: string;
  passwordUpdatedAt: Date;
  createdAt: Date;
}

async function admins(): Promise<Collection<AdminUserDoc>> {
  return (await getDb()).collection<AdminUserDoc>("admin_users");
}

/** Same `scrypt$salt$key` format as member passwords (and scripts/create-admin.mjs). */
export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

async function checkPassword(password: string, stored: string) {
  const [scheme, salt, key] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Checked against when the username is unknown, so a miss takes as long as a wrong password.
const DUMMY_HASH = hashAdminPassword(randomBytes(16).toString("hex"));

/** The username when the credentials match an admin account, else null. Throws if the database is unreachable. */
export async function verifyAdminCredentials(username: string, password: string): Promise<string | null> {
  const user = await (await admins()).findOne({ username });
  const valid = await checkPassword(password, user?.passwordHash ?? (await DUMMY_HASH));
  return user && valid ? user.username : null;
}

export async function signAdminToken(username: string) {
  return signSessionToken(`${SUBJECT_PREFIX}${username}`, Date.now(), ADMIN_TTL_SECONDS);
}

export const adminCookieOptions = (maxAge = ADMIN_TTL_SECONDS) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge,
});

/**
 * The signed-in admin's username, or null. Reads the request cookie, then
 * confirms the account still exists and its password hasn't changed since the
 * token was issued. Throws if the database is unreachable.
 */
export async function currentAdmin(): Promise<string | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const claims = await verifySessionToken(token);
  if (!claims?.sub.startsWith(SUBJECT_PREFIX)) return null;
  const username = claims.sub.slice(SUBJECT_PREFIX.length);
  const user = await (await admins()).findOne({ username }, { projection: { passwordUpdatedAt: 1 } });
  if (!user) return null;
  // iat is in whole seconds; compare at that precision.
  return Math.floor(user.passwordUpdatedAt.getTime() / 1000) <= claims.iat ? username : null;
}
