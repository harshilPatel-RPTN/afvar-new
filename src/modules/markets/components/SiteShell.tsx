import type { ReactNode } from "react";
import "../markets.css";
import { HOME_SCOPE, HomeStyles } from "@/modules/home/kit";
import { PrelaunchBanner } from "./PrelaunchBanner";
import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";

/** Page chrome for the public Markets site: fixed nav (the skip link is the root layout's), pre-launch strip, main, footer (`footer={false}` when a page renders its own). */
export function SiteShell({ children, banner = true, footer = true }: { children: ReactNode; banner?: boolean; footer?: boolean }) {
  return (
    // The /home-demo theme (green / red / black) and its motion CSS on every
    // page this shell wraps — the gold markets palette is overridden there.
    <div className={`${HOME_SCOPE} flex min-h-svh flex-col`}>
      <HomeStyles />
      <SiteNav />
      {banner && <PrelaunchBanner />}
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      {footer && <SiteFooter />}
    </div>
  );
}
