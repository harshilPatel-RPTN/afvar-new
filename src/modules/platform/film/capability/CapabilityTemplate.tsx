import type { ReactNode } from "react";
import { GHOST_LINK } from "@/modules/afvarOs";
import { BTN_PRIMARY } from "@/modules/home/kit";
import { SiteFrame } from "@/modules/homeDemo";
import { EarthHorizon } from "../../components/closing/EarthHorizon";
import { REGISTER_URL, pathOf } from "../../routes";
import type { Capability } from "../../types";
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
      closing={
        <EarthHorizon labelledBy="capability-closing-title">
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="capability-closing-title" className="text-[clamp(2.1rem,4.2vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#F5F7F7]">
              Join before launch. <span className="text-[#A3AAAC]">{closing}</span>
            </h2>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-6">
              <a href={REGISTER_URL} className={BTN_PRIMARY}>
                Register Now
              </a>
              <a href={pathOf("platform")} className={GHOST_LINK}>
                Platform overview
              </a>
            </div>
          </div>
        </EarthHorizon>
      }
    >
      {film}
      <FeatureJumpGrid capability={capability} filmId={filmId} actOf={actOf} />
      <OutcomeLine capability={capability} />
      <NotesAndRelated capability={capability} notes={notes} />
      <OtherAreas current={capability.slug} />
    </SiteFrame>
  );
}
