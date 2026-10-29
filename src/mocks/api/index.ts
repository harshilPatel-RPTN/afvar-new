/**
 * In-browser mock of the FastAPI backend. Every handler returns exactly the
 * shape the real `/api/v1/*` endpoint will, with 200–600 ms of latency, so
 * swapping to the real API only changes the base URL (see platform/api/client).
 */
import type { AiUsage, Device, MeResponse, OnboardingInput, ProfilePatch, RegisterInput, User } from "@/modules/auth";
import { LEGAL_VERSIONS } from "@/modules/auth";
import { PLANS, PRO_PRICES, dayKey, effectiveEntitlements, nextLocalMidnight, type BillingInterval, type Plan } from "@/modules/billing";
import { translate, type MessageKey } from "@/platform/i18n";
import { DEMO_PIN, loadDb, mockHash, randomId, saveDb, type MockDb, type NotificationPrefs } from "./db";
import { MOCK_DAILY_BRIEF, MOCK_HEADLINES } from "./news";

export { resetDb } from "./db";

export interface MockRequest {
  method: string;
  path: string;
  body?: unknown;
  token: string | null;
}

export interface MockResponse {
  status: number;
  body: unknown;
}

interface Context {
  db: MockDb;
  body: Record<string, unknown>;
  query: URLSearchParams;
  params: string[];
  user: User | null;
  token: string | null;
}

type Handler = (ctx: Context) => MockResponse;

const ok = (body: unknown, status = 200): MockResponse => ({ status, body });
const fail = (status: number, error: string, extra: Record<string, unknown> = {}): MockResponse => ({
  status,
  body: { error, ...extra },
});

const MAX_PIN_ATTEMPTS = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIN_RE = /^\d{4,6}$/;

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function requireUser(handler: (ctx: Context & { user: User }) => MockResponse): Handler {
  return (ctx) => (ctx.user ? handler(ctx as Context & { user: User }) : fail(401, "unauthenticated"));
}

function promptsUsedToday(db: MockDb, user: User, now = new Date()) {
  const today = dayKey(now, user.timezone);
  return db.usage.filter(
    (entry) => entry.userId === user.id && entry.counted && dayKey(new Date(entry.at), user.timezone) === today,
  ).length;
}

function usageSummary(db: MockDb, user: User) {
  return {
    used: promptsUsedToday(db, user),
    limit: effectiveEntitlements(user).ai_prompts_per_day,
    resets_at: nextLocalMidnight(user.timezone).toISOString(),
  };
}

function currentDevice(): Omit<Device, "id" | "userId"> {
  const agent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const browser = /Edg\//.test(agent) ? "Edge" : /Chrome\//.test(agent) ? "Chrome" : /Firefox\//.test(agent) ? "Firefox" : /Safari\//.test(agent) ? "Safari" : "Browser";
  const platform = /Mac/.test(agent) ? "macOS" : /Windows/.test(agent) ? "Windows" : /Linux/.test(agent) ? "Linux" : "Web";
  return { name: `${browser} on ${platform}`, platform, lastSeenAt: new Date().toISOString(), pushToken: null, isCurrent: true };
}

/** Creates a session and registers this browser as a device. */
function openSession(db: MockDb, user: User) {
  const token = randomId("mock_tok");
  const devices = (db.devices[user.id] ??= [
    {
      id: randomId("dev"),
      userId: user.id,
      name: "Trading desk · Windows",
      platform: "Windows",
      lastSeenAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      pushToken: null,
      isCurrent: false,
    },
  ]);
  const device: Device = { id: randomId("dev"), userId: user.id, ...currentDevice() };
  devices.forEach((entry) => (entry.isCurrent = false));
  devices.push(device);
  db.sessions[token] = { userId: user.id, deviceId: device.id, createdAt: new Date().toISOString() };
  user.lastSeenAt = new Date().toISOString();
  return token;
}

function authResponse(db: MockDb, user: User) {
  const token = openSession(db, user);
  saveDb(db);
  return ok({ access_token: token, user, first_login: !user.onboardingCompletedAt });
}

function newUser(fields: Partial<User> & Pick<User, "email" | "displayName">): User {
  const now = new Date().toISOString();
  return {
    id: randomId("usr"),
    emailVerifiedAt: null,
    authProvider: "email",
    avatarUrl: null,
    edition: "en",
    locale: "en-IN",
    timezone: "UTC",
    displayCurrency: "USD",
    country: "IN",
    onboardingCompletedAt: null,
    tourSeen: false,
    appPinSetAt: null,
    plan: "free",
    planSource: "free",
    entitlementsOverride: null,
    consentTermsVersion: null,
    consentRiskVersion: null,
    consentedAt: null,
    status: "active",
    createdAt: now,
    lastSeenAt: now,
    ...fields,
  };
}

/** BCP-47 locale for an edition in a country, e.g. mr-IN or hi-IN. */
function localeFor(edition: User["edition"], country: string) {
  return `${edition}-${country}`;
}

function findByEmail(db: MockDb, email: string) {
  const wanted = email.toLowerCase();
  return Object.values(db.users).find((user) => user.email.toLowerCase() === wanted && user.status !== "deleted");
}

// ---------------------------------------------------------------- auth

const register: Handler = ({ db, body }) => {
  const input = body as unknown as RegisterInput;
  const email = str(input.email).toLowerCase();
  if (!EMAIL_RE.test(email)) return fail(422, "validation_error", { field: "email" });
  if (str(input.password).length < 8) return fail(422, "validation_error", { field: "password" });
  if (!str(input.displayName)) return fail(422, "validation_error", { field: "displayName" });
  if (!input.ageConfirmed) return fail(422, "validation_error", { field: "ageConfirmed" });
  if (
    input.consentTermsVersion !== LEGAL_VERSIONS.terms ||
    input.consentPrivacyVersion !== LEGAL_VERSIONS.privacy ||
    input.consentRiskVersion !== LEGAL_VERSIONS.risk
  ) {
    return fail(422, "consent_required");
  }
  if (findByEmail(db, email)) return fail(409, "email_taken");

  const now = new Date().toISOString();
  const user = newUser({
    email,
    displayName: str(input.displayName),
    country: str(input.country) || "IN",
    edition: input.edition,
    locale: localeFor(input.edition, str(input.country) || "IN"),
    timezone: str(input.timezone) || "UTC",
    consentTermsVersion: input.consentTermsVersion,
    consentRiskVersion: input.consentRiskVersion,
    consentedAt: now,
  });
  db.users[user.id] = user;
  db.passwords[user.id] = mockHash(input.password, user.id);
  db.watchlists[user.id] = [];
  const verifyToken = randomId("verify");
  db.verifyTokens[verifyToken] = user.id;
  const response = authResponse(db, user);
  // No email is sent in the static site, so the demo exposes the link the email would contain.
  return ok({ ...(response.body as object), dev_verify_url: `/verify-email?token=${verifyToken}` }, 201);
};

const login: Handler = ({ db, body }) => {
  const user = findByEmail(db, str(body.email));
  if (!user || db.passwords[user.id] !== mockHash(String(body.password ?? ""), user.id)) {
    return fail(401, "invalid_credentials");
  }
  if (user.status === "suspended") return fail(403, "account_suspended");
  if (db.pins[user.id]) db.pins[user.id].failedAttempts = 0;
  return authResponse(db, user);
};

const loginWithGoogle: Handler = ({ db }) => {
  const email = "google.demo@afwar.app";
  let user = findByEmail(db, email);
  if (!user) {
    user = newUser({ email, displayName: "Google Demo", authProvider: "google", emailVerifiedAt: new Date().toISOString() });
    db.users[user.id] = user;
    db.watchlists[user.id] = [];
  }
  return authResponse(db, user);
};

/** The Google Sheet already checked the password; mirror that user here and open a session. */
const sheetSession: Handler = ({ db, body }) => {
  const email = str(body.email).toLowerCase();
  if (!EMAIL_RE.test(email)) return fail(422, "validation_error", { field: "email" });
  const edition = (["en", "hi", "mr"].includes(str(body.edition)) ? str(body.edition) : "en") as User["edition"];
  const country = str(body.country) || "IN";
  let user = findByEmail(db, email);
  if (!user) {
    user = newUser({
      email,
      displayName: str(body.displayName) || email,
      country,
      edition,
      locale: localeFor(edition, country),
      timezone: str(body.timezone) || "UTC",
      consentTermsVersion: str(body.consentTermsVersion) || null,
      consentRiskVersion: str(body.consentRiskVersion) || null,
      consentedAt: str(body.createdAt) || new Date().toISOString(),
    });
    db.users[user.id] = user;
    db.watchlists[user.id] = [];
  }
  if (user.status === "suspended") return fail(403, "account_suspended");
  return authResponse(db, user);
};

const logout: Handler = ({ db, token }) => {
  if (token && db.sessions[token]) {
    delete db.sessions[token];
    saveDb(db);
  }
  return ok({ ok: true });
};

const forgot: Handler = ({ db, body }) => {
  const user = findByEmail(db, str(body.email));
  // Same answer either way, so the endpoint can't be used to probe for accounts.
  if (!user) return ok({ ok: true });
  const token = randomId("reset");
  db.resetTokens[token] = { userId: user.id, expiresAt: new Date(Date.now() + 3_600_000).toISOString() };
  saveDb(db);
  return ok({ ok: true, dev_reset_url: `/reset-password?token=${token}` });
};

const reset: Handler = ({ db, body }) => {
  const entry = db.resetTokens[str(body.token)];
  if (!entry) return fail(400, "invalid_token");
  if (new Date(entry.expiresAt) < new Date()) return fail(400, "token_expired");
  if (str(body.password).length < 8) return fail(422, "validation_error", { field: "password" });
  db.passwords[entry.userId] = mockHash(String(body.password), entry.userId);
  // One reset spends every outstanding link for this account, not just the one used.
  for (const [token, other] of Object.entries(db.resetTokens)) {
    if (other.userId === entry.userId) delete db.resetTokens[token];
  }
  // A password reset signs out every session.
  for (const [token, session] of Object.entries(db.sessions)) {
    if (session.userId === entry.userId) delete db.sessions[token];
  }
  saveDb(db);
  return ok({ ok: true });
};

const verify: Handler = ({ db, body }) => {
  const userId = db.verifyTokens[str(body.token)];
  if (!userId || !db.users[userId]) return fail(400, "invalid_token");
  db.users[userId].emailVerifiedAt = new Date().toISOString();
  delete db.verifyTokens[str(body.token)];
  saveDb(db);
  return ok({ ok: true, user: db.users[userId] });
};

const resendVerification = requireUser(({ db, user }) => {
  if (user.emailVerifiedAt) return ok({ ok: true });
  const token = randomId("verify");
  db.verifyTokens[token] = user.id;
  saveDb(db);
  return ok({ ok: true, dev_verify_url: `/verify-email?token=${token}` });
});

// ---------------------------------------------------------------- app PIN

const setPin = requireUser(({ db, user, body }) => {
  const pin = str(body.pin);
  if (!PIN_RE.test(pin)) return fail(422, "validation_error", { field: "pin" });
  const existing = db.pins[user.id];
  if (existing && existing.hash !== mockHash(str(body.current_pin), `pin:${user.id}`)) {
    return fail(401, "wrong_pin");
  }
  db.pins[user.id] = { hash: mockHash(pin, `pin:${user.id}`), failedAttempts: 0 };
  user.appPinSetAt = new Date().toISOString();
  saveDb(db);
  return ok({ user });
});

const verifyPin = requireUser(({ db, user, body, token }) => {
  const record = db.pins[user.id];
  if (!record) return fail(409, "pin_not_set");
  if (record.hash === mockHash(str(body.pin), `pin:${user.id}`)) {
    record.failedAttempts = 0;
    user.lastSeenAt = new Date().toISOString();
    saveDb(db);
    return ok({ ok: true });
  }
  record.failedAttempts += 1;
  const attemptsLeft = MAX_PIN_ATTEMPTS - record.failedAttempts;
  if (attemptsLeft <= 0) {
    // Too many wrong PINs: end this session so only the password gets back in.
    record.failedAttempts = 0;
    if (token) delete db.sessions[token];
    saveDb(db);
    return fail(423, "pin_locked");
  }
  saveDb(db);
  return fail(401, "wrong_pin", { attempts_left: attemptsLeft });
});

// ---------------------------------------------------------------- me

const me = requireUser(({ db, user }) => {
  user.lastSeenAt = new Date().toISOString();
  saveDb(db);
  const response: MeResponse = { user, entitlements: effectiveEntitlements(user), usage: { ai_prompts: usageSummary(db, user) } };
  return ok(response);
});

const PROFILE_FIELDS: (keyof ProfilePatch)[] = ["displayName", "edition", "locale", "timezone", "displayCurrency", "country", "tourSeen"];

const patchMe = requireUser(({ db, user, body }) => {
  for (const field of PROFILE_FIELDS) {
    if (field in body) Object.assign(user, { [field]: body[field] });
  }
  // Dates and numbers follow the edition unless a locale was sent explicitly.
  if (("edition" in body || "country" in body) && !("locale" in body)) user.locale = localeFor(user.edition, user.country);
  saveDb(db);
  return ok({ user });
});

const completeOnboarding = requireUser(({ db, user, body }) => {
  const input = body as unknown as OnboardingInput;
  if (!PIN_RE.test(str(input.pin))) return fail(422, "validation_error", { field: "pin" });
  Object.assign(user, {
    edition: input.edition,
    locale: localeFor(input.edition, user.country),
    timezone: input.timezone,
    displayCurrency: input.displayCurrency,
    onboardingCompletedAt: new Date().toISOString(),
    appPinSetAt: new Date().toISOString(),
  });
  db.pins[user.id] = { hash: mockHash(str(input.pin), `pin:${user.id}`), failedAttempts: 0 };
  db.watchlists[user.id] = input.watchlist;
  saveDb(db);
  return ok({ user });
});

const exportMe = requireUser(({ db, user }) =>
  ok({
    exported_at: new Date().toISOString(),
    user,
    watchlist: db.watchlists[user.id] ?? [],
    ai_usage: db.usage.filter((entry) => entry.userId === user.id),
    subscription: db.subscriptions[user.id] ?? null,
    devices: db.devices[user.id] ?? [],
    broker: db.brokers[user.id] ?? null,
    notification_prefs: db.notificationPrefs[user.id] ?? null,
  }),
);

const deleteMe = requireUser(({ db, user }) => {
  user.status = "deleted";
  user.email = `deleted+${user.id}@afwar.invalid`;
  for (const [token, session] of Object.entries(db.sessions)) {
    if (session.userId === user.id) delete db.sessions[token];
  }
  delete db.pins[user.id];
  delete db.brokers[user.id];
  saveDb(db);
  return ok({ ok: true });
});

const DEFAULT_PREFS: NotificationPrefs = { push: true, email_digest: false, alert_delivery: "both", risk_warnings: true };

const getPrefs = requireUser(({ db, user }) => ok(db.notificationPrefs[user.id] ?? DEFAULT_PREFS));
const putPrefs = requireUser(({ db, user, body }) => {
  db.notificationPrefs[user.id] = { ...DEFAULT_PREFS, ...(db.notificationPrefs[user.id] ?? {}), ...body } as NotificationPrefs;
  saveDb(db);
  return ok(db.notificationPrefs[user.id]);
});

// ---------------------------------------------------------------- agent

const TRADE_INTENT = /\b(buy|sell|place\s+(an?\s+)?order|go\s+(long|short)|open\s+(a\s+)?(long|short)|close\s+(my\s+)?(trade|position)s?)\b|\b\d+(\.\d+)?\s*lots?\b|खरीद|बेच|खरेदी|विक्री/i;
const CLOSE_ALL = /\b(close|hide)\s+(everything|all)\b|सब\s*बंद|सर्व\s*बंद/i;
const OPEN_VERB = /\b(open|show|launch|bring\s+up|go\s+to|take\s+me\s+to|switch\s+to)\b|खोलो|खोलें|खोलिए|दिखाओ|दिखाएँ|दिखाएं|दिखाइए|kholo|dikhao|dikha|उघड|दाखव/i;
const TIMEFRAME = /\b\d+\s*(m|min|h|hr|hour|d|day|w)\b/i;
const QUESTION = /\?|\b(why|what|how|is|will|should|when|which|explain)\b|क्या|क्यों|कैसे|काय|कसे|कसा|कशी|कधी/i;
const CLOSE_VERB = /\b(close|hide|dismiss)\b|बंद|band\s*karo/i;

const WINDOW_WORDS: [string, RegExp][] = [
  ["markets", /\b(chart|charts|market|markets|gold|silver|oil|crude|wti|xau|xag|eur\s*\/?\s*usd|usd\s*\/?\s*jpy|gbp\s*\/?\s*usd|nzd\s*\/?\s*usd|bitcoin|btc|crypto)\b|चार्ट|सोना|गोल्ड|सिल्वर|मार्केट|बाज़ार|बाजार|सोने|चांदी/i],
  ["assistant", /\b(assistant|chat|ai)\b|सहायक|सहाय्यक|असिस्टेंट/i],
  ["news", /\b(news|headlines)\b|समाचार|खबर|न्यूज़|न्यूज|बातम्या|बातमी/i],
  ["brief", /\b(daily\s+brief|brief|briefing)\b|ब्रीफ|सारांश/i],
  ["alerts", /\b(alerts?)\b|अलर्ट|सूचना/i],
  ["positions", /\b(positions?|portfolio|risk(\s+guardian)?)\b|पोजीशन|पोज़िशन|पोझिशन|रिस्क|जोखीम/i],
  ["research", /\b(research)\b|रिसर्च|संशोधन/i],
  ["settings", /\b(settings|preferences)\b|सेटिंग|सेटिंग्ज/i],
];

type AgentAction = { type: "open_window" | "close_window"; window: string } | { type: "close_all" };

/** Code-level intent detection for OS commands — these never reach the analyst model. */
function navigationIntent(text: string): AgentAction | null {
  if (CLOSE_ALL.test(text)) return { type: "close_all" };
  const target = WINDOW_WORDS.find(([, pattern]) => pattern.test(text))?.[0];
  if (!target) return null;
  if (CLOSE_VERB.test(text)) return { type: "close_window", window: target };
  // Bare phrases like "gold 4h" or "news" are commands; anything longer needs a verb.
  const words = text.trim().split(/\s+/).length;
  const bare = words <= 2 || (words <= 3 && TIMEFRAME.test(text));
  if (OPEN_VERB.test(text) || (bare && !QUESTION.test(text))) return { type: "open_window", window: target };
  return null;
}

const agentPrompt = requireUser(({ db, user, body }) => {
  const text = str(body.text);
  if (!text) return fail(422, "validation_error", { field: "text" });
  const kind: AiUsage["kind"] = body.source === "voice" ? "voice" : "chat";
  const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(user.edition, key, vars);
  const record = (counted: boolean, credits: number) => {
    db.usage.push({ id: randomId("use"), userId: user.id, at: new Date().toISOString(), kind: counted ? kind : "navigation", counted, credits, cacheHit: false });
    saveDb(db);
  };

  if (TRADE_INTENT.test(text)) {
    return ok({ kind: "refusal", reply: t("assistant.reply.refusal"), counted: false, credits: 0, cache_hit: false, usage: usageSummary(db, user) });
  }

  const action = navigationIntent(text);
  if (action) {
    record(false, 0);
    const reply =
      action.type === "close_all"
        ? t("assistant.reply.closedAll")
        : t(action.type === "open_window" ? "assistant.reply.opened" : "assistant.reply.closed", {
            window: t(`apps.${action.window}` as MessageKey),
          });
    return ok({ kind: "navigation", reply, action, counted: false, credits: 0, cache_hit: false, usage: usageSummary(db, user) });
  }

  const summary = usageSummary(db, user);
  if (summary.limit !== null && summary.used >= summary.limit) {
    return fail(402, "quota_exceeded", { resets_at: summary.resets_at, used: summary.used, limit: summary.limit });
  }
  record(true, 1);
  return ok({
    kind: "chat",
    reply: t("assistant.reply.demo", { question: text }),
    counted: true,
    credits: 1,
    cache_hit: false,
    usage: usageSummary(db, user),
  });
});

// ---------------------------------------------------------------- content

const news = requireUser(({ user, query }) => {
  const delay = effectiveEntitlements(user).news_delay_minutes;
  const now = Date.now();
  const cutoff = now - delay * 60_000;
  const symbol = query.get("symbol")?.toUpperCase();
  const items = MOCK_HEADLINES.map((headline, index) => ({ ...headline, published_at: new Date(now - headline.minutesAgo * 60_000).toISOString(), index }))
    // The delay is applied server-side: a free account never receives fresher items.
    .filter((item) => new Date(item.published_at).getTime() <= cutoff)
    .filter((item) => !symbol || item.symbols.includes(symbol))
    .map(({ id, title, source, venue, symbols, published_at, index }) => ({
      id,
      title,
      symbols,
      published_at,
      provenance: { source, venue, time: published_at, delay_minutes: delay, cache_age_s: 6 + ((index * 7) % 40) },
    }));
  return ok({ items, delay_minutes: delay, as_of: new Date(now).toISOString() });
});

const brief = requireUser(({ user }) =>
  ok({
    ...MOCK_DAILY_BRIEF,
    edition: user.edition,
    published_at: new Date(new Date().setHours(8, 30, 0, 0)).toISOString(),
    credits: 0,
    cache_hit: true,
  }),
);

// ---------------------------------------------------------------- billing

function grantPro(db: MockDb, user: User, interval: BillingInterval) {
  const days = interval === "yearly" ? 365 : 30;
  user.plan = "pro";
  user.planSource = "stripe";
  db.subscriptions[user.id] = {
    id: randomId("sub"),
    userId: user.id,
    provider: "stripe",
    providerCustomerId: db.subscriptions[user.id]?.providerCustomerId ?? randomId("cus"),
    providerSubscriptionId: randomId("sub_test"),
    status: "active",
    currentPeriodEnd: new Date(Date.now() + days * 86_400_000).toISOString(),
    cancelAtPeriodEnd: false,
    graceUntil: null,
  };
}

const checkout = requireUser(({ db, user, body }) => {
  const interval: BillingInterval = body.interval === "yearly" ? "yearly" : "monthly";
  if (user.plan === "pro") return fail(409, "already_pro");
  const price = PRO_PRICES[interval];
  const session = {
    id: randomId("cs_test"),
    userId: user.id,
    interval,
    amount: price.amount,
    currency: price.currency,
    status: "open" as const,
    createdAt: new Date().toISOString(),
  };
  db.checkouts[session.id] = session;
  saveDb(db);
  return ok({ id: session.id, mode: "subscription", interval, amount: price.amount, currency: price.currency, customer_email: user.email, status: "open", livemode: false });
});

/**
 * Stands in for Stripe's server-to-server webhook. In production Stripe signs
 * these and calls FastAPI directly; the demo checkout posts them itself.
 */
const webhook: Handler = ({ db, body }) => {
  const data = (body.data ?? {}) as Record<string, unknown>;
  if (body.type === "checkout.session.completed") {
    const session = db.checkouts[str(data.session_id)];
    if (!session || session.status !== "open") return fail(400, "invalid_session");
    const user = db.users[session.userId];
    session.status = "complete";
    grantPro(db, user, session.interval);
    saveDb(db);
    return ok({ received: true, plan: user.plan });
  }
  if (body.type === "customer.subscription.deleted") {
    const user = db.users[str(data.user_id)];
    if (!user) return fail(400, "invalid_user");
    user.plan = "free";
    user.planSource = "free";
    if (db.subscriptions[user.id]) db.subscriptions[user.id].status = "canceled";
    saveDb(db);
    return ok({ received: true, plan: user.plan });
  }
  return ok({ received: true, ignored: true });
};

const subscription = requireUser(({ db, user }) => ok({ subscription: db.subscriptions[user.id] ?? null }));

const setCancel = (cancel: boolean) =>
  requireUser(({ db, user }) => {
    const sub = db.subscriptions[user.id];
    if (!sub || sub.status !== "active") return fail(404, "no_subscription");
    sub.cancelAtPeriodEnd = cancel;
    saveDb(db);
    return ok({ subscription: sub });
  });

/** Dev-only plan switch behind the floating Free ⇄ Pro toggle. */
const devPlan = requireUser(({ db, user, body }) => {
  if (process.env.NODE_ENV === "production") return fail(404, "not_found");
  const plan: Plan = body.plan === "pro" ? "pro" : "free";
  user.plan = plan;
  user.planSource = plan === "pro" ? "manual" : "free";
  saveDb(db);
  return ok({ user, entitlements: PLANS[plan] });
});

const devResetUsage = requireUser(({ db, user }) => {
  if (process.env.NODE_ENV === "production") return fail(404, "not_found");
  db.usage = db.usage.filter((entry) => entry.userId !== user.id);
  saveDb(db);
  return ok({ usage: usageSummary(db, user) });
});

// ---------------------------------------------------------------- devices & broker

const devices = requireUser(({ db, user, token }) => {
  const current = token ? db.sessions[token]?.deviceId : null;
  const list = (db.devices[user.id] ?? []).map((device) => ({ ...device, isCurrent: device.id === current }));
  return ok({ devices: list });
});

const deleteDevice = requireUser(({ db, user, params, token }) => {
  const [id] = params;
  if (token && db.sessions[token]?.deviceId === id) return fail(409, "cannot_remove_current_device");
  const list = db.devices[user.id] ?? [];
  if (!list.some((device) => device.id === id)) return fail(404, "not_found");
  db.devices[user.id] = list.filter((device) => device.id !== id);
  for (const [sessionToken, session] of Object.entries(db.sessions)) {
    if (session.deviceId === id) delete db.sessions[sessionToken];
  }
  saveDb(db);
  return ok({ ok: true });
});

const getBroker = requireUser(({ db, user }) => ok({ connection: db.brokers[user.id] ?? null }));

const connectBroker = requireUser(({ db, user, body }) => {
  const server = str(body.server);
  const login = str(body.login);
  if (!server || !/^\d{4,12}$/.test(login) || !str(body.investor_password)) {
    return fail(422, "validation_error");
  }
  // The investor password is checked against MT5 and discarded — never stored.
  db.brokers[user.id] = { platform: "mt5", server, login, access: "investor", connectedAt: new Date().toISOString() };
  saveDb(db);
  return ok({ connection: db.brokers[user.id] });
});

const disconnectBroker = requireUser(({ db, user }) => {
  delete db.brokers[user.id];
  saveDb(db);
  return ok({ ok: true });
});

// ---------------------------------------------------------------- router

const ROUTES: [string, RegExp, Handler][] = [
  ["POST", /^\/api\/v1\/auth\/register$/, register],
  ["POST", /^\/api\/v1\/auth\/login$/, login],
  ["POST", /^\/api\/v1\/auth\/google$/, loginWithGoogle],
  ["POST", /^\/api\/v1\/auth\/sheet-session$/, sheetSession],
  ["POST", /^\/api\/v1\/auth\/logout$/, logout],
  ["POST", /^\/api\/v1\/auth\/forgot$/, forgot],
  ["POST", /^\/api\/v1\/auth\/reset$/, reset],
  ["POST", /^\/api\/v1\/auth\/verify$/, verify],
  ["POST", /^\/api\/v1\/auth\/verify\/resend$/, resendVerification],
  ["POST", /^\/api\/v1\/auth\/pin$/, setPin],
  ["POST", /^\/api\/v1\/auth\/pin\/verify$/, verifyPin],
  ["GET", /^\/api\/v1\/me$/, me],
  ["PATCH", /^\/api\/v1\/me$/, patchMe],
  ["DELETE", /^\/api\/v1\/me$/, deleteMe],
  ["POST", /^\/api\/v1\/me\/onboarding$/, completeOnboarding],
  ["GET", /^\/api\/v1\/me\/export$/, exportMe],
  ["GET", /^\/api\/v1\/me\/notifications$/, getPrefs],
  ["PUT", /^\/api\/v1\/me\/notifications$/, putPrefs],
  ["POST", /^\/api\/v1\/agent\/prompt$/, agentPrompt],
  ["GET", /^\/api\/v1\/news$/, news],
  ["GET", /^\/api\/v1\/brief$/, brief],
  ["POST", /^\/api\/v1\/billing\/checkout$/, checkout],
  ["POST", /^\/api\/v1\/billing\/webhook$/, webhook],
  ["GET", /^\/api\/v1\/billing\/subscription$/, subscription],
  ["POST", /^\/api\/v1\/billing\/subscription\/cancel$/, setCancel(true)],
  ["POST", /^\/api\/v1\/billing\/subscription\/resume$/, setCancel(false)],
  ["POST", /^\/api\/v1\/dev\/plan$/, devPlan],
  ["POST", /^\/api\/v1\/dev\/reset-usage$/, devResetUsage],
  ["GET", /^\/api\/v1\/devices$/, devices],
  ["DELETE", /^\/api\/v1\/devices\/([^/]+)$/, deleteDevice],
  ["GET", /^\/api\/v1\/broker$/, getBroker],
  ["POST", /^\/api\/v1\/broker$/, connectBroker],
  ["DELETE", /^\/api\/v1\/broker$/, disconnectBroker],
];

export interface MockOptions {
  /** Skip the simulated network latency (tests). */
  instant?: boolean;
}

export async function handleMockRequest(request: MockRequest, options: MockOptions = {}): Promise<MockResponse> {
  if (!options.instant && process.env.NODE_ENV !== "test") await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 400));
  const url = new URL(request.path, "http://mock.local");
  const db = loadDb();
  const session = request.token ? db.sessions[request.token] : undefined;
  const user = session ? db.users[session.userId] ?? null : null;

  for (const [method, pattern, handler] of ROUTES) {
    const match = url.pathname.match(pattern);
    if (!match || method !== request.method) continue;
    return handler({
      db,
      body: (request.body ?? {}) as Record<string, unknown>,
      query: url.searchParams,
      params: match.slice(1),
      user: user && user.status === "active" ? user : null,
      token: request.token,
    });
  }
  return fail(404, "not_found");
}

export { DEMO_PIN };
