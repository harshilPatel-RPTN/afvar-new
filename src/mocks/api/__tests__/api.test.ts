import { beforeEach, describe, expect, it } from "vitest";
import { LEGAL_VERSIONS } from "@/modules/auth";
import { EDITIONS, translate } from "@/platform/i18n";
import { handleMockRequest, resetDb } from "../index";

type Body = Record<string, unknown>;

async function call(method: string, path: string, body?: unknown, token: string | null = null) {
  const response = await handleMockRequest({ method, path, body, token }, { instant: true });
  return { status: response.status, body: response.body as Body };
}

async function signIn(email: string) {
  const { body } = await call("POST", "/api/v1/auth/login", { email, password: "demo1234" });
  return body.access_token as string;
}

beforeEach(() => {
  resetDb();
});

describe("auth", () => {
  it("rejects a wrong password and accepts the seeded demo users", async () => {
    expect((await call("POST", "/api/v1/auth/login", { email: "free@afwar.app", password: "nope" })).status).toBe(401);
    const { status, body } = await call("POST", "/api/v1/auth/login", { email: "free@afwar.app", password: "demo1234" });
    expect(status).toBe(200);
    expect(body.first_login).toBe(false);
    expect((body.user as Body).plan).toBe("free");
  });

  it("stores consent versions and a timestamp on register, and sends new users to onboarding", async () => {
    const { status, body } = await call("POST", "/api/v1/auth/register", {
      email: "new@afwar.app",
      password: "Sturdy-pass-9",
      displayName: "New Trader",
      country: "AE",
      consentTermsVersion: LEGAL_VERSIONS.terms,
      consentPrivacyVersion: LEGAL_VERSIONS.privacy,
      consentRiskVersion: LEGAL_VERSIONS.risk,
      ageConfirmed: true,
      edition: "mr",
      timezone: "Asia/Dubai",
    });
    expect(status).toBe(201);
    const user = body.user as Body;
    expect(user.consentTermsVersion).toBe(LEGAL_VERSIONS.terms);
    expect(user.consentRiskVersion).toBe(LEGAL_VERSIONS.risk);
    expect(typeof user.consentedAt).toBe("string");
    expect(user.edition).toBe("mr");
    expect(body.first_login).toBe(true);
  });

  it("refuses registration without consent", async () => {
    const { status } = await call("POST", "/api/v1/auth/register", {
      email: "x@afwar.app",
      password: "Sturdy-pass-9",
      displayName: "X",
      consentTermsVersion: LEGAL_VERSIONS.terms,
      consentPrivacyVersion: LEGAL_VERSIONS.privacy,
      consentRiskVersion: null,
      ageConfirmed: true,
    });
    expect(status).toBe(422);
  });

  it("returns /me in the agreed shape", async () => {
    const token = await signIn("pro@afwar.app");
    const { body } = await call("GET", "/api/v1/me", undefined, token);
    expect(Object.keys(body).sort()).toEqual(["entitlements", "usage", "user"]);
    expect((body.usage as Body).ai_prompts).toMatchObject({ used: 0, limit: null });
  });
});

describe("app PIN", () => {
  it("unlocks with the right PIN and ends the session after five wrong ones", async () => {
    const token = await signIn("free@afwar.app");
    expect((await call("POST", "/api/v1/auth/pin/verify", { pin: "1234" }, token)).status).toBe(200);
    for (let attempt = 1; attempt <= 4; attempt++) {
      const wrong = await call("POST", "/api/v1/auth/pin/verify", { pin: "9999" }, token);
      expect(wrong.status).toBe(401);
      expect(wrong.body.attempts_left).toBe(5 - attempt);
    }
    expect((await call("POST", "/api/v1/auth/pin/verify", { pin: "9999" }, token)).status).toBe(423);
    expect((await call("GET", "/api/v1/me", undefined, token)).status).toBe(401);
  });

  it("needs the current PIN to change it", async () => {
    const token = await signIn("free@afwar.app");
    expect((await call("POST", "/api/v1/auth/pin", { pin: "4826", current_pin: "0000" }, token)).status).toBe(401);
    expect((await call("POST", "/api/v1/auth/pin", { pin: "4826", current_pin: "1234" }, token)).status).toBe(200);
    expect((await call("POST", "/api/v1/auth/pin/verify", { pin: "4826" }, token)).status).toBe(200);
  });
});

describe("agent prompt quota", () => {
  it("accepts one free prompt, then answers 402 with the reset time", async () => {
    const token = await signIn("free@afwar.app");
    const first = await call("POST", "/api/v1/agent/prompt", { text: "Why is gold moving right now?" }, token);
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ kind: "chat", counted: true });

    const second = await call("POST", "/api/v1/agent/prompt", { text: "And silver?" }, token);
    expect(second.status).toBe(402);
    expect(second.body.error).toBe("quota_exceeded");
    expect(Date.parse(String(second.body.resets_at))).toBeGreaterThan(Date.now());
  });

  it("never counts navigation, and keeps it working after the quota is spent", async () => {
    const token = await signIn("free@afwar.app");
    await call("POST", "/api/v1/agent/prompt", { text: "Explain the dollar index today" }, token);
    for (const text of ["open news", "gold 4h", "close everything", "silver ka chart dikhao"]) {
      const { status, body } = await call("POST", "/api/v1/agent/prompt", { text }, token);
      expect(status, text).toBe(200);
      expect(body.kind, text).toBe("navigation");
      expect(body.counted, text).toBe(false);
    }
  });

  it("recognises the paywall's navigation chips in every edition", async () => {
    const token = await signIn("free@afwar.app");
    const chips = ["assistant.suggest.openNews", "assistant.suggest.openAlerts", "assistant.nav.openNews", "assistant.nav.openAlerts", "assistant.nav.openBrief", "assistant.nav.openMarkets"] as const;
    for (const edition of EDITIONS) {
      for (const key of chips) {
        const text = translate(edition, key);
        const { body } = await call("POST", "/api/v1/agent/prompt", { text }, token);
        expect(body.kind, `${edition}: ${text}`).toBe("navigation");
      }
    }
  });

  it("treats a short question as a question, not a command", async () => {
    const token = await signIn("pro@afwar.app");
    const { body } = await call("POST", "/api/v1/agent/prompt", { text: "is gold bullish?" }, token);
    expect(body.kind).toBe("chat");
  });

  it("refuses any trading instruction without spending a prompt", async () => {
    const token = await signIn("free@afwar.app");
    const { body } = await call("POST", "/api/v1/agent/prompt", { text: "Buy 2 lots of gold" }, token);
    expect(body.kind).toBe("refusal");
    expect(body.counted).toBe(false);
    expect(String(body.reply)).not.toMatch(/\b(buy|sell)\b/i);
  });

  it("is unlimited on Pro", async () => {
    const token = await signIn("pro@afwar.app");
    for (let i = 0; i < 3; i++) {
      expect((await call("POST", "/api/v1/agent/prompt", { text: `Question ${i} about yields` }, token)).status).toBe(200);
    }
  });
});

describe("news delay", () => {
  it("only returns items older than 30 minutes on Free", async () => {
    const token = await signIn("free@afwar.app");
    const { body } = await call("GET", "/api/v1/news", undefined, token);
    const items = body.items as { published_at: string; provenance: { delay_minutes: number } }[];
    expect(body.delay_minutes).toBe(30);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(Date.now() - Date.parse(item.published_at)).toBeGreaterThanOrEqual(30 * 60_000 - 1000);
      expect(item.provenance.delay_minutes).toBe(30);
    }
  });

  it("is live on Pro and filters by symbol", async () => {
    const token = await signIn("pro@afwar.app");
    const all = await call("GET", "/api/v1/news", undefined, token);
    expect(all.body.delay_minutes).toBe(0);
    const gold = await call("GET", "/api/v1/news?symbol=XAUUSD", undefined, token);
    for (const item of gold.body.items as { symbols: string[] }[]) expect(item.symbols).toContain("XAUUSD");
  });
});

describe("billing", () => {
  it("upgrades a free user when Stripe reports the checkout complete", async () => {
    const token = await signIn("free@afwar.app");
    const checkout = await call("POST", "/api/v1/billing/checkout", { interval: "yearly" }, token);
    expect(checkout.body).toMatchObject({ interval: "yearly", livemode: false, status: "open" });

    await call("POST", "/api/v1/billing/webhook", { type: "checkout.session.completed", data: { session_id: checkout.body.id } });
    const me = await call("GET", "/api/v1/me", undefined, token);
    expect((me.body.user as Body).plan).toBe("pro");
    const { body } = await call("GET", "/api/v1/billing/subscription", undefined, token);
    expect((body.subscription as Body).status).toBe("active");
  });

  it("will not complete the same checkout twice", async () => {
    const token = await signIn("free@afwar.app");
    const checkout = await call("POST", "/api/v1/billing/checkout", { interval: "monthly" }, token);
    const event = { type: "checkout.session.completed", data: { session_id: checkout.body.id } };
    expect((await call("POST", "/api/v1/billing/webhook", event)).status).toBe(200);
    expect((await call("POST", "/api/v1/billing/webhook", event)).status).toBe(400);
  });
});

describe("devices", () => {
  it("can't remove the current device but can remove another", async () => {
    const token = await signIn("free@afwar.app");
    const { body } = await call("GET", "/api/v1/devices", undefined, token);
    const devices = body.devices as { id: string; isCurrent: boolean }[];
    const current = devices.find((device) => device.isCurrent)!;
    const other = devices.find((device) => !device.isCurrent)!;
    expect((await call("DELETE", `/api/v1/devices/${current.id}`, undefined, token)).status).toBe(409);
    expect((await call("DELETE", `/api/v1/devices/${other.id}`, undefined, token)).status).toBe(200);
  });
});

describe("broker", () => {
  it("never stores the investor password", async () => {
    const token = await signIn("free@afwar.app");
    await call("POST", "/api/v1/broker", { server: "Demo-Live", login: "51234567", investor_password: "secret-investor" }, token);
    const exported = await call("GET", "/api/v1/me/export", undefined, token);
    expect(JSON.stringify(exported.body)).not.toContain("secret-investor");
    expect((exported.body.broker as Body).access).toBe("investor");
  });
});
