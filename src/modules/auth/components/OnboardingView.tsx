"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, Reorder, motion, useDragControls } from "framer-motion";
import { COVERAGE_LANES, type CoverageLane } from "../lanes";
import { EDITIONS, useI18nStore, useT, type Edition, type MessageKey } from "@/platform/i18n";
import { CURRENCIES, detectedTimeZone, displayName, timeZones } from "../locale-data";
import { useAuthStore } from "../store";
import { AuthCard, AuthSelect, FormNotice } from "./AuthCard";
import { PinPad, useCreatePin } from "./Pin";

const STEPS: MessageKey[] = ["onboarding.step.edition", "onboarding.step.region", "onboarding.step.watchlist", "onboarding.step.pin"];
const EDITION_LABEL: Record<Edition, MessageKey> = { en: "edition.en", hi: "edition.hi", mr: "edition.mr" };
const EDITION_HINT: Record<Edition, MessageKey> = { en: "edition.enHint", hi: "edition.hiHint", mr: "edition.mrHint" };
const COUNTRY_CURRENCY: Record<string, string> = { IN: "INR", AE: "AED", SA: "SAR", GB: "GBP", JP: "JPY", SG: "SGD", AU: "AUD", NZ: "NZD", CA: "CAD", PK: "PKR", BD: "BDT", DE: "EUR", FR: "EUR" };

function LaneRow({ lane, index, total, selected, onToggle, onMove }: {
  lane: CoverageLane;
  index: number;
  total: number;
  selected: boolean;
  onToggle: () => void;
  onMove: (delta: number) => void;
}) {
  const { t } = useT();
  const drag = useDragControls();
  const name = t(lane.nameKey);
  return (
    <Reorder.Item
      value={lane}
      dragListener={false}
      dragControls={drag}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2"
    >
      <button type="button" aria-hidden="true" tabIndex={-1} onPointerDown={(event) => drag.start(event)} className="cursor-grab touch-none text-(--afvar-muted) hover:text-white/80 active:cursor-grabbing">
        <svg viewBox="0 0 20 20" className="h-4 w-4"><path d="M7 5h.01M13 5h.01M7 10h.01M13 10h.01M7 15h.01M13 15h.01" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" /></svg>
      </button>
      <label className="flex flex-1 cursor-pointer items-center gap-3">
        <input type="checkbox" checked={selected} onChange={onToggle} className="h-4 w-4 accent-(--afvar-mint)" />
        <span className="flex flex-col">
          <span className="text-[13px] font-medium text-white">{name}</span>
          <span className="font-mono text-[10.5px] text-(--afvar-muted)">{lane.symbol} · {t(lane.classKey)}</span>
        </span>
      </label>
      <div className="flex gap-1">
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={t("onboarding.moveUp", { name })} className="grid h-7 w-7 place-items-center rounded-lg text-(--afvar-muted) hover:bg-white/10 hover:text-white disabled:opacity-25">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true"><path d="M5 12l5-5 5 5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={t("onboarding.moveDown", { name })} className="grid h-7 w-7 place-items-center rounded-lg text-(--afvar-muted) hover:bg-white/10 hover:text-white disabled:opacity-25">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true"><path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </Reorder.Item>
  );
}

export function OnboardingView() {
  const { t, edition, locale } = useT();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const setEdition = useI18nStore((state) => state.setEdition);

  const [step, setStep] = useState(0);
  const [timezone, setTimezone] = useState(() => detectedTimeZone());
  const [currency, setCurrency] = useState(() => COUNTRY_CURRENCY[user?.country ?? ""] ?? "USD");
  const [lanes, setLanes] = useState(COVERAGE_LANES);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(COVERAGE_LANES.map((lane) => lane.symbol)));
  const [error, setError] = useState<MessageKey | null>(null);

  const zoneOptions = useMemo(() => timeZones().map((zone) => ({ value: zone, label: zone.replace(/_/g, " ") })), []);
  const currencyOptions = useMemo(
    () => CURRENCIES.map((code) => ({ value: code, label: `${code} · ${displayName(code, "currency", locale)}` })),
    [locale],
  );

  const pin = useCreatePin(async (value) => {
    setError(null);
    await completeOnboarding({
      edition,
      timezone,
      displayCurrency: currency,
      watchlist: lanes.filter((lane) => selected.has(lane.symbol)).map((lane) => lane.symbol),
      pin: value,
    });
    router.replace("/desktop?tour=1");
  });

  const move = (index: number, delta: number) =>
    setLanes((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });

  const goNext = () => {
    if (step === 2 && selected.size === 0) {
      setError("onboarding.watchlistEmpty");
      return;
    }
    setError(null);
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  };

  return (
    <AuthCard
      eyebrow={t("onboarding.eyebrow", { step: step + 1, total: STEPS.length })}
      title={t(STEPS[step])}
      subtitle={t(`${STEPS[step]}Hint` as MessageKey)}
      width="max-w-[560px]"
    >
      <div className="mb-6 flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label={t("onboarding.progress")}>
        {STEPS.map((key, index) => (
          <span key={key} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.span className="block h-full rounded-full bg-(--afvar-mint)" initial={false} animate={{ width: index <= step ? "100%" : "0%" }} transition={{ duration: 0.4 }} />
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
          {step === 0 && (
            <div role="radiogroup" aria-label={t("onboarding.step.edition")} className="grid gap-2.5">
              {EDITIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={edition === option}
                  onClick={() => setEdition(option)}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-start transition-colors ${
                    edition === option ? "border-(--afvar-mint)/70 bg-(--afvar-mint)/12" : "border-white/10 bg-white/[.04] hover:bg-white/[.07]"
                  }`}
                >
                  <span className="flex flex-col">
                    <span className="text-[15px] font-semibold text-white" lang={option}>{t(EDITION_LABEL[option])}</span>
                    <span className="text-[12px] text-(--afvar-muted)">{t(EDITION_HINT[option])}</span>
                  </span>
                  <span className={`grid h-5 w-5 place-items-center rounded-full border ${edition === option ? "border-(--afvar-mint) bg-(--afvar-mint)" : "border-white/30"}`}>
                    {edition === option && <span className="h-2 w-2 rounded-full bg-(--afvar-forest)" />}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4">
              <AuthSelect id="timezone" label={t("onboarding.timezone")} value={timezone} onChange={(event) => setTimezone(event.target.value)} options={zoneOptions} />
              <p className="-mt-2 text-[11px] text-(--afvar-muted)">{t("onboarding.timezoneDetected", { zone: detectedTimeZone() })}</p>
              <AuthSelect id="currency" label={t("onboarding.currency")} value={currency} onChange={(event) => setCurrency(event.target.value)} options={currencyOptions} />
            </div>
          )}

          {step === 2 && (
            <Reorder.Group axis="y" values={lanes} onReorder={setLanes} className="grid gap-2">
              {lanes.map((lane, index) => (
                <LaneRow
                  key={lane.symbol}
                  lane={lane}
                  index={index}
                  total={lanes.length}
                  selected={selected.has(lane.symbol)}
                  onMove={(delta) => move(index, delta)}
                  onToggle={() =>
                    setSelected((current) => {
                      const next = new Set(current);
                      if (next.has(lane.symbol)) next.delete(lane.symbol);
                      else next.add(lane.symbol);
                      return next;
                    })
                  }
                />
              ))}
            </Reorder.Group>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-[linear-gradient(160deg,rgba(168,222,194,.11),rgba(163,28,27,.06))] py-6">
              <PinPad
                label={pin.step === "enter" ? t("pin.create") : t("pin.confirm")}
                value={pin.value}
                onChange={pin.setValue}
                onComplete={pin.complete}
                disabled={pin.pending}
                errorSignal={pin.errorSignal}
              />
              <p role="status" className="min-h-4 px-6 text-center text-[12px] text-(--afvar-muted)">
                {pin.error ? t(pin.error) : t("pin.createHint")}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && <div className="mt-4"><FormNotice>{t(error)}</FormNotice></div>}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0}
          className="afvar-glass-button h-11 rounded-xl px-4 text-[13px] disabled:invisible"
        >
          {t("common.back")}
        </button>
        {step < STEPS.length - 1 && (
          <button
            type="button"
            onClick={goNext}
            className="afvar-glass-button afvar-glass-primary h-11 rounded-xl px-6 text-[13px] font-semibold"
          >
            {t("common.continue")}
          </button>
        )}
      </div>
    </AuthCard>
  );
}
