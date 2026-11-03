// AFVAR home — "The trading OS that never stops thinking".
// One continuous scroll story around the AFVAR AI core (./ai/AiStory): the
// same 3D core is on screen from the first frame to the last and transforms
// with the scroll — seven cores, every tick, 24/7, ask, the OS, the policy
// gate — then the product overview video, the launch queue and the site-wide
// ending. Flat dark surfaces and hairlines only — no glassmorphism.
import { BTN_PRIMARY, HOME_SCOPE, HomeStyles } from "@/modules/home/kit";
import { HomeSoundToggle } from "./HomeSoundToggle";
import { SiteFooter, SiteNav } from "@/modules/markets";
import { EarthHorizon } from "@/modules/platform/kit";
import { HomeAmbient } from "./HomeAmbient";
import { GlobeClosing } from "./GlobeClosing";
import { AfvarStyles } from "@/modules/afvarOs";
import { AiStory } from "./ai/AiStory";
import { DemoHeader } from "./DemoHeader";
import { LaunchQueue } from "./LaunchQueue";
import { LaunchReminder } from "./LaunchReminder";
import { OverviewVideo } from "./OverviewVideo";
import { DEMO_CSS, REGISTER_HREF } from "./ui";
import { MobileBlock, MobilePageChrome, MobileSectionMark } from "./MobileChrome";

import { Fragment, type CSSProperties } from "react";
import "./home-layout.css";
import "./home-sections-responsive.css";

// Closing headline split per word for the phone word-by-word reveal (text unchanged).
const CLOSING_LEAD = ["The", "AI", "operating", "system"];
const CLOSING_TAIL = ["for", "trading."];
// Big blocks on the phone page: story, video, queue, closing, footer.
const SECTIONS = 5;

export function HomeDemoPage({ responsiveHome = false }: { responsiveHome?: boolean }) {
  const closingCopy = (
    <>
      <h2 id="demo-closing-title" className="text-[clamp(2.1rem,4.2vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-(--afvar-text)">
        {CLOSING_LEAD.map((word, i) => <Fragment key={i}><span className="home-close-word" style={{ "--w": i } as CSSProperties}>{word}</span>{" "}</Fragment>)}
        <span className="text-[#A3AAAC]">{CLOSING_TAIL.map((word, i) => <Fragment key={i}>{i > 0 && " "}<span className="home-close-word" style={{ "--w": CLOSING_LEAD.length + i } as CSSProperties}>{word}</span></Fragment>)}</span>
      </h2>
      <div className="home-close-cta mt-9">
        <a href={REGISTER_HREF} className={BTN_PRIMARY}>Register Now</a>
      </div>
    </>
  );
  const content = (
    <div className={`${HOME_SCOPE}${responsiveHome ? " afvar-responsive-home" : ""} min-h-svh text-(--afvar-text)`}>
      <HomeStyles />
      <style>{DEMO_CSS}</style>
      <AfvarStyles />
      <SiteNav menuOnly={responsiveHome}>
        {responsiveHome && <HomeSoundToggle inMenu />}
      </SiteNav>
      {!responsiveHome && <DemoHeader />}
      <LaunchReminder />

      {responsiveHome && <MobilePageChrome />}

      <main id="main" tabIndex={-1} className="focus:outline-none">
        <AiStory responsiveHome={responsiveHome} />
        {responsiveHome ? (
          <>
            {/* Phones: hairline "0N / 05" counters + block entry (CSS hides both from 640 px up). */}
            <MobileSectionMark n={2} of={SECTIONS} />
            <MobileBlock><OverviewVideo /></MobileBlock>
            <MobileSectionMark n={3} of={SECTIONS} />
            <MobileBlock><LaunchQueue showRain={false} /></MobileBlock>
          </>
        ) : (
          <>
            <OverviewVideo />
            <LaunchQueue showRain />
          </>
        )}
      </main>

      {responsiveHome ? (
        <>
          <MobileSectionMark n={4} of={SECTIONS} />
          <MobileBlock last><GlobeClosing>{closingCopy}</GlobeClosing></MobileBlock>
          <MobileSectionMark n={5} of={SECTIONS} />
        </>
      ) : (
        <EarthHorizon labelledBy="demo-closing-title">
          <div className="mx-auto max-w-3xl text-center">
            {closingCopy}
          </div>
        </EarthHorizon>
      )}
      <SiteFooter />

      {/* The site-wide sound switch (same as every page); drives this page's audio engine too. */}
      {!responsiveHome && <HomeSoundToggle />}
    </div>
  );
  return responsiveHome ? <div className="afvar-home-backdrop"><HomeAmbient />{content}</div> : content;
}
