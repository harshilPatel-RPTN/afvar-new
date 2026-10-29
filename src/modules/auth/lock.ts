import { create } from "zustand";
import { readStorage, writeStorage } from "@/platform/storage";

/**
 * App lock, like a banking app: even with a valid session, a new tab (or a
 * return after a while away) shows the lock screen until the PIN is entered.
 * The unlock lives in sessionStorage, so it never outlives the tab.
 */
const UNLOCK_KEY = "afwar.unlocked";

/** Lock again after the tab has been hidden this long. */
export const AUTO_LOCK_AFTER_MS = 5 * 60_000;

function readUnlocked(): string | null {
  return readStorage(UNLOCK_KEY, "session");
}

interface LockState {
  /** User id this tab is unlocked for, or null when locked. */
  unlockedFor: string | null;
  unlock: (userId: string) => void;
  lock: () => void;
}

export const useLockStore = create<LockState>((set) => ({
  unlockedFor: readUnlocked(),
  unlock: (userId) => {
    writeStorage(UNLOCK_KEY, userId, "session");
    set({ unlockedFor: userId });
  },
  lock: () => {
    writeStorage(UNLOCK_KEY, null, "session");
    set({ unlockedFor: null });
  },
}));

export function isUnlocked(userId: string | undefined) {
  return !!userId && useLockStore.getState().unlockedFor === userId;
}

/**
 * Set when a password sign-in has just unlocked this tab, so arriving on the
 * OS right afterwards doesn't ask for the PIN a second time. Kept in memory
 * only: a reload or a new tab always starts locked.
 */
let freshUnlock = false;

export function markFreshUnlock() {
  freshUnlock = true;
}

/** True once after a password sign-in; every other arrival on the OS locks. */
export function consumeFreshUnlock() {
  const fresh = freshUnlock;
  freshUnlock = false;
  return fresh;
}

/** Ctrl+Shift+L on Windows/Linux, ⌘+Shift+L on macOS. */
export function isLockShortcut(event: KeyboardEvent) {
  return (event.ctrlKey || event.metaKey) && event.shiftKey && !event.altKey && event.code === "KeyL";
}
