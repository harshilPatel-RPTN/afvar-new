"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PIcon } from "@/modules/platform/kit";

/** Settings-style grouped accordion; one answer open at a time. */
export function FaqList({ items, defaultOpen = -1 }: { items: readonly { q: string; a: string }[]; defaultOpen?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <ul className="pf-group">
      {items.map((item, i) => {
        const expanded = open === i;
        return (
          <li key={item.q}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[16px] font-medium transition-colors hover:bg-white/[.02]"
            >
              {item.q}
              <PIcon name="chevron" size={14} className={`shrink-0 transition-transform duration-200 ${expanded ? "rotate-90 text-(--accent)" : "text-(--text-muted)"}`} />
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-[15px] leading-relaxed text-(--text-secondary)">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
