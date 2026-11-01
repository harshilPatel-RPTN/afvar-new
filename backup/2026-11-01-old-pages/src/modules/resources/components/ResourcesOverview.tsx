import Link from "next/link";
import { AppIcon, Dock, REGISTER_URL, PageScene3D, PIcon, Reveal, ScrollWords, SectionHeading } from "@/modules/platform/kit";
import { CATEGORIES, DISCLAIMER, FAQ_GROUPS, HELP, RESOURCES_HERO } from "../content";
import { CategoryTour } from "./CategoryTour";
import { ResourcesClosing } from "./Closing";
import { FaqList } from "./Faq";
import { ResourcesHero } from "./Hero";
import { ResourceDesktop, SearchLauncher } from "./ResourceBrowser";
import { ResourcesShell } from "./ResourcesShell";
import { ResLink } from "./ui";
import { CandleSnake } from "./motion";
import { MarketCard } from "./ui";

const TOP_QUESTIONS = [FAQ_GROUPS[0].items[0], FAQ_GROUPS[0].items[1], FAQ_GROUPS[1].items[0], FAQ_GROUPS[2].items[0], FAQ_GROUPS[5].items[0]];

/** W5.1 · Resources Overview — one destination for each resource category. */
export function ResourcesOverview() {
  return (
    <ResourcesShell>
      <ResourcesHero eyebrow={RESOURCES_HERO.eyebrow} title={RESOURCES_HERO.title} lede={RESOURCES_HERO.lede}>
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
          <Link href="/resources/getting-started" className="rs-primary">
            Get started
          </Link>
          <ResLink href="/resources/guides">Browse product guides</ResLink>
        </div>
        <div className="mt-7">
          <SearchLauncher />
        </div>
      </ResourcesHero>

      {/* Library model: the guidebook the section is about */}
      <section aria-label="Resources illustration" className="px-4 pt-20 sm:px-6 sm:pt-28">
        <PageScene3D
          kind="library"
          bleed
          label="An open guidebook with a candlestick chart drawing itself on one page, a page turning, a reading lens drifting over it, and five resource cards orbiting above."
          caption="Illustration · five resource categories around one guidebook"
          hint="Hover the book, lens or cards"
        />
      </section>

      {/* The working Resources app */}
      <section id="browse" aria-labelledby="browse-title" className="relative scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24">
        <CandleSnake from="right" radius={22} />
        <SectionHeading id="browse-title" title="Find anything in seconds." summary="Every guide, step, answer and troubleshooting topic in one searchable window. Try it — search, use the arrow keys, open what you need." />
        <Reveal className="mx-auto mt-14 max-w-6xl">
          <ResourceDesktop />
        </Reveal>
      </section>

      {/* W5.1.1–W5.1.5 */}
      <section aria-labelledby="categories-title" className="px-4 py-20 sm:px-6 sm:py-24">
        <SectionHeading id="categories-title" title="One destination for each category." summary="Five places, each with one job. Scroll through them." />
        <CategoryTour />
        <Reveal className="mt-24 hidden md:block">
          <Dock items={CATEGORIES.map((c) => ({ href: c.href, label: c.title, icon: c.icon, tone: c.tone }))} label="Resource categories" />
        </Reveal>
      </section>

      {/* Most-asked */}
      <section aria-labelledby="top-faqs-title" className="px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 id="top-faqs-title" className="pf-title">
              Asked most.
            </h2>
            <p className="pf-lede mt-5 max-w-md">Short, straight answers. The full list covers status, markets, devices, launch offers and verification.</p>
            <div className="mt-8">
              <ResLink href="/resources/faqs">See all FAQs</ResLink>
            </div>
          </div>
          <Reveal>
            <FaqList items={TOP_QUESTIONS} defaultOpen={0} />
          </Reveal>
        </div>
      </section>

      {/* Still stuck */}
      <section aria-label="Still stuck" className="relative px-4 py-20 sm:px-6 sm:py-24">
        <CandleSnake from="left" />
        <ScrollWords text="Still stuck? A person reads every request." className="pf-title mx-auto max-w-3xl text-center" />
        <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
          {[
            { icon: "info" as const, tone: "red" as const, title: "Help & Support", body: "Troubleshooting topics, then one shared support destination.", href: "/resources/help" },
            { icon: "message" as const, tone: "green" as const, title: "Contact support", body: "Topic, contact and problem details — in one request.", href: "/resources/help#support" },
            { icon: "users" as const, tone: "slate" as const, title: "General enquiries", body: "Partnerships, press and anything not about the product.", href: "/contact" },
          ].map((t, i) => (
            <MarketCard key={t.title} index={i} delay={i * 0.08} tone={t.tone === "red" ? "down" : "up"} snakeTarget={i === 0}>
              <Link href={t.href} className="group flex h-full flex-col p-7 outline-none focus-visible:ring-2 focus-visible:ring-white/50">
                <AppIcon icon={t.icon} tone={t.tone} size={48} />
                <h3 className="mt-6 text-[19px] font-semibold tracking-[-0.02em]">{t.title}</h3>
                <p className="mt-1.5 flex-1 text-[15px] text-(--text-secondary)">{t.body}</p>
                <span className="mt-6 inline-flex items-center gap-1 text-[14.5px] font-medium text-(--text-primary)">
                  Go
                  <PIcon name="chevron" size={13} weight="bold" className="text-(--accent) transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Link>
            </MarketCard>
          ))}
        </div>
        <Reveal className="mx-auto mt-10 max-w-6xl">
          <div className="flex items-start gap-3 rounded-2xl border border-(--negative)/25 bg-(--negative)/[.05] p-5 text-[14px] leading-relaxed text-(--text-secondary)">
            <PIcon name="shield" size={18} className="mt-0.5 shrink-0 text-[#ff6464]" />
            <p>
              <span className="font-semibold text-(--text-primary)">AFVAR will never</span> {HELP.never[0].charAt(0).toLowerCase() + HELP.never[0].slice(1)}{" "}
              <Link href="/resources/help#never" className="text-(--accent) hover:underline">
                See all four
              </Link>
            </p>
          </div>
          <p className="mt-6 text-center text-[12.5px] leading-relaxed text-(--text-muted)">{DISCLAIMER}</p>
        </Reveal>
      </section>

      <ResourcesClosing
        title="Start with the basics. Go deeper when you need to."
        lede="Register once — then follow your queue, read the guides and be ready for your first session."
        primary={{ label: "Register Now", href: REGISTER_URL }}
        secondary={{ label: "Getting Started", href: "/resources/getting-started" }}
      />
    </ResourcesShell>
  );
}
