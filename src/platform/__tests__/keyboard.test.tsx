import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = { back: vi.fn(), forward: vi.fn(), push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

import {
  GlobalKeyboardShortcuts,
  KeyboardShortcutsPanel,
  historyShortcut,
  isMacPlatform,
  isTypingTarget,
  useBlockHistoryShortcuts,
  useShortcutsPanel,
} from "../keyboard";

function HistoryBlocker({ blocked }: { blocked: boolean }) {
  useBlockHistoryShortcuts(blocked);
  return null;
}

const key = (init: KeyboardEventInit) => new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
const nav = (fields: Record<string, unknown>) => fields as unknown as Navigator;

describe("isMacPlatform", () => {
  it("prefers User-Agent Client Hints, then navigator.platform, then the user agent", () => {
    expect(isMacPlatform(nav({ userAgentData: { platform: "macOS" }, platform: "Win32" }))).toBe(true);
    expect(isMacPlatform(nav({ userAgentData: { platform: "Windows" }, platform: "MacIntel" }))).toBe(false);
    expect(isMacPlatform(nav({ platform: "MacIntel" }))).toBe(true);
    expect(isMacPlatform(nav({ platform: "Linux x86_64" }))).toBe(false);
    expect(isMacPlatform(nav({ platform: "", userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)" }))).toBe(true);
    expect(isMacPlatform(undefined)).toBe(false);
  });
});

describe("historyShortcut", () => {
  it("uses Alt + arrows on Windows and Linux", () => {
    expect(historyShortcut(key({ key: "ArrowLeft", altKey: true }), false)).toBe("back");
    expect(historyShortcut(key({ key: "ArrowRight", altKey: true }), false)).toBe("forward");
    expect(historyShortcut(key({ key: "ArrowLeft", metaKey: true }), false)).toBeNull();
  });

  it("uses ⌘ + arrows on macOS and leaves Alt + arrows alone", () => {
    expect(historyShortcut(key({ key: "ArrowLeft", metaKey: true }), true)).toBe("back");
    expect(historyShortcut(key({ key: "ArrowRight", metaKey: true }), true)).toBe("forward");
    expect(historyShortcut(key({ key: "ArrowLeft", altKey: true }), true)).toBeNull();
  });

  it("ignores extra modifiers and other keys", () => {
    expect(historyShortcut(key({ key: "ArrowLeft", altKey: true, shiftKey: true }), false)).toBeNull();
    expect(historyShortcut(key({ key: "ArrowLeft", altKey: true, ctrlKey: true }), false)).toBeNull();
    expect(historyShortcut(key({ key: "ArrowUp", altKey: true }), false)).toBeNull();
    expect(historyShortcut(key({ key: "ArrowLeft" }), false)).toBeNull();
  });
});

describe("isTypingTarget", () => {
  it("recognises inputs, textareas, selects and content-editable elements", () => {
    document.body.innerHTML = `<input id="i"><textarea id="t"></textarea><select id="s"></select><div contenteditable="true"><span id="c">x</span></div><button id="b"></button>`;
    for (const id of ["i", "t", "s", "c"]) expect(isTypingTarget(document.getElementById(id)), id).toBe(true);
    expect(isTypingTarget(document.getElementById("b"))).toBe(false);
    expect(isTypingTarget(window)).toBe(false);
  });
});

describe("GlobalKeyboardShortcuts", () => {
  beforeEach(() => {
    Object.values(router).forEach((fn) => fn.mockClear());
    Object.defineProperty(navigator, "platform", { value: "Win32", configurable: true });
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    useShortcutsPanel.setState({ open: false, historyBlockers: 0 });
  });

  it("walks browser history through the router and stops the browser's own handling", () => {
    render(<GlobalKeyboardShortcuts />);
    const back = key({ key: "ArrowLeft", altKey: true });
    act(() => void window.dispatchEvent(back));
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(back.defaultPrevented).toBe(true);

    act(() => void window.dispatchEvent(key({ key: "ArrowRight", altKey: true })));
    expect(router.forward).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("does nothing while typing, and keeps the native key behaviour there", () => {
    render(<GlobalKeyboardShortcuts />);
    const input = document.createElement("input");
    document.body.appendChild(input);
    const event = key({ key: "ArrowLeft", altKey: true });
    act(() => void input.dispatchEvent(event));
    expect(router.back).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("never registers a duplicate listener when mounted twice", () => {
    render(
      <>
        <GlobalKeyboardShortcuts />
        <GlobalKeyboardShortcuts />
      </>,
    );
    act(() => void window.dispatchEvent(key({ key: "ArrowLeft", altKey: true })));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("ignores key repeats and events another handler already took", () => {
    render(<GlobalKeyboardShortcuts />);
    act(() => void window.dispatchEvent(key({ key: "ArrowLeft", altKey: true, repeat: true })));
    const taken = key({ key: "ArrowLeft", altKey: true });
    taken.preventDefault();
    act(() => void window.dispatchEvent(taken));
    expect(router.back).not.toHaveBeenCalled();
  });

  it("opens the shortcuts panel on ?", () => {
    render(<GlobalKeyboardShortcuts />);
    act(() => void window.dispatchEvent(key({ key: "?", shiftKey: true })));
    expect(useShortcutsPanel.getState().open).toBe(true);
  });
});

describe("useBlockHistoryShortcuts", () => {
  beforeEach(() => {
    Object.values(router).forEach((fn) => fn.mockClear());
    Object.defineProperty(navigator, "platform", { value: "Win32", configurable: true });
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    useShortcutsPanel.setState({ open: false, historyBlockers: 0 });
  });

  const press = (init: KeyboardEventInit) => {
    const event = key(init);
    act(() => void window.dispatchEvent(event));
    return event;
  };

  it("swallows Back/Forward while blocked: no router call, and the browser's own navigation is prevented", () => {
    render(
      <>
        <GlobalKeyboardShortcuts />
        <HistoryBlocker blocked />
      </>,
    );
    expect(useShortcutsPanel.getState().historyBlockers).toBe(1);
    const back = press({ key: "ArrowLeft", altKey: true });
    const forward = press({ key: "ArrowRight", altKey: true });
    expect(router.back).not.toHaveBeenCalled();
    expect(router.forward).not.toHaveBeenCalled();
    expect(back.defaultPrevented).toBe(true);
    expect(forward.defaultPrevented).toBe(true);
  });

  it("blocks the ⌘ + arrow shortcuts on macOS too", () => {
    Object.defineProperty(navigator, "platform", { value: "MacIntel", configurable: true });
    render(
      <>
        <GlobalKeyboardShortcuts />
        <HistoryBlocker blocked />
      </>,
    );
    const back = press({ key: "ArrowLeft", metaKey: true });
    const forward = press({ key: "ArrowRight", metaKey: true });
    expect(router.back).not.toHaveBeenCalled();
    expect(router.forward).not.toHaveBeenCalled();
    expect(back.defaultPrevented).toBe(true);
    expect(forward.defaultPrevented).toBe(true);
  });

  it("restores the shortcuts once the blocker unmounts", () => {
    const { rerender } = render(
      <>
        <GlobalKeyboardShortcuts />
        <HistoryBlocker blocked />
      </>,
    );
    press({ key: "ArrowLeft", altKey: true });
    expect(router.back).not.toHaveBeenCalled();

    rerender(<GlobalKeyboardShortcuts />);
    expect(useShortcutsPanel.getState().historyBlockers).toBe(0);
    press({ key: "ArrowLeft", altKey: true });
    press({ key: "ArrowRight", altKey: true });
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.forward).toHaveBeenCalledTimes(1);
  });

  it("follows the blocked flag as it flips on and off", () => {
    const { rerender } = render(
      <>
        <GlobalKeyboardShortcuts />
        <HistoryBlocker blocked={false} />
      </>,
    );
    expect(useShortcutsPanel.getState().historyBlockers).toBe(0);
    press({ key: "ArrowLeft", altKey: true });
    expect(router.back).toHaveBeenCalledTimes(1);

    rerender(
      <>
        <GlobalKeyboardShortcuts />
        <HistoryBlocker blocked />
      </>,
    );
    expect(useShortcutsPanel.getState().historyBlockers).toBe(1);
    press({ key: "ArrowLeft", altKey: true });
    expect(router.back).toHaveBeenCalledTimes(1);

    rerender(
      <>
        <GlobalKeyboardShortcuts />
        <HistoryBlocker blocked={false} />
      </>,
    );
    expect(useShortcutsPanel.getState().historyBlockers).toBe(0);
    press({ key: "ArrowLeft", altKey: true });
    expect(router.back).toHaveBeenCalledTimes(2);
  });

  it("stays blocked until every blocker is gone", () => {
    const { rerender } = render(
      <>
        <GlobalKeyboardShortcuts />
        <HistoryBlocker key="a" blocked />
        <HistoryBlocker key="b" blocked />
      </>,
    );
    expect(useShortcutsPanel.getState().historyBlockers).toBe(2);

    rerender(
      <>
        <GlobalKeyboardShortcuts />
        <HistoryBlocker key="b" blocked />
      </>,
    );
    expect(useShortcutsPanel.getState().historyBlockers).toBe(1);
    press({ key: "ArrowLeft", altKey: true });
    expect(router.back).not.toHaveBeenCalled();

    rerender(<GlobalKeyboardShortcuts />);
    expect(useShortcutsPanel.getState().historyBlockers).toBe(0);
    press({ key: "ArrowLeft", altKey: true });
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("still opens the shortcuts panel on ? while history is blocked", () => {
    render(
      <>
        <GlobalKeyboardShortcuts />
        <HistoryBlocker blocked />
      </>,
    );
    press({ key: "?", shiftKey: true });
    expect(useShortcutsPanel.getState().open).toBe(true);
  });
});

describe("KeyboardShortcutsPanel", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "platform", { value: "Win32", configurable: true });
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    useShortcutsPanel.setState({ open: false, historyBlockers: 0 });
  });

  it("lists every shortcut when history is not blocked", () => {
    render(<KeyboardShortcutsPanel />);
    act(() => useShortcutsPanel.getState().setOpen(true));
    expect(screen.getByText("Keyboard shortcuts")).toBeTruthy();
    expect(screen.getByText("Go back to the previous page")).toBeTruthy();
    expect(screen.getByText("Go forward to the next page")).toBeTruthy();
    expect(screen.getByText("Lock AFVAR")).toBeTruthy();
    expect(screen.getByText("Show keyboard shortcuts")).toBeTruthy();
  });

  it("hides Back/Forward while blocked but keeps Lock and Help, and brings them back once unblocked", () => {
    const { rerender } = render(
      <>
        <KeyboardShortcutsPanel />
        <HistoryBlocker blocked />
      </>,
    );
    act(() => useShortcutsPanel.getState().setOpen(true));
    expect(screen.queryByText("Go back to the previous page")).toBeNull();
    expect(screen.queryByText("Go forward to the next page")).toBeNull();
    expect(screen.getByText("Lock AFVAR")).toBeTruthy();
    expect(screen.getByText("Show keyboard shortcuts")).toBeTruthy();

    rerender(<KeyboardShortcutsPanel />);
    expect(screen.getByText("Go back to the previous page")).toBeTruthy();
    expect(screen.getByText("Go forward to the next page")).toBeTruthy();
  });
});
