import Link from "next/link";
import { AppIcon, PIcon, Reveal, SectionHeading } from "@/modules/platform/kit";
import { DISCLAIMER, HELP, TROUBLESHOOTING } from "../content";
import { ResourcesClosing } from "./Closing";
import { ResourcesHero, ResourcesTabs } from "./Hero";
import { ResourcesShell } from "./ResourcesShell";
import { SupportForm } from "./SupportForm";
import { Window } from "./Window";
import { ResLink } from "./ui";
import { CandleSnake } from "./motion";
import { MarketCard } from "./ui";

function LinkGroup({ title, items }: { title: string; items: readonly { title: string; body: string; href: string }[] }) {
  return (
    <Window size="sm" title={title} bodyClassName="p-3">
      <ul className="pf-group">
        {items.map((item) => (
          <li key={item.title}>
            <Link href={item.href} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-white/[.03]">
              <span className="flex-1">
                <span className="block text-[14.5px] font-medium">{item.title}</span>
                <span className="block text-[12.5px] text-(--text-muted)">{item.body}</span>
              </span>
              <PIcon name="chevron" size={13} className="text-(--text-muted) transition-transform group-hover:translate-x-0.5 group-hover:text-(--accent)" />
            </Link>
          </li>
        ))}
      </ul>
    </Window>
  );
}

/** W5.6 · Help & Support: troubleshooting topics, account and preview help, one shared support destination. */
export function HelpPage() {
  return (
    <ResourcesShell>
      <ResourcesHero sub crumb={[{ label: "Help & Support", href: "/resources/help" }]} eyebrow="Help & Support" title={HELP.title} lede={HELP.lede} />
      <ResourcesTabs />

      {/* W5.6.1 */}
      <section aria-labelledby="topics-title" className="relative px-4 pt-20 sm:px-6">
        <CandleSnake from="right" />
        <SectionHeading id="topics-title" title="Troubleshooting topics." summary="Pick the problem. Each topic walks you through checks and recovery." />
        <ul className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TROUBLESHOOTING.map((t, i) => (
            <MarketCard as="li" key={t.slug} index={i} delay={(i % 3) * 0.07} tone={i % 2 ? "down" : "up"} snakeTarget={i === 0}>
              <Link href={`/resources/help/${t.slug}`} className="group flex h-full flex-col p-6 outline-none focus-visible:ring-2 focus-visible:ring-white/50">
                <AppIcon icon={t.icon} tone={i % 2 ? "red" : "green"} size={42} />
                <p className="mt-5 text-[12px] text-(--text-muted)">{t.capability}</p>
                <h3 className="mt-1 text-[17.5px] font-semibold leading-snug tracking-[-0.015em]">{t.title}</h3>
                <span className="mt-auto inline-flex items-center gap-1 pt-5 text-[14px] font-medium text-(--text-primary)">
                  Fix it
                  <PIcon name="chevron" size={12} weight="bold" className="text-(--accent) transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </MarketCard>
          ))}
        </ul>
      </section>

      {/* W5.6.2 + W5.6.3 */}
      <section aria-label="Account and preview help" className="px-4 pt-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <Reveal>
            <LinkGroup title="Account, verification & launch status" items={HELP.account} />
          </Reveal>
          <Reveal delay={0.06}>
            <LinkGroup title="Available product & preview help" items={HELP.preview} />
          </Reveal>
        </div>
      </section>

      {/* W5.6.4 */}
      <section id="support" aria-labelledby="support-title" className="scroll-mt-32 px-4 pt-28 sm:px-6">
        <SectionHeading id="support-title" title="Contact support." summary="One shared destination for product and account problems. Tell us the topic, how to reach you and what happened." />
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Reveal>
            <SupportForm />
          </Reveal>
          <Reveal delay={0.06} className="space-y-6">
            <div id="never" className="scroll-mt-32 rounded-2xl border border-(--negative)/30 bg-(--negative)/[.06] p-6">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-(--afvar-loss)">
                <PIcon name="shield" size={16} />
                AFVAR support will never
              </p>
              <ul className="mt-4 space-y-3">
                {HELP.never.map((n) => (
                  <li key={n} className="flex gap-2.5 text-[13.5px] leading-relaxed text-(--text-secondary)">
                    <PIcon name="close" size={13} className="mt-1 shrink-0 text-(--afvar-loss)" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
            <MarketCard index={1}>
              <div className="p-6">
              <AppIcon icon="users" tone="slate" size={40} />
              <p className="mt-4 text-[16px] font-semibold">General company enquiries</p>
              <p className="mt-1 text-[13.5px] text-(--text-secondary)">Partnerships, press and anything not about the product go to Contact Us.</p>
              <div className="mt-4">
                <ResLink href="/contact" className="!text-[15px]">
                  Contact Us
                </ResLink>
              </div>
              </div>
            </MarketCard>
          </Reveal>
        </div>
        <p className="mx-auto mt-12 max-w-3xl text-center text-[12.5px] leading-relaxed text-(--text-muted)">{DISCLAIMER}</p>
      </section>

      <div className="h-16" />
      <ResourcesClosing
        title="Most problems have a two-minute fix."
        lede="Start with a guide, check the answers, then ask — in that order, you're rarely stuck for long."
        primary={{ label: "Browse all resources", href: "/resources#browse" }}
        secondary={{ label: "Product Guides", href: "/resources/guides" }}
      />
    </ResourcesShell>
  );
}
