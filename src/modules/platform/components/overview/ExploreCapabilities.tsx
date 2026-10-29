"use client";

import Link from "next/link";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CAPABILITIES, OVERVIEW } from "../../content";
import { capabilityPath, pathOf } from "../../routes";
import type { Capability } from "../../types";
import { PreviewWindow } from "../capability/CapabilityPreview";
import { AppIcon } from "../mac/AppIcon";
import { Dock } from "../mac/Dock";
import { dockItems } from "../mac/dock-items";
import { PIcon } from "../mac/icons";
import { Reveal } from "../mac/Reveal";
import { AvailabilityBadge, ChevronLink, SectionHeading } from "../shared";

/**
 * WF03 "Explore the platform" as an Apple-style sticky tour: the app window
 * stays pinned while each capability (W2.2–W2.6) scrolls past and swaps it.
 */
export function ExploreCapabilities() {
  const [active, setActive] = useState(0);
  const current = CAPABILITIES[active];

  return (
    <section id="explore" aria-labelledby="explore-title" className="scroll-mt-10 px-4 py-20 sm:px-6 sm:py-28">
      <SectionHeading id="explore-title" title={OVERVIEW.explore.title} summary={OVERVIEW.explore.summary} />

      <div className="mx-auto mt-16 grid max-w-6xl gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div className="hidden lg:block">
          <div className="sticky top-[16vh]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={current.slug}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                aria-hidden="true"
              >
                <PreviewWindow capability={current} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <ol className="space-y-5 lg:space-y-0">
          {CAPABILITIES.map((c, i) => (
            <TourStep key={c.slug} capability={c} index={i} onActive={setActive} />
          ))}
        </ol>
      </div>

      <Reveal className="mt-24 hidden md:block">
        <Dock items={dockItems(CAPABILITIES)} label="Capability pages" />
      </Reveal>

      <Reveal className="mt-12 text-center">
        <ChevronLink href={pathOf("markets")}>See the markets AFVAR covers</ChevronLink>
      </Reveal>
    </section>
  );
}

function TourStep({ capability: c, index, onActive }: { capability: Capability; index: number; onActive: (i: number) => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <li ref={ref} className="flex flex-col justify-center lg:min-h-[76vh]">
      <motion.div
        animate={{ opacity: inView ? 1 : 0.35 }}
        transition={{ duration: 0.25 }}
        className="rounded-[28px] bg-(--card) p-7 lg:rounded-none lg:bg-transparent lg:p-0"
      >
        <AppIcon icon={c.icon} tone={c.tone} size={52} />
        <h3 className="mt-6 text-[32px] font-semibold leading-tight tracking-[-0.03em]">{c.title}</h3>
        <p className="mt-3 text-[17px] leading-relaxed text-(--text-secondary)">{c.summary}</p>
        <ul className="mt-6 space-y-2">
          {c.features.slice(0, 5).map((f) => (
            <li key={f.title} className="flex items-center gap-3 text-[15px] text-(--text-secondary)">
              <PIcon name={f.icon} size={18} className="text-(--accent)" />
              {f.title}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
          <ChevronLink href={capabilityPath(c.slug)}>Learn more about {c.title}</ChevronLink>
          <AvailabilityBadge value="in-development" />
        </div>
        <div className="mt-8 lg:hidden" aria-hidden="true">
          <PreviewWindow capability={c} />
        </div>
      </motion.div>
    </li>
  );
}

/** Capability tile used for the capability family on each capability page. */
export function CapabilityCard({ capability: c }: { capability: Capability }) {
  return (
    <Link href={capabilityPath(c.slug)} className="pf-tile group flex h-full flex-col p-7 transition-colors duration-200 hover:bg-(--surface-2)">
      <AppIcon icon={c.icon} tone={c.tone} size={48} />
      <h3 className="mt-6 text-[19px] font-semibold tracking-[-0.02em]">{c.title}</h3>
      <p className="mt-1.5 flex-1 text-[15px] text-(--text-secondary)">{c.tagline}</p>
      <span className="mt-6 inline-flex items-center gap-0.5 text-[15px] text-(--accent) group-hover:underline">
        Learn more
        <PIcon name="chevron" size={13} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
