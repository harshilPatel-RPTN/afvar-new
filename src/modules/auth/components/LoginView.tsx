"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useT, type MessageKey } from "@/platform/i18n";
import { errorKey } from "../locale-data";
import { useAuthStore } from "../store";
import type { AuthResponse } from "../types";
import { AuthCard, AuthField, FormNotice, SubmitButton, TextLink, safeNext, useShake } from "./AuthCard";

export function GoogleButton({ onClick, pending }: { onClick: () => void; pending: boolean }) {
  const { t } = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[.06] text-[13px] font-medium text-white transition-colors hover:bg-white/[.1] disabled:opacity-60"
    >
      <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden="true">
        <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.5-2.5A8.9 8.9 0 0 0 9 0 9 9 0 0 0 1 5l2.9 2.2A5.4 5.4 0 0 1 9 3.6Z" />
        <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7l2.8 2.2c1.7-1.5 2.8-3.8 2.8-6.5Z" />
        <path fill="#FBBC05" d="M3.9 10.8a5.4 5.4 0 0 1 0-3.6L1 5a9 9 0 0 0 0 8l2.9-2.2Z" />
        <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9a5.4 5.4 0 0 1-5.1-3.7L1 13a9 9 0 0 0 8 5Z" />
      </svg>
      {t("auth.google")}
    </button>
  );
}

export function OrDivider() {
  const { t } = useT();
  return (
    <div className="flex items-center gap-3 text-[11px] text-white/45">
      <span className="h-px flex-1 bg-white/10" />
      {t("auth.or")}
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

/** Where a fresh session goes: `?next=` or the OS at `/` (already unlocked by the password). */
export function useAfterAuth() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  return () => router.replace(safeNext(next));
}

/** Signed-in visitors skip the auth forms — decided after the session is verified, not from the cookie. */
export function useRedirectIfSignedIn() {
  const status = useAuthStore((state) => state.status);
  const afterAuth = useAfterAuth();
  useEffect(() => {
    if (status === "authenticated") afterAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
}

export function LoginView() {
  const { t } = useT();
  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const afterAuth = useAfterAuth();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const { controls, shake } = useShake();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Arriving here after five wrong PINs: say why the session ended.
  const [error, setError] = useState<MessageKey | null>(searchParams.get("reason") === "pin_locked" ? "auth.error.pin_locked" : null);
  useRedirectIfSignedIn();
  const [pending, setPending] = useState(false);

  const run = async (attempt: () => Promise<AuthResponse>) => {
    setPending(true);
    setError(null);
    try {
      await attempt();
      afterAuth();
    } catch (failure) {
      setError(errorKey(failure));
      setPassword("");
      shake();
      setPending(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void run(() => login(email, password));
  };

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";

  return (
    <AuthCard
      eyebrow={t("auth.login.eyebrow")}
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      shake={controls}
      footer={
        <>
          {t("auth.login.newHere")} <TextLink href={registerHref}>{t("auth.login.createAccount")}</TextLink>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <GoogleButton pending={pending} onClick={() => void run(loginWithGoogle)} />
        <OrDivider />
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate={false}>
          <AuthField
            id="email"
            label={t("auth.field.email")}
            type="email"
            required
            autoComplete="email"
            placeholder={t("auth.field.emailPlaceholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <AuthField
            id="password"
            label={t("auth.field.password")}
            type="password"
            required
            autoComplete="current-password"
            placeholder={t("auth.field.passwordPlaceholder")}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
          />
          <div className="flex justify-end text-[12px]">
            <Link href="/forgot-password" className="text-[#8AB4F8] hover:underline">
              {t("auth.login.forgot")}
            </Link>
          </div>
          {error && <FormNotice>{t(error)}</FormNotice>}
          <SubmitButton pending={pending} pendingLabel={t("auth.login.pending")}>
            {t("auth.login.submit")}
          </SubmitButton>
          {process.env.NODE_ENV !== "production" && (
            <p className="rounded-xl border border-dashed border-white/15 px-3 py-2 text-center text-[11px] leading-relaxed text-white/55">
              {t("auth.login.demoHint")}
            </p>
          )}
        </form>
      </div>
    </AuthCard>
  );
}
