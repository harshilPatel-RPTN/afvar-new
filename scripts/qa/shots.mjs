// node shots.mjs <tag> <w> <h> <list act:f,...> [waitMs] [mobile]
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const [tag, w, h, list, wait = "9000", mobile = ""] = process.argv.slice(2);
const SEC = process.env.SEC || "afvar-ai";
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGE " + e.message));
page.on("console", (m) => m.type() === "error" && !m.text().includes("synchronously") && errors.push(m.text().slice(0, 300)));
await page.goto(process.env.URL || "http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForFunction((sec) => document.getElementById(sec)?.dataset.acts, SEC, { timeout: 120000 });
await page.evaluate(() => window.scrollTo(0, 40)); await page.waitForTimeout(15000);
let i = 0;
for (const item of list.split(",")) {
  const [a, f] = item.split(":");
  await page.evaluate(([a, f, sec]) => {
    const el = document.getElementById(sec);
    const r = JSON.parse(el.dataset.acts)[a];
    const p = r[0] + (r[1] - r[0]) * +f;
    const top = el.getBoundingClientRect().top + scrollY;
    window.scrollTo(0, top + p * (el.offsetHeight - innerHeight));
  }, [a, f, SEC]);
  // Wait until the page itself reports this act (rail aria-current), then for two painted frames.
  await page.waitForFunction(([a, sec]) => {
    const el = document.getElementById(sec); const order = Object.keys(JSON.parse(el.dataset.acts));
    return document.querySelectorAll("nav[aria-label='Story chapters'] li")[order.indexOf(a)]?.querySelector("button[aria-current=step]");
  }, [a, SEC], { timeout: 90000 }).catch(() => console.log("no-settle", a, f));
  await page.waitForTimeout(+wait);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.screenshot({ path: `${tag}-${String(i).padStart(2, "0")}-${a}${f}.png`, timeout: 120000 });
  i++;
}
console.log(JSON.stringify(errors.slice(0, 10)));
await browser.close();
