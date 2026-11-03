import type { Metadata } from "next";
import { PrivacyPage } from "@/modules/platform";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How the AFVAR preview website handles your information.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return <PrivacyPage />;
}
