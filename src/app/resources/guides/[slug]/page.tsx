import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GUIDES, GuideDetail, getGuide } from "@/modules/resources";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps<"/resources/guides/[slug]">): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  return { title: `${guide.title} · Product Guides`, description: guide.task, alternates: { canonical: `/resources/guides/${guide.slug}` } };
}

export default async function Page({ params }: PageProps<"/resources/guides/[slug]">) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  return <GuideDetail guide={guide} />;
}
