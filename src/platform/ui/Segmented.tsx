"use client";

import { useId, type ReactNode } from "react";
import { motion } from "framer-motion";
import { indicatorSpring } from "./motion";

/**
 * Segmented control / filter chips with a shared animated indicator
 * (DESIGN-GUIDE §6.5). Renders as a radiogroup: arrow keys move the selection.
 * A disabled option can carry `title` to explain why.
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  size = "md",
  scroll = false,
}: {
  label: string;
  options: { value: T; label: ReactNode; disabled?: boolean; title?: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  scroll?: boolean;
}) {
  const layoutId = useId();
  const enabled = options.filter((o) => !o.disabled);
  const move = (delta: number) => {
    const index = enabled.findIndex((o) => o.value === value);
    const next = enabled[(index + delta + enabled.length) % enabled.length];
    if (next) onChange(next.value);
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          move(1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          move(-1);
        }
      }}
      className={`inline-flex max-w-full gap-0.5 rounded-full bg-(--segment-fill) p-[3px] ${scroll ? "ds-scroll-row" : "flex-wrap"}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            disabled={option.disabled}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={`relative shrink-0 whitespace-nowrap rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-[13px]"
            } ${active ? "text-(--text-primary)" : "text-(--text-secondary) hover:text-(--text-primary)"}`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={indicatorSpring}
                className="absolute inset-0 rounded-full bg-(--segment-active) shadow-[0_3px_8px_rgba(0,0,0,.12),0_1px_1px_rgba(0,0,0,.08)]"
              />
            )}
            <span className="relative inline-flex items-center gap-1">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
