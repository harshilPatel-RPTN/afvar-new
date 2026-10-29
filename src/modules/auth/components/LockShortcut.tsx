"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isLockShortcut, useLockStore } from "../lock";
import { useAuthStore } from "../store";

/**
 * Global Ctrl+Shift+L (⌘+Shift+L on macOS): lock AFVAR from any page. On the
 * OS (`/`) it locks in place, like a PC; anywhere else it opens the lock
 * screen. A correct PIN then goes to /markets (see LockScreen `AFTER_UNLOCK`).
 */
export function LockShortcut() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!isLockShortcut(event) || event.repeat) return;
      const { user, status } = useAuthStore.getState();
      if (status !== "authenticated" || !user) return;
      event.preventDefault();
      useLockStore.getState().lock();
      // `replace`: the PIN then replaces `/` with /markets, so Back never lands on the lock screen.
      if (pathname !== "/") router.replace("/");
    };
    // Capture phase, so a focused input or a page's own handler can't swallow it.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [pathname, router]);

  return null;
}
