# modules/billing — owner: @dev-billing

Plans, entitlements, pricing and payments.

- **`entitlements.ts` is the single source of truth.** Every gate calls `can()` or `quota()`; never add a premium flag.
- **Payments** go through the `PaymentProvider` interface (`payment.ts`). Today only the Stripe **test-mode demo** exists; Razorpay/Cashfree for INR slot in beside it.
- **Public API (`index.ts`):** `PLANS`, `can`, `quota`, `UpgradeGate`, `UpgradeModal`, `PricingView`, `BillingSettings`, `BillingOverlays`, `useEntitlements`
- **Backend:** `/v1/billing/checkout`, `/v1/billing/webhook` (Stripe → FastAPI), `/v1/billing/subscription`
