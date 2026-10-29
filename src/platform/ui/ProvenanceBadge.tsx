"use client";

import { useT } from "../i18n";

export interface Provenance {
  source: string;
  venue?: string | null;
  /** ISO timestamp of the value at the source. */
  time: string;
  delayMinutes: number;
  cacheAgeSeconds?: number | null;
}

/** The price sticker every market number carries: source · venue · time · delay · cache age. */
export function ProvenanceBadge({ source, venue, time, delayMinutes, cacheAgeSeconds }: Provenance) {
  const { t, locale } = useT();
  const clock = new Date(time).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const delayed = delayMinutes > 0;

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-x-1 rounded-md border px-1.5 py-0.5 text-[10px] leading-tight ${
        delayed ? "border-[#F2C46D]/30 bg-[#F2C46D]/10 text-[#F2D9A2]" : "border-white/10 bg-white/[.04] text-white/60"
      }`}
    >
      <span>{source}</span>
      {venue && <span aria-hidden="true">·</span>}
      {venue && <span>{venue}</span>}
      <span aria-hidden="true">·</span>
      <time dateTime={time}>{clock}</time>
      <span aria-hidden="true">·</span>
      <span className={delayed ? "font-semibold" : undefined}>
        {delayed ? t("provenance.delayed", { minutes: delayMinutes }) : t("provenance.live")}
      </span>
      {cacheAgeSeconds != null && (
        <>
          <span aria-hidden="true">·</span>
          <span>{t("provenance.cache", { seconds: cacheAgeSeconds })}</span>
        </>
      )}
    </span>
  );
}
