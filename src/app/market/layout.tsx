import type { Metadata } from "next";
import type { ReactNode } from "react";
import { translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";
import { SiteShell } from "@/modules/markets";
import { PlatformShell } from "@/modules/platform";
import { Ambience } from "@/modules/resources";

export async function generateMetadata(): Promise<Metadata> {
  const edition = await getServerEdition();
  return {
    title: { default: "AFVAR Markets", template: "%s · AFVAR Markets" },
    description: translate(edition, "mk.shell.metaDescription"),
  };
}

/** Same chrome as /about: Markets site shell around the platform design language. */
export default function MarketLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell>
      <PlatformShell>
        {/* the scroll-driven green / red market backdrop behind every Markets page */}
        <div className="relative">
          <Ambience />
          <div className="relative">{children}</div>
        </div>
      </PlatformShell>
    </SiteShell>
  );
}
