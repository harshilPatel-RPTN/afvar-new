import { chromium } from "playwright";
const OUT = process.argv[2];
const BASE = "http://localhost:3000";
const b = await chromium.launch({ channel: "chrome" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, baseURL: BASE });
const errors = [];
const log = (...a) => console.log("•", ...a);
const watch = (p) => { p.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`)); p.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`)); };
const p = await ctx.newPage(); watch(p);
const shot = (name, page = p) => page.screenshot({ path: `${OUT}/${name}.png` });
try {
  await p.goto("/desktop"); await p.waitForURL(/\/login\?next=%2Fdesktop/); log("unauth /desktop ->", p.url());
  await p.fill("#email", "free@afwar.app"); await p.fill("#password", "demo1234");
  await p.getByRole("button", { name: "Sign in", exact: true }).click();
  await p.waitForURL(/\/desktop/); await p.getByRole("navigation", { name: "Dock" }).waitFor(); log("signed in ->", p.url());
  await p.waitForTimeout(800); await shot("01-desktop-free");

  const input = p.locator("#assistant-input");
  await input.waitFor({ timeout: 5000 });
  await input.fill("Why is gold moving right now?"); await input.press("Enter");
  await p.getByText("You've used today's free prompt").first().waitFor({ timeout: 10000 });
  log("free prompt answered, paywall shown");
  await p.waitForTimeout(500); await shot("02-assistant-paywall");

  await p.getByRole("button", { name: "News", exact: true }).click();
  await p.getByText(/You're seeing news 30 minutes late/).waitFor({ timeout: 8000 }); log("nav chip opened news with delay banner");
  const badges = await p.getByText("delayed 30 min").count(); log("delayed badges:", badges);
  await p.waitForTimeout(400); await shot("03-news-delayed");

  await p.locator("header").getByRole("button", { name: "Speak a command" }).click();
  await p.getByRole("dialog", { name: "Voice control is a Pro feature" }).waitFor(); log("mic -> voice upgrade modal");
  await shot("04-voice-gate"); await p.keyboard.press("Escape");

  await p.getByRole("button", { name: "Layouts" }).click();
  await p.getByRole("menuitem", { name: /Save current layout/ }).click();
  await p.getByPlaceholder("Layout name").fill("Morning"); await p.keyboard.press("Enter");
  await p.getByRole("button", { name: "Layouts" }).click();
  await p.getByRole("menuitem", { name: /Save current layout/ }).click();
  await p.getByRole("dialog", { name: "Free plan saves 1 layout" }).waitFor(); log("2nd layout save blocked");
  await shot("05-layout-gate");

  await p.getByRole("dialog").getByRole("button", { name: "Upgrade to Pro" }).click();
  await p.getByText("Pay with card").waitFor(); await p.waitForTimeout(800);
  await p.getByRole("button", { name: /4242 · Succeeds/ }).click();
  await shot("06-stripe-filled");
  await p.getByRole("button", { name: /^Subscribe/ }).click();
  await p.getByText("Welcome to AFWAR Pro").waitFor({ timeout: 10000 }); log("stripe demo payment succeeded");
  await shot("07-stripe-success");
  await p.getByRole("button", { name: "Continue", exact: true }).click();
  await p.waitForTimeout(1200);
  log("banner after upgrade:", await p.getByText(/You're seeing news 30 minutes late/).count());
  log("PRO badge:", await p.locator("header").getByText("PRO", { exact: true }).count());
  await shot("08-desktop-pro");

  // New tab = new app session: must ask for the PIN.
  const tab = await ctx.newPage(); watch(tab);
  await tab.goto("/desktop"); await tab.waitForURL(/\/\?next=%2Fdesktop/, { timeout: 10000 }); log("new tab locked ->", tab.url());
  await tab.getByRole("button", { name: /Enter full screen|Open AFWAR/ }).click();
  await tab.getByText("Enter your AFWAR PIN").waitFor({ timeout: 8000 });
  await tab.waitForTimeout(600); await shot("09-lock-pin", tab);
  await tab.keyboard.type("1111"); await tab.getByText(/Wrong PIN · 4 attempts left/).waitFor(); log("wrong PIN rejected");
  await tab.keyboard.type("1234"); await tab.waitForURL(/\/desktop/, { timeout: 10000 }); log("PIN unlocked ->", tab.url());
  await tab.close();
} catch (e) {
  log("FAILED:", e.message.split("\n")[0]); await shot("zz-failure");
}
console.log("errors:", errors.slice(0, 10));
await b.close();
