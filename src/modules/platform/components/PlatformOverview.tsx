import { GHOST_LINK } from "@/modules/afvarOs";
import { BTN_PRIMARY } from "@/modules/home/kit";
import { SiteFrame } from "@/modules/homeDemo";
import { OVERVIEW } from "../content";
import { REGISTER_URL, pathOf } from "../routes";
import { OverviewFilm } from "../film/OverviewFilm";
import { EarthHorizon } from "./closing/EarthHorizon";
import { AtAGlanceGrid } from "./overview/AtAGlanceGrid";
import { TrySection } from "./playground/OsPlayground";

/**
 * W2.1 Platform Overview, in the AFVAR OS theme of the home page: the same
 * frame (navbar, live ticker, sound, earth closing, footer), the same AI core
 * and the same OS — the platform film, then hands-on, then the ten topics.
 */
export function PlatformOverview() {
  return (
    <SiteFrame
      closing={
        <EarthHorizon labelledBy="platform-closing-title">
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="platform-closing-title" className="text-[clamp(2.1rem,4.2vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#F5F7F7]">
              {OVERVIEW.closing.title}. <span className="text-[#A3AAAC]">One AI, five areas.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-[#A3AAAC]">{OVERVIEW.closing.summary}</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-6">
              <a href={REGISTER_URL} className={BTN_PRIMARY}>
                Register Now
              </a>
              <a href={pathOf("getting-started")} className={GHOST_LINK}>
                Getting Started
              </a>
            </div>
          </div>
        </EarthHorizon>
      }
    >
      <OverviewFilm />
      <TrySection />
      <AtAGlanceGrid />
    </SiteFrame>
  );
}
