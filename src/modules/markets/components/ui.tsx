import Link from "next/link";
import type { ReactNode } from "react";
import type { MessageKey, MessageVars } from "@/platform/i18n";
import type { CoverageStatus, Quote } from "../data";

export type Translate = (key: MessageKey, vars?: MessageVars) => string;

const pill =
  "afvar-glass-button inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[14px] font-semibold motion-reduce:transition-none";

export const primaryButton = `${pill} afvar-glass-primary motion-safe:hover:-translate-y-0.5`;
export const secondaryButton = pill;
export const outlineButton = pill;
/** 40px round glass icon button (carousel arrows, card corners). Always give it an aria-label. */
export const iconButton =
  "grid h-10 w-10 shrink-0 place-items-center rounded-full mk-glass text-(--mk-text) transition-[color,background-color,border-color,opacity,transform] hover:border-(--mk-glass-border-hover) hover:text-(--mk-primary) disabled:pointer-events-none disabled:opacity-60";
/** Inline accent link with an arrow, e.g. "Explore Forex →". */
export const textLink = "group inline-flex items-center gap-1.5 text-[14px] font-semibold text-(--mk-primary) hover:text-(--mk-primary-bright)";

export function ArrowIcon({ className = "h-4 w-4", direction = "right" }: { className?: string; direction?: "right" | "left" }) {
  return (
    <svg viewBox="0 0 20 20" className={`${className} ${direction === "left" ? "rotate-180" : ""}`} aria-hidden="true">
      <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`mk-eyebrow ${className}`}>{children}</p>;
}

export function Section({ id, eyebrow, title, intro, children }: { id?: string; eyebrow?: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id ? `${id}-title` : undefined} className="mt-16 first:mt-0">
      {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
      <h2 id={id ? `${id}-title` : undefined} className="text-[26px] font-semibold leading-tight text-(--mk-text) sm:text-[32px]">
        {title}
      </h2>
      {intro && <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-(--mk-dim)">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** A glass card; with `href` the whole card is one link ending in "Explore →". */
export function Card({ title, body, href, cta, footer }: { title: string; body: string; href?: string; cta?: string; footer?: ReactNode }) {
  const inner = (
    <>
      <span className="block text-[17px] font-semibold text-(--mk-text)">{title}</span>
      <span className="mt-2 block text-[14px] leading-relaxed text-(--mk-dim)">{body}</span>
      {footer && <span className="mt-4 block">{footer}</span>}
      {href && cta && (
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[14px] font-semibold text-(--mk-primary)">
          {cta}
          <ArrowIcon className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" />
        </span>
      )}
    </>
  );
  const box = "mk-glass flex h-full flex-col rounded-2xl p-6";
  /* Resting drop shadow on `::before` cross-fades to the gold glow on `::after` (opacity only, no box-shadow animation). */
  const cardGlow =
    "relative isolate before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:shadow-(--mk-shadow) before:transition-opacity before:duration-300 motion-reduce:before:transition-none hover:before:opacity-0 after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-2xl after:opacity-0 after:shadow-(--mk-glow-card) after:transition-opacity after:duration-300 motion-reduce:after:transition-none hover:after:opacity-100";
  return href ? (
    <Link href={href} className={`group ${box} ${cardGlow} transition-[color,background-color,border-color,opacity,transform] duration-300 hover:border-(--mk-glass-border-hover) motion-safe:hover:-translate-y-1`}>
      {inner}
    </Link>
  ) : (
    <div className={`${box} shadow-(--mk-shadow)`}>{inner}</div>
  );
}

export function CoveragePill({ status, t }: { status: CoverageStatus; t: Translate }) {
  return status === "available" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-(--mk-primary)/50 bg-(--mk-primary)/15 px-2.5 py-0.5 text-[12px] font-medium text-(--mk-primary)">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-(--mk-primary)" />
      {t("mk.coverage.available")}
    </span>
  ) : (
    <span className="mk-glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium text-(--mk-text)">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full border border-(--mk-dim)" />
      {t("mk.coverage.planned")}
    </span>
  );
}

/** Pre-launch / unconfirmed-content notice. Red only as an outline and a dot, never behind text. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p role="note" className="mk-glass flex gap-3 rounded-xl border-(--mk-accent)/40 px-4 py-3 text-[13.5px] leading-relaxed text-(--mk-text)">
      <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--mk-accent)" />
      <span>{children}</span>
    </p>
  );
}

export function Breadcrumb({ items, t }: { items: { label: string; href?: string }[]; t: Translate }) {
  return (
    <nav aria-label={t("mk.breadcrumb")} className="text-[13px] text-(--mk-dim)">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 && <span aria-hidden="true" className="text-(--mk-faint)">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-(--mk-primary)">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-(--mk-text)">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * A price exists only with its Provenance Envelope (R-01). Without a confirmed
 * feed the slot says so explicitly — live, delayed and unavailable share this layout.
 */
export function PriceSlot({ quote, t }: { quote: Quote | null; t: Translate }) {
  if (!quote) {
    return (
      <div className="rounded-xl border border-dashed border-(--mk-glass-border) bg-black/20 px-4 py-3">
        <p className="text-[13px] font-medium text-(--mk-text)">{t("mk.price.unavailable")}</p>
        <p className="mt-0.5 text-[12px] text-(--mk-dim)">{t("mk.price.unavailableBody")}</p>
      </div>
    );
  }
  const { provenance } = quote;
  return (
    <div className="rounded-xl border border-(--mk-glass-border) bg-black/20 px-4 py-3">
      <p className="font-mono text-[22px] font-semibold tabular-nums text-(--mk-text)">
        {quote.last} <span className="text-[13px] text-(--mk-dim)">{provenance.currency}</span>
      </p>
      <p className="mt-1 text-[12px] text-(--mk-dim)">
        {provenance.source} · {provenance.venue} · <time dateTime={provenance.tsUtc}>{provenance.tsUtc}</time> · {provenance.delayLabel}
      </p>
    </div>
  );
}
