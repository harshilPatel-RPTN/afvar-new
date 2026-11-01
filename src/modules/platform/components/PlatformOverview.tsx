import { ClosingCopy, SiteFrame } from "@/modules/homeDemo";
import { OVERVIEW } from "../content";
import { pathOf } from "../routes";
import { PlatformHero } from "../film/hero/PlatformHero";
import { PlatformSections } from "../film/sections/PlatformSections";
import { AtAGlanceGrid } from "./overview/AtAGlanceGrid";
import { TrySection } from "./playground/OsPlayground";

/**
 * W2.1 Platform Overview, in the AFVAR OS theme of the home page: the same
 * frame (glass menu, ambient sky, globe closing, footer), the same AI core
 * and the same OS — the platform film, then hands-on, then the ten topics.
 */
export function PlatformOverview() {
  return (
    <SiteFrame
      closing={<ClosingCopy title={`${OVERVIEW.closing.title}.`} soft="One AI, five areas." lede={OVERVIEW.closing.summary} second={{ label: "Getting Started", href: pathOf("getting-started") }} />}
    >
      <PlatformHero />
      <PlatformSections />
      <TrySection />
      <AtAGlanceGrid />
    </SiteFrame>
  );
}
