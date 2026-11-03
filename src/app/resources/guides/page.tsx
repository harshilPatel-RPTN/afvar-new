import type { Metadata } from "next";
import { GuidesFilmPage } from "@/modules/platform";

export const metadata: Metadata = {
  title: "Product Guides · Resources",
  description: "Step-by-step AFVAR guides grouped by task: charts and research, alerts, risk, community and connections.",
  alternates: { canonical: "/resources/guides" },
};

export default function Page() {
  return <GuidesFilmPage />;
}
