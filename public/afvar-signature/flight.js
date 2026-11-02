import { createGaze } from "./cursor-gaze.mjs";
import { sample } from "./timeline.mjs";
import { createFollowingLogo } from "./golden-reveal/reveal.js";
import { createLockup } from "./golden-reveal/lockup.js";

// The ribbon reveal plays at an unhurried pace: the gold sweep forms the
// mark, the finished lockup holds for a beat, then it glides into the header
// and the page opens. Only real page readiness can extend the centred part.
const entranceMs = 1100;
const holdMs = 280;
const dockMs = 850;
const openingMs = 600;
const clamp = value => Math.min(1, Math.max(0, value));

function waitForRoute(signal) {
  return new Promise(resolve => {
    let timer;
    const observer = new MutationObserver(check);
    function done(targets) {
      observer.disconnect();
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      document.removeEventListener("DOMContentLoaded", check);
      resolve(targets);
    }
    function cancel() { done(null); }
    function check() {
      if (document.readyState === "loading") return;
      const main = document.querySelector("main,[role=main],h1");
      if (!main) return;
      const mark = document.querySelector("[data-afvar-brand-mark]");
      if (!mark) return done(null);
      // The root story's boot layout is replaced when the first chapter has
      // hydrated. Do not wait on the AI avatar, market feeds, fonts or video.
      if (mark.dataset.afvarBrandReady !== "true" || main.querySelector('#afvar-ai[data-mode="boot"]')) return;
      const name = mark.closest("a")?.querySelector("[data-afvar-brand-name]");
      if (name && mark.getBoundingClientRect().width && name.getBoundingClientRect().width) done({mark, name});
    }
    if (signal.aborted) return done(null);
    signal.addEventListener("abort", cancel, {once:true});
    document.addEventListener("DOMContentLoaded", check);
    observer.observe(document.body, {childList:true, subtree:true, attributes:true,
      attributeFilter:["data-afvar-brand-ready", "data-mode"]});
    timer = setTimeout(cancel, 5500);
    check();
  });
}

// Decode the actual selected picture source. A <picture> may have chosen the
// mobile image while its fallback src still points at the desktop artwork.
function decodeImages(...elements) {
  const images = elements.flatMap(el => el instanceof HTMLImageElement ? [el] : [...el.querySelectorAll("img")]);
  return Promise.all(images.map(image => image.decode()));
}

export async function startFlight(root, signal, finish, started) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  if (signal.aborted) return;
  if (reduced.matches) return finish();
  const stage = root.querySelector("[data-signature-stage]");
  const caption = root.querySelector("[data-signature-caption]");
  const backdrop = root.querySelector("[data-signature-backdrop]");
  const mount = document.createElement("div");
  mount.dataset.signatureMount = "";
  const canvas = document.createElement("canvas");
  stage.append(mount, canvas);

  let raf = 0, renderer, targets, headerVisibility;
  let elapsed = 0, readyAt = null, lastTick = null, lastPaint = -Infinity;
  // At dock=0, only the center geometry is used. Bind the real destination
  // as soon as the actual route and its lettering have become usable.
  let lockup = createLockup(stage, caption, backdrop, caption);
  const gaze = createGaze();
  const resize = new ResizeObserver(measure);
  signal.addEventListener("abort", () => {
    cancelAnimationFrame(raf);
    resize.disconnect();
    renderer?.dispose();
    canvas.remove();
    mount.remove();
    if (headerVisibility) {
      targets.mark.style.visibility = headerVisibility.mark;
      targets.name.style.visibility = headerVisibility.name;
      document.documentElement.removeAttribute("data-afvar-signature-flying");
    }
  }, {once:true});

  function measure() {
    const viewport = root.getBoundingClientRect();
    lockup.measure(targets?.mark.getBoundingClientRect() ?? viewport, viewport);
  }
  function visibility() {
    lastTick = null;
    cancelAnimationFrame(raf);
    if (!document.hidden && !signal.aborted && renderer) raf = requestAnimationFrame(tick);
  }
  function pointer(event) {
    if (readyAt !== null) return;
    const bounds = stage.getBoundingClientRect();
    const unit = Math.max(1, bounds.width * .65);
    gaze.target((event.clientX - bounds.left - bounds.width / 2) / unit,
      (event.clientY - bounds.top - bounds.height * .522) / unit, elapsed);
  }
  function leave() { gaze.leave(elapsed); }

  function tick(now) {
    if (signal.aborted || document.hidden) return;
    try {
      if (targets && !targets.name.isConnected) return finish();
      // Cap each step: a long main-thread stall (hydration on a cold load)
      // must slow the signature down, never skip the logo's formation.
      elapsed += lastTick == null ? 0 : Math.min(now - lastTick, 34);
      lastTick = now;
      if (targets && readyAt === null) {
        readyAt = elapsed;
        gaze.release(elapsed);
      }
      // The eye blinks naturally during a real wait. The exit begins a short
      // hold after both the route and the formed signature are ready.
      const frame = sample(elapsed, null, {entranceMs});
      if (readyAt !== null && frame.formation === 1) {
        const settled = elapsed - Math.max(entranceMs, readyAt);
        const moving = settled - holdMs;
        frame.dock = clamp(moving / dockMs);
        frame.open = clamp((moving - dockMs) / openingMs);
        frame.phase = moving < 0 ? "holding" : frame.dock < 1 ? "docking" : frame.open < 1 ? "opening" : "complete";
        frame.gazeStrength = 1 - clamp(settled / holdMs);
      }
      // Every moving phase paints at 60 fps; only an idle wait drops to 30 fps.
      const minFrame = frame.phase === "waiting" ? 1000 / 30 - 1 : 1000 / 60 - 1;
      if (now - lastPaint >= minFrame) {
        lastPaint = now;
        const face = gaze.sample(elapsed, {waiting:frame.phase === "waiting", blink:frame.blink, reduced:false});
        renderer.draw(frame.formation, {
          waiting:frame.phase === "waiting", gazeStrength:frame.gazeStrength,
          gazeX:face.x, gazeY:face.y, blink:face.blink
        });
        lockup.paint(frame);
        root.dataset.phase = frame.phase;
        root.dataset.formation = frame.formation.toFixed(3);
        root.dataset.gazeX = face.x.toFixed(3);
        root.dataset.gazeY = face.y.toFixed(3);
        root.dataset.blink = face.blink.toFixed(3);
        if (frame.phase === "complete") return finish();
      }
      raf = requestAnimationFrame(tick);
    } catch {
      finish();
    }
  }

  measure();
  resize.observe(root);
  const passive = {passive:true, signal};
  window.addEventListener("resize", measure, passive);
  window.addEventListener("scroll", measure, passive);
  window.addEventListener("pointermove", pointer, passive);
  window.addEventListener("pointerout", event => { if (!event.relatedTarget) leave(); }, passive);
  window.addEventListener("pointercancel", leave, passive);
  window.addEventListener("blur", leave, passive);
  document.addEventListener("visibilitychange", visibility, {signal});
  reduced.addEventListener("change", event => { if (event.matches) finish(); }, {signal});

  const route = waitForRoute(signal).then(async destination => {
    if (signal.aborted) return;
    if (!destination) return finish();
    await decodeImages(caption, destination.mark, destination.name);
    if (signal.aborted) return;
    if (!destination.name.isConnected) return finish();
    targets = destination;
    headerVisibility = {mark:targets.mark.style.visibility, name:targets.name.style.visibility};
    targets.mark.style.visibility = "hidden";
    targets.name.style.visibility = "hidden";
    document.documentElement.setAttribute("data-afvar-signature-flying", "");
    lockup = createLockup(stage, caption, backdrop, targets.name);
    resize.observe(targets.mark);
    resize.observe(targets.name);
    measure();
  });
  const art = createFollowingLogo(mount, canvas).then(candidate => {
    if (signal.aborted) { candidate.dispose(); return; }
    renderer = candidate;
    started();
    visibility();
  });
  // A failed critical asset opens the real page immediately. The owner also
  // enforces a wall-clock deadline if a network request never settles.
  await Promise.all([art, route]);
}
