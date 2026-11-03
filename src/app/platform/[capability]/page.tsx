import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { SiteShell } from "@/modules/markets";
import { AlertsPage, CAPABILITIES, CapabilityPage, CommunityPage, MarketDataPage, ResearchPage, RiskPage, capabilityPath, getCapability, getCapabilityBySegment } from "@/modules/platform";

// Only the five W2.2–W2.6 pages exist; anything else is a 404.
export const dynamicParams = false;

/** URL segment of each capability page, e.g. "market-data" for W2.2. */
const segmentOf = (path: string) => path.slice("/platform/".length);

export function generateStaticParams() {
  const current = CAPABILITIES.map((c) => segmentOf(capabilityPath(c.slug)));
  // Old slug URLs (e.g. /platform/charts) stay reachable so they can redirect.
  const legacy = CAPABILITIES.map((c) => c.slug).filter((slug) => !current.includes(slug));
  return [...current, ...legacy].map((capability) => ({ capability }));
}

export async function generateMetadata({ params }: PageProps<"/platform/[capability]">): Promise<Metadata> {
  const capability = getCapabilityBySegment((await params).capability);
  if (!capability) return {};
  return {
    title: `${capability.title} · Platform`,
    description: capability.summary,
    alternates: { canonical: capabilityPath(capability.slug) },
  };
}

export default async function CapabilityRoute({ params }: PageProps<"/platform/[capability]">) {
  const segment = (await params).capability;
  // An old slug URL (/platform/charts, /platform/trade-review): send it to the page's current address first,
  // so it never renders as a duplicate of that page.
  const legacy = getCapability(segment);
  if (legacy && segmentOf(capabilityPath(legacy.slug)) !== segment) permanentRedirect(capabilityPath(legacy.slug));
  const capability = getCapabilityBySegment(segment);
  // Pages already on the AI OS capability template render their own frame (the home's navbar, ticker and footer).
  if (capability?.slug === "charts") return <MarketDataPage />;
  if (capability?.slug === "research") return <ResearchPage />;
  if (capability?.slug === "alerts") return <AlertsPage />;
  if (capability?.slug === "trade-review") return <RiskPage />;
  if (capability?.slug === "community") return <CommunityPage />;
  // The others keep the public-site chrome (nav, pre-launch strip) until they move to the AI OS theme;
  // the footer is rendered by their closing block.
  if (capability)
    return (
      <SiteShell footer={false}>
        <CapabilityPage capability={capability} />
      </SiteShell>
    );
  notFound();
}
