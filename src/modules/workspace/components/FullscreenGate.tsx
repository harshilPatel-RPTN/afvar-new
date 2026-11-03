"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useFullscreen } from "@/platform/hooks";
import { LaunchCard } from "./LaunchCard";
import { LiveNebula } from "./LiveNebula";

/**
 * AFVAR pages are only shown in full screen. Until the browser is in full
 * screen this renders the launch card instead of `children`; moving between
 * gated pages in-app keeps full screen, so the card only appears on a fresh
 * load or after leaving full screen. Browsers with no Fullscreen API at all
 * (e.g. iPhone Safari) see the page directly.
 */
const noopSubscribe = () => () => {};

export function FullscreenGate({
  children,
  withBackground = false,
}: {
  children: ReactNode;
  /** Render the lock screen's nebula behind the card (for pages that don't mount their own). */
  withBackground?: boolean;
}) {
  const { isFullscreen, isSupported, enter } = useFullscreen();
  const [requestFailed, setRequestFailed] = useState(false);
  const gated = isSupported && !isFullscreen;
  // False on the server and during hydration, true after: until then the page also ships hidden
  // behind the card, so with JavaScript off the layout's <noscript> CSS can show it instead.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const open = async () => setRequestFailed(!(await enter()));

  // Enter counts as a user gesture, so it may request full screen.
  useEffect(() => {
    if (!gated) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat || event.defaultPrevented) return;
      if (event.target instanceof Element && event.target.closest("a[href], button")) return;
      event.preventDefault();
      void open();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gated]);

  if (!gated) return <>{children}</>;
  return (
    <>
      <div data-fullscreen-gate="" className="relative min-h-svh overflow-hidden">
        {withBackground && <LiveNebula />}
        <main id="main" tabIndex={-1} className="relative z-10 grid min-h-svh place-items-center px-4 focus:outline-none">
          <LaunchCard isSupported={isSupported} requestFailed={requestFailed} onOpen={() => void open()} />
        </main>
      </div>
      {!hydrated && (
        <div data-fullscreen-gate-page="" hidden>
          {children}
        </div>
      )}
    </>
  );
}
