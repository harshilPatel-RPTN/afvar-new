"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/platform/i18n";
import { mountAvatar, type AvatarController } from "./embed";

// Sudhakar's avatar deployment. The viewer must stay on this origin: its demo
// AI endpoint (/api/avatar, Gemini) only answers same-origin requests, so a
// self-hosted copy of the viewer would render but never reply.
const VIEWER_URL = "https://afvar-avatar-final.vercel.app/avatar/AFVAR/index.html";

type Phase = "idle" | "loading" | "ready" | "failed";

/**
 * Floating AFVAR avatar chatbot, bottom-right on every page.
 * The viewer mounts on first open and is only hidden (render-paused) on
 * close, so the conversation survives reopening within the same page.
 */
export function AvatarChatWidget() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  // Pages can open the chat ("Talk to AFVAR") or ask the launcher to step aside
  // while they show the avatar themselves: window "afvar:avatar" events with
  // detail { open?: boolean; launcher?: "hide" | "show" }.
  const [launcherHidden, setLauncherHidden] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const avatarRef = useRef<AvatarController | null>(null);

  useEffect(
    () => () => {
      avatarRef.current?.dispose();
      avatarRef.current = null;
    },
    [],
  );

  const ensureMounted = () => {
    if (avatarRef.current || !hostRef.current) return;
    setPhase("loading");
    try {
      const avatar = mountAvatar(hostRef.current, {
        viewerUrl: VIEWER_URL,
        title: t("avatar.title"),
        onReady: () => setPhase("ready"),
        onError: () => setPhase((current) => (current === "ready" ? current : "failed")),
      });
      avatarRef.current = avatar;
      avatar.ready.catch(() => setPhase("failed"));
    } catch {
      setPhase("failed");
    }
  };


  // Hiding pauses rendering and stops voice; showing resumes rendering only.
  const setOpenAndVisibility = (next: boolean) => {
    setOpen(next);
    if (next) ensureMounted();
    avatarRef.current?.setVisible(next).catch(() => {});
  };

  // Uses only refs and state setters, so the first render's closure stays valid.
  const openFromPage = () => {
    setOpen(true);
    ensureMounted();
    avatarRef.current?.setVisible(true).catch(() => {});
  };
  useEffect(() => {
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ open?: boolean; launcher?: "hide" | "show" }>).detail ?? {};
      if (detail.launcher) setLauncherHidden(detail.launcher === "hide");
      if (detail.open) openFromPage();
    };
    window.addEventListener("afvar:avatar", onEvent);
    return () => window.removeEventListener("afvar:avatar", onEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- openFromPage only touches refs and setters
  }, []);

  const retry = () => {
    avatarRef.current?.dispose();
    avatarRef.current = null;
    setPhase("idle");
    ensureMounted();
  };

  return (
    <div
      className={`pointer-events-none fixed bottom-22 right-11 z-120 flex flex-col items-end gap-3 transition-opacity duration-300 motion-reduce:transition-none ${
        launcherHidden && !open ? "invisible opacity-0" : "opacity-100"
      }`}
    >
      <section
        role="dialog"
        aria-label={t("avatar.title")}
        aria-hidden={!open}
        className={`flex h-[min(30rem,calc(100dvh-15.5rem))] w-[min(21rem,calc(100vw-3.5rem))] flex-col overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-2xl shadow-black/50 transition-all duration-200 motion-reduce:transition-none ${
          open
            ? "pointer-events-auto visible translate-y-0 opacity-100"
            : "pointer-events-none invisible translate-y-3 opacity-0"
        }`}
      >
        <header className="flex items-center justify-between border-b border-border-subtle bg-surface-raised px-4 py-2.5">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <span
              aria-hidden
              className={`h-2 w-2 rounded-full ${phase === "ready" ? "bg-positive" : phase === "failed" ? "bg-negative" : "bg-muted"}`}
            />
            {t("avatar.title")}
          </h2>
          <button
            type="button"
            onClick={() => setOpenAndVisibility(false)}
            aria-label={t("avatar.close")}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 5l5 5 5-5" />
            </svg>
          </button>
        </header>
        <div className="relative flex-1 bg-background">
          <div ref={hostRef} className="absolute inset-0" />
          {phase !== "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background px-6 text-center text-sm text-muted">
              {phase === "failed" ? (
                <>
                  <p>{t("avatar.error")}</p>
                  <button
                    type="button"
                    onClick={retry}
                    className="rounded-full border border-border-subtle bg-surface-raised px-4 py-1.5 text-foreground transition-colors hover:border-accent"
                  >
                    {t("avatar.retry")}
                  </button>
                </>
              ) : (
                <p>{t("avatar.loading")}</p>
              )}
            </div>
          )}
        </div>
      </section>
      <button
        type="button"
        onClick={() => setOpenAndVisibility(!open)}
        aria-expanded={open}
        aria-label={open ? t("avatar.close") : t("avatar.open")}
        className="pointer-events-auto relative flex h-18 w-18 items-center justify-center rounded-full border border-[#00E676]/35 bg-surface-raised shadow-lg shadow-black/50 transition-transform duration-150 hover:scale-105 motion-reduce:transition-none"
      >
        {/* The idle float/glow animation pauses while the chat is open. */}
        <span
          aria-hidden
          className={`absolute inset-0 rounded-full bg-[#00E676]/25 blur-md motion-reduce:animate-none ${open ? "opacity-45" : "animate-avatar-glow"}`}
        />
        {/* The avatar's own render (repo reference.png, background removed). */}
        <Image
          src="/avatar/launcher.png"
          alt=""
          width={107}
          height={128}
          className={`pointer-events-none relative h-16 w-auto drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)] motion-reduce:animate-none ${open ? "" : "animate-avatar-float"}`}
        />
      </button>
    </div>
  );
}
