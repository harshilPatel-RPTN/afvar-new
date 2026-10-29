// The ONLY file calling the billing endpoints.
import type { Subscription } from "@/modules/auth";
import { apiFetch } from "@/platform/api/client";
import type { BillingInterval } from "./prices";

export interface CheckoutSession {
  id: string;
  mode: "subscription";
  interval: BillingInterval;
  amount: number;
  currency: string;
  customer_email: string;
  status: "open" | "complete" | "expired";
  livemode: boolean;
}

export const billingApi = {
  createCheckout: (interval: BillingInterval) =>
    apiFetch<CheckoutSession>("POST", "/api/v1/billing/checkout", { interval }),
  subscription: () => apiFetch<{ subscription: Subscription | null }>("GET", "/api/v1/billing/subscription"),
  cancelAtPeriodEnd: () => apiFetch<{ subscription: Subscription }>("POST", "/api/v1/billing/subscription/cancel"),
  resume: () => apiFetch<{ subscription: Subscription }>("POST", "/api/v1/billing/subscription/resume"),
  /**
   * Stripe → backend webhook. Production never calls this from the browser:
   * Stripe signs the event and posts it to FastAPI. Only the demo does.
   */
  demoWebhook: (type: string, data: Record<string, unknown>) =>
    apiFetch<{ received: boolean; plan?: string }>("POST", "/api/v1/billing/webhook", { type, data }),
};
