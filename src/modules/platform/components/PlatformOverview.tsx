import { pathOf } from "../routes";
import { ClosingCta } from "./ClosingCta";
import { AtAGlance } from "./overview/AtAGlance";
import { ExploreCapabilities } from "./overview/ExploreCapabilities";
import { ManualVsAI } from "./overview/ManualVsAI";
import { OverviewHero } from "./overview/OverviewHero";
import { StopVsCancel } from "./overview/StopVsCancel";
import { TrustSection } from "./overview/TrustSection";
import { VerifyFlow } from "./overview/VerifyFlow";
import { YourWorkspace } from "./overview/YourWorkspace";
import { PlatformShell } from "./PlatformShell";
import { Ambience } from "@/modules/resources";

/** W2.1 Platform Overview, laid out per WF03. */
export function PlatformOverview() {
  return (
    <PlatformShell>
      <div className="relative">
        <Ambience />
        <div className="relative">
      <OverviewHero />
      <ManualVsAI />
      <StopVsCancel />
      <VerifyFlow />
      <YourWorkspace />
      <AtAGlance />
      <TrustSection />
      <ExploreCapabilities />
      <ClosingCta secondary={{ href: pathOf("getting-started"), label: "Getting Started" }} />
            </div>
      </div>
    </PlatformShell>
  );
}
