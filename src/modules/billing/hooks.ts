"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth";
import { useT, type MessageKey } from "@/platform/i18n";
import { billingApi } from "./api";
import { PLANS, can as canFor, quota as quotaFor, type Entitlements, type Feature } from "./entitlements";
import { getPaymentProvider } from "./payment";
import type { BillingInterval } from "./prices";

/** Gating for the signed-in user. Signed-out visitors get the free plan's view. */
export function useEntitlements() {
  const user = useAuthStore((state) => state.user);
  const usage = useAuthStore((state) => state.usage);
  const subject = user ?? { plan: "free" as const, entitlementsOverride: null, timezone: "UTC" };

  return {
    plan: subject.plan,
    can: (feature: Feature) => canFor(subject, feature),
    quota: (feature: Feature, used = 0) => quotaFor(subject, feature, used),
    promptQuota: { ...quotaFor(subject, "ai_prompts_per_day", usage.promptsUsedToday), resetsAt: usage.resetsAt ?? quotaFor(subject, "ai_prompts_per_day").resetsAt },
  };
}

/** A ticking "7h 12m" until the given ISO time. */
export function useCountdown(iso: string | null) {
  const { t } = useT();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!iso) return "";
  const minutes = Math.max(0, Math.round((new Date(iso).getTime() - now) / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? t("time.hoursMinutes", { hours, minutes: minutes % 60 }) : t("time.minutes", { minutes });
}

export function useSubscription() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({ queryKey: ["billing", "subscription", userId], queryFn: billingApi.subscription, enabled: !!userId });
}

/** Starts a checkout session with the active payment provider. */
export function useCheckout() {
  return useMutation({ mutationFn: (interval: BillingInterval) => getPaymentProvider().createCheckout(interval) });
}

/** After any plan change: refresh the session and every cached query that depends on the plan. */
export function useAfterPlanChange() {
  const queryClient = useQueryClient();
  return async () => {
    await useAuthStore.getState().refresh();
    await queryClient.invalidateQueries();
  };
}

/** How a plan value reads in the pricing table and upgrade prompts. */
export function useEntitlementLabels() {
  const { t } = useT();
  const value = (feature: Feature, entitlements: Entitlements): string => {
    const raw = entitlements[feature];
    switch (feature) {
      case "ai_prompts_per_day":
        return raw === null ? t("plan.value.unlimited") : t("plan.value.promptsPerDay", { count: raw as number });
      case "news_delay_minutes":
        return raw === 0 ? t("plan.value.live") : t("plan.value.delayed", { minutes: raw as number });
      case "saved_layouts":
        return raw === null ? t("plan.value.unlimited") : t("plan.value.count", { count: raw as number });
      case "alerts_max":
        return raw === null ? t("plan.value.unlimited") : t("plan.value.count", { count: raw as number });
      case "community_post":
        return raw ? t("plan.value.readPost") : t("plan.value.readOnly");
      default:
        return raw ? t("plan.value.included") : t("plan.value.notIncluded");
    }
  };
  return {
    label: (feature: Feature) => t(`plan.feature.${feature}` as MessageKey),
    value,
    free: (feature: Feature) => value(feature, PLANS.free),
    pro: (feature: Feature) => value(feature, PLANS.pro),
  };
}
