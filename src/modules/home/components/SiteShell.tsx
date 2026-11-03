import type { ReactNode } from "react";
import { HomeFooter } from "./HomeFooter";
import { SiteNav } from "@/modules/markets";
import { HOME_SCOPE, HomeStyles } from "./HomeStyles";

/**
 * Public homepage chrome (REVISED cinematic contract): the home keeps the
 * `.mk` theme class and fonts so sections still consume mk tokens, but gets
 * its own solid-dark nav and footer with a neutral primary action instead of
 * the markets module's gold shell; `.afvar-home` swaps in the green/red/black
 * tokens. No pre-launch banner here by product
 * decision.
 */
export function SiteShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <div className={`${HOME_SCOPE} flex min-h-svh flex-col`}>
      <HomeStyles />
      {/* The site-wide nav (72px, search, Join Waitlist, live breadth line) — identical on every page. */}
      <SiteNav />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      {footer && <HomeFooter />}
    </div>
  );
}
