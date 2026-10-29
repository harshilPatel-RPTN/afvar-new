"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSyncExternalStore } from "react";
import { useT } from "@/platform/i18n";

const STORAGE_KEY = "afvar.mk.prelaunchDismissed";
const listeners = new Set<() => void>();

function readDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Fallback for browsers where sessionStorage throws: dismissal still holds for this page view.
let memoryDismissed = false;

function dismiss() {
  memoryDismissed = true;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* storage blocked — the in-memory flag is enough for this visit */
  }
  listeners.forEach((l) => l());
}

/**
 * Thin glass strip that floats just under the fixed navbar, over the hero.
 * The × hides it for the rest of the browser session.
 */
export function PrelaunchBanner() {
  const { t } = useT();
  const dismissed = useSyncExternalStore(
    subscribe,
    () => memoryDismissed || readDismissed(),
    () => false,
  );

  return (
    <div className="pointer-events-none relative z-40 h-0">
      <div className="absolute inset-x-0 top-[76px] px-4 sm:px-6 lg:px-8">
        <AnimatePresence>
          {!dismissed && (
            <motion.div
              key="mk-prelaunch"
              className="mx-auto max-w-7xl overflow-hidden"
              // Enters just after the navbar settles. Opacity + transform only: the strip is
              // absolutely positioned inside an h-0 wrapper, so its height never affects layout.
              // Same initial on server and client; MotionConfig neutralises the y under reduced motion.
              initial={{ opacity: 0, y: -10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] },
              }}
              exit={{
                opacity: 0,
                y: -6,
                transition: { duration: 0.34, ease: [0.4, 0, 0.2, 1] },
              }}
            >
              <aside
                aria-label={t("mk.shell.prelaunchLabel")}
                className="pointer-events-auto flex min-h-10 items-center gap-3 rounded-xl border border-white/10 bg-[#111312] py-1 pl-4 pr-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_-12px_rgba(0,0,0,0.8)]"
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full bg-(--mk-accent) shadow-[0_0_8px_var(--mk-accent)] motion-safe:animate-pulse"
                />
                <p className="min-w-0 flex-1 py-1.5 text-[12px] leading-snug text-(--mk-text) sm:text-[13px]">
                  <span className="sr-only">
                    {t("mk.shell.prelaunchLabel")}:{" "}
                  </span>
                  {t("mk.shell.prelaunch")}
                </p>
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label={t("mk.shell.dismiss")}
                  className="-my-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-(--mk-dim) transition-colors hover:text-(--mk-text) focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-(--mk-primary) motion-reduce:transition-none"
                >
                  <svg
                    viewBox="0 0 16 16"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 4l8 8M12 4l-8 8"
                      stroke="currentColor"
                      strokeWidth={1.7}
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
