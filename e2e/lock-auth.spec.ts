import { expect, test, type Page } from "@playwright/test";

// Every app route is removed for now (the lock screen and auth live on as
// components only), so these flows have nothing to open. Re-enable with the pages.
test.skip(true, "app routes removed for now");

/**
 * Opens an AFVAR page and steps through the full-screen gate: every owned page
 * shows the launch card until the browser is in full screen.
 */
async function openPage(page: Page, url: string) {
  await page.goto(url);
  const gate = page.getByRole("button", { name: /Enter full screen|Open AFVAR/ });
  await gate.click();
  await expect(gate).toHaveCount(0);
}

/**
 * Lock screen + mock auth flows. Every test gets a fresh browser context, so
 * the in-browser mock DB (localStorage `afwar.mockdb.v1`) starts from its seed
 * each time and registrations never leak between tests.
 *
 * `/` is the whole OS: launch card (full-screen gate) → lock screen. A correct
 * PIN opens /markets. There is no desktop: right after a password login or
 * registration (the one-time fresh unlock) `/` goes straight to /markets.
 */

const FREE_EMAIL = "free@afwar.app";
const PRO_EMAIL = "pro@afwar.app";
const DEMO_PASSWORD = "demo1234";
const DEMO_PIN = "1234";

const LAUNCH_BUTTON = /Enter full screen|Open AFVAR/;

test.use({ viewport: { width: 1440, height: 900 } });

/** Current path of the page, e.g. "/" for the OS. */
const pathOf = (page: Page) => new URL(page.url()).pathname;

const lockScreen = (page: Page) => page.getByRole("main", { name: "AFVAR lock screen" });

async function login(page: Page, email: string, password: string) {
  await openPage(page, "/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

async function loginAndWait(page: Page, email: string, password: string) {
  await login(page, email, password);
  await expect(page).not.toHaveURL(/\/login/);
}

/**
 * Clicks the launch card's button to enter full screen. A no-op when already in
 * full screen (e.g. after signing in from the gated /login, which keeps it).
 */
async function enterFullscreen(page: Page) {
  if (await page.evaluate(() => Boolean(document.fullscreenElement))) return;
  await page.getByRole("button", { name: LAUNCH_BUTTON }).click();
}

/** `/` shows the launch card first; its button reveals the lock screen. */
async function openLockScreen(page: Page) {
  await page.goto("/");
  await enterFullscreen(page);
  await expect(lockScreen(page)).toBeVisible();
}

/** Types a PIN on the keyboard, waiting for the field to re-enable after each check. */
async function enterPin(page: Page, pin: string) {
  const field = page.locator('input[inputmode="numeric"]');
  await expect(field).toBeEnabled();
  await expect(field).toBeFocused();
  await page.keyboard.type(pin);
}

/** The lock screen asks for the PIN and only ever reads "Locked". */
async function expectPinPrompt(page: Page) {
  await expect(lockScreen(page)).toBeVisible();
  await expect(page.getByText("Enter your AFVAR PIN")).toBeVisible();
  await expect(page.getByText("Locked", { exact: true })).toBeVisible();
  await expect(page.getByText("Unlocked", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(0);
}

/** A correct PIN leaves the lock screen for the /markets page. */
async function expectMarkets(page: Page) {
  await expect(page).toHaveURL(/\/markets$/);
  await expect(page.getByRole("heading", { level: 1, name: /See the market\. Understand what moves it\./ })).toBeVisible();
  await expect(lockScreen(page)).toHaveCount(0);
}

/** Signed in on /markets: plan badge, Upgrade and Log Out in the header (no desktop, no Lock). */
async function expectSignedInMarkets(page: Page) {
  await expectMarkets(page);
  const header = page.getByRole("banner");
  await expect(header.getByText("Free Trader")).toBeVisible();
  await expect(header.getByRole("button", { name: "Upgrade to Pro" })).toBeVisible();
  await expect(header.getByRole("button", { name: "Lock", exact: true })).toHaveCount(0);
  await expect(header.getByRole("button", { name: "Log Out" })).toBeVisible();
}

test("signed-out / shows the launch card, then the signed-out lock screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Your trading desk/ })).toBeVisible();
  await expect(page.getByText("Sign in to open your desktop.")).toHaveCount(0);

  await enterFullscreen(page);

  await expect(page.getByText("Sign in to open your desktop.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in", exact: true })).toHaveAttribute("href", /^\/login\?next=/);
  await expect(page.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/register");
});

test("login rejects a wrong password and accepts the right one, landing on /markets", async ({ page }) => {
  await login(page, FREE_EMAIL, "not-the-password");
  await expect(page.getByText("That email and password don't match.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);

  await page.fill("#password", DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect.poll(() => pathOf(page)).toBe("/markets");
});

test("after a password login /markets opens without a PIN, but a new tab asks for it", async ({ page, context }) => {
  await loginAndWait(page, FREE_EMAIL, DEMO_PASSWORD);
  // Fresh unlock: no desktop and no PIN, straight to /markets with the account controls.
  await expectSignedInMarkets(page);

  const tab = await context.newPage();
  await openLockScreen(tab);
  await expectPinPrompt(tab);
});

test("a new tab is locked; a wrong PIN counts down; the right PIN opens /markets", async ({ page, context }) => {
  await loginAndWait(page, FREE_EMAIL, DEMO_PASSWORD);

  const tab = await context.newPage();
  await openLockScreen(tab);
  await expectPinPrompt(tab);

  await enterPin(tab, "1111");
  await expect(tab.getByText("Wrong PIN · 4 attempts left")).toBeVisible();
  await expectPinPrompt(tab);

  await enterPin(tab, DEMO_PIN);
  await expectMarkets(tab);
});

test("a reload or a new tab always asks for the PIN, then opens /markets", async ({ page, context }) => {
  await loginAndWait(page, FREE_EMAIL, DEMO_PASSWORD);
  await expectSignedInMarkets(page);

  // The fresh unlock is one-time: opening `/` again goes through the gate and the PIN.
  await page.goto("/");
  await expect(page.getByRole("button", { name: LAUNCH_BUTTON })).toBeVisible();
  await enterFullscreen(page);
  await expectPinPrompt(page);
  await enterPin(page, DEMO_PIN);
  await expectMarkets(page);

  const tab = await context.newPage();
  await openLockScreen(tab);
  await expectPinPrompt(tab);
  await enterPin(tab, DEMO_PIN);
  await expectMarkets(tab);
});

test("leaving full screen on the lock screen hides it; re-entering asks for the PIN", async ({ page }) => {
  await loginAndWait(page, FREE_EMAIL, DEMO_PASSWORD);
  await expectSignedInMarkets(page);
  await page.keyboard.press("Control+Shift+L");
  await expectPinPrompt(page);

  await page.evaluate(() => document.exitFullscreen());
  await expect(lockScreen(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: LAUNCH_BUTTON })).toBeVisible();

  await enterFullscreen(page);
  await expectPinPrompt(page);
  await enterPin(page, DEMO_PIN);
  await expectMarkets(page);
});

test("Upgrade on /markets opens the Pro upgrade", async ({ page }) => {
  await loginAndWait(page, FREE_EMAIL, DEMO_PASSWORD);
  await expectSignedInMarkets(page);
  await page.getByRole("banner").getByRole("button", { name: "Upgrade to Pro" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("Log Out on /markets signs out and returns to the lock screen", async ({ page }) => {
  await loginAndWait(page, FREE_EMAIL, DEMO_PASSWORD);
  await expectSignedInMarkets(page);

  await page.getByRole("banner").getByRole("button", { name: "Log Out" }).click();
  await expect.poll(() => pathOf(page)).toBe("/");
  await expect(lockScreen(page)).toBeVisible();
  await expect(page.getByText("Sign in to open your desktop.")).toBeVisible();
  await expect(page.getByText("Enter your AFVAR PIN")).toHaveCount(0);
});

test("Ctrl+Shift+L on /markets locks; the PIN then opens /markets again", async ({ page }) => {
  await loginAndWait(page, FREE_EMAIL, DEMO_PASSWORD);
  await expectSignedInMarkets(page);

  await page.keyboard.press("Control+Shift+L");
  await expectPinPrompt(page);
  expect(pathOf(page)).toBe("/");
  await expect(page.getByText(/Ctrl \+ Shift \+ L|⌘ ⇧ L/)).toBeVisible();

  await enterPin(page, DEMO_PIN);
  await expectMarkets(page);
});

test("five wrong PINs end the session", async ({ page, context }) => {
  await loginAndWait(page, FREE_EMAIL, DEMO_PASSWORD);

  const tab = await context.newPage();
  await openLockScreen(tab);
  await expect(tab.getByText("Enter your AFVAR PIN")).toBeVisible();

  for (let left = 4; left >= 1; left -= 1) {
    await enterPin(tab, "0000");
    const message = left === 1 ? "Wrong PIN · 1 attempt left" : `Wrong PIN · ${left} attempts left`;
    await expect(tab.getByText(message)).toBeVisible();
  }
  await enterPin(tab, "0000");

  await expect(tab).toHaveURL(/\/login\?.*reason=pin_locked/);
  await expect(tab.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await expect(tab.getByText("Too many wrong PINs. Sign in with your password.")).toBeVisible();

  // The session is gone: the lock screen is back to its signed-out state.
  await openLockScreen(tab);
  await expect(tab.getByText("Sign in to open your desktop.")).toBeVisible();
  await expect(tab.getByText("Enter your AFVAR PIN")).toHaveCount(0);
});

test("a brand-new account creates its PIN on the lock screen, then opens /markets", async ({ page, context }) => {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@afwar.app`;
  const password = "Str0ng!Passw0rd";

  await openPage(page, "/register");
  await page.fill("#name", "E2E Tester");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirm", password);
  await page.selectOption("#country", "IN");
  const consents = page.locator("fieldset input[type=checkbox]");
  await expect(consents).toHaveCount(4);
  for (const box of await consents.all()) await box.check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).not.toHaveURL(/\/register/);

  // A fresh account has no PIN, so a new (locked) tab asks to create one.
  const tab = await context.newPage();
  await openLockScreen(tab);
  await expect(tab.getByText("Create a 4-digit PIN")).toBeVisible();
  await expect(tab.getByText("Locked", { exact: true })).toBeVisible();

  await enterPin(tab, "1111");
  await expect(tab.getByText("Choose a less obvious PIN.")).toBeVisible();
  await expect(tab.getByText("Create a 4-digit PIN")).toBeVisible();

  await enterPin(tab, "4826");
  await expect(tab.getByText("Enter the PIN again")).toBeVisible();
  await enterPin(tab, "1234");
  await expect(tab.getByText("PINs didn't match. Start again.")).toBeVisible();
  await expect(tab.getByText("Create a 4-digit PIN")).toBeVisible();

  await enterPin(tab, "4826");
  await expect(tab.getByText("Enter the PIN again")).toBeVisible();
  await enterPin(tab, "4826");

  // The new PIN unlocks and opens /markets.
  await expectMarkets(tab);
});

test("forgot password resets via the demo link and retires the old password", async ({ page }) => {
  const newPassword = "Fresh-Passw0rd!";

  await openPage(page, "/forgot-password");
  await page.fill("#email", PRO_EMAIL);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(`If an account exists for ${PRO_EMAIL}, a reset link is on its way.`)).toBeVisible();

  await page.getByRole("link", { name: "Open the reset link (demo — no email is sent)" }).click();
  await expect(page).toHaveURL(/\/reset-password\?token=/);
  await page.fill("#password", newPassword);
  await page.fill("#confirm", newPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("Password updated. Sign in with your new password.")).toBeVisible();

  await login(page, PRO_EMAIL, DEMO_PASSWORD);
  await expect(page.getByText("That email and password don't match.")).toBeVisible();

  await page.fill("#password", newPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect.poll(() => pathOf(page)).toBe("/markets");
});

test("a signed-in visitor to /login or /register is redirected to /", async ({ page }) => {
  await loginAndWait(page, FREE_EMAIL, DEMO_PASSWORD);

  await openPage(page, "/login");
  await expect.poll(() => pathOf(page)).toBe("/");
  await expect(page.locator("#email")).toHaveCount(0);

  await openPage(page, "/register");
  await expect.poll(() => pathOf(page)).toBe("/");
});

test("verify-email with a bogus token shows the invalid-link message", async ({ page }) => {
  await openPage(page, "/verify-email?token=bogus-token");
  await expect(page.getByText("This link is invalid or has already been used.")).toBeVisible();
});

test("Ctrl+Shift+L on another page goes to /, and the PIN there opens /markets", async ({ page }) => {
  await loginAndWait(page, FREE_EMAIL, DEMO_PASSWORD);
  await openPage(page, "/legal/privacy#s2");
  await page.getByRole("heading", { level: 1 }).waitFor();

  await page.keyboard.press("Control+Shift+L");
  await expect.poll(() => pathOf(page)).toBe("/");
  // Still in full screen from the gated legal page, so the PIN prompt shows directly.
  await expectPinPrompt(page);
  await expect(page.getByText(/Ctrl \+ Shift \+ L|⌘ ⇧ L/)).toBeVisible();

  await enterPin(page, DEMO_PIN);
  await expectMarkets(page);
});

test("the shortcut does nothing when signed out", async ({ page }) => {
  await openPage(page, "/legal/terms");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.keyboard.press("Control+Shift+L");
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/legal\/terms$/);
});

test("the lock screen is only shown in full screen; leaving full screen hides it again", async ({ page }) => {
  await page.goto("/");
  await expect(lockScreen(page)).toHaveCount(0);
  await enterFullscreen(page);
  await expect(lockScreen(page)).toBeVisible();

  await page.evaluate(() => document.exitFullscreen());
  await expect(lockScreen(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: LAUNCH_BUTTON })).toBeVisible();
});
