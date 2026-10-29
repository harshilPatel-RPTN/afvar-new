import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterView } from "@/modules/auth";
import { FullscreenGate, LiveNebula } from "@/modules/workspace";

export const metadata: Metadata = { title: "Create account" };

export default function Page() {
  return (
    <>
      <LiveNebula />
      <FullscreenGate>
        <Suspense>
          <RegisterView />
        </Suspense>
      </FullscreenGate>
    </>
  );
}
