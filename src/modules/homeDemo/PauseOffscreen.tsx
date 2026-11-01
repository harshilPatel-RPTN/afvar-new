"use client";

import { useEffect } from "react";

/**
 * Pauses CSS animations in every page block that is out of view: each child of
 * <main>, every section (nested ones too), the closing and the footer get `data-offscreen` while hidden (the CSS
 * in afvarOs/theme pauses everything under it). Blocks added later are picked up.
 */
export function PauseOffscreen() {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.target.toggleAttribute("data-offscreen", !e.isIntersecting)), { rootMargin: "200px 0px" });
    const seen = new WeakSet<Element>();
    const scan = () => {
      document.querySelectorAll("[data-site-frame] > main > *, [data-site-frame] section, [data-site-frame] > [data-site-closing], [data-site-frame] footer, [data-pause-offscreen]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    };
    scan();
    // Re-scan for new blocks at most every 600 ms (typing effects mutate the DOM constantly).
    let timer = 0;
    const mo = new MutationObserver(() => {
      if (!timer) timer = window.setTimeout(() => ((timer = 0), scan()), 600);
    });
    const main = document.querySelector("[data-site-frame] > main");
    if (main) mo.observe(main, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(timer);
    };
  }, []);
  return null;
}
