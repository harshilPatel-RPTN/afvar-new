"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { LockShortcut, SessionSync } from "@/modules/auth";
import { BillingOverlays } from "@/modules/billing";
import { EditionSync, I18nProvider, type Edition } from "@/platform/i18n";
import { GlobalKeyboardShortcuts } from "@/platform/keyboard";

export function Providers({ edition, children }: { edition: Edition; children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Panels must degrade gracefully when FastAPI is down —
            // fail fast instead of hammering a dead backend.
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 15_000,
          },
        },
      }),
  );

  return (
    <I18nProvider edition={edition}>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <EditionSync />
        <SessionSync />
        <LockShortcut />
        <GlobalKeyboardShortcuts />
        {/* ViewportGuard is off while there are no pages: its /unsupported target is gone. */}
        {children}
        <BillingOverlays />
      </MotionConfig>
    </QueryClientProvider>
    </I18nProvider>
  );
}
