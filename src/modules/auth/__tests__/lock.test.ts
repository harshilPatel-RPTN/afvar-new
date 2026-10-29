import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/mocks/api";
import { consumeFreshUnlock, isLockShortcut, markFreshUnlock, useLockStore } from "../lock";
import { useAuthStore } from "../store";

beforeEach(() => {
  resetDb();
  useAuthStore.setState({ user: null, token: null, status: "unauthenticated" });
  useLockStore.getState().lock();
  // Drain the module-level one-shot flag left over from other tests.
  consumeFreshUnlock();
});

describe("fresh unlock flag", () => {
  it("is false by default", () => {
    expect(consumeFreshUnlock()).toBe(false);
  });

  it("is true exactly once after markFreshUnlock, then false", () => {
    markFreshUnlock();
    expect(consumeFreshUnlock()).toBe(true);
    expect(consumeFreshUnlock()).toBe(false);
    expect(consumeFreshUnlock()).toBe(false);
  });

  it("login leaves the tab unlocked and marks a fresh unlock once; logout locks", async () => {
    await useAuthStore.getState().login("free@afwar.app", "demo1234");
    const userId = useAuthStore.getState().user?.id;
    expect(userId).toBeTruthy();
    expect(useLockStore.getState().unlockedFor).toBe(userId);
    expect(sessionStorage.getItem("afwar.unlocked")).toContain(userId as string);
    expect(consumeFreshUnlock()).toBe(true);
    expect(consumeFreshUnlock()).toBe(false);

    await useAuthStore.getState().logout();
    expect(useLockStore.getState().unlockedFor).toBeNull();
    expect(sessionStorage.getItem("afwar.unlocked")).toBeNull();
  });
});

describe("isLockShortcut", () => {
  const key = (init: KeyboardEventInit) => new KeyboardEvent("keydown", init);

  it.each([
    { ctrlKey: true, key: "L" },
    { ctrlKey: true, key: "l" },
    { metaKey: true, key: "L" },
    { metaKey: true, key: "l" },
  ])("matches %o with Shift + KeyL", (mods) => {
    expect(isLockShortcut(key({ ...mods, shiftKey: true, code: "KeyL" }))).toBe(true);
  });

  it("requires Shift", () => {
    expect(isLockShortcut(key({ ctrlKey: true, code: "KeyL", key: "l" }))).toBe(false);
    expect(isLockShortcut(key({ metaKey: true, code: "KeyL", key: "l" }))).toBe(false);
  });

  it("requires Ctrl or Meta", () => {
    expect(isLockShortcut(key({ shiftKey: true, code: "KeyL", key: "L" }))).toBe(false);
  });

  it("rejects Alt", () => {
    expect(isLockShortcut(key({ ctrlKey: true, shiftKey: true, altKey: true, code: "KeyL", key: "L" }))).toBe(false);
    expect(isLockShortcut(key({ metaKey: true, shiftKey: true, altKey: true, code: "KeyL", key: "L" }))).toBe(false);
  });

  it("rejects other keys", () => {
    expect(isLockShortcut(key({ ctrlKey: true, shiftKey: true, code: "KeyK", key: "K" }))).toBe(false);
    expect(isLockShortcut(key({ metaKey: true, shiftKey: true, code: "Digit1", key: "!" }))).toBe(false);
  });
});
