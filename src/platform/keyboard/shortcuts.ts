import type { MessageKey } from "../i18n";

/** Navigator with the (Chromium-only) User-Agent Client Hints API. */
type NavigatorWithUAData = Navigator & { userAgentData?: { platform?: string } };

/**
 * macOS or iOS/iPadOS? Prefers the User-Agent Client Hints platform, then the
 * legacy `navigator.platform`, then the user-agent string. False on the server.
 */
export function isMacPlatform(nav: Navigator | undefined = typeof navigator === "undefined" ? undefined : navigator): boolean {
  if (!nav) return false;
  const platform = (nav as NavigatorWithUAData).userAgentData?.platform || nav.platform || nav.userAgent || "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/**
 * True when the key event belongs to text entry, so global shortcuts must not
 * fire — e.g. ⌘+← moves the caret to the start of the line inside a field.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== "function") return false;
  const element = target as HTMLElement;
  if (element.isContentEditable) return true;
  return !!element.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])");
}

export type HistoryDirection = "back" | "forward";

/**
 * The history shortcut this event triggers on this OS, if any:
 * Alt + ←/→ on Windows and Linux, ⌘ + ←/→ on macOS. Only the OS's own
 * combination matches, so the other one keeps its native meaning.
 */
export function historyShortcut(event: KeyboardEvent, mac: boolean): HistoryDirection | null {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return null;
  if (event.shiftKey || event.ctrlKey) return null;
  const modifier = mac ? event.metaKey && !event.altKey : event.altKey && !event.metaKey;
  if (!modifier) return null;
  return event.key === "ArrowLeft" ? "back" : "forward";
}

/**
 * Any key combination a browser itself uses for history, on any OS: Alt/⌘ +
 * ←/→, ⌘ + [ / ], and the dedicated Back/Forward keys. Swallowed while
 * history is blocked (the lock screen), even inside the PIN field.
 */
export function isNativeHistoryKey(event: KeyboardEvent): boolean {
  if (event.key === "BrowserBack" || event.key === "BrowserForward") return true;
  const arrow = event.key === "ArrowLeft" || event.key === "ArrowRight";
  if (arrow && (event.altKey || event.metaKey)) return true;
  const bracket = event.code === "BracketLeft" || event.code === "BracketRight" || event.key === "[" || event.key === "]";
  return bracket && event.metaKey;
}

/** `?` (Shift + /) opens the keyboard-shortcuts panel. */
export function isHelpShortcut(event: KeyboardEvent) {
  return event.key === "?" && !event.ctrlKey && !event.metaKey && !event.altKey;
}

export interface ShortcutDoc {
  id: "lock" | "back" | "forward" | "help";
  labelKey: MessageKey;
  mac: string[];
  other: string[];
}

/** Everything the keyboard-shortcuts panel documents, per OS. */
export const SHORTCUTS: ShortcutDoc[] = [
  { id: "back", labelKey: "shortcuts.back", mac: ["⌘", "←"], other: ["Alt", "←"] },
  { id: "forward", labelKey: "shortcuts.forward", mac: ["⌘", "→"], other: ["Alt", "→"] },
  { id: "lock", labelKey: "shortcuts.lock", mac: ["⌘", "⇧", "L"], other: ["Ctrl", "Shift", "L"] },
  { id: "help", labelKey: "shortcuts.help", mac: ["?"], other: ["?"] },
];
