"use client";

import { Suspense, type ReactNode } from "react";
import { AuthBrandFrame } from "./AuthCard";
import { LiveNebula } from "@/modules/workspace";

/**
 * Sign-in, sign-up and recovery pages. They show their form straight away: no
 * full-screen launch card, which hid the form on phones and on a first visit.
 */
export function AuthPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="afvar-auth-frame">
      <LiveNebula />
      <AuthBrandFrame>
        <Suspense>{children}</Suspense>
      </AuthBrandFrame>
    </div>
  );
}
