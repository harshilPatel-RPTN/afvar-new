// AFVAR home — "The trading OS that never stops thinking".
// One continuous scroll story around the AFVAR AI core (./ai/AiStory): the
// same 3D core is on screen from the first frame to the last and transforms
// with the scroll — seven cores, every tick, 24/7, ask, the OS, the policy
// gate — then the product overview video, the launch queue and the site-wide
// ending. Flat dark surfaces and hairlines only — no glassmorphism.
import { BTN_PRIMARY } from "@/modules/home/kit";
import { EarthHorizon } from "@/modules/platform/kit";
import { AiStory } from "./ai/AiStory";
import { LaunchQueue } from "./LaunchQueue";
import { OverviewVideo } from "./OverviewVideo";
import { SiteFrame } from "./SiteFrame";
import { REGISTER_HREF } from "./ui";

export function HomeDemoPage() {
  return (
    <SiteFrame
      closing={
        // The site-wide ending, identical to every page: the /market earth
        // horizon (sun / moon toggle, drag to spin, the candle convoy), then
        // the shared footer with the clickable bull and bear.
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
      }
    >
      <AiStory />
      <OverviewVideo />
      <LaunchQueue />
    </SiteFrame>
  );
}
