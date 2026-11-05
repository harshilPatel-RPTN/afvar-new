"use client";

// W7.3 enquiry form: name, email and an optional message, sent to /api/contact
// (stored in MongoDB). Validates before sending, blocks duplicate submission,
// keeps an unsent draft on this device and every field as typed on failure.
// On success the form is stamped, sealed and sent to the avatar (sealAndSend.ts)
// before the sent view fades in.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { haptic, playSfx } from "@/modules/home/kit";
import { PIcon, RegisterLink } from "@/modules/platform/kit";
import { CONTACT } from "../content";
import { sealFormAndSend } from "./sealAndSend";

const DRAFT_KEY = "afvar.contact.enquiry";
const NAME_MAX = 120;
const MESSAGE_MAX = 5_000;

type Status = "idle" | "submitting" | "sent" | "failed";

interface Draft {
  name: string;
  email: string;
  message: string;
}

type Field = keyof Draft;

const EMPTY: Draft = { name: "", email: "", message: "" };
const FIELDS: readonly Field[] = ["name", "email", "message"];

const FIELD =
  "w-full rounded-[9px] bg-(--surface-inset) px-3.5 text-[16px] text-(--text-primary) sm:text-[14px] shadow-[inset_0_0_0_0.5px_var(--mac-hairline)] outline-none transition-shadow placeholder:text-(--text-disabled) focus:shadow-[inset_0_0_0_1px_var(--accent-border)]";
const INVALID = "shadow-[inset_0_0_0_1px_var(--negative)]";

/** The sent view fades up into the space the form dissolved out of. Stable identity: runs once on mount. */
const fadeIn = (el: HTMLDivElement | null) => {
  if (!el || !el.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "ease-out" });
};

const FAILURES: Record<string, string> = {
  rate_limited: "You've sent several enquiries in a short time. Please wait a few minutes and try again.",
};
const DEFAULT_FAILURE = "Your enquiry couldn't be sent just now. Your message is untouched — please try again.";

function validate(draft: Draft) {
  const errors: Partial<Record<Field, string>> = {};
  const name = draft.name.trim();
  if (!name) errors.name = "Enter your name.";
  else if (name.length > NAME_MAX) errors.name = `Keep your name under ${NAME_MAX} characters.`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email.trim())) errors.email = "Enter a valid email address.";
  if (draft.message.trim().length > MESSAGE_MAX) errors.message = `Keep the message under ${MESSAGE_MAX} characters.`;
  return errors;
}

export function EnquiryForm() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [failure, setFailure] = useState(DEFAULT_FAILURE);
  const formRef = useRef<HTMLFormElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Deferred restore keeps the state update out of the effect body (lint rule).
    const id = setTimeout(() => {
      try {
        const stored = localStorage.getItem(DRAFT_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<Draft>;
          const pick = (value: unknown) => (typeof value === "string" ? value : "");
          setDraft({ name: pick(parsed.name), email: pick(parsed.email), message: pick(parsed.message) });
        }
      } catch {
        /* unreadable draft — start clean */
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const set = (field: Field) => (value: string) => {
    setDraft((previous) => {
      const next = { ...previous, [field]: value };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — the draft just isn't kept */
      }
      return next;
    });
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    if (status === "failed") setStatus("idle");
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (status === "submitting") return; // duplicate-submit protection
    const nextErrors = validate(draft);
    setErrors(nextErrors);
    const firstInvalid = FIELDS.find((field) => nextErrors[field]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`#enquiry-${firstInvalid}`)?.focus();
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          email: draft.email.trim(),
          message: draft.message.trim(),
          website: honeypotRef.current?.value ?? "",
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string; fields?: Partial<Record<Field, string>> };
        if (body.fields && Object.keys(body.fields).length) {
          setErrors(body.fields);
          setStatus("idle");
          return;
        }
        setFailure(FAILURES[body.error ?? ""] ?? DEFAULT_FAILURE);
        setStatus("failed");
        return;
      }
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* nothing to clear */
      }
      // Stamped, sealed into an envelope and zipped to the avatar; the "sent" view takes the form's place.
      // The chime and tap land with the envelope.
      const land = () => {
        playSfx("chime");
        haptic(12);
      };
      const formEl = formRef.current;
      if (formEl) void sealFormAndSend(formEl, { onFormGone: () => setStatus("sent"), onLand: land });
      else {
        setStatus("sent");
        land();
      }
    } catch {
      // Network failure: keep every field as typed and offer retry (W7.3).
      setFailure(DEFAULT_FAILURE);
      setStatus("failed");
    }
  };

  if (status === "sent") {
    return (
      <div ref={fadeIn} className="flex flex-col items-center px-2 py-6 text-center" role="status">
        <span className="grid size-12 place-items-center rounded-full bg-(--positive-soft) text-(--positive)">
          <PIcon name="check" size={22} weight="bold" />
        </span>
        <h3 className="mt-4 text-[17px] font-semibold text-(--text-primary)">Thanks — enquiry received.</h3>
        <p className="mt-2 max-w-[40ch] text-[13.5px] leading-relaxed text-(--text-secondary)">
          The team reads every message. If a reply is needed, it will come to {draft.email.trim()}.
        </p>
        <div className="mt-6 flex flex-nowrap items-center justify-center gap-2.5 sm:gap-4">
          <RegisterLink size="md" />
          <button
            type="button"
            onClick={() => {
              setDraft(EMPTY);
              setStatus("idle");
            }}
            className="inline-flex min-h-11 items-center whitespace-nowrap px-2 text-[13.5px] font-medium text-(--text-link) hover:underline"
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  const describedBy = (field: Field) => (errors[field] ? `enquiry-${field}-error` : undefined);

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4 p-1">
      {/* Honeypot: hidden from people and assistive tech; bots that fill it are dropped server-side. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="enquiry-website">Website</label>
        <input ref={honeypotRef} id="enquiry-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="enquiry-name" className="mb-1.5 block text-[12px] font-medium text-(--text-secondary)">
          Name
        </label>
        <input
          id="enquiry-name"
          type="text"
          value={draft.name}
          onChange={(event) => set("name")(event.target.value)}
          placeholder="Your full name"
          autoComplete="name"
          maxLength={NAME_MAX}
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy("name")}
          className={`${FIELD} h-11 sm:h-10 ${errors.name ? INVALID : ""}`}
        />
        {errors.name && <p id="enquiry-name-error" className="mt-1 text-[12px] text-(--negative)">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="enquiry-email" className="mb-1.5 block text-[12px] font-medium text-(--text-secondary)">
          Email
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
          aria-describedby={describedBy("email")}
          className={`${FIELD} h-11 sm:h-10 ${errors.email ? INVALID : ""}`}
        />
        {errors.email && <p id="enquiry-email-error" className="mt-1 text-[12px] text-(--negative)">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="enquiry-message" className="mb-1.5 block text-[12px] font-medium text-(--text-secondary)">
          Message <span className="font-normal text-(--text-muted)">(optional)</span>
        </label>
        <textarea
          id="enquiry-message"
          value={draft.message}
          onChange={(event) => set("message")(event.target.value)}
          rows={5}
          maxLength={MESSAGE_MAX}
          placeholder="What would you like to talk about?"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy("message")}
          className={`${FIELD} resize-y py-2.5 ${errors.message ? INVALID : ""}`}
        />
        {errors.message && <p id="enquiry-message-error" className="mt-1 text-[12px] text-(--negative)">{errors.message}</p>}
      </div>

      {status === "failed" && (
        <p role="alert" className="flex gap-2 text-[12.5px] leading-relaxed text-(--negative)">
          <PIcon name="info" size={13} className="mt-0.5 shrink-0" />
          {failure}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="max-w-[34ch] text-[11.5px] leading-snug text-(--text-muted)">{CONTACT.formNote}</p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="afvar-glass-button afvar-glass-primary inline-flex h-11 items-center justify-center rounded-full px-5 text-[14px] font-medium active:scale-[.98] disabled:pointer-events-none disabled:opacity-60"
        >
          {status === "submitting" ? "Sending…" : status === "failed" ? "Try again" : "Send enquiry"}
        </button>
      </div>
    </form>
  );
}
