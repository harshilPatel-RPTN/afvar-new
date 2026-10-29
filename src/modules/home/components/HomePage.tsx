import { CandleCursor } from "./CandleCursor";
import { ClickBurst } from "./ClickBurst";
import { EasterEgg } from "./EasterEgg";
import { IdleScreensaver } from "./IdleScreensaver";
import { ScrollCandleMeter } from "./ScrollCandleMeter";
import { SoundToggle } from "./SoundToggle";
import { FloatingCta, ScrollProgress } from "./FloatingCta";
import { Hero } from "./Hero";
import { JoinQueue } from "./Offers";
import { Capabilities, EvidenceBanner, HowItWorks, KeyTopics, MarketsCovered, VideoSection, WhyAfvar } from "./Sections";
import { SiteShell } from "./SiteShell";
import Link from "next/link";
import { SiteFooter } from "@/modules/markets";
import { EarthHorizon } from "@/modules/platform/kit";
import { BTN_PRIMARY } from "./bits";
import { HERO } from "../content";

/** W1 · Home, matched to the approved visual mockup (content order per WF01). */
export function HomePage() {
  return (
    <SiteShell footer={false}>
      <Hero />
      {/* Everything after the hero sits on the deep section surface (README §3: #080A0B). */}
      <div data-candle-trail className="bg-[#080A0B]">
        <VideoSection />
        <Capabilities />
        <MarketsCovered />
        <HowItWorks />
        <KeyTopics />
        <WhyAfvar />
        <EvidenceBanner />
        <JoinQueue />
        <ClickBurst />
      </div>

      {/* The site-wide ending: the /market earth horizon, then the shared footer. */}
      <EarthHorizon labelledBy="home-closing-title" className="bg-[#080A0B]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="home-closing-title" className="text-[clamp(2.1rem,4.2vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#F5F7F7]">
            {HERO.titleA} <span className="text-[#A3AAAC]">{HERO.titleB}</span>
          </h2>
          <div className="mt-9 flex justify-center">
            <Link href={HERO.primary.href} className={BTN_PRIMARY}>
              {HERO.primary.label}
            </Link>
          </div>
        </div>
      </EarthHorizon>
      <SiteFooter />

      <CandleCursor />
      <ScrollProgress />
      <ScrollCandleMeter />
      <SoundToggle />
      <FloatingCta />
      <EasterEgg />
      <IdleScreensaver />
    </SiteShell>
  );
}
