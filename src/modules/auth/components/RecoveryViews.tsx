"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useT, type MessageKey } from "@/platform/i18n";
import { authApi } from "../api";
import { errorKey } from "../locale-data";
import { useAuthStore } from "../store";
import { AuthCard, AuthField, FormNotice, SubmitButton, TextLink, focusField, useShake } from "./AuthCard";
import { StrengthMeter, passwordStrength } from "./RegisterView";

function BackToSignIn() {
  const { t } = useT();
  return <TextLink href="/login">{t("auth.recovery.backToSignIn")}</TextLink>;
}

/** A full-width link button: the demo reset link, "Back to sign in", or Contact. */
function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="afvar-glass-button flex h-10 items-center justify-center rounded-xl text-[12px] font-medium">
      {label}
    </Link>
  );
}

/**
 * Who answers a reset request. Only a real backend (`NEXT_PUBLIC_API_BASE_URL`) sends email.
 * Without one, the in-browser mock can only reset its own demo accounts, so it runs as a
 * labelled demo in development; elsewhere (accounts in Google Sheets, or a static build)
 * nothing could send or honour a link, so the pages say so instead of faking success.
 */
const RECOVERY: "live" | "demo" | "off" = process.env.NEXT_PUBLIC_API_BASE_URL
  ? "live"
  : process.env.NEXT_PUBLIC_AUTH_STORE !== "sheets" && process.env.NODE_ENV !== "production"
    ? "demo"
    : "off";

/** Shown instead of a recovery form when no backend can reset a password. */
function RecoveryUnavailable({ eyebrow, title }: { eyebrow: string; title: string }) {
  const { t } = useT();
  return (
    <AuthCard eyebrow={eyebrow} title={title} footer={<BackToSignIn />}>
      <div className="flex flex-col gap-3">
        <FormNotice tone="info">{t("auth.forgot.unavailable")}</FormNotice>
        <ActionLink href="/contact" label={t("mk.nav.contact")} />
      </div>
    </AuthCard>
  );
}

export function ForgotPasswordView() {
  const { t } = useT();
  if (RECOVERY === "off") return <RecoveryUnavailable eyebrow={t("auth.forgot.eyebrow")} title={t("auth.forgot.title")} />;
  return <ForgotPasswordForm />;
}

function ForgotPasswordForm() {
  const { t } = useT();
  const { controls, shake } = useShake();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState<{ devUrl?: string } | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await authApi.forgot(email);
      setSent({ devUrl: response.dev_reset_url });
    } catch (failure) {
      setError(errorKey(failure));
      shake();
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthCard eyebrow={t("auth.forgot.eyebrow")} title={t("auth.forgot.title")} subtitle={t("auth.forgot.subtitle")} shake={controls} footer={<BackToSignIn />}>
      {sent ? (
        <div className="flex flex-col gap-3">
          <FormNotice tone={RECOVERY === "demo" ? "info" : "success"}>
            {RECOVERY === "demo" ? t("auth.forgot.demoSent") : t("auth.forgot.sent", { email })}
          </FormNotice>
          {sent.devUrl && <ActionLink href={sent.devUrl} label={t("auth.forgot.demoLink")} />}
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <AuthField id="email" label={t("auth.field.email")} type="email" required autoComplete="email" placeholder={t("auth.field.emailPlaceholder")} value={email} onChange={(event) => setEmail(event.target.value)} />
          {error && <FormNotice>{t(error)}</FormNotice>}
          <SubmitButton pending={pending}>{t("auth.forgot.submit")}</SubmitButton>
        </form>
      )}
    </AuthCard>
  );
}

export function ResetPasswordView() {
  const { t } = useT();
  if (RECOVERY === "off") return <RecoveryUnavailable eyebrow={t("auth.reset.eyebrow")} title={t("auth.reset.title")} />;
  return <ResetPasswordForm />;
}

function ResetPasswordForm() {
  const { t } = useT();
  const token = useSearchParams().get("token") ?? "";
  const { controls, shake } = useShake();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<MessageKey | null>(token ? null : "auth.error.invalid_token");
  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mismatch || passwordStrength(password) === 0) {
      setError(mismatch ? "auth.register.mismatch" : "auth.register.tooShort");
      shake();
      focusField(mismatch ? "confirm" : "password");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await authApi.reset(token, password);
      // Every session was revoked server-side; drop ours too.
      useAuthStore.getState().clearSession();
      setDone(true);
    } catch (failure) {
      setError(errorKey(failure));
      shake();
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthCard eyebrow={t("auth.reset.eyebrow")} title={t("auth.reset.title")} subtitle={t("auth.reset.subtitle")} shake={controls} footer={<BackToSignIn />}>
      {done ? (
        <div className="flex flex-col gap-3">
          <FormNotice tone="success">{t("auth.reset.done")}</FormNotice>
          <ActionLink href="/login" label={t("auth.recovery.backToSignIn")} />
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <AuthField id="password" label={t("auth.field.newPassword")} type="password" required minLength={8} autoComplete="new-password" placeholder={t("auth.field.newPasswordPlaceholder")} value={password} onChange={(event) => setPassword(event.target.value)} hint={<StrengthMeter password={password} />} aria-invalid={error === "auth.register.tooShort" || undefined} aria-describedby={error ? "reset-error" : undefined} disabled={!token} />
          <AuthField id="confirm" label={t("auth.field.confirmPassword")} type="password" required autoComplete="new-password" placeholder={t("auth.field.confirmPlaceholder")} value={confirm} onChange={(event) => setConfirm(event.target.value)} aria-invalid={mismatch} aria-describedby={error === "auth.register.mismatch" ? "reset-error" : undefined} disabled={!token} />
          {error && (
            <FormNotice id="reset-error">
              {t(error)}{" "}
              {(error === "auth.error.invalid_token" || error === "auth.error.token_expired") && (
                <Link href="/forgot-password" className="font-semibold underline">
                  {t("auth.reset.requestNew")}
                </Link>
              )}
            </FormNotice>
          )}
          <SubmitButton pending={pending}>{t("auth.reset.submit")}</SubmitButton>
        </form>
      )}
    </AuthCard>
  );
}

export function VerifyEmailView() {
  const { t } = useT();
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"pending" | "done" | MessageKey>(token ? "pending" : "auth.error.invalid_token");
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    authApi.verify(token).then(
      ({ user }) => {
        const store = useAuthStore.getState();
        if (store.user?.id === user.id) store.replaceUser(user);
        setState("done");
      },
      (failure) => setState(errorKey(failure)),
    );
  }, [token]);

  return (
    <AuthCard eyebrow={t("auth.verify.eyebrow")} title={t("auth.verify.title")} footer={<BackToSignIn />}>
      <div className="flex flex-col gap-3" aria-live="polite">
        {state === "pending" && <FormNotice tone="info">{t("auth.verify.pending")}</FormNotice>}
        {state === "done" && (
          <>
            <FormNotice tone="success">{t("auth.verify.done")}</FormNotice>
            <ActionLink href="/" label={t("auth.verify.continue")} />
          </>
        )}
        {state !== "pending" && state !== "done" && <FormNotice>{t(state)}</FormNotice>}
      </div>
    </AuthCard>
  );
}
