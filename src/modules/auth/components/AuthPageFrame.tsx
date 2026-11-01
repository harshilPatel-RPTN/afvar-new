"use client";

import { Suspense, type ReactNode } from "react";
import { AuthBrandFrame } from "./AuthCard";
import { FullscreenGate, LiveNebula } from "@/modules/workspace";

export function AuthPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="afvar-auth-frame">
      <LiveNebula />
      <AuthBrandFrame>
        <FullscreenGate>
          <Suspense>{children}</Suspense>
        </FullscreenGate>
      </AuthBrandFrame>
    </div>
  );
}
