import Link from "next/link";
import { AppIcon, PIcon } from "@/modules/platform/kit";
import { getGuide, type TroubleTopic } from "../content";
import { ResourcesClosing } from "./Closing";
import { ArticleHead } from "./ArticleHead";
import { ResourcesTabs } from "./Hero";
import { ResourcesFrame } from "./ResourcesFrame";
import { TroubleshootChecks } from "./TroubleshootChecks";
import { Window } from "./Window";
import { ResLink } from "./ui";
import { MarketCard } from "./ui";

/** Support-form topic each troubleshooting page hands over when the reader is still blocked. */
const SUPPORT_TOPIC: Record<string, string> = {
  "verification-code": "Verification and launch queue",
  "queue-status": "Verification and launch queue",
  "price-looks-wrong": "Market data",
  "workspace-on-small-screen": "Workspace and devices",
  "alert-clarification": "Alerts",
  "positions-not-showing": "Risk and read-only connections",
};

/** W5.8 · Troubleshooting template: problem and affected capability; checks; expected recovery; ways out. */
export function TroubleshootDetail({ topic }: { topic: TroubleTopic }) {
  const guide = topic.guide ? getGuide(topic.guide) : undefined;
  return (
    <ResourcesFrame>
      <ArticleHead
        crumb={[
          { label: "Help & Support", href: "/resources/help" },
          { label: topic.title, href: `/resources/help/${topic.slug}` },
        ]}
        eyebrow="Troubleshooting"
        title={topic.title}
        lede={topic.symptom}
      />
      <ResourcesTabs />

      <div className="mx-auto mt-16 grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[320px_1fr] lg:gap-14">
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Window size="sm" title="The problem" bodyClassName="p-5">
            <div className="flex items-center gap-3">
              <AppIcon icon={topic.icon} tone="red" size={40} />
              <div>
                <p className="text-[12px] text-(--text-muted)">Affected capability</p>
                <p className="text-[13.5px] font-medium">{topic.capability}</p>
              </div>
            </div>
            <p className="mt-4 text-[13.5px] leading-relaxed text-(--text-secondary)">{topic.symptom}</p>
          </Window>
          <div className="rounded-2xl border border-(--accent)/30 bg-(--accent)/[.06] p-5">
            <p className="flex items-center gap-2 text-[12.5px] font-semibold text-(--accent)">
              <PIcon name="check" size={14} weight="bold" />
              Expected recovery
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed">{topic.recovery}</p>
          </div>
        </aside>

        <div>
          <h2 className="text-[13px] font-semibold text-(--text-muted)">Checks and recovery steps</h2>
          <div className="mt-3">
            <TroubleshootChecks topic={topic} supportTopic={SUPPORT_TOPIC[topic.slug] ?? "Something else"} />
          </div>

          {guide && (
            <div className="mt-6"><MarketCard className="block">
<Link href={`/resources/guides/${guide.slug}`} className="group flex items-center gap-5 p-6 outline-none focus-visible:ring-2 focus-visible:ring-white/50">
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-(--text-muted)">Relevant guide</p>
                <p className="mt-1 text-[18px] font-semibold tracking-[-0.015em]">{guide.title}</p>
              </div>
              <PIcon name="chevron" size={18} className="text-(--accent) transition-transform group-hover:translate-x-1" />
            </Link>
</MarketCard></div>
          )}

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            <ResLink href="/resources/help" className="!text-[15px]">
              Back to Help & Support
            </ResLink>
            <ResLink href="/resources/help#support" className="!text-[15px]">
              Still blocked? Contact Support
            </ResLink>
          </div>
        </div>
      </div>

      <div className="h-24" />
      <ResourcesClosing
        title="Fixed? Pick up where you left off."
        lede="Guides, answers and evidence are all one search away."
        primary={{ label: "Browse all resources", href: "/resources#resource-directory" }}
        secondary={{ label: "Help & Support", href: "/resources/help" }}
      />
    </ResourcesFrame>
  );
}
