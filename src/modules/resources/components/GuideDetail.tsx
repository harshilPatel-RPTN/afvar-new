import Link from "next/link";
import { AppIcon, PIcon, Reveal } from "@/modules/platform/kit";
import { GUIDE_GROUPS, getGuide, type Guide } from "../content";
import { ResourcesClosing } from "./Closing";
import { GuideSample } from "./GuideSamples";
import { GuideSteps } from "./GuideSteps";
import { ArticleHead } from "./ArticleHead";
import { ResourcesTabs } from "./Hero";
import { ResourcesFrame } from "./ResourcesFrame";
import { Window } from "./Window";
import { ResLink } from "./ui";
import { MarketCard } from "./ui";

/** W5.7 · Guide Detail template: task, access and prerequisites; ordered steps; expected result; next task. */
export function GuideDetail({ guide }: { guide: Guide }) {
  const group = GUIDE_GROUPS.find((g) => g.id === guide.group)!;
  const next = guide.next ? getGuide(guide.next) : undefined;
  return (
    <ResourcesFrame>
      <ArticleHead crumb={[
          { label: "Product Guides", href: "/resources/guides" },
          { label: guide.title, href: `/resources/guides/${guide.slug}` },
        ]} eyebrow={group.title} title={guide.title} lede={guide.task} />
      <ResourcesTabs />

      <div className="mx-auto mt-16 grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[320px_1fr] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Window size="sm" title="Before you start" bodyClassName="p-5">
            <div className="flex items-center gap-3">
              <AppIcon icon={group.icon} tone={group.tone} size={40} />
              <div>
                <p className="text-[12px] text-(--text-muted)">Supported access</p>
                <p className="text-[13.5px] font-medium">{guide.access}</p>
              </div>
            </div>
            <p className="mt-5 text-[11.5px] font-semibold text-(--text-muted)">Prerequisites</p>
            <ul className="mt-2 space-y-2">
              {guide.prerequisites.map((p) => (
                <li key={p} className="flex gap-2 text-[13.5px] leading-snug text-(--text-secondary)">
                  <PIcon name="check" size={14} className="mt-0.5 shrink-0 text-(--accent)" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-center gap-2 text-[12px] text-(--text-muted)">
              <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" />
              In development · describes the planned OS
            </p>
          </Window>
        </aside>

        <div>
          <h2 className="text-[13px] font-semibold text-(--text-muted)">Steps</h2>
          <div className="mt-3">
            <GuideSteps steps={guide.steps} />
          </div>

          {guide.sample && (
            <Reveal className="mt-12">
              <GuideSample kind={guide.sample} />
              <p className="mt-3 text-[12px] text-(--text-muted)">Illustration · sample, not live data. Try it.</p>
            </Reveal>
          )}

          <Reveal className="mt-12 rounded-2xl border border-(--accent)/30 bg-(--accent)/[.06] p-6">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-(--accent)">
              <PIcon name="check" size={15} weight="bold" />
              Expected result
            </p>
            <p className="mt-2 text-[16px] leading-relaxed">{guide.result}</p>
          </Reveal>

          {next && (
            <Reveal className="mt-6">
              <MarketCard className="block">
<Link href={`/resources/guides/${next.slug}`} className="group flex items-center gap-5 p-6 outline-none focus-visible:ring-2 focus-visible:ring-white/50">
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-(--text-muted)">Next related task</p>
                  <p className="mt-1 text-[18px] font-semibold tracking-[-0.015em]">{next.title}</p>
                </div>
                <PIcon name="chevron" size={18} className="text-(--accent) transition-transform group-hover:translate-x-1" />
              </Link>
</MarketCard>
            </Reveal>
          )}

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            <ResLink href="/resources/guides" className="!text-[15px]">
              Back to Product Guides
            </ResLink>
            <ResLink href={group.capability} className="!text-[15px]">
              Relevant capability
            </ResLink>
            <ResLink href="/resources/help" className="!text-[15px]">
              Problem unresolved? Get help
            </ResLink>
          </div>
        </div>
      </div>

      <div className="h-24" />
      <ResourcesClosing
        title="Learn it once. Find it again in seconds."
        lede="Every guide, answer and troubleshooting topic lives in one searchable place."
        primary={{ label: "Browse all resources", href: "/resources#browse" }}
        secondary={{ label: "Product Guides", href: "/resources/guides" }}
      />
    </ResourcesFrame>
  );
}
