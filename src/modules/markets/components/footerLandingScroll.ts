"use client";

import { useMotionValue, type MotionValue } from "framer-motion";
import { useEffect, type RefObject } from "react";

/** Scroll progress of an element without per-scroll layout reads (framer's useScroll re-measures the
 *  target on every scroll; under the footer logo flight that forced a style/layout pass per frame).
 *  The element's page box is measured on mount, resize and when the page above changes height;
 *  each scroll only reads scrollY. `span: "enter"` = start end → end end, `"pass"` = start end → end start. */
export function useCachedScrollProgress(ref: RefObject<HTMLElement | null>, span: "enter" | "pass"): MotionValue<number> {
  const progress = useMotionValue(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let top = 0;
    let h = 1;
    let vh = window.innerHeight;
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = (window.scrollY + vh - top) / (span === "enter" ? h : h + vh);
      progress.set(p < 0 ? 0 : p > 1 ? 1 : p);
    };
    const measure = () => {
      const r = el.getBoundingClientRect();
      top = r.top + window.scrollY;
      h = Math.max(1, r.height);
      vh = window.innerHeight;
      update();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    ro.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [ref, span, progress]);
  return progress;
}
