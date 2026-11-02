"use client";

import { useEffect, useRef, useState } from "react";
import { INTRO_SEEN, readStorage, setCookie, writeStorage } from "@/platform/storage";
import { SignatureCaption } from "./SignatureCaption";
import "./signature.css";

const runtimeURL = "/afvar-signature/flight.js";
// If cookies are blocked, apply the local visit preference before painting server HTML.
const hideSeenIntro = `try{if(localStorage.getItem("${INTRO_SEEN}")==="1")document.currentScript.parentElement.hidden=true}catch{}`;

export function SplashReveal({ previouslySeen = false }: { previouslySeen?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [finished, setFinished] = useState(previouslySeen);
  const skip = useRef<boolean | null>(null);

  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const controller = new AbortController();
    const finish = () => {
      if (controller.signal.aborted) return;
      host.hidden = true;
      controller.abort();
      setFinished(true);
      window.dispatchEvent(new Event("afvar:opened"));
    };

    // Decide once per mount, including when React re-runs this effect in development.
    // The cookie lets a repeat document render the page directly from the server.
    if (skip.current === null) {
      skip.current = readStorage(INTRO_SEEN) === "1";
      try { setCookie(INTRO_SEEN, "1", 365); } catch { /* Site data may be disabled. */ }
      writeStorage(INTRO_SEEN, "1");
    }
    if (skip.current) {
      queueMicrotask(finish);
      return () => controller.abort();
    }

    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const economical = connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType ?? "");
    // The timer also releases the actual page if the module, artwork or renderer fails.
    const deadline = window.setTimeout(finish, 12000);
    const startupDeadline = window.setTimeout(finish, 2800);
    const started = () => window.clearTimeout(startupDeadline);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || economical) {
      queueMicrotask(finish);
    } else {
      import(/* webpackIgnore: true */ runtimeURL)
        .then(runtime => {
          if (!controller.signal.aborted) return runtime.startFlight(host, controller.signal, finish, started);
        })
        .catch(finish);
    }
    // Consume scrolling on the overlay itself to avoid changing scrollbar
    // width or moving the real header before the handoff.
    const preventScroll = (event: Event) => event.preventDefault();
    host.addEventListener("wheel", preventScroll, { passive: false, signal: controller.signal });
    host.addEventListener("touchmove", preventScroll, { passive: false, signal: controller.signal });
    window.addEventListener("pagehide", finish, { signal: controller.signal });
    window.addEventListener("keydown", event => {
      if (["Escape", "Tab", " ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"].includes(event.key)) finish();
    }, { signal: controller.signal, capture: true });
    controller.signal.addEventListener("abort", () => { started(); window.clearTimeout(deadline); }, { once: true });
    return () => controller.abort();
  }, []);

  // The idle standby ("sleep mode") is switched off for good: nothing takes over the page after the splash.
  if (finished) return null;
  return (
    <div ref={root} className="afvar-flight-splash" data-afvar-splash="" data-phase="preparing" aria-hidden="true" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: hideSeenIntro }} />
      <noscript><style>{"[data-afvar-splash]{display:none!important}"}</style></noscript>
      <div className="afvar-flight-backdrop" data-signature-backdrop="" />
      <div className="afvar-flight-stage afvar-flight-poster" aria-hidden="true" />
      <div className="afvar-flight-stage" data-signature-stage="" />
      <SignatureCaption />
    </div>
  );
}
