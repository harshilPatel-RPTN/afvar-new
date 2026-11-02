import { chromium, devices } from "playwright";
import fs from "fs";
const [pagesFile, outFile] = process.argv.slice(2);
const pages = JSON.parse(fs.readFileSync(pagesFile, "utf8"));
const b = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const results = [];
for (const url of pages) {
  const ctx = await b.newContext({ ...devices["iPhone 14"], deviceScaleFactor: 3 });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  p.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const r = { url, canvases: {}, steps: [], errors };
  try {
    await p.goto("http://localhost:3000" + url, { waitUntil: "load", timeout: 90000 });
    await p.waitForTimeout(7000);
    await p.evaluate(() => {
      let n = 0;
      document.querySelectorAll("canvas").forEach((c) => c.dataset.k ??= String(n++));
      new MutationObserver(() => document.querySelectorAll("canvas:not([data-k])").forEach((c) => (c.dataset.k = "c" + Math.random().toString(36).slice(2, 6)))).observe(document.body, { childList: true, subtree: true });
    });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 700) {
      // smooth-scroll 700px over ~1s while counting frames (what a swipe feels like)
      const m = await p.evaluate((y) => new Promise((res) => {
        const from = window.scrollY, t0 = performance.now(); let last = t0, frames = 0, worst = 0, jank = 0;
        function f(now) { const dt = now - last; last = now; frames++; worst = Math.max(worst, dt); if (dt > 50) jank++;
          const k = Math.min(1, (now - t0) / 1000); window.scrollTo(0, from + (y - from) * k);
          if (k < 1) requestAnimationFrame(f); else res({ fps: Math.round(frames / ((now - t0) / 1000)), worst: Math.round(worst), jank }); }
        requestAnimationFrame(f);
      }), y);
      await p.waitForTimeout(400);
      const idle = await p.evaluate(() => new Promise((res) => { const t0 = performance.now(); let n = 0, last = t0, worst = 0;
        function f(now) { worst = Math.max(worst, now - last); last = now; n++; if (now - t0 < 1000) requestAnimationFrame(f); else res({ fps: n, worst: Math.round(worst) }); } requestAnimationFrame(f); }));
      const vis = await p.evaluate(() => [...document.querySelectorAll("canvas")].map((c) => { const r = c.getBoundingClientRect();
        const visible = r.width > 40 && r.height > 40 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(c).visibility !== "hidden";
        const sec = c.closest("section[id]")?.id || c.closest("[id]")?.id || "";
        const head = (c.closest("section")?.querySelector("h1,h2")?.textContent || "").trim().slice(0, 50);
        return { k: c.dataset.k, visible, w: c.width, h: c.height, cssW: Math.round(r.width), cssH: Math.round(r.height), sec, head,
          box: { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(innerWidth, r.right) - Math.max(0, r.x), height: Math.min(innerHeight, r.bottom) - Math.max(0, r.y) } }; }));
      const visibleKeys = [];
      for (const c of vis) {
        const e = (r.canvases[c.k] ??= { sec: c.sec, head: c.head, px: c.w * c.h, dpr: +(c.w / Math.max(1, c.cssW)).toFixed(2), css: `${c.cssW}x${c.cssH}`, seenAtY: [], scrollFps: [], idleFps: [], animated: false });
        if (!c.visible || c.box.width < 20 || c.box.height < 20) continue;
        visibleKeys.push(c.k);
        e.seenAtY.push(y); e.scrollFps.push(m.fps); e.idleFps.push(idle.fps);
        e.px = Math.max(e.px, c.w * c.h);
        if (!e.animated) {
          const a = await p.screenshot({ clip: c.box }); await p.waitForTimeout(800); const bb = await p.screenshot({ clip: c.box });
          if (!a.equals(bb)) e.animated = true; else e.staticChecks = (e.staticChecks || 0) + 1;
        }
      }
      r.steps.push({ y, scroll: m, idle, canvases: visibleKeys });
    }
  } catch (e) { r.fail = String(e).slice(0, 200); }
  results.push(r);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 1));
  console.log(url, "done", Object.keys(r.canvases).length, "canvases");
  await ctx.close();
}
await b.close();
