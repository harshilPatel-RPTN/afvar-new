import type { Metadata } from "next";
import { GuidesPage } from "@/modules/resources";

export const metadata: Metadata = {
  title: "Product Guides · Resources — AFVAR",
  description: "Step-by-step AFVAR guides grouped by task: charts and research, alerts, risk, community and connections.",
  alternates: { canonical: "/resources/guides" },
};

export default function Page() {
  return <GuidesPage />;
}
