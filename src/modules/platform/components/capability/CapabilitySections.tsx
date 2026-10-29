import Link from "next/link";
import { CAPABILITIES } from "../../content";
import { pathOf } from "../../routes";
import type { Capability } from "../../types";
import { Dock } from "../mac/Dock";
import { dockItems } from "../mac/dock-items";
import { PIcon } from "../mac/icons";
import { ScrollWords } from "../mac/motion-kit";
import { Reveal } from "../mac/Reveal";
import { CapabilityCard } from "../overview/ExploreCapabilities";
import { PageNote, SectionHeading } from "../shared";
import { Scene3D } from "./Scene3D";

/** WF04 "From information to a clearer view": key outcome + supporting preview. */
export function ClearerView({ capability: c }: { capability: Capability }) {
  return (
    <section aria-labelledby="clearer-title" className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <h2 id="clearer-title" className="text-center text-[17px] font-semibold text-(--accent)">
          {c.outcome.title}
        </h2>
        <ScrollWords text={c.outcome.description} className="mt-6 text-center text-[clamp(2rem,4.6vw,3.75rem)] font-semibold leading-[1.1] tracking-[-0.035em]" />
      </div>
      <Reveal className="mx-auto mt-20 max-w-5xl">
        {/* No card around the 3D model: it sits directly on the page. */}
        <div className="text-center">
          <p className="text-[13px] font-semibold text-(--text-muted)">{c.preview.title}</p>
          <p className="mt-1 text-[17px] text-(--text-secondary)">{c.preview.description}</p>
        </div>
        <Scene3D capability={c} />
      </Reveal>
      <Reveal className="mt-10">
        <PageNote>Feature availability and sources will be confirmed before publication.</PageNote>
      </Reveal>
    </section>
  );
}

/** WF04 "Continue exploring" — the page's onward routes (W10.B). */
export function ContinueExploring({ capability: c }: { capability: Capability }) {
  return (
    <section aria-labelledby="continue-title" className="px-4 py-24 sm:px-6 sm:py-28">
      <SectionHeading id="continue-title" title="Continue exploring." />
      <ul className={`mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 ${c.related.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {c.related.map((r, i) => (
          <Reveal as="li" key={`${r.route}-${r.title}`} delay={i * 0.06}>
            <Link href={pathOf(r.route)} className="pf-tile group flex h-full flex-col p-7 transition-colors duration-200 hover:bg-(--surface-2)">
              <PIcon name={r.icon} size={28} weight="duotone" className="text-(--accent)" />
              <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.02em]">{r.title}</h3>
              <p className="mt-1.5 flex-1 text-[15px] text-(--text-secondary)">{r.description}</p>
              <span className="mt-6 inline-flex items-center gap-0.5 text-[15px] text-(--accent) group-hover:underline">
                Learn more
                <PIcon name="chevron" size={13} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/** WF04 "Capability family": the other four capability pages. */
export function CapabilityFamily({ capability: c }: { capability: Capability }) {
  const others = CAPABILITIES.filter((o) => o.slug !== c.slug);
  return (
    <section aria-labelledby="family-title" className="px-4 py-24 sm:px-6 sm:py-28">
      <SectionHeading id="family-title" title="Capability family" summary="One AI operating layer across every capability." />
      <Reveal className="mt-14 hidden md:block">
        <Dock items={dockItems(CAPABILITIES)} label="All capability pages" />
      </Reveal>
      <ul className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {others.map((o, i) => (
          <Reveal as="li" key={o.slug} delay={i * 0.06}>
            <CapabilityCard capability={o} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
