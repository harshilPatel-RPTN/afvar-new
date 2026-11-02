"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/platform/i18n";
import { AvatarEntrance } from "./AvatarEntrance";
import { mountAvatar, type AvatarController, type AvatarState } from "./embed";

// Sudhakar's avatar deployment. The viewer must stay on this origin: its demo
// AI endpoint (/api/avatar, Gemini) only answers same-origin requests, so a
// self-hosted copy of the viewer would render but never reply.
const VIEWER_URL = "https://afvar-avatar-final.vercel.app/avatar/AFVAR/index.html";

type Phase = "idle" | "loading" | "ready" | "failed";

/**
 * Floating AFVAR avatar chatbot: launcher bottom-right on every page; below lg the open chat is a centred modal.
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
  // Latest viewer state, read by the entrance before it hands the robot back to idle.
  const avatarStateRef = useRef<AvatarState | null>(null);

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
        onReady: (state) => {
          avatarStateRef.current = state;
          setPhase("ready");
        },
        onState: (state) => {
          avatarStateRef.current = state;
        },
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

  // Below lg the open chat is a centred modal over a dim backdrop: Escape closes it,
  // focus moves into the panel and back to the launcher, and the page stops scrolling.
  const panelRef = useRef<HTMLElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023.98px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
          avatarRef.current?.setVisible(false).catch(() => {});
        }
      };
      window.addEventListener("keydown", onKey);
      // Next frame: the panel's visibility has flipped by then, so it can take focus.
      const raf = compact
        ? requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true }))
        : 0;
      return () => {
        window.removeEventListener("keydown", onKey);
        cancelAnimationFrame(raf);
      };
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      const raf = requestAnimationFrame(() => {
        const active = document.activeElement;
        if (!active || active === document.body || panelRef.current?.contains(active)) {
          launcherRef.current?.focus({ preventScroll: true });
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [open, compact]);
  useEffect(() => {
    if (!open || !compact) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [open, compact]);

  const retry = () => {
    avatarRef.current?.dispose();
    avatarRef.current = null;
    setPhase("idle");
    ensureMounted();
  };

  return (
    <div
      data-avatar-dock=""
      className={`pointer-events-none fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-[max(16px,env(safe-area-inset-right))] z-120 flex flex-col items-end gap-3 transition-[opacity,translate] duration-300 lg:bottom-22 lg:right-11 motion-reduce:transition-none ${
        launcherHidden && !open ? "invisible opacity-0" : "opacity-100"
      }`}
    >
      {/* Below lg: a full-viewport layer that is both the dim backdrop (tap closes) and the
          flex centre for the panel. At lg+ it is display:contents, so the panel stays the
          dock's own flex child above the launcher exactly as before. */}
      <div
        data-avatar-layer=""
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpenAndVisibility(false);
        }}
        className={`fixed inset-0 flex h-dvh items-center justify-center bg-black/55 pt-[max(16px,env(safe-area-inset-top))] pr-[max(16px,env(safe-area-inset-right))] pb-[max(16px,env(safe-area-inset-bottom))] pl-[max(16px,env(safe-area-inset-left))] transition-[opacity,visibility] motion-reduce:transition-none lg:contents ${
          open ? "pointer-events-auto visible opacity-100 duration-300 ease-out" : "pointer-events-none invisible opacity-0 duration-200 ease-in"
        }`}
      >
      <section
        ref={panelRef}
        role="dialog"
        aria-label={t("avatar.title")}
        aria-hidden={!open}
        aria-modal={open && compact ? true : undefined}
        // Phones/tablets: scales out of the screen centre. lg+: grows out of the launcher's
        // bottom-right corner. Both with a soft overshoot; folds back on close.
        className={`flex h-[min(30rem,calc(100dvh-168px))] w-[min(21rem,calc(100vw-2rem))] shrink-0 origin-center lg:h-[min(30rem,calc(100dvh-15.5rem))] lg:origin-bottom-right flex-col overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-2xl shadow-black/50 lg:transition-[opacity,transform,visibility] motion-reduce:transition-none lg:motion-reduce:transition-none ${
          open
            ? "pointer-events-auto visible translate-y-0 scale-100 opacity-100 transition-[opacity,scale,translate] duration-[420ms] ease-[cubic-bezier(.2,1.3,.4,1)]"
            : "pointer-events-none invisible translate-y-0 scale-90 opacity-0 transition-[opacity,scale,translate,visibility] duration-200 ease-in lg:translate-y-4 lg:scale-[.86]"
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
          {/* Replays on every open: the robot materialises out of the hologram ring and waves. */}
          <AvatarEntrance active={open && phase === "ready"} avatarRef={avatarRef} stateRef={avatarStateRef} />
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
      </div>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpenAndVisibility(!open)}
        aria-expanded={open}
        aria-label={open ? t("avatar.close") : t("avatar.open")}
        // Opts out of the site-wide smoked-glass button skin (brand.css, unlayered, so it
        // beat these utilities and left the launcher dim); the launcher draws its own ring.
        data-glass-hit-area=""
        // No disc behind the robot: the render itself is the button (larger, so it reads on its own).
        className={`pointer-events-auto outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00E676] relative flex h-24 w-20 items-center justify-center rounded-2xl bg-transparent transition-transform duration-150 hover:scale-105 motion-reduce:transition-none lg:h-28 lg:w-24 ${
          // Below lg the centred panel owns the screen; the launcher steps out until it closes.
          open ? "max-lg:invisible max-lg:opacity-0" : ""
        }`}
      >
        {/* The avatar's own render (repo reference.png, background removed). The idle float pauses while the chat is open. */}
        <Image
          src="/avatar/launcher.png"
          alt=""
          width={107}
          height={128}
          className={`pointer-events-none relative h-24 w-auto drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)] motion-reduce:animate-none lg:h-28 ${open ? "" : "animate-avatar-float"}`}
        />
      </button>
    </div>
  );
}
