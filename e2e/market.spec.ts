import { expect, test, type Page } from "@playwright/test";

/**
 * Public /market site: structure, accessibility hooks and the honest
 * pre-launch contract (no prices, no buy/sell wording, registration hand-off).
 *
 * The page matrix runs at desktop + phone widths and for the en and mr
 * editions (cookie `afwar_edition`). Behaviour tests use the English labels
 * from src/locales/en.json; the mr edition is checked for structure only.
 */

const EDITION_COOKIE = "afwar_edition";
const EDITIONS = ["en", "mr"] as const;
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
] as const;
const ROUTES = ["/market", "/market/commodities", "/market/forex", "/market/crypto", "/market/forex/eurusd", "/market/briefs"] as const;

/** Where every "Join Waitlist" / "Register Now" hand-off must go (REGISTER_URL in src/modules/markets/data.ts). */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.afvar.com/";
const APP_ORIGIN = new URL(APP_URL).origin;

/** Something like 1,234.56 / 2345.1 / 0.5 — a number shaped like a quote. */
const PRICE_LIKE = /\d[\d,]*\.\d+/;
const TRADE_WORDS = /\b(buy|sell)\b/i;

// The dev server compiles routes on first hit, so leave generous room.
test.setTimeout(90_000);
test.use({ navigationTimeout: 60_000, actionTimeout: 15_000 });

type PageWatch = { errors: string[]; failed: string[]; consoleErrors: string[] };

/** Records uncaught page errors and failed (>= 400) responses from the moment it is attached. */
function watch(page: Page): PageWatch {
  const log: PageWatch = { errors: [], failed: [], consoleErrors: [] };
  page.on("pageerror", (error) => log.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") log.consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) log.failed.push(`${response.status()} ${response.url()}`);
  });
  return log;
}

async function setEdition(page: Page, edition: (typeof EDITIONS)[number]) {
  const baseURL = test.info().project.use.baseURL ?? "http://localhost:3000";
  await page.context().addCookies([{ name: EDITION_COOKIE, value: edition, url: baseURL }]);
}

/** Scrolls through the page in viewport steps so scroll-reveals and lazy images get their turn, then returns to the top. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    const total = () => document.documentElement.scrollHeight;
    for (let y = 0; y < total(); y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, total());
    await new Promise((resolve) => setTimeout(resolve, 100));
    window.scrollTo(0, 0);
  });
}

/** Forces every <img> to load (lazy ones too) and waits until each has settled. */
async function settleImages(page: Page) {
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    for (const img of images) img.loading = "eager";
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );
  });
}

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const width = window.innerWidth;
    return doc.scrollWidth > width || document.body.scrollWidth > width;
  });
}

/* ------------------------------------------------------------------ */
/* Page matrix: every route × viewport × edition                       */
/* ------------------------------------------------------------------ */

for (const viewport of VIEWPORTS) {
  for (const edition of EDITIONS) {
    test.describe(`${viewport.name} · ${edition}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      test.beforeEach(async ({ page }) => {
        await setEdition(page, edition);
      });

      for (const route of ROUTES) {
        test(`${route} renders cleanly`, async ({ page }) => {
          const log = watch(page);

          const response = await page.goto(route);
          expect(response?.status(), "HTTP status").toBe(200);

          await expect(page.locator("html")).toHaveAttribute("lang", edition);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          await expect(page.locator("h1")).toHaveCount(1);
          await expect(page.getByRole("main")).toBeVisible();

          expect(await hasHorizontalOverflow(page), "horizontal overflow on load").toBe(false);
          await scrollThrough(page);
          expect(await hasHorizontalOverflow(page), "horizontal overflow after scrolling").toBe(false);

          await settleImages(page);
          const images = await page.locator("img").evaluateAll((nodes) =>
            (nodes as HTMLImageElement[]).map((img) => ({
              src: img.currentSrc || img.src,
              hasAlt: img.hasAttribute("alt"),
              naturalWidth: img.naturalWidth,
            })),
          );
          expect(images.length, "the page has images").toBeGreaterThan(0);
          for (const img of images) {
            expect(img.hasAlt, `img ${img.src} has an alt attribute`).toBe(true);
            expect(img.naturalWidth, `img ${img.src} loaded`).toBeGreaterThan(0);
          }

          expect(log.errors, "uncaught page errors").toEqual([]);
          expect(log.failed, "failed (>= 400) responses").toEqual([]);
          if (log.consoleErrors.length > 0) {
            test.info().annotations.push({ type: "console.error", description: log.consoleErrors.join("\n") });
          }
        });
      }
    });
  }
}

/* ------------------------------------------------------------------ */
/* Unknown routes                                                      */
/* ------------------------------------------------------------------ */

test.describe("unknown routes", () => {
  for (const route of ["/market/nope", "/market/forex/nope"]) {
    test(`${route} shows the not-found page`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByText(/could not be found/i)).toBeVisible();
      // Next's not-found page keeps the one-h1 rule: its single heading is "404".
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("404");
    });

    test(`${route} responds with HTTP 404`, async ({ page }) => {
      // BUG (app): src/app/market/loading.tsx streams the shell with 200 before the
      // page component calls notFound(), so the status is already sent. Calling
      // notFound() inside generateMetadata (which runs before streaming) fixes it.
      const response = await page.goto(route);
      expect(response?.status()).toBe(404);
    });
  }
});

/* ------------------------------------------------------------------ */
/* Overview content contract (en)                                      */
/* ------------------------------------------------------------------ */

test.describe("overview", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await setEdition(page, "en");
    await page.goto("/market");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("hero anchors reach the markets and how-it-works sections", async ({ page }) => {
    await expect(page.locator("#markets")).toHaveCount(1);
    await expect(page.locator("#how-it-works")).toHaveCount(1);

    const explore = page.getByRole("link", { name: "Explore Markets", exact: true });
    await expect(explore).toBeVisible();
    expect(await explore.getAttribute("href")).toMatch(/#markets$/);

    const how = page.getByRole("link", { name: "See How It Works", exact: true }).first();
    expect(await how.getAttribute("href")).toMatch(/#how-it-works$/);
  });

  test("every external link and form hands off to the app", async ({ page }) => {
    const targets = await page.evaluate((origin) => {
      const out: { kind: string; label: string; target: string }[] = [];
      for (const a of Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))) {
        const href = a.getAttribute("href") ?? "";
        if (!/^https?:\/\//i.test(href)) continue;
        if (new URL(href).origin === origin) continue;
        out.push({ kind: "link", label: (a.textContent ?? "").trim(), target: href });
      }
      for (const form of Array.from(document.querySelectorAll<HTMLFormElement>("form[action]"))) {
        out.push({ kind: "form", label: form.getAttribute("aria-label") ?? "", target: form.getAttribute("action") ?? "" });
      }
      return out;
    }, new URL(page.url()).origin);

    expect(targets.length, "there is at least one hand-off to the app").toBeGreaterThan(0);
    for (const item of targets) {
      expect(item.target, `${item.kind} "${item.label}" points at the app`).toMatch(new RegExp(`^${APP_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(/|$)`));
    }

    const waitlist = page.getByRole("link", { name: "Join Waitlist" }).first();
    await expect(waitlist).toHaveAttribute("href", new RegExp(`^${APP_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    const form = page.locator("form").filter({ has: page.getByLabel("Email address") });
    await expect(form).toHaveAttribute("action", new RegExp(`^${APP_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    await expect(form).toHaveAttribute("method", /get/i);
  });

  test("copy never says buy or sell and the market cards carry no price-like numbers", async ({ page }) => {
    await scrollThrough(page);
    const mainText = await page.getByRole("main").innerText();
    expect(mainText).not.toMatch(TRADE_WORDS);

    const cards = page.locator("#markets article");
    await expect(cards).toHaveCount(3);
    for (const text of await cards.allInnerTexts()) {
      expect(text).not.toMatch(PRICE_LIKE);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

test.describe("navigation (desktop)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Markets chevron opens its submenu and Escape closes it", async ({ page }) => {
    await setEdition(page, "en");
    await page.goto("/market");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Main" });
    const chevron = nav.getByRole("button", { name: "Markets submenu" });
    await expect(chevron).toHaveAttribute("aria-expanded", "false");

    // Keyboard, so the hover-opens behaviour does not race the click.
    await chevron.focus();
    await page.keyboard.press("Enter");
    await expect(chevron).toHaveAttribute("aria-expanded", "true");
    await expect(nav.getByRole("link", { name: "Commodities", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Market Briefs", exact: true })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(chevron).toHaveAttribute("aria-expanded", "false");
    await expect(nav.getByRole("link", { name: "Commodities", exact: true })).toHaveCount(0);
    await expect(chevron).toBeFocused();
  });
});

test.describe("navigation (phone)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Menu opens the site menu dialog and Escape closes it", async ({ page }) => {
    await setEdition(page, "en");
    await page.goto("/market");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const menu = page.getByRole("button", { name: "Menu", exact: true });
    await expect(menu).toBeVisible();
    await menu.click();

    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
    await expect(dialog.getByRole("link", { name: "Markets", exact: true })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  });
});

/* ------------------------------------------------------------------ */
/* Site search                                                         */
/* ------------------------------------------------------------------ */

test.describe("search", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Ctrl+K opens search, typing gold offers Gold, Enter opens the instrument", async ({ page }) => {
    await setEdition(page, "en");
    await page.goto("/market");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The shortcut is registered on hydration; the trigger button carries the same state.
    await expect(page.getByRole("button", { name: "Search the site" })).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Search AFVAR" });
    await expect(dialog).toBeVisible();

    const input = dialog.getByRole("combobox", { name: "Search AFVAR" });
    await expect(input).toBeFocused();
    await input.fill("gold");

    const gold = dialog.getByRole("option", { name: /^Gold\b/ });
    await expect(gold).toBeVisible();
    await expect(gold).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/market\/commodities\/gold$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gold");
  });
});

/* ------------------------------------------------------------------ */
/* Category page filters                                               */
/* ------------------------------------------------------------------ */

test.describe("category", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("instrument filters narrow the cards and prices stay unavailable", async ({ page }) => {
    await setEdition(page, "en");
    await page.goto("/market/forex");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Forex");

    const cards = page.locator('article[aria-labelledby^="inst-"]');
    await expect(cards).toHaveCount(5);
    await expect(page.getByText("Showing 5 of 5 instruments")).toBeVisible();
    await expect(page.getByText("Price unavailable", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Price unavailable", { exact: true })).toHaveCount(5);

    const filters = page.getByRole("search", { name: "Filter instruments" });
    const search = filters.getByRole("searchbox", { name: "Find instrument" });
    await search.fill("jpy");
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("USD/JPY");
    await expect(page.getByText("Showing 1 of 5 instruments")).toBeVisible();

    await search.fill("");
    await expect(cards).toHaveCount(5);

    const coverage = filters.getByRole("combobox", { name: "Coverage" });
    await coverage.selectOption({ label: "Planned" });
    await expect(cards).toHaveCount(5);
    await expect(page.getByText("Showing 5 of 5 instruments")).toBeVisible();

    await coverage.selectOption({ label: "Available" });
    await expect(cards).toHaveCount(0);
    await expect(page.getByText("No instruments match these filters.")).toBeVisible();

    for (const text of await page.locator('article[aria-labelledby^="inst-"]').allInnerTexts()) {
      expect(text).not.toMatch(PRICE_LIKE);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Market Briefs                                                       */
/* ------------------------------------------------------------------ */

test.describe("briefs", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("market filter is mirrored to the URL and the empty state stays honest", async ({ page }) => {
    await setEdition(page, "en");
    await page.goto("/market/briefs");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Market Briefs");

    await expect(page.getByText(/No brief has been published yet/)).toBeVisible();
    await expect(page.getByText("Published briefs shown: 0")).toBeVisible();

    const filters = page.getByRole("search", { name: "Filter briefs" });
    const market = filters.getByRole("combobox", { name: "Market", exact: true });
    await market.selectOption({ label: "Crypto" });
    await expect(page).toHaveURL(/[?&]market=crypto(&|$)/);
    await expect(page.getByText(/No brief has been published yet/)).toBeVisible();

    await market.selectOption({ label: "All markets" });
    await expect(page).not.toHaveURL(/market=/);

    // A shared URL restores the selection on load.
    await page.goto("/market/briefs?market=forex");
    await expect(filters.getByRole("combobox", { name: "Market", exact: true })).toHaveValue("forex");
  });
});

/* ------------------------------------------------------------------ */
/* Reduced motion                                                      */
/* ------------------------------------------------------------------ */

test.describe("reduced motion", () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

  test("the hero heading is fully visible right after load", async ({ page }) => {
    await setEdition(page, "en");
    await page.goto("/market");

    const started = Date.now();
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible({ timeout: 300 });
    await expect
      .poll(
        () =>
          h1.evaluate((node) =>
            [node, ...Array.from(node.querySelectorAll<HTMLElement>(":scope > *"))].every((el) => getComputedStyle(el).opacity === "1"),
          ),
        { timeout: 300, message: "hero heading at full opacity" },
      )
      .toBe(true);
    expect(Date.now() - started).toBeLessThanOrEqual(600);
  });
});
