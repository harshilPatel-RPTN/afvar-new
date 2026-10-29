"use client";

import { useEffect, useRef } from "react";
import { playSfx } from "./sfx";

/** Things a click should stay "clean" on — real controls never spawn a burst. */
const IGNORE =
  'a,button,input,textarea,select,option,label,summary,video,audio,iframe,[contenteditable],[role=button],[role=option],[role=tab],[role=link],[role=slider],[role=switch],[role=checkbox],[role=radio],[role=menuitem],[role=listbox],[role=combobox],[tabindex]:not([tabindex="-1"]),[data-no-burst]';
const POOL = 30; // 3 bursts in flight × 10 candles
const PER = 10;
const GAP_MS = 250;
const DUR = 650;

/**
 * Tiny candle firework: a click/tap on plain page surface below the hero sends
 * 10 mini candles (green/red body + wick) flying radially out of the point with a
 * touch of gravity, fading in ~650ms. Pooled DOM nodes inside a fixed, clipped,
 * pointer-events-none layer (no layout, no overflow), WAAPI transform/opacity
 * only, zero React state per click. Max one burst / 250ms. Off under reduced motion.
 * Listens on its parent (the `data-candle-trail` post-hero wrapper).
 */
export function ClickBurst() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const host = layer?.parentElement;
    if (!layer || !host) return;
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    const nodes: HTMLSpanElement[] = [];
    for (let i = 0; i < POOL; i++) {
      const c = document.createElement("span");
      c.className = "cb-c";
      if (i % 2 === 0) c.setAttribute("data-up", "");
      c.innerHTML = '<i class="cb-w"></i><i class="cb-b"></i>';
      layer.appendChild(c);
      nodes.push(c);
    }
    let cursor = 0;
    let lastAt = -1e9;

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || mq?.matches) return;
      const t = e.target as Element | null;
      if (!t || t.closest(IGNORE)) return;
      if (window.getSelection?.()?.toString()) return; // finishing a text selection
      const now = performance.now();
      if (now - lastAt < GAP_MS) return;
      lastAt = now;
      const { clientX: x, clientY: y } = e;
      const spin = Math.random() * Math.PI * 2;
      for (let i = 0; i < PER; i++) {
        const n = nodes[cursor];
        cursor = (cursor + 1) % POOL;
        const a = spin + (i / PER) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const r = 46 + Math.random() * 34;
        const dx = Math.cos(a) * r;
        const dy = Math.sin(a) * r;
        const g = 26 + Math.random() * 10; // gravity drop by the end
        const rot = (a * 180) / Math.PI + 90; // candle points along its flight
        const s = 0.75 + Math.random() * 0.45;
        n.getAnimations().forEach((an) => an.cancel());
        const at = (k: number, op: number) => ({
          transform: `translate(${(x + dx * k).toFixed(1)}px,${(y + dy * k + g * k * k).toFixed(1)}px) rotate(${(rot + 40 * k).toFixed(0)}deg) scale(${(s * (1 - 0.35 * k)).toFixed(2)})`,
          opacity: op,
        });
        n.animate([{ ...at(0, 0), offset: 0 }, { ...at(0.12, 1), offset: 0.08 }, { ...at(0.62, 1), offset: 0.45 }, { ...at(1, 0), offset: 1 }], {
          duration: DUR + Math.random() * 80,
          easing: "cubic-bezier(.2,.7,.35,1)",
          fill: "both",
        });
      }
      playSfx("pop");
    };

    host.addEventListener("click", onClick);
    return () => {
      host.removeEventListener("click", onClick);
      nodes.forEach((n) => n.remove());
    };
  }, []);

  return (
    <>
      <style href="afvar-click-burst" precedence="default">
        {[
          ".cb-layer{position:fixed;inset:0;overflow:clip;pointer-events:none;z-index:60;contain:strict}",
          // anchored at the layer origin; centred on its translate point via negative margins
          ".cb-c{position:absolute;left:0;top:0;width:6px;height:16px;margin:-8px 0 0 -3px;opacity:0;will-change:transform,opacity;--k:#FF3B3B}",
          ".cb-c[data-up]{--k:#00E676}",
          ".cb-w{position:absolute;left:2.5px;top:0;width:1px;height:16px;background:var(--k);opacity:.7}",
          ".cb-b{position:absolute;left:0;top:4px;width:6px;height:8px;border-radius:1px;background:var(--k);box-shadow:0 0 6px var(--k)}",
          "@media (prefers-reduced-motion:reduce){.cb-layer{display:none}}",
        ].join("")}
      </style>
      <div ref={layerRef} className="cb-layer" aria-hidden="true" />
    </>
  );
}
