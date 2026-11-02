"use client";

// W7.3 enquiry form states: validate topic/email/message, block duplicate
// submission, acknowledge honestly (pre-launch: the message is retained on
// this device, never claimed as delivered), keep the draft on failure.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { haptic, playSfx } from "@/modules/home/kit";
import { PIcon, RegisterLink } from "@/modules/platform/kit";
import { CONTACT } from "../content";

const DRAFT_KEY = "afvar.contact.enquiry";

type Status = "idle" | "submitting" | "saved" | "failed";

interface Draft {
  topic: string;
  email: string;
  message: string;
}

const EMPTY: Draft = { topic: CONTACT.topics[0], email: "", message: "" };

const FIELD =
  "w-full rounded-[9px] bg-(--surface-inset) px-3.5 text-[16px] text-(--text-primary) sm:text-[14px] shadow-[inset_0_0_0_0.5px_var(--mac-hairline)] outline-none transition-shadow placeholder:text-(--text-disabled) focus:shadow-[inset_0_0_0_1px_var(--accent-border)]";

export function EnquiryForm() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Deferred restore keeps the state update out of the effect body (lint rule).
    const id = setTimeout(() => {
      try {
        const stored = localStorage.getItem(DRAFT_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<Draft>;
          setDraft({
            topic: typeof parsed.topic === "string" && (CONTACT.topics as readonly string[]).includes(parsed.topic) ? parsed.topic : EMPTY.topic,
            email: typeof parsed.email === "string" ? parsed.email : "",
            message: typeof parsed.message === "string" ? parsed.message : "",
          });
        }
      } catch {
        /* unreadable draft — start clean */
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const set = (field: keyof Draft) => (value: string) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    if (status === "saved" || status === "failed") setStatus("idle");
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (status === "submitting") return; // duplicate-submit protection
    const nextErrors: typeof errors = {};
    if (!(CONTACT.topics as readonly string[]).includes(draft.topic)) nextErrors.topic = "Choose a topic.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email.trim())) nextErrors.email = "Enter a valid email address.";
    if (draft.message.trim().length < 10) nextErrors.message = "Tell us a little more (at least 10 characters).";
    setErrors(nextErrors);
    const firstInvalid = (["topic", "email", "message"] as const).find((field) => nextErrors[field]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`#enquiry-${firstInvalid}`)?.focus();
      return;
    }

    setStatus("submitting");
    try {
      // No enquiry service exists pre-launch: retain the validated message locally.
      await new Promise((resolve) => setTimeout(resolve, 650));
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setStatus("saved");
      // The "/" confirmation: a soft chime and a light tap on phones.
      playSfx("chime");
      haptic(12);
    } catch {
      // Failed save: keep every field as typed and offer retry (W7.3).
      setStatus("failed");
    }
  };

  if (status === "saved") {
    return (
      <div className="flex flex-col items-center px-2 py-6 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-(--positive-soft) text-(--positive)">
          <PIcon name="check" size={22} weight="bold" />
        </span>
        <h3 className="mt-4 text-[17px] font-semibold text-(--text-primary)">Enquiry kept, ready to send.</h3>
        <p className="mt-2 max-w-[40ch] text-[13.5px] leading-relaxed text-(--text-secondary)">
          Your {draft.topic.toLowerCase()} is validated and stored on this device. Enquiry delivery opens at launch — it has not been sent anywhere yet.
        </p>
        <div className="mt-6 flex flex-nowrap items-center justify-center gap-2.5 sm:gap-4">
          <RegisterLink size="md" />
          <button type="button" onClick={() => setStatus("idle")} className="inline-flex min-h-11 items-center whitespace-nowrap px-2 text-[13.5px] font-medium text-(--text-link) hover:underline">
            Edit the enquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4 p-1">
      <div>
        <label htmlFor="enquiry-topic" className="mb-1.5 block text-[12px] font-medium text-(--text-secondary)">
          Topic
        </label>
        <div className="relative">
          <select id="enquiry-topic" value={draft.topic} onChange={(event) => set("topic")(event.target.value)} aria-invalid={Boolean(errors.topic)} aria-describedby={errors.topic ? "enquiry-topic-error" : undefined} className={`${FIELD} h-11 appearance-none pr-9 sm:h-10`}>
            {CONTACT.topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
          <PIcon name="chevron" size={13} weight="bold" className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 rotate-90 text-(--text-muted)" />
        </div>
        {errors.topic && <p id="enquiry-topic-error" className="mt-1 text-[12px] text-(--negative)">{errors.topic}</p>}
      </div>

      <div>
        <label htmlFor="enquiry-email" className="mb-1.5 block text-[12px] font-medium text-(--text-secondary)">
          Your email
        </label>
        <input
          id="enquiry-email"
          type="email"
          value={draft.email}
          onChange={(event) => set("email")(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "enquiry-email-error" : undefined}
          className={`${FIELD} h-11 sm:h-10 ${errors.email ? "shadow-[inset_0_0_0_1px_var(--negative)]" : ""}`}
        />
        {errors.email && <p id="enquiry-email-error" className="mt-1 text-[12px] text-(--negative)">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="enquiry-message" className="mb-1.5 block text-[12px] font-medium text-(--text-secondary)">
          Message
        </label>
        <textarea
          id="enquiry-message"
          value={draft.message}
          onChange={(event) => set("message")(event.target.value)}
          rows={5}
          placeholder="What would you like to talk about?"
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "enquiry-message-error" : undefined}
          className={`${FIELD} resize-y py-2.5 ${errors.message ? "shadow-[inset_0_0_0_1px_var(--negative)]" : ""}`}
        />
        {errors.message && <p id="enquiry-message-error" className="mt-1 text-[12px] text-(--negative)">{errors.message}</p>}
      </div>

      {status === "failed" && (
        <p role="alert" className="flex gap-2 text-[12.5px] leading-relaxed text-(--negative)">
          <PIcon name="info" size={13} className="mt-0.5 shrink-0" />
          The enquiry could not be kept on this device. Your message is untouched — please try again.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="max-w-[34ch] text-[11.5px] leading-snug text-(--text-muted)">{CONTACT.formNote}</p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="afvar-glass-button afvar-glass-primary inline-flex h-11 items-center justify-center rounded-full px-5 text-[14px] font-medium active:scale-[.98] disabled:pointer-events-none disabled:opacity-60"
        >
          {status === "submitting" ? "Validating…" : status === "failed" ? "Try again" : "Keep my enquiry"}
        </button>
      </div>
    </form>
  );
}
