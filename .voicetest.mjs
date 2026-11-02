import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--autoplay-policy=user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => {
  window.__plays = [];
  const orig = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const p = orig.call(this);
    const src = this.src;
    if (src.includes("/voice/")) {
      const rec = { src: src.split("/").pop(), at: Math.round(scrollY), ok: null, rate: this.playbackRate };
      window.__plays.push(rec);
      p.then(() => (rec.ok = true), (e) => (rec.ok = e.name));
    }
    return p;
  };
});
page.on("pageerror", (e) => console.log("pageerror", e.message));
await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 120000 });
await page.mouse.click(5, 450); // a gesture, like a visitor's first click
const total = await page.evaluate(() => document.documentElement.scrollHeight);
console.log("height", total);
for (let y = 0; y < total; y += 120) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(60);
}
await page.waitForTimeout(1500);
console.log(JSON.stringify(await page.evaluate(() => window.__plays), null, 1));
await browser.close();
