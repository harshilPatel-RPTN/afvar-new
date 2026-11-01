import type { Metadata } from "next";
import { MarketsFilmPage } from "@/modules/platform";
import { translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const edition = await getServerEdition();
  return {
    title: translate(edition, "mk.nav.markets"),
    description: translate(edition, "mk.page.overview.description"),
  };
}

export default function MarketPage() {
  return <MarketsFilmPage />;
}
