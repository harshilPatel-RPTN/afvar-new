// The AFVAR page frame, identical on every page built in the AI OS theme
// (home, platform, …): the site-wide navbar with the live ticker under it, the
// launch reminder, the page, its closing block (usually the earth horizon),
// the shared footer and the sound switch. Flat dark surfaces only — no glass.
import type { ReactNode } from "react";
import { AfvarStyles } from "@/modules/afvarOs";
import { HOME_SCOPE, HomeStyles } from "@/modules/home/kit";
import { SiteFooter, SiteNav } from "@/modules/markets";
import { DemoHeader } from "./DemoHeader";
import { HomeSoundToggle } from "./HomeSoundToggle";
import { LaunchReminder } from "./LaunchReminder";
import { PauseOffscreen } from "./PauseOffscreen";
import { DEMO_CSS } from "./ui";

export function SiteFrame({ children, closing }: { children: ReactNode; closing?: ReactNode }) {
  return (
    <div data-site-frame="" className={`${HOME_SCOPE} min-h-svh bg-[#050607] text-[#F5F7F7]`}>
      <HomeStyles />
      <style>{DEMO_CSS}</style>
      <AfvarStyles />
      {/* The site-wide navbar (same as every page), with the live ticker under it. */}
      <SiteNav />
      <DemoHeader />
      <LaunchReminder />

      <main>{children}</main>

      {closing ? <div data-site-closing="">{closing}</div> : null}
      <SiteFooter />

      {/* The site-wide sound switch (same as every page); drives the page's audio engine too. */}
      <HomeSoundToggle />
      <PauseOffscreen />
    </div>
  );
}
