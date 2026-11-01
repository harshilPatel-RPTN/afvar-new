import type { Metadata } from "next";
import { EvidenceFilmPage } from "@/modules/platform";

export const metadata: Metadata = {
  title: "Sources & Evidence · Resources — AFVAR",
  description: "Where AFVAR's numbers come from, how fresh they are, how analysis is built and how its record is measured — limits included.",
  alternates: { canonical: "/resources/sources-evidence" },
};

export default function Page() {
  return <EvidenceFilmPage />;
}
