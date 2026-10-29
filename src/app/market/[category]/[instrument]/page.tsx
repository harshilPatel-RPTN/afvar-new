import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { INSTRUMENTS, InstrumentDetail, findInstrument } from "@/modules/markets";
import { translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";

type Props = { params: Promise<{ category: string; instrument: string }> };

export function generateStaticParams() {
  return INSTRUMENTS.map((instrument) => ({ category: instrument.category, instrument: instrument.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, instrument: slug } = await params;
  const instrument = findInstrument(category, slug);
  // Thrown here, before the loading boundary streams, so the response is a real 404.
  if (!instrument) notFound();
  const edition = await getServerEdition();
  const name = translate(edition, instrument.nameKey);
  return {
    title: `${name} (${instrument.displaySymbol})`,
    description: translate(edition, "mk.instr.meta.description", { name, symbol: instrument.displaySymbol }),
  };
}

export default async function InstrumentPage({ params }: Props) {
  const { category, instrument: slug } = await params;
  const instrument = findInstrument(category, slug);
  if (!instrument) notFound();
  return <InstrumentDetail categoryId={instrument.category} slug={instrument.slug} />;
}
