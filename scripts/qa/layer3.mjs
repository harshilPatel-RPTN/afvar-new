// Layer 3: scroll the whole film like a user (forward, then back, then forward again) and record
// main-thread long tasks, frame intervals, heap growth, WebGL canvases and the avatar build.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const URL = process.env.URL || "http://localhost:3100/";
const SEC = process.env.SEC || "afvar-ai";
const VP = (process.env.VP || "1440x900,390x844m").split(",");
const browser = await chromium.launch({ channel: "chrome", args: [...(process.env.NOGL ? ["--disable-webgl", "--disable-3d-apis"] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]), "--enable-precise-memory-info", "--js-flags=--expose-gc"] });
const out = [];
for (const vp of VP) {
  const mobile = vp.endsWith("m");
  const [w, h] = vp.replace("m", "").split("x").map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.__long = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push({ t: e.startTime, d: e.duration }))).observe({ type: "longtask", buffered: true });
    window.__cls = 0;
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: "layout-shift", buffered: true });
    window.__lcp = 0;
    new PerformanceObserver((l) => { const e = l.getEntries().at(-1); if (e) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await page.goto(URL, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction((sec) => document.getElementById(sec)?.dataset.acts, SEC, { timeout: 120000 });
  await page.waitForTimeout(6000);
  const load = await page.evaluate(() => ({ lcp: Math.round(window.__lcp), cls: +window.__cls.toFixed(4), longAtLoad: window.__long.length, ttfb: Math.round(performance.getEntriesByType("navigation")[0].responseStart) }));
  const heap = () => page.evaluate(() => { window.gc?.(); return Math.round((performance.memory?.usedJSHeapSize ?? 0) / 1e6); });
  const heap0 = await heap();
  const pass = async (from, to, steps) => {
    await page.evaluate(() => { window.__frames = []; let last = performance.now(); window.__rafOn = true; const f = (t) => { window.__frames.push(t - last); last = t; if (window.__rafOn) requestAnimationFrame(f); }; requestAnimationFrame(f); window.__long = []; });
    const t0 = Date.now();
    for (let i = 0; i <= steps; i++) {
      const p = from + ((to - from) * i) / steps;
      await page.evaluate(([p, sec]) => { const el = document.getElementById(sec); if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY + p * (el.offsetHeight - innerHeight)); }, [p, SEC]);
      await page.waitForTimeout(120);
    }
    const wall = Date.now() - t0;
    return page.evaluate((wall) => {
      window.__rafOn = false;
      const f = window.__frames.slice(2).sort((a, b) => a - b);
      const q = (x) => Math.round(f[Math.min(f.length - 1, Math.floor(f.length * x))] ?? 0);
      const long = window.__long;
      return { wallMs: wall, frames: f.length, frameP50: q(0.5), frameP95: q(0.95), longTasks: long.length, longMaxMs: Math.round(Math.max(0, ...long.map((l) => l.d))), blockingMs: Math.round(long.reduce((s, l) => s + Math.max(0, l.d - 50), 0)), canvases: document.querySelectorAll("canvas").length };
    }, wall);
  };
  const fwd = await pass(0, 1, 160);
  const back = await pass(1, 0, 80);
  const fwd2 = await pass(0, 1, 80);
  const heap1 = await heap();
  const avatar = await page.evaluate(() => Math.round(performance.getEntriesByName("afvar-avatar-build")[0]?.duration ?? -1));
  out.push({ vp, load, avatarBuildMs: avatar, heapMB: { start: heap0, afterThreePasses: heap1 }, forward: fwd, backward: back, forwardAgain: fwd2, errors: errors.slice(0, 3) });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
