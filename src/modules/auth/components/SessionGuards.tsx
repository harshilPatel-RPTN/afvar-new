"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "@/platform/i18n";
import { AUTO_LOCK_AFTER_MS, useLockStore } from "../lock";
import { useAuthStore } from "../store";
import { BrandMark } from "./AuthCard";

/**
 * Mounted once in the app providers: restores the persisted session after
 * hydration, keeps tabs in sync, and re-locks the app after time away.
 */
export function SessionSync() {
  useEffect(() => {
    void Promise.resolve(useAuthStore.persist.rehydrate()).then(() => useAuthStore.getState().refresh());

    // Signing in or out in another tab applies here too.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "afwar.auth.v1") return;
      void Promise.resolve(useAuthStore.persist.rehydrate()).then(() => {
        // Signed out (or switched user) elsewhere: this tab must not stay unlocked.
        const { user } = useAuthStore.getState();
        const { unlockedFor, lock } = useLockStore.getState();
        if (unlockedFor && unlockedFor !== user?.id) lock();
      });
    };
    let hiddenAt: number | null = null;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt > AUTO_LOCK_AFTER_MS) useLockStore.getState().lock();
      hiddenAt = null;
      void useAuthStore.getState().refresh();
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return null;
}

export function SessionSplash() {
  const { t } = useT();
  return (
    <div className="grid min-h-svh place-items-center text-(--afvar-text)" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <span className="relative grid h-14 w-14 place-items-center rounded-2xl border border-white/15 bg-white/[.06]">
          <BrandMark className="h-7 w-7 text-(--afvar-mint)" />
          <span className="absolute inset-0 animate-ping rounded-2xl border border-(--afvar-mint)/40 motion-reduce:hidden" />
        </span>
        <span className="text-[12px] tracking-[.2em] text-(--afvar-muted)">{t("session.loading")}</span>
      </div>
    </div>
  );
}

/**
 * Client-side half of the auth guard (the proxy does the optimistic half):
 * signed out → /login, not onboarded → /onboarding, locked → the lock screen.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const unlockedFor = useLockStore((state) => state.unlockedFor);

  const onboarding = pathname.startsWith("/onboarding");
  const onboarded = !!user?.onboardingCompletedAt;
  const unlocked = !!user && unlockedFor === user.id;

  let redirect: string | null = null;
  if (status === "unauthenticated" || (status === "authenticated" && !user)) {
    redirect = `/login?next=${encodeURIComponent(pathname)}`;
  } else if (status === "authenticated" && user) {
    if (!onboarded && !onboarding) redirect = "/onboarding";
    else if (onboarded && onboarding) redirect = "/desktop";
    else if (onboarded && !unlocked) redirect = `/?next=${encodeURIComponent(pathname + (typeof window === "undefined" ? "" : window.location.search))}`;
  }

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (status === "loading" || redirect) return <SessionSplash />;
  return <>{children}</>;
}
