/**
 * Payments sit behind one interface so Razorpay or Cashfree (INR) can be
 * added beside Stripe without touching the UI. Only the Stripe test-mode
 * demo exists today; it never contacts Stripe.
 */
import type { Subscription } from "@/modules/auth";
import { billingApi, type CheckoutSession } from "./api";
import type { BillingInterval } from "./prices";

export interface CardDetails {
  number: string;
  expiry: string; // MM/YY
  cvc: string;
  name: string;
  country: string;
}

export type PaymentFailure =
  | "invalid_number"
  | "invalid_expiry"
  | "expired_card"
  | "incorrect_cvc"
  | "card_declined"
  | "insufficient_funds"
  | "authentication_failed"
  | "test_card_required";

export type PaymentOutcome =
  | { status: "succeeded" }
  | { status: "requires_action" }
  | { status: "failed"; code: PaymentFailure };

export interface PaymentProvider {
  id: "stripe" | "razorpay";
  testMode: boolean;
  createCheckout: (interval: BillingInterval) => Promise<CheckoutSession>;
  /** In production the provider's own hosted fields collect the card; the demo simulates them. */
  confirmCard: (session: CheckoutSession, card: CardDetails) => Promise<PaymentOutcome>;
  /** Finish a 3-D Secure challenge (mandatory for most Indian cards). */
  completeAuthentication: (session: CheckoutSession, approved: boolean) => Promise<PaymentOutcome>;
  cancelAtPeriodEnd: () => Promise<Subscription>;
  resume: () => Promise<Subscription>;
}

/** Stripe's documented test cards and what they do. */
export const STRIPE_TEST_CARDS = {
  success: "4242424242424242",
  threeDSecure: "4000002500003155",
  declined: "4000000000000002",
  insufficientFunds: "4000000000009995",
} as const;

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function luhnValid(number: string) {
  const digits = digitsOnly(number);
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/** Validates the card the way Stripe Elements would before submitting. */
export function validateCard(card: CardDetails, now = new Date()): PaymentFailure | null {
  if (!luhnValid(card.number)) return "invalid_number";
  const match = card.expiry.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 12) return "invalid_expiry";
  const expiryEnd = new Date(2000 + Number(match[2]), Number(match[1]), 1);
  if (expiryEnd <= now) return "expired_card";
  if (!/^\d{3,4}$/.test(card.cvc)) return "incorrect_cvc";
  return null;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function settle(session: CheckoutSession): Promise<PaymentOutcome> {
  await billingApi.demoWebhook("checkout.session.completed", { session_id: session.id });
  return { status: "succeeded" };
}

export const stripeDemoProvider: PaymentProvider = {
  id: "stripe",
  testMode: true,
  createCheckout: (interval) => billingApi.createCheckout(interval),
  confirmCard: async (session, card) => {
    const invalid = validateCard(card);
    if (invalid) return { status: "failed", code: invalid };
    await wait(900 + Math.random() * 600);
    switch (digitsOnly(card.number)) {
      case STRIPE_TEST_CARDS.success:
        return settle(session);
      case STRIPE_TEST_CARDS.threeDSecure:
        return { status: "requires_action" };
      case STRIPE_TEST_CARDS.declined:
        return { status: "failed", code: "card_declined" };
      case STRIPE_TEST_CARDS.insufficientFunds:
        return { status: "failed", code: "insufficient_funds" };
      default:
        // Test mode refuses real card numbers, as Stripe does.
        return { status: "failed", code: "test_card_required" };
    }
  },
  completeAuthentication: async (session, approved) => {
    await wait(700);
    return approved ? settle(session) : { status: "failed", code: "authentication_failed" };
  },
  cancelAtPeriodEnd: async () => (await billingApi.cancelAtPeriodEnd()).subscription,
  resume: async () => (await billingApi.resume()).subscription,
};

/** The active provider. Switch here (e.g. Razorpay for INR) once it exists. */
export function getPaymentProvider(): PaymentProvider {
  return stripeDemoProvider;
}
