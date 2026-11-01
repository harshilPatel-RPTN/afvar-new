// The 12 site pages: each one's own 3D hero, its OS sections, the working
// links it keeps, and the Earth closing.
import { CATEGORIES, FAQ_GROUPS, GUIDE_GROUPS, GUIDES, TROUBLESHOOTING } from "@/modules/resources/kit";
import { PageHero, type CapHeroText } from "../hero/CapHero";
import { AboutSections, ContactSections, PricingSections } from "../sections/CompanySections";
import { EnquiryForm } from "@/modules/company/kit";
import { PfScope } from "./PfScope";
import { BriefsSections, GroupSections, InstrumentSections, MarketsSections } from "../sections/MarketSections";
import { EvidenceSections, FaqSections, GuidesSections, HelpSections, HubSections, StartSections } from "../sections/ResourceSections";
import { GROUP, GROUP_IDS, INST, type GroupId } from "../sections/marketMap";
import { DirCard, Directory, SitePage } from "./SitePage";

const RES_CRUMB = { label: "Resources", href: "/resources" };

/* ------------------------------------------------------------- Company */

const ABOUT_T: CapHeroText = {
  eyebrow: "About AFVAR",
  title: "About AFVAR.",
  gold: "Built so every number can defend itself.",
  body: "A small team in India building one desk for international markets, where analysis carries its own evidence and the trader keeps every decision.",
  short: "A small team in India building one desk where analysis carries its own evidence.",
  facts: ["Pre-launch", "Registered in India", "English · हिन्दी"],
  second: { label: "Contact the team", href: "/contact" },
};
export function AboutFilmPage() {
  return <SitePage id="about" film={<><PageHero kind="about" id="about-hero" label="About AFVAR" text={ABOUT_T} /><AboutSections /></>} closing="Be early." soft="Join the launch queue." second={{ label: "Contact the team", href: "/contact" }} />;
}

const PRICING_T: CapHeroText = {
  eyebrow: "Pricing",
  title: "Pricing.",
  gold: "Free to start. Pay when the desk earns it.",
  body: "Three tiers on the same desk, from free to $500 a month. Every price on this page is indicative until launch, and nobody pays before then.",
  short: "Three tiers, from free to $500 a month — indicative until launch.",
  facts: ["No payment before launch", "Indicative prices", "Two launch offers"],
  second: { label: "Compare tiers", href: "#s03-side-by-side" },
};
export function PricingFilmPage() {
  return <SitePage id="pricing" film={<><PageHero kind="pricing" id="pricing-hero" label="Pricing" text={PRICING_T} /><PricingSections /></>} closing="Register free." soft="Choose a tier at launch." second={{ label: "Explore the platform", href: "/platform" }} />;
}

/* ------------------------------------------------------------- Markets */

const MARKETS_T: CapHeroText = {
  eyebrow: "Markets",
  title: "Markets.",
  gold: "Ten instruments, three groups.",
  body: "Commodities, forex and crypto on real hourly candles — each price with its status and the place it came from.",
  short: "Commodities, forex and crypto on real hourly candles, each price labelled.",
  facts: ["Real hourly candles", "Commodities · Forex · Crypto", "Times in IST"],
  second: { label: "See the groups", href: "#market-groups" },
};
export function MarketsFilmPage() {
  return (
    <SitePage
      id="markets"
      film={<><PageHero kind="markets" id="markets-hero" label="Markets" text={MARKETS_T} /><MarketsSections /></>}
      after={
        <Directory id="market-groups" title="Open a group." soft="Or go straight to an instrument.">
          <div className="grid gap-4 md:grid-cols-3">
            {GROUP_IDS.map((g) => (
              <div key={g} className="space-y-3">
                <DirCard href={`/market/${g}`} tag={GROUP[g].short} title={GROUP[g].name} />
                {GROUP[g].items.map((s) => (
                  <DirCard key={s} href={`/market/${g}/${s}`} tag={INST[s].sym} title={INST[s].name} />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-6">
            <DirCard href="/market/briefs" tag="Editions" title="Market briefs" />
          </div>
        </Directory>
      }
      closing="Watch the markets with AFVAR."
      soft="Register for launch."
      second={{ label: "Market data on the platform", href: "/platform/market-data" }}
    />
  );
}

const GROUP_T: Record<GroupId, { gold: string; body: string }> = {
  commodities: { gold: "Metals and energy.", body: "Gold, Silver and crude oil — priced in dollars and moved by rates, supply and the dollar itself." },
  forex: { gold: "Five major pairs.", body: "EUR/USD, USD/JPY, GBP/USD, AUD/USD and NZD/USD — each one two economies in a single price." },
  crypto: { gold: "Open every hour.", body: "Bitcoin and Ether, trading through nights and weekends, when fewer people are watching." },
};
export function MarketGroupFilmPage({ group }: { group: GroupId }) {
  const g = GROUP[group];
  const t: CapHeroText = {
    eyebrow: `Markets · ${g.name}`,
    title: `${g.name}.`,
    gold: GROUP_T[group].gold,
    body: GROUP_T[group].body,
    short: `${g.items.length} instruments · ${g.short.toLowerCase()}.`,
    facts: [`${g.items.length} instruments`, "Real hourly candles", "Times in IST"],
    second: { label: "See the instruments", href: "#group-instruments" },
    crumb: [{ label: "Markets", href: "/market" }, { label: g.name }],
  };
  return (
    <SitePage
      id={`group-${group}`}
      film={<><PageHero kind="group" id={`${group}-hero`} label={g.name} text={t} /><GroupSections group={group} /></>}
      after={
        <Directory id="group-instruments" title={`Instruments in ${g.name}.`}>
          <div className="grid gap-4 md:grid-cols-3">
            {g.items.map((s) => (
              <DirCard key={s} href={`/market/${group}/${s}`} tag={INST[s].sym} title={INST[s].name} />
            ))}
            <DirCard href="/market" tag="All groups" title="Markets" />
          </div>
        </Directory>
      }
      closing={`Follow ${g.name.toLowerCase()} on AFVAR.`}
      soft="Register for launch."
      second={{ label: "All markets", href: "/market" }}
    />
  );
}

export function InstrumentFilmPage({ slug }: { slug: string }) {
  const i = INST[slug];
  const g = GROUP[i.group];
  const t: CapHeroText = {
    eyebrow: `${g.name} · ${i.sym}`,
    title: `${i.name}.`,
    gold: i.key ? `${i.sym}, candle by candle.` : `${i.sym} · source pending.`,
    body: i.key ? `The ${i.name} page: real hourly candles, the levels code finds in them, the events that move it and an alert you can set.` : `${i.name} is listed in coverage. Its candles appear here once a licensed source is connected.`,
    short: i.key ? `Real hourly candles for ${i.name}, its levels and its events.` : `${i.name} is listed; candles follow once a source is connected.`,
    facts: [i.key ? "Real hourly candles" : "No source yet", g.name, "Times in IST"],
    second: { label: "Read the chart", href: "#s02-price" },
    crumb: [{ label: "Markets", href: "/market" }, { label: g.name, href: `/market/${i.group}` }, { label: i.name }],
  };
  return (
    <SitePage
      id={`inst-${slug}`}
      film={<><PageHero kind="instrument" id={`${slug}-hero`} label={i.name} text={t} /><InstrumentSections slug={slug} /></>}
      after={
        <Directory id="instrument-more" title="Keep going.">
          <div className="grid gap-4 md:grid-cols-3">
            <DirCard href={`/market/${i.group}`} tag="Group" title={g.name} />
            <DirCard href="/market/briefs" tag="Editions" title="Market briefs" />
            <DirCard href="/resources/sources-evidence" tag="Resources" title="Sources & evidence" />
          </div>
        </Directory>
      }
      closing={`Watch ${i.name} with AFVAR.`}
      soft="Register for launch."
      second={{ label: g.name, href: `/market/${i.group}` }}
    />
  );
}

const BRIEFS_T: CapHeroText = {
  eyebrow: "Market briefs",
  title: "Market briefs.",
  gold: "Two minutes, every line sourced.",
  body: "Morning, evening, weekly and before big releases — short editions you can check line by line.",
  short: "Short editions on a fixed clock, every line numbered to its source.",
  facts: ["Sources on every line", "Morning · evening · weekly", "IST times"],
  second: { label: "How an edition reads", href: "#s03-inside-an-edition" },
  crumb: [{ label: "Markets", href: "/market" }, { label: "Briefs" }],
};
export function BriefsFilmPage() {
  return (
    <SitePage
      id="briefs"
      film={<><PageHero kind="briefs" id="briefs-hero" label="Market briefs" text={BRIEFS_T} /><BriefsSections /></>}
      after={
        <Directory id="briefs-markets" title="Markets the briefs cover.">
          <div className="grid gap-4 md:grid-cols-3">
            {GROUP_IDS.map((g) => (
              <DirCard key={g} href={`/market/${g}`} tag={GROUP[g].short} title={GROUP[g].name} />
            ))}
          </div>
        </Directory>
      }
      closing="Read the first edition at launch."
      soft="Register now."
      second={{ label: "Research on the platform", href: "/platform/research" }}
    />
  );
}

/* ----------------------------------------------------------- Resources */

const HUB_T: CapHeroText = {
  eyebrow: "Resources",
  title: "Resources.",
  gold: "Learn the desk before you sit at it.",
  body: "Getting started, step-by-step guides, how numbers are checked, quick answers and a way to reach a person.",
  short: "Start, guides, evidence, answers and help — five places in one.",
  facts: ["Five categories", "One search", "One support desk"],
  second: { label: "Browse the five", href: "#resource-directory" },
};
export function ResourcesFilmPage() {
  return (
    <SitePage
      id="resources"
      film={<><PageHero kind="resources" id="resources-hero" label="Resources" text={HUB_T} /><HubSections /></>}
      after={
        <Directory id="resource-directory" title="The five resource pages.">
          <div className="grid gap-4 md:grid-cols-3">
            {CATEGORIES.map((c) => (
              <DirCard key={c.id} href={c.href} title={c.title} />
            ))}
          </div>
        </Directory>
      }
      closing="Ready when you are."
      soft="Register for launch."
      second={{ label: "Getting started", href: "/resources/getting-started" }}
    />
  );
}

const START_T: CapHeroText = {
  eyebrow: "Getting started",
  title: "Getting started.",
  gold: "Five steps from sign-up to first session.",
  body: "Verify, wait your turn, decide on identity checks, look around the preview, then sign in on invitation day.",
  short: "Verify, wait your turn, look around, then sign in on invitation day.",
  facts: ["No payment", "Queue order only", "Desktop for the workspace"],
  second: { label: "Product guides", href: "/resources/guides" },
  crumb: [RES_CRUMB, { label: "Getting started" }],
};
export function StartFilmPage() {
  return <SitePage id="start" film={<><PageHero kind="start" id="start-hero" label="Getting started" text={START_T} /><StartSections /></>} closing="Step one takes two minutes." soft="Register now." second={{ label: "Product guides", href: "/resources/guides" }} />;
}

const GUIDES_T: CapHeroText = {
  eyebrow: "Product guides",
  title: "Product guides.",
  gold: "Short steps for each task.",
  body: "Charts, alerts, risk, community and connections — what you need first, the steps, and what you will have at the end.",
  short: "What you need, the steps, and what you will have at the end.",
  facts: [`${GUIDES.length} guides`, "Five groups", "Planned workspace"],
  second: { label: "All guides", href: "#all-guides" },
  crumb: [RES_CRUMB, { label: "Product guides" }],
};
export function GuidesFilmPage() {
  return (
    <SitePage
      id="guides"
      film={<><PageHero kind="guides" id="guides-hero" label="Product guides" text={GUIDES_T} /><GuidesSections /></>}
      after={
        <Directory id="all-guides" title="All guides.">
          <div className="grid gap-8 md:grid-cols-2">
            {GUIDE_GROUPS.map((g) => (
              <div key={g.id}>
                <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#A8DEC2]">{g.title}</p>
                <div className="space-y-3">
                  {GUIDES.filter((x) => x.group === g.id).map((x) => (
                    <DirCard key={x.slug} href={`/resources/guides/${x.slug}`} title={x.title} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Directory>
      }
      closing="Every task, a few clear steps."
      soft="Register for launch."
      second={{ label: "Help & support", href: "/resources/help" }}
    />
  );
}

const HELP_T: CapHeroText = {
  eyebrow: "Help & support",
  title: "Help & support.",
  gold: "Fix it fast, or ask a person.",
  body: "Find your problem, run the checks in order, and if it is still stuck, send one request.",
  short: "Find your problem, run the checks, then ask a person.",
  facts: ["Six topics", "Checks in order", "One support desk"],
  second: { label: "All topics", href: "#all-topics" },
  crumb: [RES_CRUMB, { label: "Help & support" }],
};
export function HelpFilmPage() {
  return (
    <SitePage
      id="help"
      film={<><PageHero kind="help" id="help-hero" label="Help & support" text={HELP_T} /><HelpSections /></>}
      after={
        <Directory id="all-topics" title="All troubleshooting topics.">
          <div className="grid gap-4 md:grid-cols-2">
            {TROUBLESHOOTING.map((t) => (
              <DirCard key={t.slug} href={`/resources/help/${t.slug}`} tag={t.capability} title={t.title} />
            ))}
          </div>
        </Directory>
      }
      closing="Still stuck?"
      soft="Contact the team."
      second={{ label: "Contact", href: "/contact" }}
    />
  );
}

const FAQ_COUNT = FAQ_GROUPS.reduce((n, g) => n + g.items.length, 0);
const FAQS_T: CapHeroText = {
  eyebrow: "FAQs",
  title: "FAQs.",
  gold: "Short answers first.",
  body: `${FAQ_COUNT} questions in six groups — status, markets, devices, offers, verification and your place in the queue.`,
  short: `${FAQ_COUNT} questions in six groups, short answers first.`,
  facts: [`${FAQ_COUNT} answers`, "Six groups", "Plain words"],
  second: { label: "Start with status", href: "#status" },
  crumb: [RES_CRUMB, { label: "FAQs" }],
};
export function FaqsFilmPage() {
  return <SitePage id="faqs" film={<><PageHero kind="faqs" id="faqs-hero" label="FAQs" text={FAQS_T} /><FaqSections /></>} closing="Didn’t find it?" soft="Ask a person." second={{ label: "Help & support", href: "/resources/help" }} />;
}

const EVIDENCE_T: CapHeroText = {
  eyebrow: "Sources & evidence",
  title: "Sources & evidence.",
  gold: "How every number proves itself.",
  body: "Where prices come from, how fresh they are, how a view is built and graded — and what a record cannot tell you.",
  short: "Where prices come from, how views are built and how they are graded.",
  facts: ["Five badge fields", "Seven labels", "Public grading"],
  second: { label: "The seven labels", href: "#s03-labels" },
  crumb: [RES_CRUMB, { label: "Sources & evidence" }],
};
export function EvidenceFilmPage() {
  return <SitePage id="evidence" film={<><PageHero kind="evidence" id="evidence-hero" label="Sources & evidence" text={EVIDENCE_T} /><EvidenceSections /></>} closing="Check every number." soft="Register for launch." second={{ label: "FAQs", href: "/resources/faqs" }} />;
}

/* ------------------------------------------------------------- Contact */

const CONTACT_T: CapHeroText = {
  eyebrow: "Contact",
  title: "Contact the team.",
  gold: "Every message lands on one desk.",
  body: "Company enquiries, partnerships, press and careers come here. Account and product problems have their own faster lane in Help.",
  short: "Company enquiries come here; account problems go to Help.",
  facts: ["One desk", "No reply-time promises", "Never asks for money"],
  second: { label: "Write to us", href: "#enquiry" },
};
export function ContactFilmPage() {
  return (
    <SitePage
      id="contact"
      film={<><PageHero kind="contact" id="contact-hero" label="Contact" text={CONTACT_T} /><ContactSections /></>}
      after={
        <Directory id="enquiry" title="Write to us." soft="Topic, email, message.">
          <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
            <PfScope surface="#06110C" className="rounded-[14px] border border-[rgba(255,255,255,0.1)] p-5 sm:p-6">
              <EnquiryForm />
            </PfScope>
            <div className="space-y-4">
              <DirCard href="/resources/help" tag="Faster for account problems" title="Help & support" />
              <DirCard href="/resources/faqs" tag="Short answers" title="FAQs" />
              <DirCard href="/about" tag="The company" title="About AFVAR" />
            </div>
          </div>
        </Directory>
      }
      closing="Rather just get in line?"
      soft="Register for launch."
      second={{ label: "About AFVAR", href: "/about" }}
    />
  );
}
