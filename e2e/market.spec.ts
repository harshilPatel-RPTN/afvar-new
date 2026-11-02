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

/** Where every "Register Now" / "Join Waitlist" hand-off must go (REGISTER_URL in src/modules/markets/data.ts). */
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
  for (const route of ["/market/nope", "/market/forex/nope", "/market/briefs/nope"]) {
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

  test("the hero link reaches the directory of groups, instruments and briefs", async ({ page }) => {
    const groups = page.getByRole("link", { name: "See the groups", exact: true });
    await expect(groups).toBeVisible();
    expect(await groups.getAttribute("href")).toMatch(/#market-groups$/);

    const directory = page.locator("#market-groups");
    await expect(directory).toHaveCount(1);
    const hrefs = await directory.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    for (const group of ["commodities", "forex", "crypto"]) expect(hrefs).toContain(`/market/${group}`);
    expect(hrefs).toContain("/market/commodities/gold");
    expect(hrefs).toContain("/market/briefs");
  });

  test("every external link hands off to the app", async ({ page }) => {
    const targets = await page.evaluate((origin) => {
      const out: { label: string; target: string }[] = [];
      for (const a of Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))) {
        const href = a.getAttribute("href") ?? "";
        if (!/^https?:\/\//i.test(href)) continue;
        if (new URL(href).origin === origin) continue;
        out.push({ label: (a.textContent ?? "").trim(), target: href });
      }
      return out;
    }, new URL(page.url()).origin);

    expect(targets.length, "there is at least one hand-off to the app").toBeGreaterThan(0);
    for (const item of targets) {
      expect(item.target, `link "${item.label}" points at the app`).toMatch(new RegExp(`^${APP_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(/|$)`));
    }

    await expect(page.getByRole("link", { name: "Register Now" }).first()).toHaveAttribute("href", new RegExp(`^${APP_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  });

  test("copy never says buy or sell and the directory cards carry no price-like numbers", async ({ page }) => {
    await scrollThrough(page);
    const mainText = await page.getByRole("main").innerText();
    expect(mainText).not.toMatch(TRADE_WORDS);

    const cards = page.locator("#market-groups a");
    await expect(cards).toHaveCount(14);
    for (const text of await cards.allInnerTexts()) {
      expect(text).not.toMatch(PRICE_LIKE);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

for (const viewport of VIEWPORTS) {
  test.describe(`navigation (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("Menu opens the site menu, Markets lists its pages, Escape closes it", async ({ page }) => {
      await setEdition(page, "en");
      await page.goto("/market");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const menu = page.getByRole("button", { name: "Menu", exact: true });
      await expect(menu).toHaveAttribute("aria-expanded", "false");
      // The click waits out the intro splash, which covers the page just after load.
      await menu.click();
      await expect(menu).toHaveAttribute("aria-expanded", "true");

      const panelId = await menu.getAttribute("aria-controls");
      const panel = page.locator(`[id="${panelId}"]`);
      const markets = panel.getByRole("button", { name: "Markets", exact: true });
      await expect(markets).toHaveAttribute("aria-expanded", "false");
      await markets.click();
      // Wide screens show the submenu beside the list; phones slide it over the list.
      const submenu = page.locator(`[id="${panelId}-children"]`);
      for (const name of ["Markets Overview", "Commodities", "Forex", "Crypto", "Market Briefs"]) {
        await expect(submenu.getByRole("link", { name, exact: true })).toBeVisible();
      }
      await expect(submenu.getByRole("link", { name: "Commodities", exact: true })).toHaveAttribute("href", "/market/commodities");

      // Escape steps back one layer at a time: the submenu first, then the menu.
      await page.keyboard.press("Escape");
      await expect(submenu).toHaveCount(0);
      await expect(markets).toHaveAttribute("aria-expanded", "false");
      await expect(markets).toBeFocused();
      await expect(menu).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Escape");
      await expect(menu).toHaveAttribute("aria-expanded", "false");
      await expect(menu).toBeFocused();
    });
  });
}

/* ------------------------------------------------------------------ */
/* Site search                                                         */
/* ------------------------------------------------------------------ */

test.describe("search", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Ctrl+K opens search, typing gold offers Gold, Enter opens the instrument", async ({ page }) => {
    await setEdition(page, "en");
    await page.goto("/market");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // The shortcut is registered on hydration, so retry until the dialog answers.
    const dialog = page.getByRole("dialog", { name: "Search AFVAR" });
    await expect(async () => {
      await page.keyboard.press("Control+k");
      await expect(dialog).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });

    const input = dialog.getByRole("combobox", { name: "Search AFVAR" });
    await expect(input).toBeFocused();
    await input.fill("gold");

    const gold = dialog.getByRole("option", { name: /^Gold\b/ });
    await expect(gold).toBeVisible();
    await expect(gold).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/market\/commodities\/gold$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Gold\./);
  });
});

/* ------------------------------------------------------------------ */
/* Group and instrument pages                                          */
/* ------------------------------------------------------------------ */

test.describe("group", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the group page links every instrument in it and its cards carry no prices", async ({ page }) => {
    await setEdition(page, "en");
    await page.goto("/market/forex");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Forex\./);

    const directory = page.locator("#group-instruments");
    const hrefs = await directory.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(hrefs).toEqual(["/market/forex/eurusd", "/market/forex/usdjpy", "/market/forex/gbpusd", "/market/forex/audusd", "/market/forex/nzdusd", "/market"]);
    for (const text of await directory.locator("a").allInnerTexts()) {
      expect(text).not.toMatch(PRICE_LIKE);
    }

    await directory.getByRole("link", { name: /Dollar \/ Yen/ }).click();
    await expect(page).toHaveURL(/\/market\/forex\/usdjpy$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Dollar \/ Yen\./);
  });
});

/* ------------------------------------------------------------------ */
/* Market Briefs                                                       */
/* ------------------------------------------------------------------ */

test.describe("briefs", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the briefs page explains editions and links none while none is published", async ({ page }) => {
    await setEdition(page, "en");
    await page.goto("/market/briefs");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Market briefs\./);

    const inside = page.getByRole("link", { name: "How an edition reads", exact: true });
    expect(await inside.getAttribute("href")).toMatch(/#s03-inside-an-edition$/);
    await expect(page.locator("#s03-inside-an-edition")).toHaveCount(1);

    // No edition is published yet, so nothing may link to one.
    const editionLinks = await page.locator('a[href^="/market/briefs/"]').count();
    expect(editionLinks).toBe(0);
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
