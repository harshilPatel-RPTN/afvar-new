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

test.use({ viewport: { width: 1440, height: 900 } });

const pathOf = (url: string) => new URL(url).pathname;

test("signing in lands on /markets", async ({ page }) => {
  await openPage(page, "/login");
  await page.fill("#email", "free@afwar.app");
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect.poll(() => pathOf(page.url())).toBe("/markets");
});

test("removed private routes fall back to sign-in when signed out", async ({ page }) => {
  await page.goto("/desktop");
  await expect(page).toHaveURL(/\/login$/);
});

test("unknown routes fall back to / when signed in", async ({ page }) => {
  await openPage(page, "/login");
  await page.fill("#email", "free@afwar.app");
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);

  await page.goto("/desktop");
  await expect.poll(() => pathOf(page.url())).toBe("/");
});

test("narrow screens are sent to /unsupported", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  // /unsupported has no full-screen gate, so this goes straight there.
  await page.goto("/login");
  await expect(page).toHaveURL(/\/unsupported/);
});
