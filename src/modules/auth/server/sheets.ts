// Server-only Google Sheets store for registrations and sign-ins (used by
// /api/auth/register and /api/auth/login). Self-contained: signs a service
// account JWT with node:crypto and calls the Sheets REST API, no SDK.
//
// Env (see .env.example):
//   GOOGLE_SHEETS_ID               spreadsheet id from its URL
//   GOOGLE_SERVICE_ACCOUNT_EMAIL   xxx@project.iam.gserviceaccount.com
//   GOOGLE_PRIVATE_KEY             the service account key ("\n" escapes are fine)
// Share the spreadsheet with the service account email as Editor. The "Users"
// and "Logins" tabs (with header rows) are created on first use.
import { createSign, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";
const USERS_TAB = "Users";
const LOGINS_TAB = "Logins";
const USER_COLUMNS = [
  "id",
  "createdAt",
  "email",
  "displayName",
  "passwordHash",
  "phone",
  "country",
  "experience",
  "edition",
  "timezone",
  "consentTermsVersion",
  "consentPrivacyVersion",
  "consentRiskVersion",
  "ageConfirmed",
] as const;
const LOGIN_COLUMNS = ["at", "email", "result", "userAgent"] as const;

export type SheetUser = Record<(typeof USER_COLUMNS)[number], string>;

export class SheetsError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

function config() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!spreadsheetId || !clientEmail || !privateKey) throw new SheetsError(503, "sheets_unconfigured");
  return { spreadsheetId, clientEmail, privateKey };
}

export function sheetsConfigured() {
  return Boolean(process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

// ---------------------------------------------------------------- access token

let cachedToken: { value: string; expiresAt: number } | null = null;

const base64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const { clientEmail, privateKey } = config();
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(privateKey, "base64url");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  if (!response.ok) throw new SheetsError(502, "sheets_auth_failed");
  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

async function sheets<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const { spreadsheetId } = config();
  const response = await fetch(`${SHEETS}/${spreadsheetId}${path}`, {
    method,
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw new SheetsError(502, "sheets_request_failed");
  return (await response.json()) as T;
}

// ---------------------------------------------------------------- tabs

let tabsReady: Promise<void> | null = null;

/** Creates the Users / Logins tabs with header rows the first time they're missing. */
function ensureTabs() {
  tabsReady ??= (async () => {
    const meta = await sheets<{ sheets: { properties: { title: string } }[] }>("GET", "?fields=sheets.properties.title");
    const existing = new Set(meta.sheets.map((sheet) => sheet.properties.title));
    const missing = [
      [USERS_TAB, USER_COLUMNS],
      [LOGINS_TAB, LOGIN_COLUMNS],
    ].filter(([title]) => !existing.has(title as string)) as [string, readonly string[]][];
    if (!missing.length) return;
    await sheets("POST", ":batchUpdate", {
      requests: missing.map(([title]) => ({ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } })),
    });
    for (const [title, columns] of missing) await append(title, [...columns]);
  })().catch((error) => {
    tabsReady = null;
    throw error;
  });
  return tabsReady;
}

function append(tab: string, row: string[]) {
  // RAW keeps "+91…" phones and "=…" names as plain text, never formulas.
  return sheets("POST", `/values/${encodeURIComponent(`${tab}!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    values: [row],
  });
}

async function readUsers(): Promise<SheetUser[]> {
  const data = await sheets<{ values?: string[][] }>("GET", `/values/${encodeURIComponent(`${USERS_TAB}!A2:N`)}`);
  return (data.values ?? []).map((row) => Object.fromEntries(USER_COLUMNS.map((column, index) => [column, row[index] ?? ""])) as SheetUser);
}

// ---------------------------------------------------------------- passwords

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

async function checkPassword(password: string, stored: string) {
  const [scheme, salt, key] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

// ---------------------------------------------------------------- public

export type PublicSheetUser = Omit<SheetUser, "passwordHash">;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- dropped on purpose
const toPublic = ({ passwordHash, ...user }: SheetUser): PublicSheetUser => user;

export interface SheetRegistration {
  email: string;
  password: string;
  displayName: string;
  phone: string;
  country: string;
  experience: string;
  edition: string;
  timezone: string;
  consentTermsVersion: string;
  consentPrivacyVersion: string;
  consentRiskVersion: string;
  ageConfirmed: boolean;
}

export async function registerInSheet(input: SheetRegistration): Promise<PublicSheetUser> {
  await ensureTabs();
  const email = input.email.trim().toLowerCase();
  if ((await readUsers()).some((user) => user.email.toLowerCase() === email)) throw new SheetsError(409, "email_taken");
  const user: SheetUser = {
    id: `usr_${randomUUID().replace(/-/g, "")}`,
    createdAt: new Date().toISOString(),
    email,
    displayName: input.displayName.trim(),
    passwordHash: await hashPassword(input.password),
    phone: input.phone.trim(),
    country: input.country,
    experience: input.experience,
    edition: input.edition,
    timezone: input.timezone,
    consentTermsVersion: input.consentTermsVersion,
    consentPrivacyVersion: input.consentPrivacyVersion,
    consentRiskVersion: input.consentRiskVersion,
    ageConfirmed: input.ageConfirmed ? "TRUE" : "FALSE",
  };
  await append(USERS_TAB, USER_COLUMNS.map((column) => user[column]));
  return toPublic(user);
}

export async function loginWithSheet(emailInput: string, password: string, userAgent: string): Promise<PublicSheetUser> {
  await ensureTabs();
  const email = emailInput.trim().toLowerCase();
  const user = (await readUsers()).find((row) => row.email.toLowerCase() === email);
  const valid = Boolean(user) && (await checkPassword(password, user!.passwordHash));
  await append(LOGINS_TAB, [new Date().toISOString(), email, valid ? "success" : "invalid_credentials", userAgent.slice(0, 200)]);
  if (!valid) throw new SheetsError(401, "invalid_credentials");
  return toPublic(user!);
}
