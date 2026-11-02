"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { SignatureMark } from "@/platform/ui/SignatureMark";
import { SignatureCaption } from "./SignatureCaption";
import "./standby.css";

const runtimeURL = "/afvar-signature/standby.js";
const inputEvents = ["pointermove", "pointerdown", "pointerup", "touchstart", "touchmove",
  "keydown", "keyup", "wheel", "scroll", "input", "focusin", "popstate", "hashchange"];

/** Mounted only once the initial splash has handed the real site back to the user. */
export function SignatureStandby() {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const controller = new AbortController();
    let lastActivity = performance.now();
    let wake: ((event: Event) => void) | undefined;
    const activity = (event: Event) => { lastActivity = performance.now(); wake?.(event); };
    const options = { capture: true, passive: true, signal: controller.signal };
    // Count genuine interactions during the initial runtime download as well.
    for (const type of inputEvents) window.addEventListener(type, activity, options);
    // While the AFVAR avatar chat is open the visitor is talking or listening, not idle:
    // keep counting that time as activity so standby never covers the conversation.
    const avatarOpen = () => document.querySelector('[data-avatar-dock] button[aria-expanded="true"]') !== null;
    const lastActive = () => {
      if (avatarOpen()) lastActivity = performance.now();
      return lastActivity;
    };
    import(/* webpackIgnore: true */ runtimeURL).then(runtime => {
      if (!controller.signal.aborted) wake = runtime.startStandby(host, controller.signal, lastActive);
    }).catch(() => { host.dataset.phase = "armed"; });
    return () => controller.abort();
  }, [pathname]);

  return (
    <div ref={root} className="afvar-standby-shell" data-afvar-standby="" data-phase="armed" aria-hidden="true">
      <div className="afvar-standby-backdrop" data-standby-backdrop="" />
      <div className="afvar-standby-brand">
        <div className="afvar-flight-stage" data-signature-stage="">
          <picture className="afvar-standby-still">
            <source media="(max-width:600px)" srcSet="/afvar-signature/assets/approved-lite.webp" />
            <Image unoptimized loading="eager" src="/afvar-signature/assets/approved.webp" width={640} height={640} alt="" />
          </picture>
        </div>
        <SignatureCaption />
      </div>
      <div className="afvar-standby-fallback">
        <SignatureMark fallback />
        <Image unoptimized src="/afvar-signature/golden-reveal/afvar-wordmark-dock.webp" width={1009} height={150} alt="" data-standby-name-target="" />
      </div>
    </div>
  );
}
