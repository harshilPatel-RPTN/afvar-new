import { pathOf } from "../routes";
import type { Capability } from "../types";
import { CapabilityHero } from "./capability/CapabilityHero";
import { CapabilityFamily, ClearerView, ContinueExploring } from "./capability/CapabilitySections";
import { FeatureFocusProvider } from "./capability/FeatureFocus";
import { FeatureGrid } from "./capability/FeatureGrid";
import { ClosingCta } from "./ClosingCta";
import { PlatformShell } from "./PlatformShell";
import { Ambience } from "@/modules/resources";

/** W2.2–W2.6: one WF04 template, five pages. The preview and feature grid share focus. */
export function CapabilityPage({ capability }: { capability: Capability }) {
  return (
    <PlatformShell fx={false}>
      <div className="relative">
        <Ambience />
        <div className="relative">
      <FeatureFocusProvider>
        <CapabilityHero capability={capability} />
        <FeatureGrid capability={capability} />
      </FeatureFocusProvider>
      <ClearerView capability={capability} />
      <ContinueExploring capability={capability} />
      <CapabilityFamily capability={capability} />
      <ClosingCta secondary={{ href: pathOf("platform"), label: "Explore Platform" }} />
            </div>
      </div>
    </PlatformShell>
  );
}
