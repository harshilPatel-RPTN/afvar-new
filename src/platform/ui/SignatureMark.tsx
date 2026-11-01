"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import "./signature-home-link.css";

const dockURL = "/afvar-signature/dock.js";

export function SignatureMark({ landing = false, fallback = false }: { landing?: boolean; fallback?: boolean }) {
  const mark = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    const node = mark.current;
    if (!node) return;
    if (landing) node.dataset.afvarBrandReady = "true";
    if (fallback && document.querySelector("[data-afvar-brand-mark]")) return;
    const controller = new AbortController();
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & {
      connection?: EventTarget & { saveData?: boolean; effectiveType?: string };
    }).connection;
    let requested = false;
    const start = () => {
      if (requested || motion.matches || connection?.saveData ||
          ["slow-2g", "2g"].includes(connection?.effectiveType ?? "") ||
          document.querySelector("[data-afvar-splash]:not([hidden])")) return;
      requested = true;
      import(/* webpackIgnore: true */ dockURL).then(runtime => {
        if (!controller.signal.aborted) runtime.startDock(node, controller.signal);
      }).catch(() => { /* The server-rendered logo remains available. */ });
    };
    const options = {signal:controller.signal};
    window.addEventListener("afvar:opened", start, options);
    motion.addEventListener("change", start, options);
    connection?.addEventListener("change", start, options);
    start();
    return () => controller.abort();
  }, [fallback, landing, pathname]);
  return (
    <span ref={mark} className="afvar-header-symbol" data-afvar-brand-mark={landing ? "" : undefined}
      data-standby-mark-target={fallback ? "" : undefined}>
      <picture>
        <source media="(max-width: 600px)" srcSet="/afvar-signature/assets/approved-lite.webp" />
        <img src="/afvar-signature/assets/approved.webp" alt="" width="46" height="46" />
      </picture>
      <span data-dock-surface="" aria-hidden="true" />
    </span>
  );
}
