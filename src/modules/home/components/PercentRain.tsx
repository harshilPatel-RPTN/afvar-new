"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { usePauseOffscreen } from "./bits";

/* ── PERCENT RAIN — a light drizzle of "+" (green) and "−" (red) glyphs behind
 * the Launch section. No numbers, purely decorative. A pool of 16 spans is
 * recycled: each drop is one CSS keyframe run (transform/opacity only), which
 * usePauseOffscreen freezes when the section is off-screen. Spawning runs on a
 * rAF loop only while the section intersects the viewport; the rate idles at
 * ~1 drop/s and rises with scroll velocity (more while scrolling). Opacity is
 * capped at .32 and the layer sits behind the cards (parent must isolate).
 * Reduced motion: layer display:none and the spawn loop never starts. */

const POOL = 16;
const RAIN_CSS = [
  "@keyframes pr-fall-a{0%{opacity:0;transform:translate3d(0,-28px,0)}12%{opacity:var(--o)}85%{opacity:var(--o)}100%{opacity:0;transform:translate3d(var(--dx),var(--h),0)}}",
  "@keyframes pr-fall-b{0%{opacity:0;transform:translate3d(0,-28px,0)}12%{opacity:var(--o)}85%{opacity:var(--o)}100%{opacity:0;transform:translate3d(var(--dx),var(--h),0)}}",
  ".pr-drop{position:absolute;top:0;opacity:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:600;line-height:1;will-change:transform,opacity;animation-timing-function:linear;animation-fill-mode:both}",
  "@media (prefers-reduced-motion:reduce){.pr-layer{display:none}}",
].join("");

export function PercentRain() {
  const reduce = useReducedMotion();
  const layerRef = usePauseOffscreen<HTMLDivElement>();
  const dropRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const layer = layerRef.current;
    if (reduce || !layer || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const busyUntil = new Array<number>(POOL).fill(0);
    const flip = new Array<boolean>(POOL).fill(false);
    let height = layer.offsetHeight;
    let raf = 0;
    let visible = false;
    let lastT = 0;
    let acc = 0;
    let velocity = 0; // px/ms, smoothed
    let lastY = window.scrollY;
    let lastScrollT = performance.now();

    const ro = new ResizeObserver(() => {
      height = layer.offsetHeight;
      layer.style.setProperty("--h", `${height + 28}px`);
    });
    ro.observe(layer);
    layer.style.setProperty("--h", `${height + 28}px`);

    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(8, now - lastScrollT);
      const v = Math.abs(window.scrollY - lastY) / dt;
      velocity = Math.min(4, velocity * 0.6 + v * 0.4);
      lastY = window.scrollY;
      lastScrollT = now;
    };

    const spawn = (now: number) => {
      const index = busyUntil.findIndex((t) => t <= now);
      const el = dropRefs.current[index];
      if (index === -1 || !el) return;
      const plus = Math.random() < 0.5;
      const dur = (velocity > 0.3 ? 2.6 : 3.6) + Math.random() * 1.6;
      busyUntil[index] = now + dur * 1000 + 60;
      flip[index] = !flip[index];
      el.textContent = plus ? "+" : "−";
      el.style.color = plus ? "#00E676" : "#FF3B3B";
      el.style.left = `${(2 + Math.random() * 96).toFixed(2)}%`;
      el.style.fontSize = `${Math.round(14 + Math.random() * 9)}px`;
      el.style.setProperty("--o", (0.18 + Math.random() * 0.14).toFixed(2));
      el.style.setProperty("--dx", `${Math.round(-14 + Math.random() * 28)}px`);
      el.style.animationDuration = `${dur.toFixed(2)}s`;
      // Alternating two identical keyframe names restarts the run without a reflow.
      el.style.animationName = flip[index] ? "pr-fall-a" : "pr-fall-b";
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = lastT ? Math.min(100, now - lastT) : 16;
      lastT = now;
      // Velocity decays when the user stops scrolling.
      if (now - lastScrollT > 120) velocity *= 0.9;
      const rate = 1 + Math.min(1, velocity / 1.6) * 9; // drops per second
      acc += (rate * dt) / 1000;
      while (acc >= 1) {
        acc -= 1;
        spawn(now);
      }
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) {
        lastT = 0;
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(layer);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduce, layerRef]);

  // Always rendered (SSR-stable); under reduced motion the CSS hides the layer and no loop runs.
  return (
    <div ref={layerRef} aria-hidden="true" data-percent-rain className="pr-layer pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <style href="afvar-percent-rain" precedence="default">
        {RAIN_CSS}
      </style>
      {Array.from({ length: POOL }, (_, i) => (
        <span
          key={i}
          className="pr-drop"
          ref={(el) => {
            dropRefs.current[i] = el;
          }}
        />
      ))}
    </div>
  );
}
