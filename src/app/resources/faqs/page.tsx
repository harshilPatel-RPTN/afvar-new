import type { Metadata } from "next";
import { FaqsFilmPage } from "@/modules/platform";

export const metadata: Metadata = {
  title: "FAQs · Resources — AFVAR",
  description: "Answers on AFVAR's development status, markets and data, devices, the two launch offers, verification and queue priority.",
  alternates: { canonical: "/resources/faqs" },
};

export default function Page() {
  return <FaqsFilmPage />;
}
