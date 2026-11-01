"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi, useAuthStore } from "@/modules/auth";
import { useT } from "@/platform/i18n";
import { FEATURE_ORDER, effectiveEntitlements } from "../entitlements";
import { useAfterPlanChange, useCountdown, useEntitlementLabels, useEntitlements, useSubscription } from "../hooks";
import { getPaymentProvider } from "../payment";
import { useBillingStore } from "../store";
import { PlanBadge, UpgradeModal } from "./Gating";
import { StripeCheckoutModal } from "./StripeCheckout";

/** Floating Free ⇄ Pro switch so every gated state can be tested. Never rendered in production. */
export function DevPlanToggle() {
  const { t } = useT();
  const user = useAuthStore((state) => state.user);
  const setPlan = useAuthStore((state) => state.setPlan);
  const afterPlanChange = useAfterPlanChange();
  const [pending, setPending] = useState(false);
  if (process.env.NODE_ENV === "production" || !user) return null;

  const flip = async (plan: "free" | "pro") => {
    if (plan === user.plan) return;
    setPending(true);
    try {
      await setPlan(plan);
      await afterPlanChange();
    } finally {
      setPending(false);
    }
  };

  const resetUsage = async () => {
    const { usage } = await authApi.devResetUsage();
    useAuthStore.getState().setUsage({ promptsUsedToday: usage.used, limit: usage.limit, resetsAt: usage.resets_at });
  };

  return (
    <div className="afvar-glass-panel fixed bottom-3 right-3 z-[90] flex items-center gap-1.5 rounded-full p-1 ps-3 text-[11px] text-(--afvar-muted)" aria-busy={pending}>
      <span className="font-semibold">{t("dev.plan")}</span>
      <div className="afvar-glass-track flex rounded-full p-0.5" role="radiogroup" aria-label={t("dev.plan")}>
        {(["free", "pro"] as const).map((plan) => (
          <button
            key={plan}
            type="button"
            role="radio"
            aria-checked={user.plan === plan}
            disabled={pending}
            onClick={() => void flip(plan)}
            className="afvar-glass-tab rounded-full px-2.5 py-0.5 font-semibold"
          >
            {t(plan === "pro" ? "plan.badge.pro" : "plan.badge.free")}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => void resetUsage()} className="afvar-glass-button rounded-full px-2 py-0.5" title={t("dev.resetUsageHint")}>
        {t("dev.resetUsage")}
      </button>
    </div>
  );
}

/** The app-wide billing overlays; mounted once in the providers. */
export function BillingOverlays() {
  return (
    <>
      <UpgradeModal />
      <StripeCheckoutModal />
      <DevPlanToggle />
    </>
  );
}

/** Settings → Plan & Billing. */
export function BillingSettings() {
  const { t, locale } = useT();
  const user = useAuthStore((state) => state.user);
  const usage = useAuthStore((state) => state.usage);
  const { plan, quota, promptQuota } = useEntitlements();
  const labels = useEntitlementLabels();
  const subscription = useSubscription();
  const afterPlanChange = useAfterPlanChange();
  const openUpgrade = useBillingStore((state) => state.openUpgrade);
  const resetsIn = useCountdown(promptQuota.resetsAt);
  const sub = subscription.data?.subscription ?? null;
  const toggleCancel = useMutation({
    mutationFn: () => (sub?.cancelAtPeriodEnd ? getPaymentProvider().resume() : getPaymentProvider().cancelAtPeriodEnd()),
    onSuccess: () => afterPlanChange(),
  });
  if (!user) return null;

  const entitlements = effectiveEntitlements(user);
  const periodEnd = sub ? new Date(sub.currentPeriodEnd).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-5">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[15px] font-semibold">
            {t("settings.billing.currentPlan")} <PlanBadge />
          </p>
          <p className="text-[12px] text-white/55">
            {plan === "pro"
              ? sub && sub.status === "active"
                ? t(sub.cancelAtPeriodEnd ? "settings.billing.endsOn" : "settings.billing.renewsOn", { date: periodEnd })
                : t("settings.billing.manualPro")
              : t("settings.billing.freeForever")}
          </p>
        </div>
        {plan === "free" ? (
          <button type="button" onClick={() => openUpgrade("generic")} className="h-10 rounded-xl bg-[linear-gradient(135deg,#9BC0FF,#7FA9F5)] px-5 text-[13px] font-semibold text-[#0B1220]">
            {t("plan.upgradeToPro")}
          </button>
        ) : (
          sub &&
          sub.status === "active" && (
            <button type="button" disabled={toggleCancel.isPending} onClick={() => toggleCancel.mutate()} className="h-10 rounded-xl border border-white/15 px-4 text-[13px] text-white/85 hover:bg-white/10 disabled:opacity-60">
              {t(sub.cancelAtPeriodEnd ? "settings.billing.resume" : "settings.billing.cancel")}
            </button>
          )
        )}
      </section>

      <section>
        <h3 className="mb-2 text-[12px] font-semibold tracking-[.14em] text-white/50">{t("settings.billing.usage")}</h3>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          {FEATURE_ORDER.map((feature) => {
            const used = feature === "ai_prompts_per_day" ? usage.promptsUsedToday : null;
            const q = used !== null ? quota(feature, used) : null;
            return (
              <div key={feature} className="flex items-center justify-between gap-4 border-b border-white/[.06] px-4 py-2.5 text-[12.5px] last:border-b-0">
                <span className="text-white/80">{labels.label(feature)}</span>
                <span className="text-end text-white">
                  {q && q.limit !== null ? t("settings.billing.usedOf", { used: q.used, limit: q.limit, resetsIn }) : labels.value(feature, entitlements)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-[11px] text-white/40">{t("settings.billing.provider")}</p>
    </div>
  );
}
