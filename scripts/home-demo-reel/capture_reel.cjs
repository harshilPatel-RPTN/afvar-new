// Records /home-demo as a cut reel: one shot per chapter. For each chapter it
// jumps in, lets the scene mount and settle off-camera, then scrolls the
// chapter's own progress range (story only — the closing copy is skipped
// except for the Chapter 10 wordmark finale) while a CDP screencast writes
// frames. Shots are resampled to 30 fps and joined with 0.5 s crossfades.
// The market API is blocked so the page shows SNAPSHOT, never a frozen LIVE.
// usage: node capture_reel.cjs <projectDir> <url> <outDir>
const fs = require("fs");
const path = require("path");
const [projectDir, url, outDir] = process.argv.slice(2);
const { chromium } = require(require.resolve("@playwright/test", { paths: [projectDir] }));
const FPS = 30;
const XFADE = 15; // frames
const W = 1920;
const H = 1080;

// [section aria-label, progress from, progress to, seconds, hold at end]
const SHOTS = [
  ["Chapter 01 — Origin", 0.0, 0.8, 9, 0.4],
  ["Chapter 02 — The Market World", 0.06, 0.82, 9, 0.4],
  ["Chapter 03 — Intelligence", 0.02, 0.84, 8, 0.4],
  ["Chapter 04 — Context", 0.06, 0.84, 7, 0.4],
  ["Chapter 05 — Alerts & Strategy", 0.05, 0.85, 7.5, 0.4],
  ["Chapter 06 — Risk Guardian", 0.02, 0.86, 7.5, 0.4],
  ["Chapter 07 — Journal", 0.05, 0.85, 7, 0.4],
  ["Chapter 08 — Community", 0.03, 0.85, 7, 0.4],
  ["Chapter 09 — Why AFVAR", 0.04, 0.71, 6, 0.4],
  ["Chapter 10 — The Desk", 0.02, 1.0, 10, 3.0],
];

(async () => {
  const rawDir = path.join(outDir, "raw");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(rawDir, { recursive: true });

  const browser = await chromium.launch({ args: ["--enable-gpu", "--use-angle=metal", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.route("**/api/home/market**", (r) => r.abort());
  await page.goto(url, { waitUntil: "load" });
  await page.addStyleTag({ content: 'header.fixed, aside[aria-label="Launch queue reminder"] { display: none !important; }' });
  await page.waitForTimeout(2500);

  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    const file = path.join(rawDir, `f${String(frames.length).padStart(6, "0")}.jpg`);
    fs.writeFileSync(file, Buffer.from(data, "base64"));
    frames.push({ file, t: metadata.timestamp });
    try {
      await cdp.send("Page.screencastFrameAck", { sessionId });
    } catch {}
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: W, maxHeight: H, everyNthFrame: 1 });

  const windows = [];
  for (const [label, from, to, seconds, holdEnd] of SHOTS) {
    // Jump in and warm up off-camera: mount, shader compile, damper settle.
    await page.evaluate(
      ({ label, from }) => {
        const s = document.querySelector(`section[aria-label="${label}"]`);
        window.scrollTo(0, s.offsetTop + from * (s.offsetHeight - innerHeight));
      },
      { label, from },
    );
    await page.waitForTimeout(1600);
    const t0 = Date.now() / 1000;
    await page.evaluate(
      ({ label, from, to, ms }) =>
        new Promise((resolve) => {
          const s = document.querySelector(`section[aria-label="${label}"]`);
          const range = s.offsetHeight - innerHeight;
          const start = performance.now();
          const step = (now) => {
            const k = Math.min(1, (now - start) / ms);
            window.scrollTo(0, s.offsetTop + (from + (to - from) * k) * range);
            if (k < 1) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        }),
      { label, from, to, ms: seconds * 1000 },
    );
    await page.waitForTimeout(holdEnd * 1000);
    windows.push([t0, Date.now() / 1000]);
  }

  await cdp.send("Page.stopScreencast");
  await page.waitForTimeout(300);
  await browser.close();

  // Resample each shot to constant FPS.
  const shots = windows.map(([a, b]) => {
    const out = [];
    let j = 0;
    for (let t = a; t <= b; t += 1 / FPS) {
      while (j + 1 < frames.length && frames[j + 1].t <= t) j++;
      out.push(frames[j].file);
    }
    return out;
  });

  // Join with crossfades: the tail of shot A overlaps the head of shot B.
  const list = [...shots[0]];
  for (let s = 1; s < shots.length; s++) {
    const tail = list.splice(list.length - XFADE, XFADE);
    const head = shots[s].slice(0, XFADE);
    for (let i = 0; i < XFADE; i++) list.push(`${tail[i]}|${head[i]}|${((i + 1) / (XFADE + 1)).toFixed(4)}`);
    list.push(...shots[s].slice(XFADE));
  }
  fs.writeFileSync(path.join(outDir, "frames.txt"), list.join("\n") + "\n");
  console.log(JSON.stringify({ captured: frames.length, shots: shots.map((s) => s.length), outputFrames: list.length, seconds: +(list.length / FPS).toFixed(1) }));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
