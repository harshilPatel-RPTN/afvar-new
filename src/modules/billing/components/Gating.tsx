"use client";

import { useId, type ReactNode } from "react";
import { Modal } from "@/platform/ui";
import { useT, type MessageKey } from "@/platform/i18n";
import type { Feature } from "../entitlements";
import { useCountdown, useEntitlementLabels, useEntitlements } from "../hooks";
import { useBillingStore, type UpgradeReason } from "../store";

export function LockGlyph({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path d="M6 9V7a4 4 0 0 1 8 0v2M5 9h10v8H5z" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

export function PlanBadge() {
  const { t } = useT();
  const { plan } = useEntitlements();
  return plan === "pro" ? (
    <span className="rounded-full bg-[linear-gradient(135deg,#F7D774,#E9A93B)] px-2 py-0.5 text-[10px] font-bold tracking-[.12em] text-[#2A1A00]">
      {t("plan.badge.pro")}
    </span>
  ) : (
    <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-semibold tracking-[.12em] text-white/75">
      {t("plan.badge.free")}
    </span>
  );
}

/** Top-bar Upgrade button; renders nothing on Pro. */
export function UpgradeButton({ className = "" }: { className?: string }) {
  const { t } = useT();
  const { plan } = useEntitlements();
  const openUpgrade = useBillingStore((state) => state.openUpgrade);
  if (plan === "pro") return null;
  return (
    <button
      type="button"
      onClick={() => openUpgrade("generic")}
      className={`rounded-full bg-[linear-gradient(135deg,#9BC0FF,#7FA9F5)] px-2.5 py-0.5 text-[11px] font-semibold text-[#0B1220] hover:brightness-110 ${className}`}
    >
      {t("plan.upgrade")}
    </button>
  );
}

const TOOLTIP: Partial<Record<Feature, MessageKey>> = {
  voice_navigation: "gate.tooltip.voice_navigation",
  voice_answers: "gate.tooltip.voice_answers",
};

/**
 * Wraps a control that needs a Pro entitlement. When the user lacks it the
 * control stays visible, gains a lock and a tooltip, and any click opens the
 * upgrade modal instead of running the action.
 */
export function UpgradeGate({ feature, children, className = "" }: { feature: Feature; children: ReactNode; className?: string }) {
  const { t } = useT();
  const { can } = useEntitlements();
  const openUpgrade = useBillingStore((state) => state.openUpgrade);
  const tooltipId = useId();
  if (can(feature)) return <>{children}</>;

  const tooltip = t(TOOLTIP[feature] ?? "gate.tooltip.generic");
  return (
    <span
      className={`group/gate relative inline-flex ${className}`}
      aria-describedby={tooltipId}
      onClickCapture={(event) => {
        event.preventDefault();
        event.stopPropagation();
        openUpgrade(feature);
      }}
    >
      <span className="contents opacity-60">{children}</span>
      <span className="pointer-events-none absolute -end-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[#F2C46D] text-[#2A1A00] shadow" aria-hidden="true">
        <LockGlyph className="h-2.5 w-2.5" />
      </span>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-white/10 bg-[rgba(20,26,36,.95)] px-2.5 py-1.5 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-focus-within/gate:opacity-100 group-hover/gate:opacity-100"
      >
        {tooltip}
      </span>
    </span>
  );
}

const REASON_COPY: Record<UpgradeReason, { title: MessageKey; body: MessageKey }> = {
  ai_prompts_per_day: { title: "upgrade.ai_prompts_per_day.title", body: "upgrade.ai_prompts_per_day.body" },
  voice_navigation: { title: "upgrade.voice_navigation.title", body: "upgrade.voice_navigation.body" },
  voice_answers: { title: "upgrade.voice_answers.title", body: "upgrade.voice_answers.body" },
  news_delay_minutes: { title: "upgrade.news_delay_minutes.title", body: "upgrade.news_delay_minutes.body" },
  saved_layouts: { title: "upgrade.saved_layouts.title", body: "upgrade.saved_layouts.body" },
  alerts_max: { title: "upgrade.alerts_max.title", body: "upgrade.alerts_max.body" },
  community_post: { title: "upgrade.generic.title", body: "upgrade.generic.body" },
  generic: { title: "upgrade.generic.title", body: "upgrade.generic.body" },
};

const HIGHLIGHTS: Feature[] = ["ai_prompts_per_day", "voice_navigation", "news_delay_minutes", "saved_layouts", "alerts_max"];

export function UpgradeModal() {
  const { t } = useT();
  const reason = useBillingStore((state) => state.upgradeReason);
  const close = useBillingStore((state) => state.closeUpgrade);
  const openCheckout = useBillingStore((state) => state.openCheckout);
  const { promptQuota } = useEntitlements();
  const labels = useEntitlementLabels();
  const resetsIn = useCountdown(promptQuota.resetsAt);
  const copy = REASON_COPY[reason ?? "generic"];
  const rows = reason && reason !== "generic" && reason !== "community_post" ? [reason, ...HIGHLIGHTS.filter((feature) => feature !== reason)].slice(0, 4) : HIGHLIGHTS;

  return (
    <Modal open={reason !== null} onClose={close} title={t(copy.title)}>
      <p className="mb-5 text-[13px] leading-relaxed text-[#B8C2CF]">{t(copy.body, { resetsIn })}</p>
      <div className="mb-5 overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 bg-white/[.04] px-4 py-2 text-[10px] font-semibold tracking-[.14em] text-white/50">
          <span />
          <span>{t("plan.badge.free")}</span>
          <span className="text-[#F2C46D]">{t("plan.badge.pro")}</span>
        </div>
        {rows.map((feature) => (
          <div key={feature} className={`grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-t border-white/[.06] px-4 py-2.5 text-[12px] ${feature === reason ? "bg-[#8AB4F8]/[.07]" : ""}`}>
            <span className="text-white/85">{labels.label(feature)}</span>
            <span className="text-end text-white/50">{labels.free(feature)}</span>
            <span className="text-end font-medium text-white">{labels.pro(feature)}</span>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => openCheckout("monthly")} className="h-11 w-full rounded-xl bg-[linear-gradient(135deg,#9BC0FF,#7FA9F5)] text-[13px] font-semibold text-[#0B1220] hover:brightness-105">
        {t("plan.upgradeToPro")}
      </button>
      <p className="mt-4 text-center text-[11px] text-white/45">{t("plan.trustLine")}</p>
    </Modal>
  );
}
