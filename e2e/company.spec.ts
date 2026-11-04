import { expect, test, type Page } from "@playwright/test";

// /about and /contact: no sideways scroll from phone to wide desktop, the OS
// screen of each pinned section sits below its caption (never under it), and the
// hero's 3D centrepiece mounts. Runs without a backend.

const SIZES = [
  { width: 320, height: 640 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

const PAGES = [
  { path: "/about", h1: /About AFVAR\./, hero: "#about-hero" },
  { path: "/contact", h1: /Contact the team\./, hero: "#contact-hero" },
];

async function open(page: Page, path: string, h1: RegExp) {
  // Skip the intro splash, which plays on every full load: the hero holds its 3D back until the
  // splash is gone. Escape skips it even before hydration (SplashReveal's early-skip script).
  await page.goto(path);
  const splash = page.locator("[data-afvar-splash]");
  if (await splash.count()) {
    await page.keyboard.press("Escape");
    await expect(splash).toBeHidden();
  }
  await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
}

for (const p of PAGES) {
  test.describe(p.path, () => {
    for (const size of SIZES) {
      test.describe(`${size.width}×${size.height}`, () => {
        test.use({ viewport: size });

        test("no sideways scroll", async ({ page }) => {
          await open(page, p.path, p.h1);
          // Walk the page so stacked cards and pinned sections all render.
          const height = await page.evaluate(() => document.documentElement.scrollHeight);
          for (let y = 0; y < height; y += size.height) await page.evaluate((top) => window.scrollTo(0, top), y);
          const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
          expect(widths.scroll).toBeLessThanOrEqual(widths.client);
        });

        test("hero 3D mounts (when WebGL is available)", async ({ page }) => {
          await open(page, p.path, p.h1);
          const webgl = await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2") ?? document.createElement("canvas").getContext("webgl")));
          test.skip(!webgl, "no WebGL; the CSS poster shows instead");
          const canvas = page.locator(`${p.hero} canvas`).first();
          await expect(canvas).toBeVisible({ timeout: 15_000 });
          // The canvas mounts at the default 300×150 and fills the hero a frame or so later, once
          // the renderer has measured it, so wait for that rather than reading the first size.
          const heroBox = page.locator(p.hero);
          await expect
            .poll(
              async () => {
                const [box, hero] = await Promise.all([canvas.boundingBox(), heroBox.boundingBox()]);
                return Boolean(box && hero && box.width >= hero.width * 0.9 && box.height >= hero.height * 0.9);
              },
              { timeout: 10_000 },
            )
            .toBe(true);
        });

        test("section screens sit below their captions", async ({ page }) => {
          test.skip(size.width < 1024, "below 1024px the sections are stacked cards");
          await open(page, p.path, p.h1);
          const ids = await page.locator("section[id^='s0']").evaluateAll((els) => els.map((e) => e.id));
          expect(ids.length).toBeGreaterThan(0);
          for (const id of ids) {
            // Sections render as cards until the width check settles after hydration.
            await expect(page.locator(`#${id} .afvar-os-desktop-frame`)).toBeAttached();
            // Halfway through the section's scroll it is pinned, caption and screen both in view.
            // Jump (the site scrolls smoothly), then wait until the section has pinned.
            await page.evaluate((sid) => {
              const s = document.getElementById(sid)!;
              window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY + s.offsetHeight / 4, behavior: "instant" });
            }, id);
            const measure = () =>
              page.evaluate((sid) => {
                const s = document.getElementById(sid)!;
                const head = s.querySelector("header")!.getBoundingClientRect();
                const frame = s.querySelector(".afvar-os-desktop-frame")!.getBoundingClientRect();
                return { head: head.bottom, top: frame.top, bottom: frame.bottom, left: frame.left, right: frame.right, vw: document.documentElement.clientWidth, vh: window.innerHeight };
              }, id);
            await expect.poll(async () => (await measure()).head, { message: `${id} pins` }).toBeGreaterThan(0);
            await expect.poll(async () => { const r = await measure(); return r.bottom <= r.vh; }, { message: `${id}: screen runs off the bottom` }).toBe(true);
            const m = await measure();
            expect(m.top, `${id}: screen starts under the caption`).toBeGreaterThanOrEqual(m.head + 8);
            expect(m.bottom, `${id}: screen runs off the bottom`).toBeLessThanOrEqual(m.vh);
            expect(m.left, `${id}: screen runs off the left`).toBeGreaterThanOrEqual(0);
            expect(m.right, `${id}: screen runs off the right`).toBeLessThanOrEqual(m.vw);
          }
        });
      });
    }
  });
}

test.describe("contact buttons", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Write to us goes to the enquiry form", async ({ page }) => {
    await open(page, "/contact", /Contact the team\./);
    await page.getByRole("link", { name: "Write to us" }).filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/#enquiry$/);
    await expect(page.locator("#enquiry")).toBeInViewport();
  });
});

test.describe("about buttons", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Contact the team goes to /contact", async ({ page }) => {
    await open(page, "/about", /About AFVAR\./);
    await page.getByRole("link", { name: "Contact the team" }).filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/\/contact(#.*)?$/);
  });
});
