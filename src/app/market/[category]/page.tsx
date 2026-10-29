import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, MarketCategory, findCategory } from "@/modules/markets";
import { translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";

type Props = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: category.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: id } = await params;
  const category = findCategory(id);
  // Thrown here, before the loading boundary streams, so the response is a real 404.
  if (!category) notFound();
  const edition = await getServerEdition();
  const title = translate(edition, category.titleKey);
  return {
    title,
    description: translate(edition, "mk.cat.meta.description", { category: title }),
  };
}

export default async function MarketCategoryPage({ params }: Props) {
  const { category: id } = await params;
  const category = findCategory(id);
  if (!category) notFound();
  return <MarketCategory categoryId={category.id} />;
}
