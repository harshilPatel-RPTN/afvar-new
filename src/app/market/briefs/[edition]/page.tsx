import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRIEFS, BriefDetail, SiteShell, findBrief } from "@/modules/markets";
import { PlatformShell } from "@/modules/platform";
import { Ambience } from "@/modules/resources";
import { translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";

type Props = { params: Promise<{ edition: string }> };

export function generateStaticParams() {
  return BRIEFS.map((brief) => ({ edition: brief.edition }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { edition: id } = await params;
  const brief = findBrief(decodeURIComponent(id));
  // Thrown here, before the loading boundary streams, so the response is a real 404.
  if (!brief) notFound();
  const edition = await getServerEdition();
  return { title: translate(edition, brief.titleKey) };
}

export default async function BriefPage({ params }: Props) {
  const { edition } = await params;
  return (
    <SiteShell>
      <PlatformShell>
        <div className="relative">
          <Ambience />
          <div className="relative">
            <BriefDetail edition={decodeURIComponent(edition)} />
          </div>
        </div>
      </PlatformShell>
    </SiteShell>
  );
}
