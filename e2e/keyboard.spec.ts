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

/** Global history shortcuts: Alt+←/→ on Windows/Linux, ⌘+←/→ on macOS. */
test.use({ viewport: { width: 1440, height: 900 } });

async function modifier(page: Page) {
  const mac = await page.evaluate(() => /mac|iphone|ipad/i.test(navigator.platform));
  return mac ? "Meta" : "Alt";
}

test("back and forward walk real browser history", async ({ page }) => {
  await openPage(page, "/legal/terms");
  await page.getByRole("link", { name: "Privacy Policy", exact: true }).click();
  await expect(page).toHaveURL(/\/legal\/privacy$/);
  await page.getByRole("link", { name: "Risk Disclaimer", exact: true }).click();
  await expect(page).toHaveURL(/\/legal\/risk-disclaimer$/);

  const mod = await modifier(page);
  await page.keyboard.press(`${mod}+ArrowLeft`);
  await expect(page).toHaveURL(/\/legal\/privacy$/);
  await page.keyboard.press(`${mod}+ArrowLeft`);
  await expect(page).toHaveURL(/\/legal\/terms$/);
  await page.keyboard.press(`${mod}+ArrowRight`);
  await expect(page).toHaveURL(/\/legal\/privacy$/);
  await page.keyboard.press(`${mod}+ArrowRight`);
  await expect(page).toHaveURL(/\/legal\/risk-disclaimer$/);
});

test("the shortcuts are ignored while typing in a field", async ({ page }) => {
  await openPage(page, "/legal/terms");
  await page.getByRole("link", { name: "Privacy Policy", exact: true }).click();
  await expect(page).toHaveURL(/\/legal\/privacy$/);
  await openPage(page, "/login");
  await page.fill("#email", "someone@example.com");
  await page.focus("#email");
  await page.keyboard.press(`${await modifier(page)}+ArrowLeft`);
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/login$/);
});

test("? opens the keyboard-shortcuts panel listing back and forward", async ({ page }) => {
  await openPage(page, "/legal/terms");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.keyboard.press("Shift+?");
  const panel = page.getByRole("dialog", { name: "Keyboard shortcuts" });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Go back to the previous page")).toBeVisible();
  await expect(panel.getByText("Go forward to the next page")).toBeVisible();
  const mod = (await modifier(page)) === "Meta" ? "⌘" : "Alt";
  await expect(panel.getByText(mod, { exact: true }).first()).toBeVisible();
});

/* ---- Back/Forward are switched off on the launch card and lock screen at `/` ---- */

const LAUNCH_BUTTON = /Enter full screen|Open AFVAR/;
const pathOf = (page: Page) => new URL(page.url()).pathname;
const lockScreen = (page: Page) => page.getByRole("main", { name: "AFVAR lock screen" });

/** Signs in as the Free demo user; `/login` → `/` → /markets, all with `replace`. */
async function signIn(page: Page) {
  await openPage(page, "/login");
  await page.fill("#email", "free@afwar.app");
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect.poll(() => pathOf(page)).toBe("/markets");
}

/** Presses a history shortcut and checks the URL stays on `/` (the app swallows it). */
async function expectHistoryKeyIgnored(page: Page, key: "ArrowLeft" | "ArrowRight") {
  await page.keyboard.press(`${await modifier(page)}+${key}`);
  await page.waitForTimeout(500);
  expect(pathOf(page)).toBe("/");
}

test("back and forward do nothing on the launch card or the signed-out lock screen", async ({ page }) => {
  await openPage(page, "/legal/terms");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.goto("/");
  // Leave a page ahead of `/` too, so forward has somewhere it could go.
  await openPage(page, "/legal/privacy");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.goBack();
  await expect.poll(() => pathOf(page)).toBe("/");

  const launch = page.getByRole("button", { name: LAUNCH_BUTTON });
  await expect(launch).toBeVisible();
  await expectHistoryKeyIgnored(page, "ArrowLeft");
  await expectHistoryKeyIgnored(page, "ArrowRight");
  await expect(launch).toBeVisible();

  await launch.click();
  await expect(lockScreen(page)).toBeVisible();
  await expectHistoryKeyIgnored(page, "ArrowLeft");
  await expectHistoryKeyIgnored(page, "ArrowRight");
  await expect(lockScreen(page)).toBeVisible();
});

test("back and forward do nothing on the lock screen after Ctrl+Shift+L on /markets", async ({ page }) => {
  await openPage(page, "/legal/terms");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await signIn(page);

  await page.keyboard.press("Control+Shift+L");
  await expect(lockScreen(page)).toBeVisible();
  await expect(page.getByText("Enter your AFVAR PIN")).toBeVisible();

  await expectHistoryKeyIgnored(page, "ArrowLeft");
  await expect(lockScreen(page)).toBeVisible();
  await expectHistoryKeyIgnored(page, "ArrowRight");
  await expect(lockScreen(page)).toBeVisible();
});

test("signed in, forward does nothing on the launch card or the PIN lock screen", async ({ page }) => {
  await signIn(page);
  await page.goto("/");
  await openPage(page, "/legal/terms");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.goBack();
  await expect.poll(() => pathOf(page)).toBe("/");

  const launch = page.getByRole("button", { name: LAUNCH_BUTTON });
  await expect(launch).toBeVisible();
  await expectHistoryKeyIgnored(page, "ArrowRight");

  await launch.click();
  await expect(page.getByText("Enter your AFVAR PIN")).toBeVisible();
  await expectHistoryKeyIgnored(page, "ArrowRight");
  await expectHistoryKeyIgnored(page, "ArrowLeft");
  await expect(lockScreen(page)).toBeVisible();
});

test("? on the lock screen leaves back and forward out of the shortcuts panel", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: LAUNCH_BUTTON }).click();
  await expect(lockScreen(page)).toBeVisible();

  await page.keyboard.press("Shift+?");
  const panel = page.getByRole("dialog", { name: "Keyboard shortcuts" });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Lock AFVAR")).toBeVisible();
  await expect(panel.getByText("Go back to the previous page")).toHaveCount(0);
  await expect(panel.getByText("Go forward to the next page")).toHaveCount(0);
});

test("back works on /markets after signing in, skipping /login and the lock screen", async ({ page }) => {
  await openPage(page, "/legal/terms");
  await page.getByRole("heading", { level: 1 }).waitFor();
  // /login → `/` → /markets are all replaces, so terms is the entry behind /markets.
  await signIn(page);
  await page.getByRole("heading", { level: 1 }).waitFor();

  await page.keyboard.press(`${await modifier(page)}+ArrowLeft`);
  await expect(page).toHaveURL(/\/legal\/terms$/);
});

test("after a correct PIN, Back from /markets skips the lock screen", async ({ page }) => {
  await openPage(page, "/legal/terms");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await signIn(page);
  await page.keyboard.press("Control+Shift+L");
  await expect(page.getByText("Enter your AFVAR PIN")).toBeVisible();
  await page.keyboard.type("1234");
  await expect.poll(() => pathOf(page)).toBe("/markets");

  // The lock screen replaced itself with /markets, so Back goes to the page before it.
  await page.goBack();
  await expect.poll(() => pathOf(page)).toBe("/legal/terms");
  await expect(lockScreen(page)).toHaveCount(0);
});

test("the browser's own Forward goes nowhere from the launch card", async ({ page }) => {
  await openPage(page, "/legal/terms");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.goto("/");
  await openPage(page, "/legal/privacy");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.goBack();
  await expect.poll(() => pathOf(page)).toBe("/");
  await expect(page.getByRole("button", { name: LAUNCH_BUTTON })).toBeVisible();

  // Opening the launch card dropped the forward entry (/legal/privacy).
  await expect.poll(() => page.evaluate(() => (window as Window & { navigation?: { canGoForward: boolean } }).navigation?.canGoForward)).toBe(false);
  await page.goForward().catch(() => null);
  await page.waitForTimeout(500);
  expect(pathOf(page)).toBe("/");
});

test("on the lock screen, history keys are swallowed even inside the PIN field, including ⌘+[ / ⌘+]", async ({ page }) => {
  await openPage(page, "/legal/terms");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await signIn(page);
  await page.keyboard.press("Control+Shift+L");
  const pin = page.locator('input[inputmode="numeric"]');
  await expect(pin).toBeFocused();

  for (const combo of ["Alt+ArrowLeft", "Meta+ArrowLeft", "Meta+BracketLeft", "Alt+ArrowRight", "Meta+ArrowRight", "Meta+BracketRight"]) {
    await page.keyboard.press(combo);
    await page.waitForTimeout(250);
    expect(pathOf(page), combo).toBe("/");
  }
  await expect(lockScreen(page)).toBeVisible();
});
