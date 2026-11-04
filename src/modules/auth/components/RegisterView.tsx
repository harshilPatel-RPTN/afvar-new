"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useT, type MessageKey } from "@/platform/i18n";
import { readStorage, writeStorage } from "@/platform/storage";
import { useHydrated } from "../hooks/useHydrated";
import { COUNTRIES, detectedTimeZone, displayName, errorKey } from "../locale-data";
import { useAuthStore } from "../store";
import { LEGAL_VERSIONS, type RegisterInput } from "../types";
import { AuthCard, AuthField, AuthSelect, FormNotice, SubmitButton, TextLink, focusField, useShake } from "./AuthCard";
import { GoogleButton, OrDivider, useAfterAuth, useRedirectIfSignedIn } from "./LoginView";

const STRENGTH: { key: MessageKey; color: string }[] = [
  { key: "auth.strength.tooShort", color: "bg-white/20" },
  { key: "auth.strength.weak", color: "bg-(--afvar-loss)" },
  { key: "auth.strength.fair", color: "bg-[#F2C46D]" },
  { key: "auth.strength.good", color: "bg-(--afvar-mint)/70" },
  { key: "auth.strength.strong", color: "bg-(--afvar-mint)" },
];

export function passwordStrength(password: string) {
  if (password.length < 8 || /^(.)\1+$/.test(password)) return 0;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((rule) => rule.test(password)).length;
  // One kind of character only (e.g. "aaaabbbb") is too weak unless it's long.
  if (variety < 2 && password.length < 12) return 0;
  return Math.min(4, Math.max(1, variety + (password.length >= 12 ? 1 : 0) - 1));
}

export function StrengthMeter({ password }: { password: string }) {
  const { t } = useT();
  const strength = passwordStrength(password);
  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((level) => (
          <span key={level} className={`h-1 flex-1 rounded-full transition-colors ${strength >= level ? STRENGTH[strength].color : "bg-white/10"}`} />
        ))}
      </div>
      <span className="w-16 text-end text-[10px] text-(--afvar-muted)">{password ? t(STRENGTH[strength].key) : ""}</span>
    </div>
  );
}

function Consent({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: (value: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-[12px] leading-snug text-(--afvar-muted)">
      <input id={id} type="checkbox" required checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-(--afvar-mint)" />
      <span>{children}</span>
    </label>
  );
}

/**
 * Opens a legal page in the same tab. The pages have no way back to this form, so the
 * browser's Back button returns here and the draft below restores what was typed.
 */
function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-(--afvar-mint) underline-offset-2 hover:underline">
      {children}
    </Link>
  );
}

/** What survives a trip to a legal page and back. Never the password. */
const DRAFT_KEY = "afwar.registerDraft";
type Experience = NonNullable<RegisterInput["experience"]>;
interface RegisterDraft {
  step: number;
  displayName: string;
  email: string;
  phone: string;
  country: string;
  experience: Experience;
  consents: { terms: boolean; privacy: boolean; risk: boolean; age: boolean };
}

/** Each stage asks for two or three things; the last one submits. */
const STEPS: MessageKey[] = ["auth.register.step.about", "auth.register.step.security", "auth.register.step.profile", "auth.register.step.agreements"];
const LAST_STEP = STEPS.length - 1;
const EXPERIENCE: { value: Experience; key: MessageKey }[] = [
  { value: "new", key: "auth.experience.new" },
  { value: "intermediate", key: "auth.experience.intermediate" },
  { value: "experienced", key: "auth.experience.experienced" },
];
const EASE = [0.22, 1, 0.36, 1] as const;

function Stepper({ step }: { step: number }) {
  const { t } = useT();
  return (
    <div className="mb-5 flex flex-col gap-2.5">
      <div className="flex gap-1.5" aria-hidden="true">
        {STEPS.map((key, index) => (
          <span key={key} className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.span
              className="absolute inset-0 origin-left rounded-full bg-(--afvar-mint)"
              initial={false}
              animate={{ scaleX: index <= step ? 1 : 0 }}
              transition={{ duration: 0.45, ease: EASE }}
            />
          </span>
        ))}
      </div>
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="font-medium text-white/85">{t(STEPS[step])}</span>
        <span className="text-(--afvar-muted)">{t("auth.register.stepOf", { current: step + 1, total: STEPS.length })}</span>
      </div>
    </div>
  );
}

export function RegisterView() {
  const { t, edition, locale } = useT();
  const register = useAuthStore((state) => state.register);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const afterAuth = useAfterAuth();
  useRedirectIfSignedIn();
  const next = useSearchParams().get("next");
  const { controls, shake } = useShake();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [displayNameValue, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("IN");
  const [experience, setExperience] = useState<Experience>("new");
  const [consents, setConsents] = useState({ terms: false, privacy: false, risk: false, age: false });
  const [error, setError] = useState<MessageKey | null>(null);
  const [pending, setPending] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Restore what was typed before reading a legal page (same tab), once, after hydration.
  useEffect(() => {
    const raw = readStorage(DRAFT_KEY, "session");
    if (raw) {
      try {
        const draft = JSON.parse(raw) as RegisterDraft;
        /* eslint-disable react-hooks/set-state-in-effect -- one-time restore from sessionStorage, unavailable during SSR */
        setDisplayName(draft.displayName ?? "");
        setEmail(draft.email ?? "");
        setPhone(draft.phone ?? "");
        if (draft.country) setCountry(draft.country);
        if (draft.experience) setExperience(draft.experience);
        if (draft.consents) setConsents(draft.consents);
        // The password is never saved, so a restored form resumes no later than that step.
        if (draft.step === LAST_STEP) setStep(LAST_STEP);
        else if (draft.step > 1) setStep(1);
        /* eslint-enable react-hooks/set-state-in-effect */
      } catch {
        // A corrupt draft is simply dropped.
      }
    }
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    const draft: RegisterDraft = { step, displayName: displayNameValue, email, phone, country, experience, consents };
    writeStorage(DRAFT_KEY, JSON.stringify(draft), "session");
  }, [draftLoaded, step, displayNameValue, email, phone, country, experience, consents]);

  const mismatch = confirm.length > 0 && confirm !== password;
  const hydrated = useHydrated();
  const countryOptions = useMemo(
    () =>
      COUNTRIES.map((code) => ({ value: code, label: hydrated ? displayName(code, "region", locale) : code })).sort((a, b) =>
        a.label.localeCompare(b.label, locale),
      ),
    [locale, hydrated],
  );

  /** Shows the error and moves focus to the field that needs fixing, when there is one. */
  const fail = (key: MessageKey, field?: string) => {
    setError(key);
    shake();
    setPending(false);
    if (field) focusField(field);
  };

  const go = (target: number) => {
    setDirection(target > step ? 1 : -1);
    setError(null);
    setStep(target);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (step === 1) {
      if (mismatch) return fail("auth.register.mismatch", "confirm");
      if (passwordStrength(password) === 0) return fail("auth.register.tooShort", "password");
    }
    if (step < LAST_STEP) return go(step + 1);
    // Back from a legal page the password is gone; send the visitor to type it again.
    if (!password) return go(1);
    const missingConsent = (["terms", "privacy", "risk", "age"] as const).find((key) => !consents[key]);
    if (missingConsent) return fail("auth.error.consent_required", `consent-${missingConsent}`);
    setPending(true);
    setError(null);
    try {
      await register({
        email,
        password,
        displayName: displayNameValue,
        country,
        phone,
        experience,
        consentTermsVersion: LEGAL_VERSIONS.terms,
        consentPrivacyVersion: LEGAL_VERSIONS.privacy,
        consentRiskVersion: LEGAL_VERSIONS.risk,
        ageConfirmed: consents.age,
        edition,
        timezone: detectedTimeZone(),
      });
      writeStorage(DRAFT_KEY, null, "session");
      afterAuth();
    } catch (failure) {
      const key = errorKey(failure);
      // A taken email is fixed on the first step.
      if (key === "auth.error.email_taken") go(0);
      fail(key, key === "auth.error.email_taken" ? "email" : undefined);
    }
  };

  const errorId = error ? "register-error" : undefined;
  const consent = (key: keyof typeof consents) => (value: boolean) => setConsents((state) => ({ ...state, [key]: value }));

  const fields: ReactNode[] = [
    <Fragment key="about">
      <AuthField id="name" label={t("auth.field.displayName")} required maxLength={80} autoFocus autoComplete="name" placeholder={t("auth.field.displayNamePlaceholder")} value={displayNameValue} onChange={(event) => setDisplayName(event.target.value)} />
      <AuthField id="email" label={t("auth.field.email")} type="email" required autoComplete="email" placeholder={t("auth.field.emailPlaceholder")} value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={error === "auth.error.email_taken" || undefined} aria-describedby={error === "auth.error.email_taken" ? errorId : undefined} />
    </Fragment>,
    <Fragment key="security">
      <AuthField
        id="password"
        label={t("auth.field.password")}
        type="password"
        required
        autoFocus
        minLength={8}
        autoComplete="new-password"
        placeholder={t("auth.field.newPasswordPlaceholder")}
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setError(null);
        }}
        hint={<StrengthMeter password={password} />}
        aria-invalid={error === "auth.register.tooShort" || undefined}
        aria-describedby={error === "auth.register.tooShort" ? errorId : undefined}
      />
      <AuthField
        id="confirm"
        label={t("auth.field.confirmPassword")}
        type="password"
        required
        autoComplete="new-password"
        placeholder={t("auth.field.confirmPlaceholder")}
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        aria-invalid={mismatch}
        hint={mismatch && <span className="text-[11px] text-(--afvar-loss)">{t("auth.register.mismatch")}</span>}
      />
    </Fragment>,
    <Fragment key="profile">
      <AuthSelect id="country" label={t("auth.field.country")} value={country} onChange={(event) => setCountry(event.target.value)} options={countryOptions} />
      <AuthField id="phone" label={t("auth.field.phone")} type="tel" autoComplete="tel" maxLength={32} pattern="\+?[0-9 \-]{6,31}" placeholder={t("auth.field.phonePlaceholder")} value={phone} onChange={(event) => setPhone(event.target.value)} />
      <AuthSelect
        id="experience"
        label={t("auth.field.experience")}
        value={experience}
        onChange={(event) => setExperience(event.target.value as Experience)}
        options={EXPERIENCE.map((option) => ({ value: option.value, label: t(option.key) }))}
      />
    </Fragment>,
    <fieldset key="agreements" className="flex flex-col gap-2.5 rounded-2xl border border-white/15 bg-white/[.05] p-3.5 backdrop-blur-md">
      <legend className="px-1 text-[11px] font-medium text-white/80">{t("auth.register.consentLegend")}</legend>
      <Consent id="consent-terms" checked={consents.terms} onChange={consent("terms")}>
        {t("auth.register.consentTermsPrefix")} <LegalLink href="/terms">{t("legal.terms.title")}</LegalLink>
      </Consent>
      <Consent id="consent-privacy" checked={consents.privacy} onChange={consent("privacy")}>
        {t("auth.register.consentPrivacyPrefix")} <LegalLink href="/privacy">{t("legal.privacy.title")}</LegalLink>
      </Consent>
      {/* No risk-disclaimer page yet; until one is written, /terms ("What AFVAR is") states the not-advice terms. */}
      <Consent id="consent-risk" checked={consents.risk} onChange={consent("risk")}>
        {t("auth.register.consentRisk")} <LegalLink href="/terms">{t("legal.risk.title")}</LegalLink>
      </Consent>
      <Consent id="consent-age" checked={consents.age} onChange={consent("age")}>
        {t("auth.register.consentAge")}
      </Consent>
    </fieldset>,
  ];

  return (
    <AuthCard
      eyebrow={t("auth.register.eyebrow")}
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      shake={controls}
      width="max-w-[480px]"
      footer={
        <>
          {t("auth.register.haveAccount")}{" "}
          <TextLink href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}>{t("auth.register.signIn")}</TextLink>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {step === 0 && (
          <>
            <GoogleButton pending={pending} onClick={() => void loginWithGoogle().then(() => afterAuth(), (failure) => fail(errorKey(failure)))} />
            <OrDivider />
          </>
        )}
        <form onSubmit={submit} className="flex flex-col">
          <Stepper step={step} />
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({ opacity: 0, x: dir * 28 }),
                  center: { opacity: 1, x: 0 },
                  exit: (dir: number) => ({ opacity: 0, x: dir * -28 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: EASE }}
                className="flex flex-col gap-4 p-px"
              >
                {fields[step]}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {error && <FormNotice id="register-error">{t(error)}</FormNotice>}
            <div className="flex items-center gap-2.5">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => go(step - 1)}
                  disabled={pending}
                  className="afvar-glass-button mt-1 flex h-12 shrink-0 items-center gap-1.5 rounded-xl px-4 text-[13px] font-medium disabled:opacity-60"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                    <path d="M16 10H5M9 6l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t("auth.register.back")}
                </button>
              )}
              <div className="flex-1">
                <SubmitButton pending={pending} pendingLabel={t("auth.register.pending")}>
                  {step === LAST_STEP ? t("auth.register.submit") : t("auth.register.next")}
                </SubmitButton>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AuthCard>
  );
}
