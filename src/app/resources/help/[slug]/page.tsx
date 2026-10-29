import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TROUBLESHOOTING, TroubleshootDetail, getTopic } from "@/modules/resources";

export const dynamicParams = false;

export function generateStaticParams() {
  return TROUBLESHOOTING.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: PageProps<"/resources/help/[slug]">): Promise<Metadata> {
  const topic = getTopic((await params).slug);
  if (!topic) return {};
  return { title: `${topic.title} · Help — AFVAR`, description: topic.symptom, alternates: { canonical: `/resources/help/${topic.slug}` } };
}

export default async function Page({ params }: PageProps<"/resources/help/[slug]">) {
  const topic = getTopic((await params).slug);
  if (!topic) notFound();
  return <TroubleshootDetail topic={topic} />;
}
