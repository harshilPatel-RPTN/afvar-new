"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "./Icon";
import { variants } from "./motion";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal dialog / sheet (DESIGN-GUIDE §6.6): focus moves in on open, is trapped
 * while open and returns to the trigger on close; Escape and backdrop click
 * call `onClose`. `variant="sheet"` slides in from the right (mobile nav);
 * `variant="bottom"` is a full-width sheet on small screens and a centred
 * dialog from `sm` up. Styling uses the tokens in tokens.css.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  width = 480,
  variant = "dialog",
  hideTitle = false,
  initialFocusRef,
  role = "dialog",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  width?: number;
  variant?: "dialog" | "sheet" | "palette" | "bottom";
  hideTitle?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Use "alertdialog" for confirmations of destructive actions. */
  role?: "dialog" | "alertdialog";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => {
      const target = initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current;
      target?.focus();
    });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      returnFocus.current?.focus?.();
    };
  }, [open, initialFocusRef]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
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

  const isSheet = variant === "sheet";
  const isBottom = variant === "bottom";
  const layout = isSheet
    ? "pointer-events-none absolute inset-y-0 right-0 flex w-full max-w-[360px]"
    : isBottom
      ? "pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:px-3 sm:py-6"
      : `pointer-events-none absolute inset-0 flex justify-center px-3 ${variant === "palette" ? "items-start pt-[12vh]" : "items-center py-6"}`;
  const shape = isSheet
    ? "h-full w-full rounded-l-[20px]"
    : isBottom
      ? "max-h-[92svh] w-full rounded-t-[20px] sm:max-h-[calc(100svh-48px)] sm:rounded-[20px]"
      : "max-h-[calc(100svh-48px)] rounded-[20px]";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90]" onKeyDown={onKeyDown}>
          <motion.div
            className="absolute inset-0 bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <div className={layout}>
            <motion.div
              ref={panelRef}
              role={role}
              aria-modal="true"
              aria-label={hideTitle ? title : undefined}
              aria-labelledby={hideTitle ? undefined : titleId}
              aria-describedby={description ? descriptionId : undefined}
              tabIndex={-1}
              {...(isSheet
                ? {
                    initial: { x: "100%" },
                    animate: { x: 0, transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] } },
                    exit: { x: "100%", transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } },
                  }
                : { variants: variants.dialog, initial: "hidden", animate: "visible", exit: "exit" })}
              style={isSheet ? undefined : { width: isBottom ? undefined : width, maxWidth: isBottom ? `min(100vw, ${width}px)` : "calc(100vw - 24px)" }}
              className={`ds-glass-overlay pointer-events-auto flex max-h-full flex-col overflow-hidden text-(--text-primary) outline-none ${shape}`}
            >
              {!hideTitle && (
                <div className="flex items-start justify-between gap-3 border-b border-(--border-subtle) px-5 py-4">
                  <div className="min-w-0">
                    <h2 id={titleId} className="text-[15px] font-semibold leading-snug">
                      {title}
                    </h2>
                    {description && (
                      <div id={descriptionId} className="mt-1 text-[13px] text-(--text-secondary)">
                        {description}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-(--text-tertiary) hover:bg-(--surface-3) hover:text-(--text-primary)"
                  >
                    <Icon name="close" />
                  </button>
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
