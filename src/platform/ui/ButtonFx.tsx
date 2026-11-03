"use client";

import { useEffect, useRef } from "react";
import "./button-fx.css";

/*
 * Site-wide buttons: on mouse hover a green light runs round the button's border
 * and a shine sweeps across it once; its trailing arrow slides forward and a press
 * squishes it (CSS). The beam and shine live in one fixed layer laid over the
 * hovered button, so nothing inside the buttons changes.
 */

/** A visible, button-shaped control (filled or outlined, rounded, button-sized). */
function isButtonLike(el: HTMLElement): boolean {
  if (el.closest("[data-avatar-dock], [data-no-magnetic], canvas, iframe")) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 24 || r.height < 24 || r.height > 84 || r.width > 520) return false;
  const cs = getComputedStyle(el);
  if (parseFloat(cs.borderTopLeftRadius) < 8) return false;
  const filled = cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent";
  const outlined = parseFloat(cs.borderTopWidth) > 0 && !cs.borderTopColor.endsWith(", 0)");
  return filled || outlined || cs.backgroundImage !== "none";
}

export function ButtonFx() {
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = layer.current;
    const root = document.body;
    if (!host) return;
    const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.reduceMotion === "true";
    const box = host.querySelector<HTMLDivElement>("[data-mb-box]")!;
    const cache = new WeakMap<HTMLElement, boolean>();
    let current: HTMLElement | null = null;

    const pick = (target: EventTarget | null) => {
      const el = (target as Element | null)?.closest?.<HTMLElement>("a, button");
      if (!el || !root.contains(el)) return null;
      let ok = cache.get(el);
      if (ok === undefined) {
        ok = isButtonLike(el);
        cache.set(el, ok);
      }
      return ok ? el : null;
    };
    let raf = 0;
    const leave = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (!current) return;
      current.removeAttribute("data-mb-hover");
      box.dataset.on = "false";
      current = null;
    };
    // Keep the beam glued to the hovered button every frame, so it follows when the
    // button itself moves (menu cards swapping, carousels, sticky sections).
    const follow = () => {
      const el = current;
      if (!el) return;
      if (!el.isConnected) {
        leave();
        return;
      }
      const r = el.getBoundingClientRect();
      box.style.translate = `${r.left}px ${r.top}px`;
      box.style.width = `${r.width}px`;
      box.style.height = `${r.height}px`;
      raf = requestAnimationFrame(follow);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || reduce()) return;
      const el = pick(e.target);
      if (el === current) return;
      leave();
      if (!el) return;
      current = el;
      el.setAttribute("data-mb-hover", "");
      box.style.borderRadius = getComputedStyle(el).borderTopLeftRadius;
      follow();
      // Restart the shine on every new hover.
      box.dataset.on = "false";
      requestAnimationFrame(() => {
        if (current === el) box.dataset.on = "true";
      });
    };
    const onLeaveAll = () => leave();

    const opts = { passive: true } as const;
    document.addEventListener("pointermove", onMove, opts);
    document.addEventListener("pointerleave", onLeaveAll, opts);
    window.addEventListener("scroll", onLeaveAll, opts);
    window.addEventListener("blur", onLeaveAll);
    return () => {
      leave();
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeaveAll);
      window.removeEventListener("scroll", onLeaveAll);
      window.removeEventListener("blur", onLeaveAll);
    };
  }, []);

  return (
    <div ref={layer} className="mb-layer" aria-hidden="true">
      <div data-mb-box="" data-on="false" className="mb-box">
        <span className="mb-beam" />
        <span className="mb-shine" />
      </div>
    </div>
  );
}
