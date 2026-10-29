import type { ReactNode } from "react";
import { translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";
import "../markets.css";
import { HOME_SCOPE, HomeStyles } from "@/modules/home/kit";
import { PrelaunchBanner } from "./PrelaunchBanner";
import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";

/** Page chrome for the public Markets site: skip link, fixed nav, pre-launch strip, main, footer (`footer={false}` when a page renders its own). */
export async function SiteShell({ children, banner = true, footer = true }: { children: ReactNode; banner?: boolean; footer?: boolean }) {
  const edition = await getServerEdition();
  return (
    // The /home-demo theme (green / red / black) and its motion CSS on every
    // page this shell wraps — the gold markets palette is overridden there.
    <div className={`${HOME_SCOPE} flex min-h-svh flex-col`}>
      <HomeStyles />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-(--mk-primary) focus:px-5 focus:py-3 focus:text-[14px] focus:font-semibold focus:text-(--mk-on-primary) focus:shadow-(--mk-glow-primary)"
      >
        {translate(edition, "mk.shell.skip")}
      </a>
      <SiteNav />
      {banner && <PrelaunchBanner />}
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      {footer && <SiteFooter />}
    </div>
  );
}
