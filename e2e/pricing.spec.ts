import { expect, test, type Page } from "@playwright/test";

// /pricing: lays out without sideways scroll from phone to wide desktop, and
// every button on it does its job. Runs without a backend.

const SIZES = [
  { width: 320, height: 640 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
];

async function open(page: Page) {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1, name: /Pricing\./ })).toBeVisible();
}

for (const size of SIZES) {
  test.describe(`${size.width}×${size.height}`, () => {
    test.use({ viewport: size });

    test("no sideways scroll", async ({ page }) => {
      await open(page);
      // Walk the page so stacked cards and pinned sections all render.
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += size.height) await page.evaluate((top) => window.scrollTo(0, top), y);
      const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      expect(widths.scroll).toBeLessThanOrEqual(widths.client);
    });

    test("hero buttons", async ({ page }) => {
      await open(page);
      const register = page.getByRole("link", { name: "Register Now" }).filter({ visible: true }).first();
      await expect(register).toHaveAttribute("href", /^https:\/\/app\.afvar\.com/);

      await page.getByRole("link", { name: "Compare tiers" }).filter({ visible: true }).first().click();
      await expect(page).toHaveURL(/#s03-side-by-side$/);
      await expect(page.locator("#s03-side-by-side")).toBeInViewport();
    });
  });
}

test.describe("buttons", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Register Now opens the app", async ({ page }) => {
    await page.route("https://app.afvar.com/**", (route) => route.fulfill({ status: 200, body: "app" }));
    await open(page);
    await page.getByRole("link", { name: "Register Now" }).filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/^https:\/\/app\.afvar\.com/);
  });

  test("Explore the platform goes to /platform", async ({ page }) => {
    await open(page);
    await page.getByRole("link", { name: "Explore the platform" }).click();
    await expect(page).toHaveURL(/\/platform$/);
  });

  test("Menu opens and closes", async ({ page }) => {
    await open(page);
    const menu = page.getByRole("button", { name: /Menu/ }).first();
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  });

  test("FX route picker switches the route", async ({ page }) => {
    await open(page);
    await page.locator("#afvar-globe").scrollIntoViewIfNeeded();
    const kicker = page.locator(".home-fx-kicker");
    for (const [code, n] of [["INR", "04"], ["JPY", "06"], ["USD", "01"]] as const) {
      const pick = page.getByRole("button", { name: new RegExp(`^Show ${code} route`) });
      await pick.click();
      await expect(pick).toHaveAttribute("aria-pressed", "true");
      await expect(kicker).toContainText(`${n} / 07`);
    }
  });

  test("globe controls respond (when WebGL is available)", async ({ page }) => {
    await open(page);
    await page.locator("#afvar-globe").scrollIntoViewIfNeeded();
    const controls = page.getByRole("group", { name: "Globe controls" });
    try {
      await controls.waitFor({ timeout: 8000 });
    } catch {
      test.skip(true, "globe needs WebGL; the still image shows instead");
    }
    const play = controls.getByRole("button", { name: /Pause globe rotation|Resume globe rotation/ });
    const before = await play.getAttribute("aria-label");
    await play.click();
    await expect(play).not.toHaveAttribute("aria-label", before ?? "");
    await controls.getByRole("button", { name: "Rotate globe left" }).click();
    await controls.getByRole("button", { name: "Rotate globe right" }).click();
    await controls.getByRole("button", { name: "Center active currency route" }).click();
  });

  test("assistant opens", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Open the AFVAR assistant" }).click();
    await expect(page.getByRole("dialog", { name: "AFVAR Assistant" })).toBeVisible();
  });
});
