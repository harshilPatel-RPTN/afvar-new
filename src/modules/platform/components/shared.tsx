import Link from "next/link";
import { MotionTitle, ScrubText } from "@/modules/home/kit";
import type { ReactNode } from "react";
import { AVAILABILITY_LABEL } from "../content";
import { REGISTER_URL } from "../routes";
import type { Availability } from "../types";
import { PIcon } from "./mac/icons";

export function SectionHeading({
  id,
  title,
  summary,
  align = "center",
}: {
  id?: string;
  title: string;
  summary?: string;
  align?: "center" | "start";
  /** Accepted for existing call sites; the charging bull is home-only ("/" and /home-demo). */
  charge?: boolean;
}) {
  const center = align === "center";
  // The "/" heading motion: the title opens word by word on candle gaps with
  // currency letters; the summary lights word by word as it scrolls.
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <MotionTitle id={id} text={title} className="pf-title" />
      {summary && <ScrubText text={summary} className="pf-lede mt-5" />}
    </div>
  );
}

/** Quiet status label; text carries the meaning, the dot only reinforces it (guide §2.5). */
export function AvailabilityBadge({ value, className = "" }: { value: Availability; className?: string }) {
  const preview = value === "preview";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium text-(--text-muted) ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${preview ? "bg-(--positive)" : "bg-(--accent)"}`} aria-hidden="true" />
      {AVAILABILITY_LABEL[value]}
    </span>
  );
}

/** Register Now always leaves for the existing app Welcome (W9.2). */
export function RegisterLink({ size = "lg" }: { size?: "md" | "lg" }) {
  return (
    <a
      href={REGISTER_URL}
      className={`inline-flex items-center justify-center rounded-full bg-(--accent) font-medium text-(--text-inverse) transition-[background-color,transform] duration-150 hover:bg-(--accent-hover) active:scale-[.98] active:bg-(--accent-pressed) ${
        size === "lg" ? "h-12 px-7 text-[17px]" : "h-10 px-5 text-[15px]"
      }`}
    >
      Register Now
    </a>
  );
}

/** Apple-style text link with a chevron (e.g. "Learn more ›"). */
export function ChevronLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-0.5 text-[17px] text-(--accent) hover:underline ${className}`}>
      {children}
      <PIcon name="chevron" size={14} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}

export function PageNote({ children }: { children: ReactNode }) {
  return <p className="mx-auto max-w-2xl text-center text-[13px] leading-relaxed text-(--text-muted)">{children}</p>;
}
