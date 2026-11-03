import type { Metadata } from "next";
import { TermsPage } from "@/modules/platform";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The ground rules for the AFVAR preview website.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return <TermsPage />;
}
