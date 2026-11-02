import { SiteFooter } from "@/modules/markets";
import { BrandMark } from "@/platform/ui";
import { OVERVIEW } from "../content";
import { EarthHorizon } from "./closing/EarthHorizon";
import { Reveal } from "./mac/Reveal";
import { ChevronLink, RegisterLink } from "./shared";

/**
 * Closing block shared by the overview and capability pages: the registration
 * call to action in the sky above the /market earth horizon, then the solid
 * site footer — one component, so the /platform layout renders no footer of its own.
 */
export function ClosingCta({ secondary }: { secondary?: { href: string; label: string } }) {
  return (
    <>
      <EarthHorizon labelledBy="closing-title">
        {/* Staggered entrance: badge, title, lede, then the actions, each fading up in turn. */}
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-[16px] bg-(--surface-2) text-(--text-primary)">
              <BrandMark className="h-9 w-9" />
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 id="closing-title" className="pf-title mt-8">
              {OVERVIEW.closing.title}
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="pf-lede mx-auto mt-5 max-w-lg">{OVERVIEW.closing.summary}</p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-9 flex flex-nowrap items-center justify-center gap-x-2.5 sm:gap-x-7">
              <RegisterLink />
              {secondary && <ChevronLink compact href={secondary.href}>{secondary.label}</ChevronLink>}
            </div>
          </Reveal>
        </div>
      </EarthHorizon>
      <SiteFooter />
    </>
  );
}
