"use client";

import { motion } from "framer-motion";
import { useId, useRef, type KeyboardEvent } from "react";
import { getCapability } from "../../content";
import { AppIcon } from "../mac/AppIcon";
import { PIcon } from "../mac/icons";
import { resolve, type Intent } from "./commands";
import { STRINGS, type Lang } from "./strings";

export interface Row {
  id: string;
  label: string;
  hint?: string;
  /** Command to run, or null for an informational row. */
  command: string | null;
  intent?: Intent;
}

/** Rows for the current text: suggestions, Top Hit, clarification or a refusal. */
export function rowsFor(text: string, lang: Lang): { rows: Row[]; heading: string; note?: string } {
  const s = STRINGS[lang];
  const intent = resolve(text);
  if (intent.status === "empty") {
    return { heading: s.suggestions, rows: s.examples.map((e, i) => ({ id: `ex-${i}`, label: e, command: e })) };
  }
  if (intent.status === "clarify") {
    return {
      heading: s.clarify,
      rows: intent.options!.map((o, i) => ({ id: `opt-${i}`, label: o.label, command: o.command, intent: resolve(o.command) })),
    };
  }
  if (intent.status === "resolved") {
    return { heading: s.topHit, rows: [{ id: "hit", label: describe(intent), hint: text, command: text, intent }], note: s.local };
  }
  const message = intent.status === "refused" ? s.refused : intent.status === "negated" ? s.negated : s.unsupported;
  return { heading: s.topHit, rows: [{ id: "msg", label: message, command: null }] };
}

function describe(i: Intent) {
  if (i.action === "arrange") return "Arrange windows";
  const app = getCapability(i.app!)!;
  const verb = { open: "Open", close: "Close", minimize: "Minimize", maximize: "Zoom" }[i.action as "open"] ?? "Open";
  return app.slug === "charts" ? `${verb} ${i.instrument} chart${i.timeframe ? ` · ${i.timeframe}` : ""}` : `${verb} ${app.title}`;
}

/**
 * Spotlight, after Renovamen/playground-macos (MIT): large search field,
 * grouped results, gold selected row, ↑/↓ + Return, Escape closes. Results
 * come from the on-device demo resolver.
 */
export function SpotlightPanel({
  lang,
  text,
  selected,
  onText,
  onSelect,
  onRun,
  onClose,
  userOpened,
}: {
  /** Only take keyboard focus when the visitor opened Spotlight, never during the demo. */
  userOpened: boolean;
  lang: Lang;
  text: string;
  selected: number;
  onText: (t: string) => void;
  onSelect: (i: number) => void;
  onRun: (row: Row) => void;
  onClose: () => void;
}) {
  const s = STRINGS[lang];
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const { rows, heading, note } = rowsFor(text, lang);
  const index = Math.min(selected, rows.length - 1);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      onSelect((index + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rows[index]) onRun(rows[index]);
    }
  };

  return (
    <motion.div
      className="pf-vibrant absolute left-1/2 top-[16%] z-[70] w-[min(86%,560px)] -translate-x-1/2 overflow-hidden rounded-[14px]"
      initial={{ opacity: 0, scale: 0.97, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <PIcon name="search" size={20} className="text-(--text-secondary)" />
        <input
          ref={input}
          autoFocus={userOpened}
          readOnly={!userOpened}
          value={text}
          onChange={(e) => {
            onText(e.target.value);
            onSelect(0);
          }}
          onKeyDown={onKey}
          placeholder={s.ask}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={rows[index] ? `${listId}-${rows[index].id}` : undefined}
          aria-label={s.ask}
          className="min-w-0 flex-1 bg-transparent text-[clamp(14px,1.7vw,19px)] font-light text-(--text-primary) !outline-none placeholder:text-(--text-muted)"
        />
        <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-(--text-muted)">esc</kbd>
      </div>
      <div className="border-t border-white/10 p-2">
        <p className="px-2 pb-1 text-[11px] font-semibold text-(--text-muted)">{heading}</p>
        <ul id={listId} role="listbox" aria-label={heading}>
          {rows.map((r, i) => {
            const on = i === index;
            const app = r.intent?.app ? getCapability(r.intent.app) : undefined;
            return (
              <li
                key={r.id}
                id={`${listId}-${r.id}`}
                role="option"
                aria-selected={on}
                aria-disabled={r.command === null}
                onPointerEnter={() => onSelect(i)}
                onClick={() => onRun(r)}
                className={`flex cursor-default items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] ${on ? "bg-(--mac-select) text-(--text-inverse)" : "text-(--text-secondary)"}`}
              >
                {app ? (
                  <AppIcon icon={app.icon} tone={app.tone} size={20} />
                ) : (
                  <PIcon name={r.command === null ? "info" : "sparkle"} size={15} weight={on ? "fill" : "regular"} />
                )}
                <span className="flex-1 truncate">{r.label}</span>
                {on && r.command !== null && <span className="text-[11px] opacity-70">↩</span>}
              </li>
            );
          })}
        </ul>
        {note && (
          <p className="mt-1 flex items-center gap-1.5 px-2 pt-1 text-[11px] text-(--text-muted)">
            <PIcon name="zap" size={12} weight="fill" className="text-(--accent)" /> {note}
          </p>
        )}
      </div>
    </motion.div>
  );
}
