import { createFollowingLogo } from "./face-follow.js";
import { lidClosure, nextBlinkDelay } from "./timeline.mjs";

// The real header keeps the signature after the splash unmounts. The material
// owns its own clock; eye patches only need painting during an actual blink.
export function startDock(mark, signal) {
  const mount = mark.querySelector("[data-dock-surface]");
  const image = mark.querySelector("picture img");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  let face, pending = false, timer = 0, onScreen = true, visibleSince = performance.now();

  function visible() {
    const style = getComputedStyle(mark);
    return !signal.aborted && !document.hidden && onScreen && !reduced.matches &&
      !connection?.saveData && !["2g", "slow-2g"].includes(connection?.effectiveType) &&
      style.visibility === "visible" && style.opacity !== "0";
  }
  function paint() {
    const time = performance.now() - visibleSince;
    const blink = lidClosure(time);
    face.draw(1, { waiting:true, gazeStrength:0, blink });
    mark.dataset.dockBlink = blink.toFixed(3);
    timer = setTimeout(paint, nextBlinkDelay(time));
  }
  async function sync() {
    clearTimeout(timer);
    if (!visible()) {
      face?.setActive(false);
      delete mark.dataset.dockReady;
      delete mark.dataset.dockBlink;
      visibleSince = performance.now();
      return;
    }
    if (!face) {
      if (pending) return;
      pending = true;
      try {
        await image.decode();
        if (!visible()) return;
        const candidate = await createFollowingLogo(mount, { compact:true, artwork:image });
        if (signal.aborted) { candidate.dispose(); return; }
        face = candidate;
      } catch { return; } finally { pending = false; }
      if (!visible()) { face.setActive(false); return; }
    }
    face.setActive(true);
    paint();
    mark.dataset.dockReady = "";
  }
  const observer = new IntersectionObserver(entries => {
    onScreen = entries[0].isIntersecting;
    sync();
  });
  observer.observe(mark);
  const visibility = new MutationObserver(sync);
  visibility.observe(mark, { attributes:true, attributeFilter:["style"] });
  const options = {signal};
  document.addEventListener("visibilitychange", sync, options);
  window.addEventListener("pageshow", sync, options);
  reduced.addEventListener("change", sync, options);
  connection?.addEventListener?.("change", sync, options);
  signal.addEventListener("abort", () => {
    clearTimeout(timer); observer.disconnect(); visibility.disconnect(); face?.dispose();
    delete mark.dataset.dockReady; delete mark.dataset.dockBlink;
  }, {once:true});
  sync();
}
