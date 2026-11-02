// The AFVAR page frame, the same as the home page's (HomeDemoPage with
// responsiveHome): the shared colour field with its quiet stars and drifting
// +/− marks, the 1440 px frame, the glass menu navigation with the sound switch
// inside it, the launch reminder, the page, the point-globe closing and the
// shared footer. Every page outside the home is built on it.
import type { ReactNode } from "react";
import { AfvarStyles } from "@/modules/afvarOs";
import { BTN_PRIMARY, HOME_SCOPE, HomeStyles } from "@/modules/home/kit";
import { SiteFooter, SiteNav } from "@/modules/markets";
import { GlobeClosing } from "./GlobeClosing";
import { HomeAmbient } from "./HomeAmbient";
import { HomeSoundToggle } from "./HomeSoundToggle";
import { LaunchReminder } from "./LaunchReminder";
import { PauseOffscreen } from "./PauseOffscreen";
import { DEMO_CSS, REGISTER_HREF } from "./ui";
import "./home-layout.css";

export function SiteFrame({ children, closing }: { children: ReactNode; closing?: ReactNode }) {
  return (
    <div className="afvar-home-backdrop">
      <HomeAmbient />
      <div data-site-frame="" className={`${HOME_SCOPE} afvar-responsive-home min-h-svh text-(--afvar-text)`}>
        <HomeStyles />
        <style>{DEMO_CSS}</style>
        <AfvarStyles />
        <SiteNav menuOnly>
          <HomeSoundToggle inMenu />
        </SiteNav>
        <LaunchReminder />

        <main>{children}</main>

        {closing ? (
          <div data-site-closing="">
            <GlobeClosing>{closing}</GlobeClosing>
          </div>
        ) : null}
        <SiteFooter />
        <PauseOffscreen />
      </div>
    </div>
  );
}

/**
 * The closing copy beside the globe, set like the home's: the headline (the
 * globe reads it by id), then Register Now and an optional second link.
 */
export function ClosingCopy({ title, soft, lede, second }: { title: string; soft?: string; lede?: string; second?: { label: string; href: string } }) {
  return (
    <>
      <h2 id="demo-closing-title" className="text-[clamp(2.1rem,4.2vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-(--afvar-text)">
        {title} {soft ? <span className="text-(--afvar-muted)">{soft}</span> : null}
      </h2>
      {lede ? <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-(--afvar-muted)">{lede}</p> : null}
      <div className="mt-9 flex flex-wrap items-center gap-2.5 sm:gap-4 max-[700px]:justify-center">
        <a href={REGISTER_HREF} className={`${BTN_PRIMARY} whitespace-nowrap max-sm:px-4 max-sm:text-[13px]`}>
          Register Now
        </a>
        {second ? (
          <a href={second.href} className="afvar-glass-button inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[13px] font-medium sm:px-6 sm:text-[14.5px]">
            {second.label}
          </a>
        ) : null}
      </div>
    </>
  );
}
