"use client";

import { useEffect } from "react";

/**
 * Pauses CSS animations in every page block that is out of view: each child of
 * <main>, the closing and the footer get `data-offscreen` while hidden (the CSS
 * in afvarOs/theme pauses everything under it). Blocks added later are picked up.
 */
export function PauseOffscreen() {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.target.toggleAttribute("data-offscreen", !e.isIntersecting)), { rootMargin: "200px 0px" });
    const seen = new WeakSet<Element>();
    const scan = () => {
      document.querySelectorAll("[data-site-frame] > main > *, [data-site-frame] > [data-site-closing], [data-site-frame] > footer, [data-site-frame] footer").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    const main = document.querySelector("[data-site-frame] > main");
    if (main) mo.observe(main, { childList: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
