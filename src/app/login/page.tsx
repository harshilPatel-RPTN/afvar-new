import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "@/modules/auth";
import { FullscreenGate, LiveNebula } from "@/modules/workspace";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return (
    <>
      <LiveNebula />
      <FullscreenGate>
        <Suspense>
          <LoginView />
        </Suspense>
      </FullscreenGate>
    </>
  );
}
