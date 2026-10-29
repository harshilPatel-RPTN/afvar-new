import type { Metadata } from "next";
import { PricingPage } from "@/modules/home";

export const metadata: Metadata = {
  title: "Pricing — AFVAR",
  description:
    "AFVAR plan structure and launch benefits. Plan names, prices and allowances are confirmed before launch — join the launch queue to hear them first. No payment required now.",
};

export default function Page() {
  return <PricingPage />;
}
