import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/mocks/api";
import { useLockStore } from "../lock";
import { useAuthStore } from "../store";

beforeEach(() => {
  resetDb();
  useAuthStore.setState({ user: null, token: null, status: "unauthenticated" });
  useLockStore.getState().lock();
});

describe("auth store", () => {
  it("signs in, unlocks this tab and mirrors the session into the proxy cookie", async () => {
    const response = await useAuthStore.getState().login("free@afwar.app", "demo1234");
    const state = useAuthStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.user?.email).toBe("free@afwar.app");
    expect(state.token).toBe(response.access_token);
    expect(useLockStore.getState().unlockedFor).toBe(state.user?.id);
    expect(document.cookie).toContain("afwar_session=");
    expect(document.cookie).toContain("afwar_onboarded=1");
  });

  it("persists under afwar.auth.v1", async () => {
    await useAuthStore.getState().login("pro@afwar.app", "demo1234");
    const stored = JSON.parse(localStorage.getItem("afwar.auth.v1") ?? "{}");
    expect(stored.state.user.plan).toBe("pro");
  });

  it("signs out, locks the tab and clears the cookie", async () => {
    await useAuthStore.getState().login("free@afwar.app", "demo1234");
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useLockStore.getState().unlockedFor).toBeNull();
    expect(document.cookie).not.toMatch(/afwar_session=usr/);
  });

  it("flips the plan with the dev toggle", async () => {
    await useAuthStore.getState().login("free@afwar.app", "demo1234");
    await useAuthStore.getState().setPlan("pro");
    expect(useAuthStore.getState().user?.plan).toBe("pro");
    expect(useAuthStore.getState().usage.limit).toBeNull();
  });
});
