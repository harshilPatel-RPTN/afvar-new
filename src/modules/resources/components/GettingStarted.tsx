"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AppIcon, PIcon } from "@/modules/platform/kit";
import { GETTING_STARTED } from "../content";
import { Window } from "./Window";

const STORE_KEY = "afvar.resources.start";
const MIN_WIDTH = 1000;

function subscribeWidth(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

/**
 * W5.2 checklist: tick steps off as you go (kept on this device only — it is
 * a personal checklist, not your account record), with a live check of this
 * screen against the OS workspace's 1000 px minimum.
 */
export function StartChecklist() {
  const steps = GETTING_STARTED.steps;
  const [done, setDone] = useState<string[]>([]);
  const [open, setOpen] = useState<string>(steps[0].id);
  const width = useSyncExternalStore(subscribeWidth, () => window.innerWidth, () => 0);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(STORE_KEY) ?? "[]");
        if (Array.isArray(saved)) setDone(saved.filter((s) => typeof s === "string"));
      } catch {
        /* storage unavailable: start empty */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  function toggle(id: string) {
    const next = done.includes(id) ? done.filter((s) => s !== id) : [...done, id];
    setDone(next);
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* keep in memory only */
    }
    if (!done.includes(id)) {
      const following = steps.find((s) => !next.includes(s.id));
      if (following) setOpen(following.id);
    }
  }

  const progress = done.length / steps.length;
  const wide = width >= MIN_WIDTH;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.4fr_1fr]">
      <Window
        title="Getting Started — AFVAR"
        toolbar={<span className="text-[12px] tabular-nums text-(--text-muted)">{done.length}/{steps.length}</span>}
        bodyClassName="p-5 sm:p-6"
      >
        <div className="flex items-center gap-4">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[.06]" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done.length} aria-label="Checklist progress">
            <motion.div className="h-full rounded-full bg-(--accent)" animate={{ width: `${progress * 100}%` }} transition={{ type: "spring", stiffness: 140, damping: 22 }} />
          </div>
          <span className="text-[12.5px] font-medium text-(--text-secondary)">{progress === 1 ? "All set" : `${Math.round(progress * 100)}%`}</span>
        </div>

        <ol className="pf-group mt-5">
          {steps.map((step, i) => {
            const isDone = done.includes(step.id);
            const isOpen = open === step.id;
            return (
              <li key={step.id} id={step.id} className="scroll-mt-40">
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => toggle(step.id)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `Mark “${step.title}” as not done` : `Mark “${step.title}” as done`}
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors ${isDone ? "bg-(--accent) text-(--text-inverse)" : "border border-white/25 text-transparent hover:border-(--accent)"}`}
                  >
                    <motion.span initial={false} animate={{ scale: isDone ? 1 : 0.4 }}>
                      <PIcon name="check" size={13} weight="bold" />
                    </motion.span>
                  </button>
                  <button type="button" onClick={() => setOpen(isOpen ? "" : step.id)} aria-expanded={isOpen} className="flex flex-1 items-center gap-3 text-left">
                    <span className="text-[12px] tabular-nums text-(--text-muted)">{i + 1}</span>
                    <span className={`flex-1 text-[15.5px] font-medium ${isDone ? "text-(--text-muted) line-through decoration-white/25" : ""}`}>{step.title}</span>
                    <span className="max-sm:hidden text-[11px] text-(--text-disabled)">{step.ref}</span>
                    <PIcon name="chevron" size={13} className={`transition-transform ${isOpen ? "rotate-90 text-(--accent)" : "text-(--text-muted)"}`} />
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="flex gap-4 px-4 pb-5 pl-[52px]">
                        <div className="flex-1">
                          <p className="text-[14.5px] leading-relaxed text-(--text-secondary)">{step.body}</p>
                          <p className="mt-4 text-[11.5px] font-semibold text-(--text-muted)">You&rsquo;ll need</p>
                          <ul className="mt-1.5 space-y-1">
                            {step.needs.map((n) => (
                              <li key={n} className="flex items-center gap-2 text-[13.5px] text-(--text-secondary)">
                                <span className="h-1 w-1 rounded-full bg-(--accent)" />
                                {n}
                              </li>
                            ))}
                          </ul>
                          {step.link && (
                            <Link href={step.link.href} className="mt-4 inline-flex items-center gap-1 text-[14px] text-(--accent) hover:underline">
                              {step.link.label}
                              <PIcon name="chevron" size={12} weight="bold" />
                            </Link>
                          )}
                        </div>
                        <AppIcon icon={step.icon} tone={isDone ? "green" : "slate"} size={40} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-[11.5px] text-(--text-muted)">Your ticks are kept on this device only. Your real queue record lives on your account.</p>
      </Window>

      <div className="space-y-5">
        <Window size="sm" title="Screen check" bodyClassName="p-5">
          <div className="flex items-center gap-3">
            <AppIcon icon="desktop" tone={width === 0 ? "slate" : wide ? "green" : "red"} size={40} />
            <div>
              <p className="text-[15px] font-semibold">{width === 0 ? "Checking this window…" : wide ? "Ready for the OS workspace" : "Too narrow for the OS workspace"}</p>
              <p className="text-[12.5px] text-(--text-muted)">
                {width > 0 && <>This window is {width} px wide · minimum {MIN_WIDTH} px</>}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-(--text-secondary)">{GETTING_STARTED.device}</p>
        </Window>
        <Window size="sm" title="Good to know" bodyClassName="p-5">
          <ul className="space-y-3 text-[13.5px] leading-relaxed text-(--text-secondary)">
            <li className="flex gap-2.5">
              <PIcon name="check" size={15} className="mt-0.5 shrink-0 text-(--accent)" />
              Registration is free. No payment is taken before launch.
            </li>
            <li className="flex gap-2.5">
              <PIcon name="check" size={15} className="mt-0.5 shrink-0 text-(--accent)" />
              One account, one queue record — verification never moves it.
            </li>
            <li className="flex gap-2.5">
              <PIcon name="check" size={15} className="mt-0.5 shrink-0 text-(--accent)" />
              Editions: English and हिन्दी.
            </li>
          </ul>
        </Window>
      </div>
    </div>
  );
}
