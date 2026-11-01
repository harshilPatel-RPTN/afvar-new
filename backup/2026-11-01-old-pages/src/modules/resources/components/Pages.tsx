import { PageScene3D, Reveal } from "@/modules/platform/kit";
import { FAQ_GROUPS, GETTING_STARTED, REGISTER_LINK } from "../content";
import { ResourcesClosing } from "./Closing";
import { FaqBrowser } from "./FaqBrowser";
import { StartChecklist } from "./GettingStarted";
import { GuidesIndex } from "./GuidesIndex";
import { ResourcesHero, ResourcesTabs } from "./Hero";
import { ResourcesShell } from "./ResourcesShell";
import { ResLink } from "./ui";
import { CandleSnake } from "./motion";

/** W5.2 · Getting Started. */
export function GettingStartedPage() {
  return (
    <ResourcesShell>
      <ResourcesHero sub crumb={[{ label: "Getting Started", href: "/resources/getting-started" }]} eyebrow="Getting Started" title={GETTING_STARTED.title} lede={GETTING_STARTED.lede} />
      <ResourcesTabs />
      <section aria-label="Getting started checklist" className="px-4 pt-16 sm:px-6">
        <Reveal>
          <StartChecklist />
        </Reveal>
      </section>
      <div className="h-24" />
      <ResourcesClosing
        title="Register once. Everything else follows."
        lede="One account, one queue record. No payment before launch."
        primary={REGISTER_LINK}
        secondary={{ label: "Product Guides", href: "/resources/guides" }}
      />
    </ResourcesShell>
  );
}

/** W5.3 · Product Guides index. */
export function GuidesPage() {
  return (
    <ResourcesShell>
      <ResourcesHero
        sub
        crumb={[{ label: "Product Guides", href: "/resources/guides" }]}
        eyebrow="Product Guides"
        title={["Product guides.", "Grouped by what you want to do."]}
        lede="Short, ordered steps for each task in the OS workspace — charts, alerts, risk, community and connections."
      />
      <ResourcesTabs />
      <section aria-label="Guide path illustration" className="px-4 pt-14 sm:px-6">
        <PageScene3D kind="pathway" bleed label="A glowing marker climbs a path of six step tiles to a flag; each tile lights green as it is completed." caption="Illustration · every guide is a short path of steps" hint="Hover a step" />
      </section>
      <section aria-label="Guides" className="relative px-4 pt-14 sm:px-6">
        <CandleSnake from="right" />
        <GuidesIndex />
        <div className="mt-16 text-center">
          <ResLink href="/resources/help">Need help instead?</ResLink>
        </div>
      </section>
      <div className="h-16" />
      <ResourcesClosing
        title="Every task, a few clear steps."
        lede="Guides describe the planned OS workspace. They're ready before you are."
        primary={{ label: "Get started", href: "/resources/getting-started" }}
        secondary={{ label: "Explore the platform", href: "/platform" }}
      />
    </ResourcesShell>
  );
}

/** W5.5 · FAQs. */
export function FaqsPage() {
  const count = FAQ_GROUPS.reduce((n, g) => n + g.items.length, 0);
  return (
    <ResourcesShell>
      <ResourcesHero
        sub
        crumb={[{ label: "FAQs", href: "/resources/faqs" }]}
        eyebrow="FAQs"
        title={["Questions, answered.", "Straight, short and sourced."]}
        lede={`${count} answers across six topics — development status, markets, devices, launch offers, verification and queue priority.`}
      />
      <ResourcesTabs />
      <section aria-label="Frequently asked questions" className="relative px-4 pt-16 sm:px-6">
        <CandleSnake from="left" radius={12} />
        <Reveal className="relative" >
          <FaqBrowser />
        </Reveal>
      </section>
      <div className="h-24" />
      <ResourcesClosing
        title="Didn't find it? Ask a person."
        lede="One shared support destination for product and account questions."
        primary={{ label: "Help & Support", href: "/resources/help" }}
        secondary={{ label: "Sources & Evidence", href: "/resources/sources-evidence" }}
      />
    </ResourcesShell>
  );
}
