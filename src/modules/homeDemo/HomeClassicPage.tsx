// /home-2 — the previous homepage (chapter film), kept alongside the AI OS home. RPTN-style cinematic experience for AFVAR, built chapter by
// chapter. Navbar + ticker, ten chapters, the overview video, the launch
// queue and the footer, with a floating launch reminder.
// Flat dark surfaces and hairlines only — no glassmorphism anywhere.
// The content is the demo's own; the look, motion and sound are inherited
// from "/" (its theme scope, candle cursor, click burst, scroll candle meter,
// Konami easter egg and the sleeping bull & bear screensaver).
import { BTN_PRIMARY, CandleCursor, ClickBurst, EasterEgg, HOME_SCOPE, HomeStyles, IdleScreensaver, ScrollCandleMeter } from "@/modules/home/kit";
import { HomeSoundToggle } from "./HomeSoundToggle";
import { SiteFooter, SiteNav } from "@/modules/markets";
import { EarthHorizon } from "@/modules/platform/kit";
import { Chapter01 } from "./Chapter01";
import { Chapter02 } from "./Chapter02";
import { Chapter03 } from "./Chapter03";
import { Chapter04 } from "./Chapter04";
import { Chapter05 } from "./Chapter05";
import { Chapter06 } from "./Chapter06";
import { Chapter07 } from "./Chapter07";
import { Chapter08 } from "./Chapter08";
import { Chapter09 } from "./Chapter09";
import { Chapter10 } from "./Chapter10";
import { DemoHeader } from "./DemoHeader";
import { CandleSweep, OilSeam } from "./transitions";
import { LaunchQueue } from "./LaunchQueue";
import { LaunchReminder } from "./LaunchReminder";
import { OverviewVideo } from "./OverviewVideo";
import { ScenePrefetch } from "./ScenePrefetch";
import { AmbienceDirector, BeastEasterEgg, RegisterCoins } from "./playful";
import { DEMO_CSS, REGISTER_HREF } from "./ui";

export function HomeClassicPage() {
  return (
    <div className={`${HOME_SCOPE} min-h-svh bg-[#080A0B] text-[#F5F7F7]`}>
      <HomeStyles />
      <style>{DEMO_CSS}</style>
      {/* The site-wide navbar (same as every page), with the demo ticker under it. */}
      <SiteNav />
      <DemoHeader />
      <LaunchReminder />
      <AmbienceDirector />
      <RegisterCoins />
      <BeastEasterEgg />
      <ScenePrefetch />

      {/* data-candle-trail: "/"'s candle cursor and click burst live inside main. */}
      <main data-candle-trail>
        <Chapter01 />
        <CandleSweep dir="rtl" seed={1} />
        <Chapter02 />
        <CandleSweep dir="ltr" seed={2} />
        <OilSeam />
        <Chapter03 />
        <CandleSweep dir="rtl" seed={3} />
        <Chapter04 />
        <CandleSweep dir="ltr" seed={4} />
        <Chapter05 />
        <CandleSweep dir="rtl" seed={5} />
        <Chapter06 />
        <CandleSweep dir="ltr" seed={6} />
        <Chapter07 />
        <CandleSweep dir="rtl" seed={7} />
        <Chapter08 />
        <CandleSweep dir="ltr" seed={8} />
        <Chapter09 />
        <CandleSweep dir="rtl" seed={9} />
        <Chapter10 />
        <CandleSweep dir="ltr" seed={10} />
        <OverviewVideo />
        <CandleSweep dir="rtl" seed={11} />
        <LaunchQueue />
        <ClickBurst />
      </main>

      {/* The site-wide ending, identical to every page: the /market earth
          horizon (sun / moon toggle, drag to spin, the candle convoy), then
          the shared footer with the clickable bull and bear. */}
      <EarthHorizon labelledBy="demo-closing-title">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="demo-closing-title" className="text-[clamp(2.1rem,4.2vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#F5F7F7]">
            The AI operating system <span className="text-[#A3AAAC]">for trading.</span>
          </h2>
          <div className="mt-9 flex justify-center">
            <a href={REGISTER_HREF} className={BTN_PRIMARY}>
              Register Now
            </a>
          </div>
        </div>
      </EarthHorizon>
      <SiteFooter />

      <CandleCursor />
      <ScrollCandleMeter />
      {/* The site-wide sound switch (same as every page); drives this page's audio engine too. */}
      <HomeSoundToggle />
      <EasterEgg />
      <IdleScreensaver />
    </div>
  );
}
