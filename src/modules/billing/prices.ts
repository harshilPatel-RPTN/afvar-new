/**
 * Pro pricing shown on /pricing and charged by the demo checkout.
 * PLACEHOLDER amounts — owner to confirm (see README, "Freemium defaults").
 * Amounts are in minor units, as Stripe expects.
 */
export type BillingInterval = "monthly" | "yearly";

export interface Price {
  amount: number;
  currency: string;
}

export const PRO_PRICES: Record<BillingInterval, Price> = {
  monthly: { amount: 1_900, currency: "USD" },
  yearly: { amount: 19_000, currency: "USD" },
};

export function formatPrice(price: Price, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: price.currency,
    minimumFractionDigits: price.amount % 100 === 0 ? 0 : 2,
  }).format(price.amount / 100);
}
