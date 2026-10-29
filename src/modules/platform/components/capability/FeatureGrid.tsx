"use client";

import { motion } from "framer-motion";
import type { Capability } from "../../types";
import { PIcon } from "../mac/icons";
import { Reveal } from "../mac/Reveal";
import { AvailabilityBadge, PageNote, SectionHeading } from "../shared";
import { PREVIEW_ANCHOR, useFeatureFocus } from "./FeatureFocus";

/**
 * WF04 "Explore this capability": every board section as an Apple feature
 * grid, linked to the preview window — the feature on screen is highlighted
 * here, and each item can open itself in the preview.
 */
export function FeatureGrid({ capability: c }: { capability: Capability }) {
  const { selected, select } = useFeatureFocus();

  const show = (i: number) => {
    select(i, true);
    document.getElementById(PREVIEW_ANCHOR)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section aria-labelledby="features-title" className="px-4 py-20 sm:px-6 sm:py-28">
      <SectionHeading id="features-title" title="Explore this capability." summary={c.tagline} />
      <ul className="mx-auto mt-16 grid max-w-6xl gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {c.features.map((f, i) => {
          const on = i === selected;
          return (
            <Reveal as="li" key={f.title} delay={Math.min(i % 3, 2) * 0.06} className="group relative pt-6">
              <span className="absolute inset-x-0 top-0 h-px bg-(--border-default)" aria-hidden="true" />
              <motion.span
                className="absolute left-0 top-0 h-px bg-(--accent)"
                initial={false}
                animate={{ width: on ? "100%" : "0%" }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                aria-hidden="true"
              />
              <motion.span className="inline-block" animate={{ scale: on ? 1.12 : 1, rotate: on ? -6 : 0 }} transition={{ type: "spring", stiffness: 420, damping: 20 }}>
                <PIcon name={f.icon} size={30} weight={on ? "fill" : "duotone"} className="text-(--accent)" />
              </motion.span>
              <h3 className="mt-4 text-[19px] font-semibold tracking-[-0.02em]">{f.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-(--text-secondary)">{f.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <AvailabilityBadge value={f.availability} />
                <button
                  type="button"
                  onClick={() => show(i)}
                  aria-current={on ? "true" : undefined}
                  className="inline-flex items-center gap-0.5 text-[14px] text-(--accent) hover:underline"
                >
                  {on ? "Showing in preview" : "See it in the preview"}
                  <PIcon name="chevron" size={12} weight="bold" className={`transition-transform ${on ? "-rotate-90" : "group-hover:translate-x-0.5"}`} />
                </button>
              </div>
            </Reveal>
          );
        })}
      </ul>
      {c.note && (
        <Reveal className="mt-16">
          <PageNote>{c.note}</PageNote>
        </Reveal>
      )}
    </section>
  );
}
