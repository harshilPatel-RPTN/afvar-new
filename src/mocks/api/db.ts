/**
 * The mock backend's "database": one JSON blob in localStorage, so a demo
 * survives reloads and stays in sync across tabs. Falls back to memory when
 * storage is blocked. MOCK ONLY — the real tables live in Postgres (README).
 */
import type { AiUsage, Device, Subscription, User } from "@/modules/auth";
import type { BillingInterval } from "@/modules/billing";
import { readStorage, writeStorage } from "@/platform/storage";

const DB_KEY = "afwar.mockdb.v1";

export interface CheckoutSession {
  id: string;
  userId: string;
  interval: BillingInterval;
  amount: number;
  currency: string;
  status: "open" | "complete" | "expired";
  createdAt: string;
}

export interface BrokerConnection {
  platform: "mt5";
  server: string;
  login: string;
  /** Always "investor" — trade-rights credentials are never accepted or stored. */
  access: "investor";
  connectedAt: string;
}

export interface NotificationPrefs {
  push: boolean;
  email_digest: boolean;
  alert_delivery: "in_app" | "push" | "both";
  risk_warnings: boolean;
}

export interface MockDb {
  users: Record<string, User>;
  /** Mock-only hashes. The real backend uses argon2id. */
  passwords: Record<string, string>;
  pins: Record<string, { hash: string; failedAttempts: number }>;
  sessions: Record<string, { userId: string; deviceId: string; createdAt: string }>;
  usage: AiUsage[];
  subscriptions: Record<string, Subscription>;
  devices: Record<string, Device[]>;
  resetTokens: Record<string, { userId: string; expiresAt: string }>;
  verifyTokens: Record<string, string>;
  checkouts: Record<string, CheckoutSession>;
  watchlists: Record<string, string[]>;
  brokers: Record<string, BrokerConnection>;
  notificationPrefs: Record<string, NotificationPrefs>;
}

/** Tiny deterministic hash — fine for a demo, never for production. */
export function mockHash(secret: string, salt: string) {
  let hash = 0x811c9dc5;
  for (const char of `${salt}:${secret}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a$${salt}$${hash.toString(16)}`;
}

export function randomId(prefix: string) {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `${prefix}_${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export const DEMO_PASSWORD = "demo1234";
export const DEMO_PIN = "1234";

function seedUser(id: string, email: string, displayName: string, plan: User["plan"]): User {
  const now = new Date().toISOString();
  return {
    id,
    email,
    emailVerifiedAt: now,
    authProvider: "email",
    displayName,
    avatarUrl: null,
    edition: "en",
    locale: "en-IN",
    timezone: "Asia/Kolkata",
    displayCurrency: "INR",
    country: "IN",
    onboardingCompletedAt: now,
    tourSeen: true,
    appPinSetAt: now,
    plan,
    planSource: plan === "pro" ? "stripe" : "free",
    entitlementsOverride: null,
    consentTermsVersion: "2026-10-01",
    consentRiskVersion: "2026-10-01",
    consentedAt: now,
    status: "active",
    createdAt: now,
    lastSeenAt: now,
  };
}

const LANES = ["XAUUSD", "XAGUSD", "WTI", "EURUSD", "USDJPY", "GBPUSD", "NZDUSD", "BTCUSD"];

function seed(): MockDb {
  const free = seedUser("usr_free", "free@afwar.app", "Free Trader", "free");
  const pro = seedUser("usr_pro", "pro@afwar.app", "Pro Trader", "pro");
  const periodEnd = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const db: MockDb = {
    users: { [free.id]: free, [pro.id]: pro },
    passwords: {},
    pins: {},
    sessions: {},
    usage: [],
    subscriptions: {
      [pro.id]: {
        id: "sub_demo_pro",
        userId: pro.id,
        provider: "stripe",
        providerCustomerId: "cus_demo_pro",
        providerSubscriptionId: "sub_test_demo_pro",
        status: "active",
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        graceUntil: null,
      },
    },
    devices: {},
    resetTokens: {},
    verifyTokens: {},
    checkouts: {},
    watchlists: { [free.id]: [...LANES], [pro.id]: [...LANES] },
    brokers: {},
    notificationPrefs: {},
  };
  for (const user of [free, pro]) {
    db.passwords[user.id] = mockHash(DEMO_PASSWORD, user.id);
    db.pins[user.id] = { hash: mockHash(DEMO_PIN, `pin:${user.id}`), failedAttempts: 0 };
  }
  return db;
}

let memory: MockDb | null = null;

export function loadDb(): MockDb {
  const raw = readStorage(DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as MockDb;
    } catch {
      // Corrupt blob — reseed below.
    }
  }
  if (memory) return memory;
  const fresh = seed();
  saveDb(fresh);
  return fresh;
}

export function saveDb(db: MockDb) {
  memory = db;
  writeStorage(DB_KEY, JSON.stringify(db));
}

/** Wipe and reseed — used by tests and the dev "reset demo data" control. */
export function resetDb() {
  memory = null;
  writeStorage(DB_KEY, null);
  return loadDb();
}
