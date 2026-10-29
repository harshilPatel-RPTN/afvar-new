"use client";

import { useState } from "react";
import { useAuthStore } from "../store";

/** The seeded demo account behind "Continue with a demo session". */
const DEMO_ACCOUNT = { email: "free@afwar.app", password: "demo1234" };

/**
 * Starts a clearly labelled DEMO session for modules that need a signed-in
 * user before real sign-in is wired in (e.g. communities). It signs in to the
 * mock backend as the seeded demo account, so `useSession()` and every
 * `/api/v1/*` call see a real session.
 */
export function useDemoSession() {
  const login = useAuthStore((state) => state.login);
  const [pending, setPending] = useState(false);
  const start = async () => {
    setPending(true);
    try {
      await login(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password);
    } finally {
      setPending(false);
    }
  };
  return { start, pending };
}
