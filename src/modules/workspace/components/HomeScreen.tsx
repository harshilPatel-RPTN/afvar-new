"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { consumeFreshUnlock, useLockStore } from "@/modules/auth";
import { useFullscreen } from "@/platform/hooks";
import { useBlockHistoryShortcuts } from "@/platform/keyboard";
import { LaunchCard } from "./LaunchCard";
import { LiveNebula } from "./LiveNebula";
import { LockScreen } from "./LockScreen";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The in-browser OS. Strict full-screen gate: nothing past the launch card is
 * shown unless the browser is in full screen (only a browser with no
 * Fullscreen API at all may open it windowed).
 *
 * Like a PC, the OS is locked on every arrival — reload, new tab, coming back
 * from another page — and whenever full screen is left. The one exception is
 * right after a password sign-in or registration, so the PIN isn't asked twice.
 * There is no desktop and no app page behind it for now: once unlocked
 * (correct PIN or that fresh sign-in) the lock screen stays and shows Unlocked.
 */

export function HomeScreen() {
  const { isFullscreen, isSupported, enter, exit } = useFullscreen();
  const [openedWithoutFullscreen, setOpenedWithoutFullscreen] = useState(false);
  const [requestFailed, setRequestFailed] = useState(false);
  const unlocked = isSupported ? isFullscreen : openedWithoutFullscreen;
  const lock = useLockStore((state) => state.lock);
  // No Back/Forward on the launch card or the lock screen.
  useBlockHistoryShortcuts(true);

  // Every arrival starts locked, except straight after a password sign-in.
  // Decided once per mount: React's dev double-run of effects must not spend
  // the one-time fresh unlock and then lock anyway.
  const arrivalDecided = useRef(false);
  useEffect(() => {
    if (arrivalDecided.current) return;
    arrivalDecided.current = true;
    if (!consumeFreshUnlock()) useLockStore.getState().lock();
  }, []);

  // Leaving full screen locks, like closing a laptop lid.
  const wasFullscreen = useRef(false);
  useEffect(() => {
    if (wasFullscreen.current && !isFullscreen) lock();
    wasFullscreen.current = isFullscreen;
  }, [isFullscreen, lock]);

  const open = async () => {
    if (!isSupported) {
      setOpenedWithoutFullscreen(true);
      return;
    }
    setRequestFailed(!(await enter()));
  };

  // Enter counts as a user gesture, so it may request full screen.
  useEffect(() => {
    if (unlocked) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat) return;
      event.preventDefault();
      void open();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, isSupported]);

  const leave = () => {
    lock();
    if (isFullscreen) void exit();
    else setOpenedWithoutFullscreen(false);
  };

  return (
    <div className="relative min-h-svh overflow-hidden">
      <LiveNebula dimmed={!unlocked} />
      <AnimatePresence mode="wait">
        {unlocked ? (
          <motion.div
            key="lock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <LockScreen onLock={leave} />
          </motion.div>
        ) : (
          <motion.main
            key="gate"
            className="relative z-10 grid min-h-svh place-items-center px-4"
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <LaunchCard
              isSupported={isSupported}
              requestFailed={requestFailed}
              onOpen={() => void open()}
            />
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
