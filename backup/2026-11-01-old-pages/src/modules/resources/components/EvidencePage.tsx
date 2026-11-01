import type { ReactNode } from "react";
import { AppIcon, PIcon, Reveal, type PlatformIcon } from "@/modules/platform/kit";
import { EVIDENCE } from "../content";
import { ResourcesClosing } from "./Closing";
import { BadgeSample, VerdictSample } from "./GuideSamples";
import { ResourcesHero, ResourcesTabs } from "./Hero";
import { ResourcesShell } from "./ResourcesShell";
import { SectionSpy } from "./SectionSpy";
import { Window } from "./Window";
import { ResLink } from "./ui";
import { MarketCard } from "./ui";

const SECTIONS = [
  { id: "sources", title: "Sources" },
  { id: "freshness", title: "Freshness" },
  { id: "analysis", title: "Analysis" },
  { id: "records", title: "Records" },
  { id: "backtest", title: "Backtests" },
] as const;

function Block({ id, refId, icon, title, lede, children, aside }: { id: string; refId: string; icon: PlatformIcon; title: string; lede: string; children?: ReactNode; aside: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal>
          <AppIcon icon={icon} tone="green" size={48} />
          <p className="mt-6 text-[12.5px] font-semibold text-(--text-muted)">{refId}</p>
          <h2 id={`${id}-title`} className="mt-1 text-[clamp(1.8rem,3.2vw,2.6rem)] font-semibold leading-tight tracking-[-0.03em]">
            {title}
          </h2>
          <p className="pf-lede mt-4">{lede}</p>
          {children}
        </Reveal>
        <Reveal delay={0.08}>{aside}</Reveal>
      </div>
    </section>
  );
}

/** W5.4 · Sources & Evidence — customer evidence only; no model or cache internals. */
export function EvidencePage() {
  return (
    <ResourcesShell>
      <ResourcesHero sub crumb={[{ label: "Sources & Evidence", href: "/resources/sources-evidence" }]} eyebrow="Sources & Evidence" title={EVIDENCE.title} lede={EVIDENCE.lede} />
      <ResourcesTabs />
      <SectionSpy sections={SECTIONS} label="Evidence sections" />

      <Block
        id="sources"
        refId="W5.4.1"
        icon="file"
        title="Data sources & attribution"
        lede="Every market number travels with its provenance envelope. Hover a field to see what it tells you."
        aside={<BadgeSample />}
      >
        <ul className="mt-6 space-y-2.5 text-[15px] text-(--text-secondary)">
          {["Source, venue and currency", "Observation time in UTC", "Delay label and market open or closed", "Cache age — staleness is computed, never guessed"].map((t) => (
            <li key={t} className="flex gap-2.5">
              <PIcon name="check" size={16} className="mt-0.5 shrink-0 text-(--accent)" />
              {t}
            </li>
          ))}
        </ul>
      </Block>

      <Block
        id="freshness"
        refId="W5.4.2"
        icon="clock"
        title="Freshness, delays & missing data"
        lede="A number is only as useful as its age. These labels say exactly how fresh each one is — and when there is nothing trustworthy to show."
        aside={
          <Window title="Labels" bodyClassName="p-4 sm:p-5">
            <ul className="pf-group">
              {EVIDENCE.labels.map((l) => (
                <li key={l.id} className="flex items-start gap-4 px-4 py-3.5">
                  <span className="rs-chip mt-0.5 w-[112px] shrink-0 justify-center" data-tone={l.tone}>
                    {l.label}
                  </span>
                  <span className="text-[13.5px] leading-relaxed text-(--text-secondary)">{l.body}</span>
                </li>
              ))}
            </ul>
          </Window>
        }
      >
        <MarketCard className="mt-6 block" tone="down">
          <p className="p-5 text-[14.5px] leading-relaxed text-(--text-secondary)">
            <span className="font-semibold text-(--text-primary)">Missing means missing.</span> When no trustworthy value exists, AFVAR shows the gap instead of filling it with a guess.
          </p>
        </MarketCard>
      </Block>

      <Block
        id="analysis"
        refId="W5.4.3"
        icon="lightbulb"
        title="Understanding the analysis"
        lede="An analysis states its view, where it would be wrong, and where every number came from. Tap each part of the sample."
        aside={<VerdictSample />}
      >
        <p className="mt-6 text-[15px] leading-relaxed text-(--text-secondary)">
          AFVAR never says “buy” or “sell”. It observes, analyses and explains — the decision is always yours.
        </p>
      </Block>

      <Block
        id="records"
        refId="W5.4.4"
        icon="check"
        title="Measured records: scope and limitations"
        lede="Calls are graded in public, by code, against what price actually did — and a record has limits worth knowing."
        aside={
          <div className="space-y-5">
            <Window size="sm" title="How calls are graded" bodyClassName="p-5">
              <ul className="space-y-3">
                {EVIDENCE.records.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[13.5px] leading-relaxed text-(--text-secondary)">
                    <PIcon name="check" size={15} className="mt-0.5 shrink-0 text-(--accent)" />
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-xl bg-black/30 p-4">
                <p className="text-[11px] font-semibold text-(--text-muted)">How a record reads · format example</p>
                <p className="mt-1.5 font-mono text-[13px]">{EVIDENCE.records.format}</p>
              </div>
            </Window>
            <Window size="sm" title="Limitations" bodyClassName="p-5">
              <ul className="space-y-3">
                {EVIDENCE.records.limits.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[13.5px] leading-relaxed text-(--text-secondary)">
                    <PIcon name="info" size={15} className="mt-0.5 shrink-0 text-[#ff6464]" />
                    {p}
                  </li>
                ))}
              </ul>
            </Window>
          </div>
        }
      />

      <Block
        id="backtest"
        refId="W5.4.5"
        icon="flask"
        title="Backtest assumptions"
        lede={EVIDENCE.backtest.intro}
        aside={
          <Window title="Assumptions stated with every result" toolbar={<span className="rs-chip">IN DEVELOPMENT</span>} bodyClassName="p-4 sm:p-5">
            <ul className="pf-group">
              {EVIDENCE.backtest.fields.map((f, i) => (
                <li key={f} className="flex items-center gap-3 px-4 py-3 text-[14px]">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white/[.06] text-[11px] tabular-nums text-(--text-muted)">{i + 1}</span>
                  <span className="flex-1">{f}</span>
                  <span className="text-[12px] text-(--text-muted)">Stated</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[12px] text-(--text-muted)">No backtest results are published yet.</p>
          </Window>
        }
      >
        <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
          <ResLink href="/market" className="!text-[15px]">
            Related market outputs
          </ResLink>
          <ResLink href="/pricing" className="!text-[15px]">
            Commercial allowances
          </ResLink>
        </div>
      </Block>

      <ResourcesClosing
        title="Evidence first. Opinions never."
        lede="Every quote shows its source and freshness. Every analysis is graded publicly — including every WAIT."
        primary={{ label: "See market coverage", href: "/market" }}
        secondary={{ label: "Read the FAQs", href: "/resources/faqs" }}
      />
    </ResourcesShell>
  );
}
