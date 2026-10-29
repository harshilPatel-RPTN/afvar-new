"use client";

import { useLockStore } from "../lock";
import { useAuthStore } from "../store";

/** Current session; `user` is null when signed out. */
export function useSession() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);
  const unlockedFor = useLockStore((state) => state.unlockedFor);
  return {
    user,
    status,
    // A user in the store counts as signed in unless the session was explicitly
    // ended — modules (and their tests) that only set `user` keep working.
    isAuthenticated: user !== null && status !== "unauthenticated",
    isUnlocked: !!user && unlockedFor === user.id,
    logout,
    /** Alias kept for the landing module, which predates the rename to `logout`. */
    signOut: logout,
  };
}
