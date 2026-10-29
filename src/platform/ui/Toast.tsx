"use client";

import { AnimatePresence, motion } from "framer-motion";
import { create } from "zustand";
import { Icon } from "./Icon";

type Tone = "neutral" | "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

const useToasts = create<{ items: ToastItem[]; push: (message: string, tone: Tone) => void; dismiss: (id: number) => void }>((set) => ({
  items: [],
  push: (message, tone) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items.slice(-2), { id, message, tone }] }));
    window.setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), tone === "error" ? 7000 : 4000);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/**
 * Non-blocking feedback (DESIGN-GUIDE §6.6). Toasts confirm server results;
 * errors must also be shown in the relevant module, not only here.
 */
export const toast = {
  show: (message: string) => useToasts.getState().push(message, "neutral"),
  success: (message: string) => useToasts.getState().push(message, "success"),
  error: (message: string) => useToasts.getState().push(message, "error"),
};

/** Mount once per route tree. Announces politely via aria-live. */
export function Toaster() {
  const items = useToasts((s) => s.items);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-3">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }}
            className="ds-glass-overlay pointer-events-auto flex max-w-[min(440px,100%)] items-center gap-2.5 rounded-full py-2 pl-4 pr-2 text-[13px] text-(--text-primary)"
          >
            <Icon
              name={t.tone === "success" ? "check" : t.tone === "error" ? "warning" : "info"}
              className={`h-4 w-4 ${t.tone === "success" ? "text-(--positive)" : t.tone === "error" ? "text-(--negative)" : "text-(--text-tertiary)"}`}
            />
            <span className="min-w-0 flex-1">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="grid h-7 w-7 place-items-center rounded-full text-(--text-tertiary) hover:bg-(--surface-3)">
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
