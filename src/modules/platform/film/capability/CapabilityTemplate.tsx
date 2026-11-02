import type { ReactNode } from "react";
import { ClosingCopy, SiteFrame } from "@/modules/homeDemo";
import { pathOf } from "../../routes";
import type { Capability } from "../../types";
import { PageProgress } from "../motion";
import { FeatureJumpGrid, NotesAndRelated, OtherAreas, OutcomeLine } from "./sections";

/**
 * W2.2–W2.6 in the AI OS theme: one template, five pages. The home's frame
 * (navbar, live ticker, sound, Earth closing, footer), a short film led by the
 * page's cores, then the features (each jumps to its act), the outcome, notes
 * and related links, and the other four areas.
 */
export function CapabilityTemplate({
  capability,
  film,
  filmId,
  actOf,
  notes = [],
  closing,
}: {
  capability: Capability;
  /** The page's film (a client component built on CapFilmShell). */
  film: ReactNode;
  /** Section id of the film, for the feature cards' jumps. */
  filmId: string;
  /** Feature title → the act that shows it. */
  actOf: Record<string, string>;
  /** Page-specific notes (sources, freshness, limits). */
  notes?: readonly string[];
  /** Second half of the closing headline. */
  closing: string;
}) {
  return (
    <SiteFrame
      closing={<ClosingCopy title="Join before launch." soft={closing} second={{ label: "Platform overview", href: pathOf("platform") }} />}
    >
      <PageProgress />
      {film}
      <FeatureJumpGrid capability={capability} filmId={filmId} actOf={actOf} />
      <OutcomeLine capability={capability} />
      <NotesAndRelated capability={capability} notes={notes} />
      <OtherAreas current={capability.slug} />
    </SiteFrame>
  );
}
