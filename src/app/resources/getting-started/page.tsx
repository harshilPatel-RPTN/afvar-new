import type { Metadata } from "next";
import { GettingStartedPage } from "@/modules/resources";

export const metadata: Metadata = {
  title: "Getting Started · Resources — AFVAR",
  description: "Verify your mobile and email, follow your launch queue status and get ready for your first AFVAR session.",
  alternates: { canonical: "/resources/getting-started" },
};

export default function Page() {
  return <GettingStartedPage />;
}
