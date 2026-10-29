// Records the AFVAR overview video from the real interactive OS preview on
// /platform (TryDesktop autoplay demo, sample data, labelled in-product).
// Honest product capture — no generated imagery (README §9.3).
//
//   node scripts/record-overview-video.mjs [--base http://localhost:3000] [--seconds 32]
//
// Output: public/afvar/overview/afvar-overview.webm (+ poster.jpg)
import { mkdir, rename, readdir, rm } from "node:fs/promises";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const BASE = args.includes("--base") ? args[args.indexOf("--base") + 1] : "http://localhost:3000";
const SECONDS = args.includes("--seconds") ? Number(args[args.indexOf("--seconds") + 1]) : 32;
const OUT = new URL("../public/afvar/overview/", import.meta.url);
const TMP = new URL("../.overview-recording/", import.meta.url);
const SIZE = { width: 1280, height: 720 };

const ISOLATE = `
  html,body{background:#030405!important}
  nextjs-portal{display:none!important}
  body *{visibility:hidden!important}
  [aria-label^="Try AFVAR"],[aria-label^="Try AFVAR"] *{visibility:visible!important}
  [aria-label^="Try AFVAR"]{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;min-height:0!important;aspect-ratio:auto!important;z-index:2147483647!important;border-radius:0!important;max-width:none!important;outline:none!important}
`;

await mkdir(OUT, { recursive: true });
await rm(TMP, { recursive: true, force: true });
const browser = await chromium.launch();
// Warm the route first so the recording doesn't capture a cold compile.
{
  const warm = await browser.newPage();
  await warm.goto(`${BASE}/platform`, { waitUntil: "networkidle" });
  await warm.close();
}
const ctx = await browser.newContext({ viewport: SIZE, recordVideo: { dir: TMP.pathname, size: SIZE }, colorScheme: "dark" });
const page = await ctx.newPage();
// Keep the isolation stylesheet in <head> even across hydration (React may
// replace head children), so no frame shows the surrounding page.
await page.addInitScript((css) => {
  // Init scripts run before <html> exists — guard, and keep re-applying.
  const ensure = () => {
    const root = document.head || document.documentElement;
    if (!root || document.getElementById("__isolate")) return;
    const s = document.createElement("style");
    s.id = "__isolate";
    s.textContent = css;
    root.appendChild(s);
  };
  setInterval(ensure, 50);
  document.addEventListener("DOMContentLoaded", ensure);
  ensure();
}, ISOLATE);
await page.goto(`${BASE}/platform`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: new URL("poster.jpg", OUT).pathname, type: "jpeg", quality: 82 });
await page.waitForTimeout(SECONDS * 1000);
await page.screenshot({ path: new URL("poster-late.jpg", OUT).pathname, type: "jpeg", quality: 82 });
await page.close();
await ctx.close();
await browser.close();

const [file] = (await readdir(TMP)).filter((f) => f.endsWith(".webm"));
await rename(new URL(file, TMP), new URL("afvar-overview.webm", OUT));
await rm(TMP, { recursive: true, force: true });
console.log("saved public/afvar/overview/afvar-overview.webm");
