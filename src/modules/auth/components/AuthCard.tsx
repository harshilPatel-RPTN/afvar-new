"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useContext, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { useT } from "@/platform/i18n";
import { SignatureHomeLink } from "@/platform/ui/SignatureHomeLink";

const BrandInFrame = createContext(false);

function AuthHomeLink() {
  const { t } = useT();
  return <SignatureHomeLink label={t("mk.nav.logoLabel")} className="afvar-auth-home" landing />;
}

export function AuthBrandFrame({ children }: { children: ReactNode }) {
  return <BrandInFrame.Provider value={true}><AuthHomeLink />{children}</BrandInFrame.Provider>;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function BrandMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} aria-hidden="true">
      <Image src="/afvar/afvar-mark.png" alt="" fill sizes="64px" className="object-contain" />
    </span>
  );
}

/** Shake controls for a rejected form. */
export function useShake() {
  const controls = useAnimationControls();
  const shake = () => void controls.start({ x: [0, -10, 9, -7, 5, -2, 0], transition: { duration: 0.45 } });
  return { controls, shake };
}

interface AuthCardProps {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  shake?: ReturnType<typeof useAnimationControls>;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function AuthCard({ eyebrow, title, subtitle, shake, children, footer, width = "max-w-[440px]" }: AuthCardProps) {
  const brandInFrame = useContext(BrandInFrame);
  return (
    <main className="relative z-10 flex min-h-svh flex-col items-center justify-center px-4 py-14 text-[#E6EDF3]">
      {!brandInFrame && <AuthHomeLink />}

      <motion.div
        className={`w-full ${width}`}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <motion.div animate={shake} className="relative rounded-[28px] p-px">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
            <div className="absolute inset-[-60%] animate-[spin_10s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(138,180,248,.7)_40deg,transparent_95deg,transparent_180deg,rgba(255,170,130,.5)_220deg,transparent_275deg)] motion-reduce:animate-none" />
          </div>
          {/* Frosted glass: a translucent tinted pane over the nebula, a light top edge and a soft sheen. */}
          <section className="relative overflow-hidden rounded-[27px] border border-white/[.14] bg-[linear-gradient(155deg,rgba(255,255,255,.13),rgba(255,255,255,.04)_42%,rgba(12,17,26,.38))] px-7 pb-7 pt-8 shadow-[0_40px_100px_-30px_rgba(0,0,0,.8),inset_0_1px_0_rgba(255,255,255,.28),inset_0_-1px_0_rgba(255,255,255,.05)] backdrop-blur-[28px] backdrop-saturate-[1.8] sm:px-9">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[120%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(138,180,248,.2),transparent)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)]" />
            <p className="relative mb-2 text-[10px] font-medium tracking-[.28em] text-[#8AB4F8]">{eyebrow}</p>
            <h1 className="relative mb-2 bg-[linear-gradient(180deg,#fff,rgba(214,226,245,.78))] bg-clip-text text-[28px] font-semibold leading-tight tracking-[-.03em] text-transparent">
              {title}
            </h1>
            {subtitle && <p className="relative mb-6 text-[13px] leading-relaxed text-[#B0BBC8]">{subtitle}</p>}
            <div className="relative">{children}</div>
          </section>
        </motion.div>
        {footer && <div className="mt-5 text-center text-[12px] text-[#B0BBC8]">{footer}</div>}
      </motion.div>
    </main>
  );
}

const FIELD_CLASS =
  "h-11 w-full rounded-xl border border-white/15 bg-white/[.07] px-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-md text-[13px] text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#8AB4F8]/60 focus:bg-white/[.09] focus:shadow-[0_0_0_3px_rgba(138,180,248,.12)] aria-[invalid=true]:border-[#F08A7E]/70";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
}

export function AuthField({ label, hint, id, type, ...input }: AuthFieldProps) {
  const { t } = useT();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-medium text-white/80">
        {label}
      </label>
      <div className="relative">
        <input id={id} type={isPassword && revealed ? "text" : type} className={`${FIELD_CLASS} ${isPassword ? "pe-10" : ""}`} {...input} />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? t("auth.field.hidePassword") : t("auth.field.showPassword")}
            className="absolute inset-e-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" fill="none" stroke="currentColor" strokeWidth={1.5} />
              <circle cx="10" cy="10" r="2.3" fill="none" stroke="currentColor" strokeWidth={1.5} />
              {revealed && <path d="M3 3l14 14" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />}
            </svg>
          </button>
        )}
      </div>
      {hint}
    </div>
  );
}

interface AuthSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export function AuthSelect({ label, options, id, ...select }: AuthSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-medium text-white/80">
        {label}
      </label>
      <select id={id} className={`${FIELD_CLASS} appearance-none bg-[rgba(20,26,38,.55)] [&>option]:bg-[#141A26]`} {...select}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SubmitButton({ children, pending = false, pendingLabel }: { children: ReactNode; pending?: boolean; pendingLabel?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="group relative mt-1 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#9BC0FF,#7FA9F5)] text-[14px] font-semibold text-[#0B1220] shadow-[0_12px_32px_-12px_rgba(138,180,248,.8),inset_0_1px_0_rgba(255,255,255,.5)] transition-[transform,box-shadow,opacity] duration-300 hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#8AB4F8] active:translate-y-0 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0B1220]/30 border-t-[#0B1220]" aria-hidden="true" />
          {pendingLabel ?? children}
        </>
      ) : (
        <>
          {children}
          <svg viewBox="0 0 20 20" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
            <path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>
      )}
    </button>
  );
}

/** Inline status line under a form: errors in red, confirmations in green. */
export function FormNotice({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  if (!children) return null;
  const color = tone === "error" ? "border-[#F08A7E]/30 bg-[#F08A7E]/10 text-[#FFC2BA]" : tone === "success" ? "border-[#6FD3A8]/30 bg-[#6FD3A8]/10 text-[#B9F0D6]" : "border-[#8AB4F8]/30 bg-[#8AB4F8]/10 text-[#CFE0FF]";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-3 py-2 text-[12px] leading-snug ${color}`}>
      {children}
    </p>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-[#8AB4F8] hover:underline">
      {children}
    </Link>
  );
}

/**
 * Only same-site relative paths are honoured as `?next=` targets. Browsers
 * treat a backslash like a slash, so `/\evil.com` is rejected along with `//`.
 */
export function safeNext(next: string | null, fallback = "/") {
  if (!next || !/^\/(?![\\/])/.test(next) || next.includes("\\")) return fallback;
  return next;
}
