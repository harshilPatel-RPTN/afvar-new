import type { Metadata } from "next";
import { ResourcesOverview } from "@/modules/resources";

export const metadata: Metadata = {
  title: "Resources — AFVAR",
  description: "Getting started, product guides, sources and evidence, FAQs and help — one destination for each AFVAR resource category.",
  alternates: { canonical: "/resources" },
};

export default function Page() {
  return <ResourcesOverview />;
}
