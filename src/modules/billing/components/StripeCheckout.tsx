"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COUNTRIES, displayName, useAuthStore } from "@/modules/auth";
import { Modal } from "@/platform/ui";
import { useT, type MessageKey } from "@/platform/i18n";
import type { CheckoutSession } from "../api";
import { useAfterPlanChange, useCheckout } from "../hooks";
import { STRIPE_TEST_CARDS, digitsOnly, getPaymentProvider, type PaymentFailure } from "../payment";
import { PRO_PRICES, formatPrice, type BillingInterval } from "../prices";
import { useBillingStore } from "../store";

type Phase = "form" | "processing" | "authenticate" | "success";

const FAILURE_KEYS: Record<PaymentFailure, MessageKey> = {
  invalid_number: "stripe.error.invalid_number",
  invalid_expiry: "stripe.error.invalid_expiry",
  expired_card: "stripe.error.expired_card",
  incorrect_cvc: "stripe.error.incorrect_cvc",
  card_declined: "stripe.error.card_declined",
  insufficient_funds: "stripe.error.insufficient_funds",
  authentication_failed: "stripe.error.authentication_failed",
  test_card_required: "stripe.error.test_card_required",
};

const TEST_CARD_CHIPS: { number: string; label: MessageKey }[] = [
  { number: STRIPE_TEST_CARDS.success, label: "stripe.test.success" },
  { number: STRIPE_TEST_CARDS.threeDSecure, label: "stripe.test.threeDSecure" },
  { number: STRIPE_TEST_CARDS.declined, label: "stripe.test.declined" },
  { number: STRIPE_TEST_CARDS.insufficientFunds, label: "stripe.test.insufficient" },
];

function formatCardNumber(value: string) {
  return digitsOnly(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string) {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
}

function StripeWordmark() {
  return <span className="font-bold tracking-[-.02em] text-[#635BFF]">stripe</span>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-[#30313D]">{label}</span>
      {children}
    </label>
  );
}

const INPUT = "h-10 w-full bg-white px-3 text-[14px] text-[#30313D] outline-none placeholder:text-[#A3ACB9] focus:relative focus:z-10 focus:shadow-[0_0_0_3px_rgba(99,91,255,.25)] focus:border-[#635BFF]";

/** Stripe-Checkout-style payment sheet. Test mode only: no request ever reaches Stripe. */
export function StripeCheckoutModal() {
  const { t } = useT();
  const interval = useBillingStore((state) => state.checkoutInterval);
  const close = useBillingStore((state) => state.closeCheckout);
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      open={interval !== null}
      onClose={() => (busy ? undefined : close())}
      title={t("stripe.title")}
      hideTitle
      width="max-w-[880px]"
      surfaceClassName="overflow-hidden rounded-2xl bg-white text-[#30313D] shadow-[0_50px_120px_-30px_rgba(0,0,0,.9)]"
    >
      {/* Mounted fresh on every open, so each one starts a new Checkout Session — like Stripe. */}
      {interval && <CheckoutSheet interval={interval} onClose={close} onBusyChange={setBusy} />}
    </Modal>
  );
}

function CheckoutSheet({ interval, onClose: close, onBusyChange }: { interval: BillingInterval; onClose: () => void; onBusyChange: (busy: boolean) => void }) {
  const { t, locale } = useT();
  const user = useAuthStore((state) => state.user);
  const checkout = useCheckout();
  const afterPlanChange = useAfterPlanChange();
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<MessageKey | null>(null);
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: user?.displayName ?? "", country: user?.country ?? "IN" });

  const price = PRO_PRICES[interval];
  const priceLabel = formatPrice(price, locale);
  const countryOptions = useMemo(() => COUNTRIES.map((code) => ({ code, name: displayName(code, "region", locale) })), [locale]);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    checkout.mutate(interval, { onSuccess: setSession, onError: () => setError("stripe.error.session") });
  }, [checkout, interval]);

  useEffect(() => onBusyChange(phase === "processing"), [phase, onBusyChange]);

  const fail = (code: PaymentFailure) => {
    setError(FAILURE_KEYS[code]);
    setPhase("form");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setError(null);
    setPhase("processing");
    try {
      const outcome = await getPaymentProvider().confirmCard(session, card);
      if (outcome.status === "succeeded") {
        await afterPlanChange();
        setPhase("success");
      } else if (outcome.status === "requires_action") setPhase("authenticate");
      else fail(outcome.code);
    } catch {
      setError("stripe.error.session");
      setPhase("form");
    }
  };

  const authenticate = async (approved: boolean) => {
    if (!session) return;
    setPhase("processing");
    const outcome = await getPaymentProvider().completeAuthentication(session, approved);
    if (outcome.status === "succeeded") {
      await afterPlanChange();
      setPhase("success");
    } else if (outcome.status === "failed") fail(outcome.code);
  };

  const busy = phase === "processing";

  return (
      <div className="grid md:grid-cols-[1fr_1.1fr]">
        {/* Order summary */}
        <section className="flex flex-col gap-6 bg-[#0B1220] px-8 py-9 text-white">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-[12px] font-bold text-[#8AB4F8]">A</span>
            <span className="text-[13px] font-semibold tracking-[.18em]">{t("brand.name")}</span>
            <span className="ms-auto rounded bg-[#FFDE92] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#6B4A00]">{t("stripe.testMode")}</span>
          </div>
          <div>
            <p className="text-[14px] text-white/60">{t("stripe.subscribeTo")}</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-[36px] font-semibold tracking-[-.02em]">{priceLabel}</span>
              <span className="text-[13px] leading-tight text-white/60">{t(interval === "yearly" ? "stripe.perYear" : "stripe.perMonth")}</span>
            </p>
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-[13px]">
            <div className="flex justify-between">
              <span>{t("stripe.lineItem", { interval: t(interval === "yearly" ? "pricing.yearly" : "pricing.monthly") })}</span>
              <span>{priceLabel}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>{t("stripe.subtotal")}</span>
              <span>{priceLabel}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3 font-semibold">
              <span>{t("stripe.totalToday")}</span>
              <span>{priceLabel}</span>
            </div>
          </div>
          <p className="mt-auto text-[11px] leading-relaxed text-white/45">{t("stripe.demoNote")}</p>
        </section>

        {/* Payment */}
        <section className="relative px-8 py-9">
          <AnimatePresence mode="wait">
            {phase === "success" ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 16 }} className="grid h-16 w-16 place-items-center rounded-full bg-[#E3F9EE] text-[#1A7F4B]">
                  <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
                    <motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.15, duration: 0.4 }} />
                  </svg>
                </motion.span>
                <h3 className="text-[20px] font-semibold">{t("stripe.success.title")}</h3>
                <p className="max-w-[300px] text-[13px] text-[#6A7383]">{t("stripe.success.body")}</p>
                <button type="button" onClick={close} className="mt-2 h-11 w-full max-w-[260px] rounded-md bg-[#635BFF] text-[14px] font-semibold text-white hover:bg-[#5249F0]">
                  {t("stripe.success.continue")}
                </button>
              </motion.div>
            ) : phase === "authenticate" ? (
              <motion.div key="3ds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                <p className="text-[11px] font-semibold tracking-[.14em] text-[#6A7383]">{t("stripe.3ds.eyebrow")}</p>
                <h3 className="text-[18px] font-semibold">{t("stripe.3ds.title")}</h3>
                <p className="text-[13px] leading-relaxed text-[#6A7383]">{t("stripe.3ds.body", { amount: priceLabel })}</p>
                <div className="rounded-lg border border-[#E3E8EE] bg-[#F6F9FC] p-4 text-[12px] text-[#6A7383]">{t("stripe.3ds.hint")}</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void authenticate(true)} className="h-11 flex-1 rounded-md bg-[#635BFF] text-[14px] font-semibold text-white hover:bg-[#5249F0]">
                    {t("stripe.3ds.complete")}
                  </button>
                  <button type="button" onClick={() => void authenticate(false)} className="h-11 flex-1 rounded-md border border-[#E3E8EE] text-[14px] font-medium hover:bg-[#F6F9FC]">
                    {t("stripe.3ds.fail")}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                <h3 className="text-[18px] font-semibold">{t("stripe.payWithCard")}</h3>
                <Field label={t("stripe.email")}>
                  <input className={`${INPUT} rounded-md border border-[#E3E8EE] bg-[#F6F9FC] text-[#6A7383]`} value={session?.customer_email ?? user?.email ?? ""} readOnly />
                </Field>
                <fieldset className="flex flex-col gap-1.5" disabled={busy}>
                  <legend className="mb-1.5 text-[12px] font-medium text-[#30313D]">{t("stripe.cardInfo")}</legend>
                  <div className="overflow-hidden rounded-md border border-[#E3E8EE] shadow-[0_1px_1px_rgba(0,0,0,.03)]">
                    <input
                      className={`${INPUT} border-b border-[#E3E8EE] font-mono tracking-wide`}
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="1234 1234 1234 1234"
                      aria-label={t("stripe.cardNumber")}
                      value={card.number}
                      onChange={(event) => setCard({ ...card, number: formatCardNumber(event.target.value) })}
                      required
                    />
                    <div className="grid grid-cols-2">
                      <input className={`${INPUT} border-e border-[#E3E8EE] font-mono`} inputMode="numeric" autoComplete="cc-exp" placeholder={t("stripe.expiryPlaceholder")} aria-label={t("stripe.expiry")} value={card.expiry} onChange={(event) => setCard({ ...card, expiry: formatExpiry(event.target.value) })} required />
                      <input className={`${INPUT} font-mono`} inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" aria-label={t("stripe.cvc")} value={card.cvc} onChange={(event) => setCard({ ...card, cvc: digitsOnly(event.target.value).slice(0, 4) })} required />
                    </div>
                  </div>
                </fieldset>
                <Field label={t("stripe.cardholder")}>
                  <input className={`${INPUT} rounded-md border border-[#E3E8EE]`} autoComplete="cc-name" value={card.name} onChange={(event) => setCard({ ...card, name: event.target.value })} required disabled={busy} />
                </Field>
                <Field label={t("stripe.country")}>
                  <select className={`${INPUT} rounded-md border border-[#E3E8EE]`} value={card.country} onChange={(event) => setCard({ ...card, country: event.target.value })} disabled={busy}>
                    {countryOptions.map(({ code, name }) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </Field>

                {error && (
                  <p role="alert" className="flex items-start gap-2 rounded-md bg-[#FFF0F0] px-3 py-2 text-[13px] text-[#C0123C]">
                    {t(error)}
                  </p>
                )}

                <button type="submit" disabled={busy || !session} className="relative flex h-11 items-center justify-center gap-2 rounded-md bg-[#635BFF] text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,.1)] transition-colors hover:bg-[#5249F0] disabled:cursor-wait disabled:opacity-80">
                  {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                  {busy ? t("stripe.processing") : t("stripe.subscribe", { amount: priceLabel })}
                </button>

                <div className="rounded-lg border border-dashed border-[#C9CFF9] bg-[#F5F4FF] p-3">
                  <p className="mb-2 text-[11px] font-semibold text-[#4B45C6]">{t("stripe.test.heading")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TEST_CARD_CHIPS.map((chip) => (
                      <button
                        key={chip.number}
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setError(null);
                          setCard({ ...card, number: formatCardNumber(chip.number), expiry: "12 / 34", cvc: "123", name: card.name || user?.displayName || "" });
                        }}
                        className="rounded-md border border-[#C9CFF9] bg-white px-2 py-1 text-[11px] text-[#30313D] hover:border-[#635BFF]"
                      >
                        <span className="font-mono">•••• {chip.number.slice(-4)}</span> · {t(chip.label)}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="flex items-center justify-center gap-3 text-[11px] text-[#A3ACB9]">
                  <span>
                    {t("stripe.poweredBy")} <StripeWordmark />
                  </span>
                  <span className="h-3 w-px bg-[#E3E8EE]" />
                  <span>{t("stripe.noRealCharge")}</span>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </section>
      </div>
  );
}
