import { createGaze } from "./cursor-gaze.mjs";
import { sample, TIMING } from "./timeline.mjs";
import { createFollowingLogo } from "./golden-reveal/reveal.js";
import { createLockup } from "./golden-reveal/lockup.js";

const entranceMs = 5100;
const firstExpression = TIMING.firstBlink + TIMING.close + TIMING.shut + TIMING.unclose;

// The route can be streamed after the shared layout hydrates. Wait for its
// actual header and content; market APIs, background video and chat are optional.
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
      if (document.readyState === "loading" || !document.querySelector("main,[role=main],h1")) return;
      const mark = document.querySelector('[data-afvar-brand-mark][data-afvar-brand-ready="true"]');
      const name = mark?.closest("a")?.querySelector("[data-afvar-brand-name]");
      if (name && mark.getBoundingClientRect().width && name.getBoundingClientRect().width) done({mark, name});
    }
    if (signal.aborted) return done(null);
    signal.addEventListener("abort", cancel, {once:true});
    document.addEventListener("DOMContentLoaded", check);
    observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:["data-afvar-brand-ready"]});
    timer = setTimeout(cancel, 1500);
    check();
  });
}

export async function startFlight(root, signal, finish, started) {
  const targets = await waitForRoute(signal);
  if (signal.aborted) return;
  if (!targets) return finish();

  const stage = root.querySelector("[data-signature-stage]");
  const caption = root.querySelector("[data-signature-caption]");
  const backdrop = root.querySelector("[data-signature-backdrop]");
  // Each mount owns its own buffers. A late image decode from a discarded
  // StrictMode effect cannot replace the new run's artwork.
  const mount = document.createElement("div");
  mount.dataset.signatureMount = "";
  const canvas = document.createElement("canvas");
  stage.append(mount, canvas);
  let renderer, raf = 0;
  const resize = new ResizeObserver(measure);
  const lockup = createLockup(stage, caption, backdrop, targets.name);
  const gaze = createGaze();
  let elapsed = 0, readyAt = null, lastTick = null, lastPaint = -Infinity;
  let headerVisibility;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

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
    lockup.measure(targets.mark.getBoundingClientRect(), root.getBoundingClientRect());
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
      if (!targets.name.isConnected) return finish();
      elapsed += lastTick == null ? 0 : now - lastTick;
      lastTick = now;
      if (readyAt === null && elapsed >= entranceMs + firstExpression) {
        readyAt = elapsed;
        gaze.release(elapsed);
        measure();
      }
      // Limit the software ribbon draw to 30fps. The smaller CSS-transformed
      // signature and aperture get a higher budget while moving to the header.
      const minFrame = readyAt === null ? 1000 / 30 - 1 : 1000 / 60 - 1;
      if (now - lastPaint >= minFrame) {
        lastPaint = now;
        const frame = sample(elapsed, readyAt, {entranceMs, pairedExit:true});
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

  // Paint only when both the real landing artwork and the moving layers are ready.
  const inputs = [...caption.querySelectorAll("img"), ...targets.mark.querySelectorAll("img"), ...targets.name.querySelectorAll("img")];
  if (targets.name instanceof HTMLImageElement) inputs.push(targets.name);
  if (targets.mark instanceof HTMLImageElement) inputs.push(targets.mark);
  const candidate = await createFollowingLogo(mount, canvas);
  if (signal.aborted) { candidate.dispose(); return; }
  renderer = candidate;
  await Promise.all(inputs.map(image => image.decode()));
  if (signal.aborted) return;
  measure();
  resize.observe(root);
  resize.observe(targets.mark);
  resize.observe(targets.name);
  headerVisibility = {mark:targets.mark.style.visibility, name:targets.name.style.visibility};
  targets.mark.style.visibility = "hidden";
  targets.name.style.visibility = "hidden";
  document.documentElement.setAttribute("data-afvar-signature-flying", "");
  const passive = {passive:true, signal};
  window.addEventListener("resize", measure, passive);
  window.addEventListener("scroll", measure, passive);
  window.addEventListener("pointermove", pointer, passive);
  window.addEventListener("pointerout", event => { if (!event.relatedTarget) leave(); }, passive);
  window.addEventListener("pointercancel", leave, passive);
  window.addEventListener("blur", leave, passive);
  document.addEventListener("visibilitychange", visibility, {signal});
  reduced.addEventListener("change", event => { if (event.matches) finish(); }, {signal});
  if (reduced.matches) return finish();
  started();
  visibility();
}
