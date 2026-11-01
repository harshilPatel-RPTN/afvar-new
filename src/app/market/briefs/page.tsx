import type { Metadata } from "next";
import { BriefsFilmPage } from "@/modules/platform";
import { translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const edition = await getServerEdition();
  return {
    title: translate(edition, "mk.briefs.title"),
    description: translate(edition, "mk.page.briefs.description"),
  };
}

export default function BriefsPage() {
  return <BriefsFilmPage />;
}
