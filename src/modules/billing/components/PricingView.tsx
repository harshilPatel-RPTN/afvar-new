"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "@/modules/auth";
import { useT } from "@/platform/i18n";
import { FEATURE_ORDER, PLANS, type Plan } from "../entitlements";
import { useEntitlementLabels, useEntitlements } from "../hooks";
import { PRO_PRICES, formatPrice, type BillingInterval } from "../prices";
import { useBillingStore } from "../store";

function Check({ on }: { on: boolean }) {
  return on ? (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[#6FD3A8]" aria-hidden="true">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-white/25" aria-hidden="true">
      <path d="M6 10h8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function PricingView() {
  const { t, locale } = useT();
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const { plan: currentPlan } = useEntitlements();
  const openCheckout = useBillingStore((state) => state.openCheckout);
  const labels = useEntitlementLabels();
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  const monthlyEquivalent = formatPrice({ ...PRO_PRICES.yearly, amount: Math.round(PRO_PRICES.yearly.amount / 12) }, locale);
  const savings = Math.round((1 - PRO_PRICES.yearly.amount / (PRO_PRICES.monthly.amount * 12)) * 100);

  const choose = (plan: Plan) => {
    if (plan === "free") {
      router.push(isAuthenticated ? "/markets" : "/register");
      return;
    }
    if (!isAuthenticated) {
      router.push(`/register?next=${encodeURIComponent("/")}`);
      return;
    }
    openCheckout(interval);
  };

  const card = (plan: Plan) => {
    const isPro = plan === "pro";
    const isCurrent = isAuthenticated && currentPlan === plan;
    return (
      <motion.section
        key={plan}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: isPro ? 0.08 : 0 }}
        aria-labelledby={`plan-${plan}`}
        className={`relative flex flex-col rounded-[28px] border p-7 ${
          isPro
            ? "border-[#8AB4F8]/40 bg-[linear-gradient(170deg,rgba(79,140,255,.16),rgba(14,19,28,.85)_45%)] shadow-[0_40px_90px_-40px_rgba(79,140,255,.6)]"
            : "border-white/10 bg-[rgba(14,19,28,.7)]"
        }`}
      >
        {isPro && (
          <span className="absolute -top-3 inset-s-7 rounded-full bg-[linear-gradient(135deg,#F7D774,#E9A93B)] px-3 py-1 text-[10px] font-bold tracking-[.14em] text-[#2A1A00]">
            {t("pricing.recommended")}
          </span>
        )}
        <h2 id={`plan-${plan}`} className="text-[13px] font-semibold tracking-[.2em] text-white/70">
          {t(isPro ? "plan.badge.pro" : "plan.badge.free")}
        </h2>
        <p className="mt-3 flex items-baseline gap-2">
          <span className="text-[40px] font-semibold tracking-[-.03em] text-white">
            {isPro ? (interval === "monthly" ? formatPrice(PRO_PRICES.monthly, locale) : monthlyEquivalent) : formatPrice({ amount: 0, currency: PRO_PRICES.monthly.currency }, locale)}
          </span>
          <span className="text-[13px] text-white/55">{t("pricing.perMonth")}</span>
        </p>
        <p className="mb-6 min-h-5 text-[12px] text-white/55">
          {isPro && interval === "yearly" ? t("pricing.billedYearly", { amount: formatPrice(PRO_PRICES.yearly, locale) }) : t(isPro ? "pricing.proTagline" : "pricing.freeTagline")}
        </p>

        <ul className="mb-7 flex flex-col gap-3 text-[13px]">
          {FEATURE_ORDER.map((feature) => {
            const value = PLANS[plan][feature];
            const on = typeof value === "boolean" ? value : feature === "news_delay_minutes" ? true : value === null || value > 0;
            return (
              <li key={feature} className="flex items-start gap-2.5">
                <Check on={on} />
                <span className="flex flex-1 flex-wrap justify-between gap-x-3">
                  <span className={on ? "text-white/85" : "text-white/40"}>{labels.label(feature)}</span>
                  <span className={`font-medium ${on ? "text-white" : "text-white/40"}`}>{labels.value(feature, PLANS[plan])}</span>
                </span>
              </li>
            );
          })}
          <li className="flex items-start gap-2.5">
            <Check on />
            <span className="text-white/85">{t("pricing.cachedFree")}</span>
          </li>
        </ul>

        <button
          type="button"
          disabled={isCurrent}
          onClick={() => choose(plan)}
          className={`mt-auto h-12 rounded-xl text-[14px] font-semibold transition disabled:cursor-default ${
            isPro
              ? "bg-[linear-gradient(135deg,#9BC0FF,#7FA9F5)] text-[#0B1220] shadow-[0_12px_32px_-12px_rgba(138,180,248,.8)] hover:brightness-105 disabled:opacity-60"
              : "border border-white/15 text-white hover:bg-white/10 disabled:opacity-60"
          }`}
        >
          {isCurrent ? t("pricing.currentPlan") : isPro ? t("plan.upgradeToPro") : t("pricing.startFree")}
        </button>
      </motion.section>
    );
  };

  return (
    <main id="main" tabIndex={-1} className="focus:outline-none mx-auto flex min-h-svh w-full max-w-[980px] flex-col px-6 py-14 text-[#E6EDF3]">
      <header className="mb-10 flex items-center justify-between">
        <Link href={isAuthenticated ? "/markets" : "/"} className="text-[12px] font-semibold tracking-[.22em] text-white/80 hover:text-white">
          {t("brand.name")}
        </Link>
        {!isAuthenticated && (
          <Link href="/login?next=/" className="text-[12px] text-[#8AB4F8] hover:underline">
            {t("auth.register.signIn")}
          </Link>
        )}
      </header>

      <div className="mb-10 text-center">
        <p className="mb-3 text-[11px] font-medium tracking-[.28em] text-[#8AB4F8]">{t("pricing.eyebrow")}</p>
        <h1 className="mb-3 bg-[linear-gradient(180deg,#fff,rgba(214,226,245,.75))] bg-clip-text text-[40px] font-semibold leading-tight tracking-[-.035em] text-transparent">
          {t("pricing.title")}
        </h1>
        <p className="mx-auto max-w-[520px] text-[14px] leading-relaxed text-[#B0BBC8]">{t("pricing.subtitle")}</p>

        <div role="radiogroup" aria-label={t("pricing.billingPeriod")} className="afvar-glass-track mx-auto mt-7 inline-flex rounded-full p-1">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={interval === option}
              onClick={() => setInterval(option)}
              className="afvar-glass-tab relative rounded-full px-4 py-1.5 text-[12px] font-medium"
            >
              {interval === option && <motion.span layoutId="interval-pill" aria-hidden="true" className="afvar-glass-indicator pointer-events-none absolute inset-0 rounded-full" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative">
                {t(option === "monthly" ? "pricing.monthly" : "pricing.yearly")}
                {option === "yearly" && <span className="ms-1.5 text-[10px] font-bold">{t("pricing.save", { percent: savings })}</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {card("free")}
        {card("pro")}
      </div>

      <ul className="mt-10 grid gap-3 text-center text-[12px] text-white/60 sm:grid-cols-3">
        <li className="rounded-2xl border border-white/[.08] bg-white/[.03] px-4 py-3">{t("pricing.promise.cached")}</li>
        <li className="rounded-2xl border border-white/[.08] bg-white/[.03] px-4 py-3">{t("pricing.promise.noAds")}</li>
        <li className="rounded-2xl border border-white/[.08] bg-white/[.03] px-4 py-3">{t("pricing.promise.neverTrades")}</li>
      </ul>
      <p className="mt-6 text-center text-[11px] text-white/40">{t("pricing.footnote")}</p>
    </main>
  );
}
