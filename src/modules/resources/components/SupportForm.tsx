"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useState, type FormEvent } from "react";
import { PIcon } from "@/modules/platform/kit";
import { HELP } from "../content";
import { Window } from "./Window";

const DRAFT_KEY = "afvar.resources.support";
const LANES = ["XAUUSD", "XAGUSD", "WTI", "EURUSD", "USDJPY", "GBPUSD", "NZDUSD", "Crypto"];
const DATA_TOPICS = new Set(["Market data", "Analysis and verdicts"]);

type Draft = { topic: string; email: string; instrument: string; badge: string; details: string };
type Status = "idle" | "sending" | "kept" | "failed";

const EMPTY: Draft = { topic: "", email: "", instrument: "", badge: "", details: "" };

function validate(d: Draft) {
  const errors: Partial<Record<keyof Draft, string>> = {};
  if (!d.topic) errors.topic = "Choose the topic closest to your problem.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) errors.email = "Enter an email address we can reply to.";
  if (d.details.trim().length < 20) errors.details = "Tell us a little more — at least 20 characters.";
  return errors;
}

/**
 * W5.6.4 · Contact Support — the one shared destination. Request: topic,
 * contact and problem details (plus instrument and badge text for data
 * issues, which make a wrong-number report checkable). Support opens at
 * launch, so a request is kept on this device, clearly not sent; storage
 * failure shows the failed state with Retry. Drafts autosave.
 */
export function SupportForm() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);
  const ids = useId();

  useEffect(() => {
    const t = window.setTimeout(() => {
      let restored: Draft = EMPTY;
      try {
        const saved = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "null");
        if (saved && typeof saved === "object") restored = { ...EMPTY, ...saved };
      } catch {
        /* no draft */
      }
      const topic = new URLSearchParams(window.location.search).get("topic");
      if (topic && (HELP.topics as readonly string[]).includes(topic)) restored = { ...restored, topic };
      setDraft(restored);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (status === "kept" || status === "failed") setStatus("idle");
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    } catch {
      /* drafts are a convenience */
    }
  }

  const errors = validate(draft);
  const invalid = Object.keys(errors).length > 0;

  function keep() {
    setStatus("sending");
    window.setTimeout(() => {
      try {
        const record = { ...draft, savedAt: new Date().toISOString(), sent: false };
        window.localStorage.setItem(`${DRAFT_KEY}.request`, JSON.stringify(record));
        setStatus("kept");
      } catch {
        setStatus("failed");
      }
    }, 700);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (invalid) return;
    keep();
  }

  function copySummary() {
    const text = [`Topic: ${draft.topic}`, `Email: ${draft.email}`, draft.instrument && `Instrument: ${draft.instrument}`, draft.badge && `Badge: ${draft.badge}`, "", draft.details].filter(Boolean).join("\n");
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => undefined);
  }

  const field = "mt-1.5 w-full rounded-lg bg-white/[.05] px-3.5 py-2.5 text-[14.5px] text-(--text-primary) shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.12)] outline-none transition-shadow placeholder:text-(--text-muted) focus:shadow-[inset_0_0_0_1.5px_var(--accent)]";
  const err = (k: keyof Draft) =>
    touched && errors[k] ? (
      <p id={`${ids}-${k}-err`} className="mt-1.5 text-[12.5px] text-(--afvar-loss)">
        {errors[k]}
      </p>
    ) : null;

  return (
    <Window title="New Support Request — AFVAR" bodyClassName="p-5 sm:p-7">
      <form noValidate onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
        <label className="text-[13px] font-medium text-(--text-secondary)">
          Topic
          <select value={draft.topic} onChange={(e) => update("topic", e.target.value)} aria-invalid={touched && !!errors.topic} aria-describedby={`${ids}-topic-err`} className={`${field} appearance-none`}>
            <option value="">Choose a topic…</option>
            {HELP.topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {err("topic")}
        </label>
        <label className="text-[13px] font-medium text-(--text-secondary)">
          Your email
          <input type="email" autoComplete="email" value={draft.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" aria-invalid={touched && !!errors.email} aria-describedby={`${ids}-email-err`} className={field} />
          {err("email")}
        </label>

        <AnimatePresence initial={false}>
          {DATA_TOPICS.has(draft.topic) && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="grid gap-5 overflow-hidden sm:col-span-2 sm:grid-cols-2">
              <label className="text-[13px] font-medium text-(--text-secondary)">
                Instrument <span className="font-normal text-(--text-muted)">(optional)</span>
                <select value={draft.instrument} onChange={(e) => update("instrument", e.target.value)} className={`${field} appearance-none`}>
                  <option value="">Not specific</option>
                  {LANES.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </label>
              <label className="text-[13px] font-medium text-(--text-secondary)">
                Badge text <span className="font-normal text-(--text-muted)">(optional)</span>
                <input value={draft.badge} onChange={(e) => update("badge", e.target.value)} placeholder="source · venue · time · delay · cache age" className={field} />
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        <label className="text-[13px] font-medium text-(--text-secondary) sm:col-span-2">
          What happened?
          <textarea
            rows={5}
            value={draft.details}
            onChange={(e) => update("details", e.target.value)}
            placeholder="What you did, what you expected, what you saw instead."
            aria-invalid={touched && !!errors.details}
            aria-describedby={`${ids}-details-err`}
            className={`${field} resize-y`}
          />
          <span className="mt-1 flex justify-between text-[11.5px] font-normal text-(--text-muted)">
            <span>Never include passwords, codes or API keys.</span>
            <span className="tabular-nums">{draft.details.trim().length}</span>
          </span>
          {err("details")}
        </label>

        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <button type="submit" disabled={status === "sending"} className="afvar-glass-button afvar-glass-primary rs-primary !h-11 disabled:opacity-60">
            {status === "sending" ? (
              <>
                <motion.span className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
                Keeping…
              </>
            ) : (
              "Submit request"
            )}
          </button>
          <span className="text-[12.5px] text-(--text-muted)">Drafts save as you type.</span>
        </div>
      </form>

      <AnimatePresence>
        {(status === "kept" || status === "failed") && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-6 rounded-2xl border p-5 ${status === "kept" ? "border-(--accent)/30 bg-(--accent)/[.06]" : "border-(--negative)/35 bg-(--negative)/[.07]"}`}
          >
            <p className={`flex items-center gap-2 text-[14.5px] font-semibold ${status === "kept" ? "text-(--accent)" : "text-(--afvar-loss)"}`}>
              <PIcon name={status === "kept" ? "check" : "info"} size={16} weight="bold" />
              {status === "kept" ? "Request kept — not sent yet" : "We couldn't keep your request"}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-(--text-secondary)">
              {status === "kept"
                ? "Support opens at launch, so this request is saved on this device and has not been sent anywhere. Copy it now if you'd like a record of it."
                : "This browser blocked local storage, so nothing was saved. Try again, or copy the request to keep it yourself."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button type="button" onClick={copySummary} className="afvar-glass-button rs-ghost">
                <PIcon name={copied ? "check" : "file"} size={13} className={copied ? "text-(--accent)" : ""} />
                {copied ? "Copied" : "Copy request"}
              </button>
              {status === "failed" && (
                <button type="button" onClick={keep} className="afvar-glass-button afvar-glass-primary rs-btn">
                  Retry
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Window>
  );
}
