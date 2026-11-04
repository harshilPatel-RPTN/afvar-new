import type { Metadata } from "next";
import { PRICING_TIERS, formatInr } from "@/modules/home/kit";
import { PricingFilmPage } from "@/modules/platform";

const TOP_PRICE = formatInr(Math.max(...PRICING_TIERS.map((t) => t.monthly)));

export const metadata: Metadata = {
  title: "Pricing",
  description: `AFVAR plan structure and launch benefits: three tiers, from free to ${TOP_PRICE} a month. Prices shown are indicative, in Indian rupees; final plan names, prices and allowances are confirmed before launch. No payment required now.`,
};

export default function Page() {
  return <PricingFilmPage />;
}
