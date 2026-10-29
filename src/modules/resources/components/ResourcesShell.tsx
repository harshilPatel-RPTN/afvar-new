import type { ReactNode } from "react";
import { SiteShell } from "@/modules/home";
import { PlatformShell } from "@/modules/platform/kit";
import { Ambience } from "./Ambience";
import { SparkBurst } from "./motion";
import "../resources.css";

/**
 * W5 chrome: the home page's shell (HomeNav, green/red/black `.afvar-home`
 * tokens, HomeFooter) outside; the platform pages' macOS kit inside, with its
 * pf tokens re-pointed at the home palette by `.rs-theme`. The footer renders
 * straight after the page's closing earth block, as on /platform.
 *
 * PlatformShell already mounts the home page's effects (candle cursor, click
 * burst on plain surface, scroll candle meter, sound toggle, sleeping bull &
 * bear). Resources adds SparkBurst — the same burst on buttons and links,
 * which the home burst skips — and the scroll-driven Ambience. The site nav
 * (with its live bull-vs-bear line) comes from the shell. All stand down under
 * reduced motion.
 */
export function ResourcesShell({ children }: { children: ReactNode }) {
  return (
    <SiteShell footer={false}>
      <PlatformShell className="rs-theme">
        <div data-candle-trail className="relative">
          <Ambience />
          <div className="relative">{children}</div>
          <SparkBurst />
        </div>
      </PlatformShell>
    </SiteShell>
  );
}
