import Link from "next/link";
import type { ReactNode } from "react";
import { EarthHorizon, MacWindow, PageScene3D, PIcon, Reveal, type PageModelKind } from "@/modules/platform";
import { MotionTitle, ScrubText } from "@/modules/home/kit";
import { REGISTER_URL } from "../../data";
import { Magnetic, ScrollStage, Tilt } from "./motion";

// The /about page's building blocks (platform kit), shared by every Markets page.
export { AppIcon, MacWindow, PageNote, PIcon, Reveal, ScrollWords } from "@/modules/platform";
export { PageHero } from "./PageHero";
export { CountUp, Tilt } from "./motion";

/** Section rhythm used on /about. */
export const SECTION = "px-4 pt-28 sm:px-6";

/** Centred (or start-aligned) pf-title heading with an optional dimmed second line and lede. */
/** `charge` is accepted for existing call sites; the charging bull is home-only ("/" and /home-demo). */
export function Heading({ id, title, sub, lede, align = "center" }: { id?: string; title: string; sub?: string; lede?: string; align?: "center" | "start"; charge?: boolean }) {
  const center = align === "center";
  const heading = (
    <h2 id={id} className="pf-title text-(--text-primary)" aria-label={sub ? `${title} ${sub}` : title}>
      <MotionTitle as="span" text={title} />
      {sub && <MotionTitle as="span" text={sub} delay={0.3} className="block text-(--text-tertiary)" />}
    </h2>
  );
  return (
    // The "/" heading motion: words open on candle gaps (currency letters on
    // Latin text), the dimmed second line follows, the lede lights with scroll.
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      {heading}
      {lede && <ScrubText text={lede} className="pf-lede mt-5" />}
    </div>
  );
}

/** Gold pill button (RegisterLink look) with a translated label. */
export function PrimaryLink({ href = REGISTER_URL, children }: { href?: string; children: ReactNode }) {
  return (
    <Magnetic>
    <a
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-full bg-(--accent) px-7 text-[17px] font-medium text-(--text-inverse) transition-[background-color,transform] duration-150 hover:bg-(--accent-hover) active:scale-[.98] active:bg-(--accent-pressed)"
    >
      {children}
    </a>
    </Magnetic>
  );
}

/** Apple "Learn more ›" link. */
export function Chevron({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`group inline-flex min-h-11 items-center gap-0.5 text-[17px] text-(--accent) hover:underline ${className}`}>
      {children}
      <PIcon name="chevron" size={14} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}

/** The live 3D model, full width and borderless, rising into place as it scrolls into view. */
export function Scene({ kind, label, caption, hint, className = "mt-10" }: { kind: PageModelKind; label: string; caption: string; hint: string; className?: string }) {
  return (
    <ScrollStage className={className}>
      <PageScene3D kind={kind} label={label} caption={caption} hint={hint} bleed />
    </ScrollStage>
  );
}

/** Mac window holding a settings-style grouped list of label/value rows (the /about "Company record"). */
export function Record({ title, rows, className = "" }: { title: string; rows: ReadonlyArray<readonly [string, ReactNode]>; className?: string }) {
  return (
    <MacWindow size="sm" title={title} bodyClassName="p-4" className={className}>
      <dl className="pf-group">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-[13px] text-(--text-secondary)">{label}</dt>
            <dd className="text-right text-[13px] font-medium text-(--text-primary)">{value}</dd>
          </div>
        ))}
      </dl>
    </MacWindow>
  );
}

/** Quiet status text with a dot; the words carry the meaning. */
export function Status({ available, children }: { available: boolean; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-(--text-secondary)">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${available ? "bg-(--positive)" : "border border-(--text-muted)"}`} />
      {children}
    </span>
  );
}

/** Honest empty state: dashed hairline, hollow dot, never a sample value. */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 rounded-xl border border-dashed border-(--mac-hairline) px-4 py-3 text-[13.5px] leading-relaxed text-(--text-secondary)">
      <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full border border-(--text-muted)" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Closing section over the live 3D earth (the /about horizon, as on /platform):
 * copy in the starry sky, the planet's arc running down to the footer's border.
 * The disclaimer lives in the footer, so the sunrise has the band to itself.
 */
export function ClosingBand({ id, title, lede, children }: { id: string; title: string; lede?: string; children: ReactNode }) {
  return (
    // Taller bottom padding than ResourcesClosing: that section carries more copy
    // (lede + page note), and the arc's apex rides the section height — this
    // evens out the sections so the earth rises equally high on both pages.
    <EarthHorizon labelledBy={id} className="mt-28">
      <Heading id={id} title={title} lede={lede} charge />
      <Reveal delay={0.1} className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
        {children}
      </Reveal>
    </EarthHorizon>
  );
}

/** A tile that tilts toward the cursor with a spotlight and a lit border. */
export function Tile({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <Tilt>
        <div className={`pf-tile relative h-full ${className}`}>{children}</div>
      </Tilt>
    </Reveal>
  );
}
