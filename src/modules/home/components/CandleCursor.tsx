"use client";

// Candle cursor trail — desktop fine pointers only. Moving the mouse over the
// page below the hero drops tiny candles along the path: up = green, down =
// red, sideways = doji. Each fades and sinks over ~600ms. A fixed pool of 8
// DOM nodes is reused; pointermove never touches React state — transforms and
// opacity are written straight to the nodes via the Web Animations API.
// Off on touch/coarse pointers, under reduced motion, over the hero, and over
// interactive elements (links, buttons, form fields).
import { useEffect, useRef } from "react";

const POOL = 8;
const SPAWN_DIST = 16; // px of travel between candles
const LIFE_MS = 600;
const SKIP = "a, button, input, textarea, select, label, [role='button'], [role='option'], [contenteditable='true']";

export function CandleCursor() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || typeof window === "undefined" || !layer.animate) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const nodes = Array.from(layer.children) as HTMLElement[];
    const anims: (Animation | null)[] = nodes.map(() => null);
    let next = 0;
    let last: { x: number; y: number } | null = null;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !fine.matches || reduce.matches) return;
      const target = e.target instanceof Element ? e.target : null;
      if (!target || !target.closest("[data-candle-trail]") || target.closest(SKIP)) {
        last = null;
        return;
      }
      if (!last) {
        last = { x: e.clientX, y: e.clientY };
        return;
      }
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      const dist = Math.hypot(dx, dy);
      if (dist < SPAWN_DIST) return;
      last = { x: e.clientX, y: e.clientY };

      // Screen-space: moving UP (negative dy) is a green candle.
      const slope = dy / dist;
      const kind = slope < -0.35 ? "up" : slope > 0.35 ? "down" : "doji";
      const h = kind === "doji" ? 2 : Math.round(10 + Math.min(1, Math.abs(dy) / 40) * 8);

      const node = nodes[next];
      anims[next]?.cancel();
      node.dataset.kind = kind;
      const body = node.firstElementChild as HTMLElement;
      body.style.height = `${h}px`;
      body.style.marginTop = `${-h / 2}px`;
      const x = e.clientX + 10;
      const y = e.clientY + 12;
      anims[next] = node.animate(
        [
          { transform: `translate3d(${x}px, ${y}px, 0) scale(1)`, opacity: 0.95 },
          { transform: `translate3d(${x}px, ${y + 14}px, 0) scale(.75)`, opacity: 0 },
        ],
        { duration: LIFE_MS, easing: "cubic-bezier(.33,0,.67,1)", fill: "forwards" },
      );
      next = (next + 1) % POOL;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      for (const anim of anims) anim?.cancel();
    };
  }, []);

  return (
    <div ref={layerRef} aria-hidden="true" data-candle-cursor className="pointer-events-none fixed inset-0 z-[25] overflow-hidden motion-reduce:hidden">
      {Array.from({ length: POOL }, (_, i) => (
        <span
          key={i}
          className="absolute left-0 top-0 block h-0 w-[6px] opacity-0 will-change-transform data-[kind=down]:[--c:#FF3B3B] data-[kind=doji]:[--c:#A3AAAC] data-[kind=up]:[--c:#00E676]"
        >
          {/* body (height set per spawn) + wick */}
          <span className="absolute left-0 top-0 block w-[6px] rounded-[1px] bg-(--c)" />
          <span className="absolute left-[2.5px] top-[-12px] block h-[24px] w-px bg-(--c) opacity-70" />
        </span>
      ))}
    </div>
  );
}
