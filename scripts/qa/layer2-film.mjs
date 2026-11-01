import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const URL = process.env.URL || "http://localhost:3100/platform";
const SEC = process.env.SEC || "afvar-platform";
/** Desktop OS acts render inside one full-bleed OS layer (data-act="os"). */
const OS_ACTS = ["ways", "stop", "workspace"];
const VIEWPORTS = (process.env.VP || "1440x900,1280x720,1024x768,820x1180m,390x844m,360x640m,844x390m").split(",");
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const report = [];
for (const vp of VIEWPORTS) {
  const mobile = vp.endsWith("m");
  const [w, h] = vp.replace("m", "").split("x").map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 200)));
  const fails = [];
  const fail = (m) => fails.push(m);
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForFunction((sec) => document.getElementById(sec)?.dataset.acts, SEC, { timeout: 120000 });
  await page.waitForTimeout(4000);
  const mode = await page.evaluate((sec) => document.getElementById(sec).dataset.mode, SEC);
  const acts = await page.evaluate((sec) => JSON.parse(document.getElementById(sec).dataset.acts), SEC);
  const order = Object.keys(acts);
  const expectMode = w >= 1024 ? "desktop" : "compact";
  if (mode !== expectMode) fail(`mode ${mode} != ${expectMode}`);
  const probes = [];
  for (const id of order) {
    if (OS_ACTS.includes(id)) probes.push([id, 0.3], [id, 0.75]);
    else if (id === "hero") probes.push([id, 0.0]);
    else probes.push([id, 0.6]);
  }
  const go = (id, f) =>
    page.evaluate(([id, f, sec]) => {
      const el = document.getElementById(sec);
      const r = JSON.parse(el.dataset.acts)[id];
      const p = r[0] + (r[1] - r[0]) * f;
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY + p * (el.offsetHeight - innerHeight));
    }, [id, f, SEC]);
  const state = () =>
    page.evaluate(() => {
      const fixedTop = Math.max(
        0,
        ...[...document.querySelectorAll("body *")]
          .filter((e) => getComputedStyle(e).position === "fixed")
          .map((e) => e.getBoundingClientRect())
          .filter((r) => r.top <= 80 && r.height > 0 && r.height < 160 && r.width > innerWidth * 0.5)
          .map((r) => r.bottom),
      );
      // Measure the visible content (the act's inner box), not its reserved padding.
      const vis = [...document.querySelectorAll("[data-act]")]
        .map((e) => ({ act: e.dataset.act, o: parseFloat(getComputedStyle(e).opacity), r: (e.dataset.act === "os" ? e : e.firstElementChild ?? e).getBoundingClientRect() }))
        .filter((x) => x.o > 0.5 && x.r.height > 0)
        .map((x) => ({ act: x.act, top: Math.round(x.r.top), bottom: Math.round(x.r.bottom), left: Math.round(x.r.left), right: Math.round(x.r.right) }));
      // Fixed site extras (sound toggle, reminder, launcher) that are visible right now.
      const fixed = [...document.querySelectorAll("body *")]
        .filter((e) => getComputedStyle(e).position === "fixed" && getComputedStyle(e).visibility !== "hidden" && parseFloat(getComputedStyle(e).opacity) > 0.1)
        .map((e) => ({ name: (e.getAttribute("aria-label") || e.className || e.tagName).toString().slice(0, 40), r: e.getBoundingClientRect() }))
        .filter((x) => x.r.top > 140 && x.r.width > 0 && x.r.width < innerWidth * 0.95 && x.r.height < 300)
        .map((x) => ({ name: x.name, top: Math.round(x.r.top), bottom: Math.round(x.r.bottom), left: Math.round(x.r.left), right: Math.round(x.r.right) }));
      return { vis, fixed, fixedTop: Math.round(fixedTop), sw: document.documentElement.scrollWidth, iw: innerWidth, ih: innerHeight };
    });
  // Wait until the page itself reports the act (the rail's aria-current), then let motion settle.
  const settle = async (id) => {
    const idx = order.indexOf(id);
    await page
      .waitForFunction((idx) => document.querySelectorAll("nav[aria-label='Story chapters'] li")[idx]?.querySelector("button[aria-current=step]"), idx, { timeout: 60000 })
      .catch(() => fail(`${id}: page never reported this act`));
    await page.waitForFunction(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))), null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(400);
  };
  const states = {};
  for (const [id, f] of probes) {
    await go(id, f);
    await settle(id);
    const s = await state();
    states[`${id}:${f}`] = s;
    const acts = [...new Set(s.vis.map((v) => v.act))];
    const want = mode === "desktop" && OS_ACTS.includes(id) ? "os" : id;
    if (acts.length !== 1 || acts[0] !== want) fail(`${id}:${f} visible=${JSON.stringify(acts)}`);
    if (s.sw > s.iw + 1) fail(`${id}:${f} horizontal overflow ${s.sw}>${s.iw}`);
    for (const v of s.vis) {
      if (v.act === "os") continue; // the OS layer is full-bleed by design
      if (v.top < s.fixedTop - 2) fail(`${id}:${f} under the navbar (top ${v.top} < ${s.fixedTop})`);
      if (v.bottom > s.ih + 1) fail(`${id}:${f} cut at the bottom (${v.bottom} > ${s.ih})`);
      if (v.left < -1 || v.right > s.iw + 1) fail(`${id}:${f} off-screen horizontally`);
    }
    const boxes = s.vis.filter((v) => v.act !== "os");
    // Film content must never collide with the site's floating extras.
    const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 4 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 4;
    for (const fx of s.fixed) for (const b of boxes) if (hit(fx, b)) fail(`${id}:${f} "${fx.name}" floats over the ${b.act} caption`);
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        const ov = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 4 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 4;
        if (ov) fail(`${id}:${f} overlays overlap ${JSON.stringify(a)} ${JSON.stringify(b)}`);
      }
  }
  // reverse: come back from the end to each probe
  for (const [id, f] of [...probes].reverse().slice(0, 6)) {
    await go(id, f);
    await settle(id);
    const s = await state();
    const a = JSON.stringify([...new Set(s.vis.map((v) => v.act))]);
    const b = JSON.stringify([...new Set(states[`${id}:${f}`].vis.map((v) => v.act))]);
    if (a !== b) fail(`reverse ${id}:${f} ${a} vs ${b}`);
  }
  // rail navigation (desktop)
  if (mode === "desktop") {
    await go("verify", 0.6);
    await settle("verify");
    await page.locator("nav[aria-label='Story chapters'] button").filter({ hasText: "Trust" }).click({ force: true });
    await page.waitForFunction(() => document.querySelector("nav[aria-label='Story chapters'] button[aria-current=step]")?.textContent?.includes("Trust"), null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const s = await state();
    const acts2 = [...new Set(s.vis.map((v) => v.act))];
    if (!acts2.includes("trust")) fail(`rail → Trust landed on ${JSON.stringify(acts2)}`);
  }
  // launcher hand-off + Talk button
  await go("stop", 0.3);
  await settle("stop");
  const launcher = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button[aria-expanded]")].find((b) => b.querySelector("img[src*='launcher']"));
    return btn ? getComputedStyle(btn.parentElement).visibility : "missing";
  });
  if (launcher !== "hidden") fail(`launcher not hidden during the stop act (${launcher})`);
  const talk = page.getByRole("button", { name: "Talk to AFVAR" }).first();
  if (false) {
    // Hit-test like a finger would, then click (Playwright's own stability wait times out at 2 fps).
    await page.waitForFunction(() => [...document.querySelectorAll("button")].some((x) => x.textContent.includes("Talk to AFVAR") && parseFloat(getComputedStyle(x.closest("[data-act]") ?? x).opacity) > 0.5), null, { timeout: 30000 }).catch(() => {});
    const hit = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Talk to AFVAR") && parseFloat(getComputedStyle(x.closest("[data-act]") ?? x).opacity) > 0.5);
      if (!b) return "missing";
      const r = b.getBoundingClientRect();
      const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      if (!(h === b || b.contains(h))) return "covered by " + h?.tagName;
      b.click();
      return "ok";
    });
    if (hit !== "ok") fail("talk button " + hit);
    await page.waitForTimeout(800);
    const open = await page.evaluate(() => [...document.querySelectorAll("section[role=dialog]")].some((d) => d.getAttribute("aria-hidden") === "false"));
    if (!open) fail("Talk to AFVAR did not open the live avatar");
    await page.keyboard.press("Escape");
  }
  const avatarMs = await page.evaluate(() => performance.getEntriesByName("afvar-avatar-build")[0]?.duration ?? null);
  const realErrors = errors.filter((e) => !/synchronously unmount/.test(e));
  report.push({ vp, mode, probes: probes.length, avatarBuildMs: avatarMs && Math.round(avatarMs), errors: realErrors.slice(0, 5), fails });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
