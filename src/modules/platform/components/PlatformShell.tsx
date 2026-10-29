import type { ReactNode } from "react";
import "@/platform/ui/tokens.css";
import "../platform.css";
import { ClickBurst, SiteFx } from "@/modules/home/kit";
import { CommandPalette } from "./CommandPalette";

/**
 * Theme root for every /platform page. The markets SiteShell (app/platform/
 * layout.tsx) provides the chrome — skip link, nav, pre-launch strip,
 * <main id="main"> and footer — so this wrapper only scopes the pf tokens,
 * which are mapped onto the `.mk` markets palette in platform.css.
 *
 * It is also where every page it wraps (markets, platform, pricing, about,
 * contact) inherits the "/" home page's motion: the candle cursor and click
 * burst over the content (`data-candle-trail`), the scroll candle meter, the
 * sound toggle, the easter egg and the sleeping bull & bear — in the page's
 * own colours.
 */
export function PlatformShell({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div data-candle-trail className={`ds-theme pf-theme overflow-x-clip pt-[72px] ${className}`}>
      {children}
      <ClickBurst />
      <CommandPalette />
      <SiteFx />
    </div>
  );
}
