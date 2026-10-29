"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "../i18n";

const EASE = [0.22, 1, 0.36, 1] as const;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Tailwind max-width class for the dialog. */
  width?: string;
  /** Replaces the default dark glass surface, e.g. for the light Stripe sheet. */
  surfaceClassName?: string;
  hideTitle?: boolean;
}

/** Accessible dialog: Esc and backdrop close it, focus moves in and returns on close. */
export function Modal({ open, onClose, title, children, width = "max-w-md", surfaceClassName, hideTitle }: ModalProps) {
  const { t } = useT();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = panelRef.current?.querySelector<HTMLElement>(
      "input:not([disabled]), button:not([disabled]), [href], select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    (focusable ?? panelRef.current)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(
        "input:not([disabled]), button:not([disabled]), [href], select, textarea, [tabindex]:not([tabindex='-1'])",
      )];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      previous?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={`relative max-h-[calc(100svh-32px)] w-full overflow-auto outline-none ${width} ${
              surfaceClassName ??
              "rounded-3xl border border-white/12 bg-[rgba(14,19,28,.92)] p-6 text-[#E6EDF3] shadow-[0_40px_100px_-30px_rgba(0,0,0,.9)] backdrop-blur-2xl"
            }`}
          >
            <h2 id={titleId} className={hideTitle ? "sr-only" : "mb-3 pe-8 text-lg font-semibold tracking-[-.01em]"}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close")}
              className="absolute inset-e-3 top-3 grid h-8 w-8 place-items-center rounded-full text-current opacity-60 hover:bg-black/10 hover:opacity-100"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
              </svg>
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
