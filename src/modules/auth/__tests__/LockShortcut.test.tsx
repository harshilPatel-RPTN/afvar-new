import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDb } from "@/mocks/api";
import { LockShortcut } from "../components/LockShortcut";
import { useLockStore } from "../lock";
import { useAuthStore } from "../store";
import type { User } from "../types";

const nav = vi.hoisted(() => ({ pathname: "/", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), replace: nav.replace, back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
}));

const USER_ID = "usr_test";

function signIn() {
  useAuthStore.setState({ user: { id: USER_ID } as User, token: "tok", status: "authenticated" });
  useLockStore.getState().unlock(USER_ID);
}

function pressLock(init: KeyboardEventInit = {}) {
  fireEvent.keyDown(window, { ctrlKey: true, shiftKey: true, code: "KeyL", key: "L", ...init });
}

beforeEach(() => {
  resetDb();
  nav.pathname = "/";
  nav.replace.mockReset();
  useAuthStore.setState({ user: null, token: null, status: "unauthenticated" });
  useLockStore.getState().lock();
});

afterEach(() => cleanup());

describe("LockShortcut", () => {
  it("locks and opens the lock screen from a website page", () => {
    nav.pathname = "/legal/terms";
    signIn();
    render(<LockShortcut />);
    pressLock();
    expect(useLockStore.getState().unlockedFor).toBeNull();
    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith("/");
  });

  it("also works with Meta+Shift+L", () => {
    nav.pathname = "/legal/terms";
    signIn();
    render(<LockShortcut />);
    pressLock({ ctrlKey: false, metaKey: true, key: "l" });
    expect(useLockStore.getState().unlockedFor).toBeNull();
    expect(nav.replace).toHaveBeenCalledWith("/");
  });

  it("locks in place on the OS without navigating", () => {
    nav.pathname = "/";
    signIn();
    render(<LockShortcut />);
    pressLock();
    expect(useLockStore.getState().unlockedFor).toBeNull();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("does nothing when signed out", () => {
    nav.pathname = "/legal/terms";
    useLockStore.getState().unlock(USER_ID);
    render(<LockShortcut />);
    pressLock();
    expect(useLockStore.getState().unlockedFor).toBe(USER_ID);
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("ignores key repeat", () => {
    nav.pathname = "/legal/terms";
    signIn();
    render(<LockShortcut />);
    pressLock({ repeat: true });
    expect(useLockStore.getState().unlockedFor).toBe(USER_ID);
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("ignores other key combos", () => {
    nav.pathname = "/legal/terms";
    signIn();
    render(<LockShortcut />);
    pressLock({ shiftKey: false });
    pressLock({ altKey: true });
    expect(useLockStore.getState().unlockedFor).toBe(USER_ID);
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("stops listening after unmount", () => {
    nav.pathname = "/legal/terms";
    signIn();
    const { unmount } = render(<LockShortcut />);
    unmount();
    pressLock();
    expect(useLockStore.getState().unlockedFor).toBe(USER_ID);
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
