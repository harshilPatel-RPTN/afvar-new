"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AppUnlock, BrandMark, safeNext, useLockStore, useSession } from "@/modules/auth";
import { AnimatedWordmark } from "./AnimatedWordmark";
import { useT } from "@/platform/i18n";
import { isMacPlatform } from "@/platform/keyboard";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Null until mounted to avoid a hydration mismatch. */
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let timer: number;
    const tick = () => {
      setNow(new Date());
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    tick();
    return () => window.clearTimeout(timer);
  }, []);
  return now;
}

/**
 * The app lock — like a PC, it always asks for the PIN. Signed-in users unlock
 * with their PIN (or create one); a correct PIN unlocks in place, and the
 * screen then offers Lock and Log Out (there are no app pages behind it for
 * now). Signed-out visitors are pointed to sign-in.
 */
export function LockScreen({ onLock }: { onLock?: () => void }) {
  const { t, locale } = useT();
  const next = safeNext(useSearchParams().get("next"));
  const { user, status, isUnlocked, logout } = useSession();
  const lock = useLockStore((state) => state.lock);
  const now = useNow();

  const date = now?.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" });
  const time = now?.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  const signedIn = status === "authenticated" && !!user;
  const unlocked = signedIn && isUnlocked;
  const initial = user?.displayName.trim().charAt(0).toUpperCase() || "A";

  return (
    <main className="relative z-10 flex min-h-svh select-none flex-col items-center text-(--afvar-text)" aria-label={t("lock.label")}>
      <header className="flex w-full items-center justify-between px-6 pt-5 text-[13px] sm:px-10">
        <span className="flex items-center gap-2 font-semibold tracking-[.22em] text-white/90">
          <BrandMark className="h-8 w-8 text-(--afvar-mint)" />
          {/* Starts once the lock screen has faded in, so every letter's arrival is visible. */}
          <AnimatedWordmark text={t("brand.name")} delay={0.5} className="text-[30px]" />
        </span>
        <span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-(--afvar-muted) backdrop-blur-md">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--afvar-mint) opacity-70 motion-reduce:hidden" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--afvar-mint)" />
          </span>
          {t(unlocked ? "lock.unlocked" : "lock.locked")}
        </span>
      </header>

      <motion.section
        className="flex flex-col items-center text-center [text-shadow:0_2px_24px_rgba(0,0,0,.55)]"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        style={{ marginTop: "clamp(12px, 4vh, 48px)" }}
      >
        <p className="min-h-[1.5em] text-base font-medium text-(--afvar-muted) sm:text-lg" suppressHydrationWarning>{date}</p>
        <p
          className="min-h-[1em] font-semibold leading-none tracking-[-.035em] tabular-nums text-(--afvar-text) [text-shadow:none] drop-shadow-[0_2px_18px_rgba(0,0,0,.35)]"
          style={{ fontSize: "clamp(56px, 7vw, 96px)" }}
          suppressHydrationWarning
        >
          {time}
        </p>
      </motion.section>

      <div className="flex-1" />

      <motion.section
        className="mb-[clamp(20px,5vh,56px)] flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
      >
        <div className="afvar-glass-panel grid h-[64px] w-[64px] place-items-center rounded-full text-[24px] font-semibold text-(--afvar-text)">
          {signedIn ? initial : <BrandMark className="h-8 w-8 text-white" />}
        </div>
        <p className="text-[15px] font-semibold text-white [text-shadow:0_1px_10px_rgba(0,0,0,.6)]">
          {signedIn ? user.displayName : <AnimatedWordmark text={t("brand.name")} delay={0.9} className="text-[30px] tracking-[.14em]" />}
        </p>

        {status === "loading" ? (
          <div className="h-[280px]" />
        ) : unlocked ? (
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={lock} className="afvar-glass-button afvar-glass-primary rounded-full px-5 py-2 text-[13px] font-semibold">
              {t("desktop.lock")}
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="afvar-glass-button rounded-full px-5 py-2 text-[13px]"
            >
              {t("lock.logOut")}
            </button>
          </div>
        ) : signedIn ? (
          <AppUnlock />
        ) : (
          <div className="mt-2 flex flex-col items-center gap-3">
            <p className="text-[13px] text-(--afvar-muted) [text-shadow:0_1px_10px_rgba(0,0,0,.6)]">{t("lock.signedOut")}</p>
            <div className="flex gap-2">
              <Link href={`/login?next=${encodeURIComponent(next)}`} className="afvar-glass-button afvar-glass-primary rounded-full px-5 py-2 text-[13px] font-semibold">
                {t("auth.register.signIn")}
              </Link>
              <Link href="/register" className="afvar-glass-button rounded-full px-5 py-2 text-[13px]">
                {t("auth.login.createAccount")}
              </Link>
            </div>
          </div>
        )}

        {signedIn && (
          <p className="mt-2 text-[11px] text-(--afvar-muted)">
            {t("lock.shortcutHint", { keys: isMacPlatform() ? "⌘ ⇧ L" : "Ctrl + Shift + L" })}
          </p>
        )}

        {onLock && (
          <button type="button" onClick={onLock} className="mt-3 min-h-6 py-1 text-[11px] text-(--afvar-muted) hover:text-white">
            {t("lock.exitFullscreen")}
          </button>
        )}
      </motion.section>
    </main>
  );
}
