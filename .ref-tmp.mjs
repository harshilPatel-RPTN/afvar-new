import { chromium } from "@playwright/test";
const out = process.argv[2];
const browser = await chromium.launch({ channel: "chrome" });
const dismiss = async (page) => {
  for (let i = 0; i < 4; i++) {
    const btn = page.locator("button:has-text('Not now'), button[aria-label='Dismiss FIN greeting']").first();
    if (await btn.isVisible().catch(() => false)) { await btn.click().catch(() => {}); await page.waitForTimeout(600); } else break;
  }
};
// FinAI
let page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto("https://finai-frontend-liart.vercel.app/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(3000); await dismiss(page);
await page.screenshot({ path: `${out}/finai-1.png` });
await page.mouse.wheel(0, 900); await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/finai-2.png` });
await page.close();
// Demo
page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto("https://ai-investment-demo.vercel.app/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(3000); await dismiss(page);
await page.screenshot({ path: `${out}/demo-1.png` });
const comm = page.locator("button[aria-label*='Trading Communities'], button:has-text('Trading Communities')").first();
if (await comm.isVisible().catch(() => false)) { await comm.click(); await page.waitForTimeout(1500); }
await page.screenshot({ path: `${out}/demo-2.png` });
const commText = await page.evaluate(() => {
  const el = [...document.querySelectorAll("section,div")].find((d) => /Join community/.test(d.innerText) && d.innerText.length < 4000);
  return el ? el.innerText : "";
});
console.log("COMMUNITIES TEXT:\n", commText.slice(0, 3000));
const view = page.locator("button:has-text('View community')").first();
if (await view.isVisible().catch(() => false)) { await view.click(); await page.waitForTimeout(1500); await page.screenshot({ path: `${out}/demo-3.png` }); }
const after = await page.evaluate(() => document.body.innerText);
const i = after.indexOf("community");
console.log("AFTER VIEW:\n", after.slice(Math.max(0, i - 1500), i + 2500));
// launcher apps
const launcher = page.locator("button[aria-label='Open app launcher']").first();
if (await launcher.isVisible().catch(() => false)) { await page.keyboard.press("Escape"); await launcher.click(); await page.waitForTimeout(1200); await page.screenshot({ path: `${out}/demo-4.png` }); }
await browser.close();
