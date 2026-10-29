import type { Metadata } from "next";
import { BriefsIndex, CATEGORIES, type CategoryId } from "@/modules/markets";
import { translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata(): Promise<Metadata> {
  const edition = await getServerEdition();
  return {
    title: translate(edition, "mk.briefs.title"),
    description: translate(edition, "mk.page.briefs.description"),
  };
}

export default async function BriefsPage({ searchParams }: Props) {
  const query = await searchParams;
  const requested = first(query.market);
  const market: CategoryId | "all" = CATEGORIES.find((category) => category.id === requested)?.id ?? "all";
  const q = (first(query.q) ?? "").trim().slice(0, 100);
  return <BriefsIndex market={market} q={q} />;
}
