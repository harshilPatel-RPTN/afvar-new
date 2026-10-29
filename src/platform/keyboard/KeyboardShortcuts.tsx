"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import { useT } from "../i18n";
import { Modal } from "../ui/Modal";
import { SHORTCUTS, historyShortcut, isHelpShortcut, isMacPlatform, isNativeHistoryKey, isTypingTarget } from "./shortcuts";

interface ShortcutsPanelState {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Screens that switch Back/Forward off (e.g. the lock screen); off while any is mounted. */
  historyBlockers: number;
}

/** Whether the keyboard-shortcuts panel is open; any component may open it. */
export const useShortcutsPanel = create<ShortcutsPanelState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  historyBlockers: 0,
}));

/** The browser Navigation API (Chromium), used to see whether a forward entry exists. */
type WindowWithNavigation = Window & { navigation?: { canGoForward?: boolean } };

/**
 * Drops every "forward" history entry by pushing a copy of the current one —
 * the only way a page can make the browser's Forward button go nowhere.
 * Only acts when the Navigation API reports a forward entry, so it never
 * adds a needless entry; browsers without that API are left alone.
 */
function dropForwardHistory() {
  if (!(window as WindowWithNavigation).navigation?.canGoForward) return;
  window.history.pushState(window.history.state, "", window.location.href);
}

/**
 * Switches history navigation off while `blocked` is true and the calling
 * component is mounted — the lock screen uses it so nothing can step past the
 * PIN: the Back/Forward shortcuts and the browser's own history keys are
 * swallowed, and any forward history is dropped so Forward goes nowhere.
 */
export function useBlockHistoryShortcuts(blocked: boolean) {
  useEffect(() => {
    if (!blocked) return;
    dropForwardHistory();
    useShortcutsPanel.setState((state) => ({ historyBlockers: state.historyBlockers + 1 }));
    return () => useShortcutsPanel.setState((state) => ({ historyBlockers: Math.max(0, state.historyBlockers - 1) }));
  }, [blocked]);
}

/** Owner token so a second mounted copy never adds a duplicate listener. */
let listenerOwner: symbol | null = null;

/**
 * Global history shortcuts, mounted once in the app providers:
 * Back = Alt+← (Windows/Linux) or ⌘+← (macOS); Forward = Alt+→ or ⌘+→.
 * Switched off wherever `useBlockHistoryShortcuts(true)` is active (the lock screen).
 * They walk real browser history through the Next.js router — never a
 * hardcoded route. Ignored while typing, so text editing keeps its native keys.
 * Also opens the shortcuts panel on `?`.
 */
export function GlobalKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const owner = Symbol("keyboard-shortcuts");
    if (listenerOwner) return;
    listenerOwner = owner;
    const mac = isMacPlatform();

    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      // Locked: swallow every browser history key first — even in the focused PIN field.
      if (useShortcutsPanel.getState().historyBlockers > 0 && isNativeHistoryKey(event)) {
        event.preventDefault();
        return;
      }
      if (isTypingTarget(event.target)) return;
      const direction = historyShortcut(event, mac);
      if (direction) {
        // Handle it ourselves and stop the browser doing the same, so a page never moves twice.
        event.preventDefault();
        // Blocked (lock screen): swallow the keys so not even the browser navigates.
        if (event.repeat || useShortcutsPanel.getState().historyBlockers > 0) return;
        if (direction === "back") router.back();
        else router.forward();
        return;
      }
      if (isHelpShortcut(event) && !event.repeat) {
        event.preventDefault();
        useShortcutsPanel.getState().setOpen(true);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (listenerOwner === owner) listenerOwner = null;
    };
  }, [router]);

  return <KeyboardShortcutsPanel />;
}

function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((key) => (
        <kbd key={key} className="inline-grid h-6 min-w-6 place-items-center rounded-md border border-white/15 bg-white/[.07] px-1.5 font-sans text-[11px] font-medium text-white/85 shadow-[inset_0_-1px_0_rgba(255,255,255,.08)]">
          {key}
        </kbd>
      ))}
    </span>
  );
}

/** The keyboard-shortcuts help panel, showing the keys for the visitor's OS. */
export function KeyboardShortcutsPanel() {
  const { t } = useT();
  const open = useShortcutsPanel((state) => state.open);
  const historyBlocked = useShortcutsPanel((state) => state.historyBlockers > 0);
  const setOpen = useShortcutsPanel((state) => state.setOpen);
  // The panel only renders once opened in the browser, so the OS is known here.
  const mac = open && isMacPlatform();

  return (
    <Modal open={open} onClose={() => setOpen(false)} title={t("shortcuts.title")}>
      <ul className="flex flex-col divide-y divide-white/[.06]">
        {SHORTCUTS.filter((shortcut) => !historyBlocked || (shortcut.id !== "back" && shortcut.id !== "forward")).map((shortcut) => (
          <li key={shortcut.id} className="flex items-center justify-between gap-4 py-2.5 text-[13px]">
            <span className="text-white/85">{t(shortcut.labelKey)}</span>
            <Keys keys={mac ? shortcut.mac : shortcut.other} />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11.5px] leading-relaxed text-white/50">{t("shortcuts.typingNote")}</p>
    </Modal>
  );
}
