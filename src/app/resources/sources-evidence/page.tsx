import type { Metadata } from "next";
import { EvidencePage } from "@/modules/resources";

export const metadata: Metadata = {
  title: "Sources & Evidence · Resources — AFVAR",
  description: "Where AFVAR's numbers come from, how fresh they are, how analysis is built and how its record is measured — limits included.",
  alternates: { canonical: "/resources/sources-evidence" },
};

export default function Page() {
  return <EvidencePage />;
}
