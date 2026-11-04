"use client";

// Copy and cards for each act of the /platform film. The words are the
// platform board's (content.ts and the old WF03 sections); none repeats a
// sentence from the home film or from another act. Each block has a full
// (desktop) and a compact (phone / tablet bottom panel) form.
import { type MotionValue } from "framer-motion";
import Link from "next/link";
import { createContext, useContext } from "react";
import { AI_CORES, AiOrb, AppGlyph, BODY, CARD, CARD_AI, EYEBROW, GHOST_LINK, GOLD_CTA, H1, H2, HAIR, HeroTitle, MONO, MiniChart, SOFT, useStep, useTypedText } from "@/modules/afvarOs";
import { CAPABILITIES, OVERVIEW } from "../content";
import { REGISTER_URL, capabilityPath } from "../routes";
import {
  APPS,
  AREA_BEATS,
  FRESHNESS,
  FRESH_AT,
  RETURN_AT,
  RETURN_LABEL,
  STATIONS,
  STATION_AT,
  STOP,
  STOP_ITEMS,
  STOP_STATE,
  stopRows,
  type OverviewAct,
  type OverviewFilm,
} from "./overviewFilm";

/* ----------------------------------------------------------- film context */

export const OverviewUi = createContext<OverviewFilm | null>(null);
function useOverview(): OverviewFilm {
  const f = useContext(OverviewUi);
  if (!f) throw new Error("OverviewUi missing");
  return f;
}

/** "01 · Two ways" — numbered by the act's place in the film. */
function ActEyebrow({ id, label }: { id: OverviewAct; label: string }) {
  const film = useContext(OverviewUi);
  const n = film ? film.story.order.indexOf(id) : -1;
  return <p className={EYEBROW}>{n > 0 ? `${String(n).padStart(2, "0")} · ${label}` : label}</p>;
}

export const H2_COMPACT = "text-[clamp(1.55rem,6.4vw,2.2rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F2F5F2]";
/** OS-act caption title (the home film's OS beats use the same size). */
export const H_OS = "text-[clamp(1.4rem,2vw,1.9rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#F2F5F2]";

/* ------------------------------------------------------------------ hero */

export function HeroCopy({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <p className={EYEBROW}>AFVAR Platform · Pre-launch</p>
      <HeroTitle twin={compact} className={compact ? "mt-3 text-[clamp(2.05rem,8.8vw,3rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-[#F2F5F2] [@media(max-height:700px)_and_(orientation:portrait)]:mt-2 [@media(max-height:700px)_and_(orientation:portrait)]:text-[clamp(1.6rem,7.6vw,2.2rem)]" : `mt-5 ${H1}`}>
        {OVERVIEW.title[0]} <span className="text-[#A8DEC2]">{OVERVIEW.title[1]}</span>
      </HeroTitle>
      <p className={compact ? "mt-3 text-[14.5px] leading-relaxed text-[#B7C5BC] [@media(max-height:700px)_and_(orientation:portrait)]:mt-2 [@media(max-height:700px)_and_(orientation:portrait)]:text-[13.5px] [@media(max-height:700px)_and_(orientation:portrait)]:leading-snug" : `mt-6 max-w-[31rem] ${BODY}`}>{compact ? OVERVIEW.summary : OVERVIEW.workWith.summary}</p>
      <div className={`${compact ? "mt-5 [@media(max-height:700px)_and_(orientation:portrait)]:mt-3.5" : "mt-8"} flex flex-nowrap items-center gap-2.5 sm:gap-5`}>
        <Link href={REGISTER_URL} prefetch={false} className={GOLD_CTA}>
          Register Now
        </Link>
        <a href="#try-afvar" className={GHOST_LINK}>
          Try it yourself
        </a>
      </div>
      <div className={`${compact ? "mt-5 pt-3 [@media(max-height:700px)_and_(orientation:portrait)]:mt-3.5 [@media(max-height:700px)_and_(orientation:portrait)]:pt-2.5" : "mt-10 pt-5"} flex flex-wrap items-center gap-x-6 gap-y-2 border-t ${HAIR}`}>
        <span className={`${MONO} flex items-center gap-2 text-[#A8DEC2]`}>
          <AiOrb size={8} /> 5 capability areas
        </span>
        <span className={`${MONO} text-[#92A399]`}>Text + voice</span>
        <span className={`${MONO} text-[#92A399]`} lang="hi">
          EN · हिन्दी
        </span>
        {compact ? null : <span className={`${MONO} text-[#92A399]`}>Read-only connections</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- OS captions */

/** Top caption for the desktop OS acts, in the home film's OS-beat layout. */
export function OsCaption({ id, label, title, soft, body }: { id: OverviewAct; label: string; title: string; soft: string; body: string }) {
  // ≥1280px: title and body side by side (the home's OS-beat layout); narrower: body under the title.
  return (
    <div>
      <ActEyebrow id={id} label={label} />
      <div className="mt-2 xl:flex xl:items-baseline xl:gap-6">
        <h2 className={`${H_OS} shrink-0`}>
          {title} <span className={SOFT}>{soft}</span>
        </h2>
        <p className="mt-1.5 line-clamp-2 max-w-[44rem] text-[13.5px] leading-snug text-[#B7C5BC] xl:mt-0 xl:line-clamp-none xl:max-w-[34rem] xl:text-[14px]">{body}</p>
      </div>
    </div>
  );
}

export const WAYS_TEXT = { id: "ways", label: "Two ways", title: "Two ways.", soft: "One result.", body: "Click it yourself or just ask. Both reach the same action and the same verified result." } as const;
export const STOP_TEXT = {
  id: "stop",
  label: "Stop or cancel",
  title: "Stop speaking.",
  soft: "Or cancel the task.",
  body: "Two separate controls, because they do different things. Stopping speech never cancels the task. Cancelling never undoes work that is already done.",
} as const;
export const WORK_TEXT = { id: "workspace", label: "Your workspace", title: "Your workspace.", soft: "Your context stays with it.", body: OVERVIEW.workspace.summary } as const;

/** Chip strip on the right of an OS caption: the active control lights up. */
export function ChipStrip({ mv, chips }: { mv: MotionValue<number>; chips: readonly { label: string; at: readonly [number, number] }[] }) {
  const step = useStep(
    mv,
    chips.flatMap((c) => [c.at[0], c.at[1]]),
  );
  return (
    <ol className="flex shrink-0 items-center gap-1.5 pb-1" aria-label="Controls in this demo">
      {chips.map((c, i) => {
        const on = step === i * 2;
        const done = step > i * 2;
        return (
          <li
            key={c.label}
            className={`${MONO} rounded-full border px-2.5 py-1 text-[9.5px] transition-colors ${on ? "border-[rgba(168,222,194,0.7)] text-[#A8DEC2]" : done ? "border-[rgba(255,255,255,0.14)] text-[#B7C5BC]" : "border-[rgba(255,255,255,0.08)] text-[#7E8F85]"}`}
          >
            {c.label}
          </li>
        );
      })}
    </ol>
  );
}

/* --------------------------------------------------------------- compact */

/** Compact header for any act (eyebrow + compact H2). */
export function CompactHead({ id, label, title, soft }: { id: OverviewAct; label: string; title: string; soft: string }) {
  return (
    <div>
      <ActEyebrow id={id} label={label} />
      <h2 className={`mt-3 ${H2_COMPACT}`}>
        {title} <span className={SOFT}>{soft}</span>
      </h2>
    </div>
  );
}

const MANUAL = ["Move", "Resize", "Snap", "Minimize", "Close"] as const;

/** Phones: the same action twice — by hand, then by asking — with one verified result. */
export function WaysCard({ mv }: { mv: MotionValue<number> }) {
  const film = useOverview();
  const W = (f: number) => film.at("ways", f);
  const step = useStep(mv, [W(0.14), W(0.24), W(0.34), W(0.44), W(0.52), W(0.64), W(0.76)]);
  const typed = useTypedText(mv, OVERVIEW.workWith.ai.examples[0], [W(0.54), W(0.64)]);
  return (
    <div className={`${CARD} space-y-2.5 p-3.5`}>
      <div>
        <p className={`${MONO} text-[9.5px] text-[#8A9295]`}>Manual controls</p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {MANUAL.map((m, i) => (
            <li key={m} className={`rounded-full border px-2.5 py-0.5 text-[11.5px] transition-colors ${step === i ? "border-[rgba(168,222,194,0.7)] text-[#A8DEC2]" : step > i ? "border-[rgba(255,255,255,0.14)] text-[#C9CFD1]" : "border-[rgba(255,255,255,0.08)] text-[#92A399]"}`}>
              {m}
            </li>
          ))}
        </ul>
      </div>
      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${step >= 5 ? "border-[rgba(168,222,194,0.55)]" : "border-[rgba(255,255,255,0.08)]"}`}>
        <AiOrb size={10} pulse={step === 5} />
        <span className="min-w-0 flex-1 truncate text-[13px] text-[#F2F5F2]">
          <span ref={typed} />
          {step === 5 ? <span className="afv-caret" /> : null}
        </span>
      </div>
      <p className={`flex items-center justify-between text-[12px] transition-opacity duration-300 ${step >= 6 ? "opacity-100" : "opacity-0"}`}>
        <span className="text-[#C9CFD1]">Gold · 1D chart</span>
        <span className="font-mono text-[10.5px] text-[#00E676]">✓ BY HAND · ✓ BY ASKING</span>
      </p>
    </div>
  );
}

/** The stop / cancel task as a card (phones; the desktop shows it inside the OS). */
export function StopCard({ mv, compact = false }: { mv: MotionValue<number>; compact?: boolean }) {
  const film = useOverview();
  const S = (f: number) => film.at("stop", f);
  // every moment the card changes, in order
  const marks = [STOP.run1[0][0], STOP.run1[0][1], STOP.stopPress, STOP.run1[1][1], STOP.run1[2][1], STOP.done1, STOP.reset[0], STOP.run2Gold[0], STOP.run2Gold[1], STOP.cancelPress];
  const step = useStep(mv, marks.map(S));
  // f is re-derived from the step so the card re-renders only on state changes
  const f = step < 0 ? 0 : marks[step];
  const s = stopRows(f);
  const stopOn = f >= STOP.stopPress && f < STOP.reset[0];
  const cancelOn = f >= STOP.cancelPress;
  return (
    <div className={`${CARD_AI} ${compact ? "p-3" : "p-4"}`} aria-label="Stop speaking versus cancel task, sample">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[13px] font-semibold">
          <AiOrb size={10} pulse={s.speaking} /> Opening your selected charts
        </p>
        <span className={`${MONO} text-[9.5px] ${s.status === "Cancelled" ? "text-[#FF6B6B]" : s.status === "Complete" ? "text-[#00E676]" : "text-[#A8DEC2]"}`}>{s.status}</span>
      </div>
      <ol className="mt-2 space-y-1">
        {STOP_ITEMS.map((item, i) => {
          const r = s.rows[i];
          return (
            <li key={item} className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.06)] px-2.5 py-1 text-[12px]">
              <span className="text-[#E6E9EB]">{item}</span>
              <span className={`font-mono text-[10px] ${r === "done" ? "text-[#00E676]" : r === "active" ? "text-[#A8DEC2]" : r === "cancelled" ? "text-[#FF6B6B]" : "text-[#7E8F85]"}`}>{STOP_STATE[r]}</span>
            </li>
          );
        })}
      </ol>
      <p className={`mt-2 min-h-[1.4em] text-[12px] ${s.caption ? "text-[#F3DFAF]" : "text-transparent"}`}>{s.caption ?? "·"}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <span className={`rounded-full border px-3 py-1 text-center text-[11.5px] ${stopOn ? "border-[#A8DEC2] bg-[rgba(168,222,194,0.16)] text-[#F2F5F2]" : "border-[rgba(255,255,255,0.12)] text-[#B7C5BC]"}`}>Stop speaking</span>
        <span className={`rounded-full border px-3 py-1 text-center text-[11.5px] ${cancelOn ? "border-[#FF6B6B] bg-[rgba(255,77,77,0.14)] text-[#F2F5F2]" : "border-[rgba(255,255,255,0.12)] text-[#B7C5BC]"}`}>Cancel task</span>
      </div>
    </div>
  );
}

/** Phones: the four workspace topics, lit in turn. */
export function WorkspaceList({ mv, compact = false }: { mv: MotionValue<number>; compact?: boolean }) {
  const film = useOverview();
  const K = (f: number) => film.at("workspace", f);
  const step = useStep(mv, [K(0.06), K(0.31), K(0.53), K(0.73)]);
  return (
    <ul className={compact ? "space-y-1.5" : "space-y-2"}>
      {OVERVIEW.workspace.items.map((it, i) => (
        <li key={it.title} className={`rounded-xl border px-3 transition-colors ${compact ? "py-1.5" : "py-2.5"} ${step === i ? "border-[rgba(168,222,194,0.6)] bg-[rgba(168,222,194,0.07)]" : "border-[rgba(255,255,255,0.07)]"}`}>
          <p className={`text-[13px] font-semibold ${step === i ? "text-[#F2F5F2]" : "text-[#B7C5BC]"}`}>{it.title}</p>
          <p className="text-[12px] leading-snug text-[#8A9295]">{it.description}</p>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- verify */

export function VerifyCopy({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <ActEyebrow id="verify" label="Request to verified" />
      <h2 className={compact ? `mt-3 ${H2_COMPACT}` : `mt-4 ${H2}`}>
        From request <span className={SOFT}>to verified result.</span>
      </h2>
      {compact ? null : (
        <p className={`mt-5 ${BODY} [@media(max-height:820px)]:hidden`}>
          Every action follows the same path: validated, authorized, run by the service that owns it, then checked against what actually happened.
        </p>
      )}
    </div>
  );
}

/** The station the request is at, synced with the 3D pulse. */
export function StationCard({ mv, compact = false }: { mv: MotionValue<number>; compact?: boolean }) {
  const film = useOverview();
  const V = (f: number) => film.at("verify", f);
  const step = useStep(mv, [...STATION_AT.map(V), V(RETURN_AT[0])]);
  const back = step >= STATIONS.length;
  const st = STATIONS[Math.max(0, Math.min(step, STATIONS.length - 1))];
  return (
    <div className={`${CARD_AI} ${compact ? "p-3" : "p-4"}`} aria-live="off">
      <div className="flex items-center justify-between">
        <p className={`${MONO} text-[10px] text-[#A8DEC2]`}>{back ? "Returned" : `Step ${Math.max(1, step + 1)} of ${STATIONS.length}`}</p>
        <ol className="flex gap-1" aria-hidden="true">
          {STATIONS.map((s, i) => (
            <li key={s.label} className={`h-1.5 w-4 rounded-full ${i <= step ? "bg-[#A8DEC2]" : "bg-[#2A2F33]"}`} />
          ))}
        </ol>
      </div>
      <p className={`mt-2 font-semibold ${compact ? "text-[15px]" : "text-[17px]"} text-[#F2F5F2]`}>{back ? RETURN_LABEL : st.label}</p>
      {back ? (
        <p className="mt-1 text-[12.5px] text-[#B7C5BC]">Back to the trader, shown only after the check.</p>
      ) : (
        <ul className="mt-1.5 space-y-0.5 text-[12.5px] text-[#B7C5BC]">
          {st.detail.map((d) => (
            <li key={d} className="flex gap-2">
              <span className="text-[#A8DEC2]">›</span>
              {d}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- trust */

const PROMISES = [
  ["Never places orders", "No command can place, change or close an order."],
  ["Read-only connections", "Supported account connections are read-only."],
  ["Verified means verified", "Identity verification and verified trading records are different things."],
  ["No fake live data", "Sample, delayed and stale data are always labelled."],
  ["No silent success", "A result is shown as done only after it is checked."],
] as const;

export function TrustCopy({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <ActEyebrow id="trust" label="Trust" />
      <h2 className={compact ? `mt-3 ${H2_COMPACT}` : `mt-4 ${H2}`}>
        Built to be trusted. <span className={SOFT}>What it does, and never does.</span>
      </h2>
      {compact ? null : (
        <ol className={`mt-6 border-t ${HAIR}`}>
          {PROMISES.map(([t, d], i) => (
            <li key={t} className={`flex items-baseline gap-4 border-b ${HAIR} py-2.5 [@media(max-height:800px)]:py-1.5`}>
              <span className={`${MONO} w-6 shrink-0 text-[10px] text-[#92A399]`}>{String(i + 1).padStart(2, "0")}</span>
              <span className="w-[11.5rem] shrink-0 text-sm font-semibold text-[#F2F5F2]">{t}</span>
              <span className="text-[13px] leading-snug text-[#8A9295]">{d}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const DOT: Record<string, string> = { live: "bg-[#00E676]", delayed: "bg-[#F6B94A]", stale: "bg-[#F6B94A]", sample: "bg-[#92A399]" };

/** One chart, four honest states: the label always says where the data stands. */
export function FreshnessCard({ mv, closes, compact = false }: { mv: MotionValue<number>; closes?: readonly number[]; compact?: boolean }) {
  const film = useOverview();
  const step = useStep(
    mv,
    FRESH_AT.map((a) => film.at("trust", a)),
  );
  const fresh = FRESHNESS[Math.max(0, step)];
  return (
    <div className={`${CARD} ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#F2F5F2]">Freshness, always labelled.</p>
        <span className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.12)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#C9CFD1]">
          <span className={`h-1.5 w-1.5 rounded-full ${DOT[fresh.id]}`} />
          {fresh.label}
        </span>
      </div>
      {compact ? null : <p className="mt-1.5 text-[12px] leading-snug text-[#8A9295]">Every chart says where its data stands. When data goes stale, conclusions wait until it is fresh again.</p>}
      <div className={`relative mt-3 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A0C0D] ${compact ? "h-20" : "h-28 [@media(max-height:820px)]:h-20"}`}>
        {closes && closes.length > 1 ? (
          <div className={`absolute inset-x-2 bottom-2 top-6 transition-opacity duration-500 ${fresh.id === "stale" ? "opacity-40" : "opacity-100"}`}>
            <MiniChart closes={closes} className="h-full w-full" />
          </div>
        ) : null}
        <span className={`${MONO} absolute left-2.5 top-2 text-[9px] text-[#8A9295]`}>Gold chart</span>
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-1.5">
        {FRESHNESS.map((s, i) => (
          <li key={s.id} className={`rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase ${i === Math.max(0, step) ? "border-[rgba(168,222,194,0.6)] text-[#A8DEC2]" : "border-[rgba(255,255,255,0.08)] text-[#7E8F85]"}`}>
            {s.label}
          </li>
        ))}
      </ul>
      <p className="mt-2 font-mono text-[10.5px] text-[#B7C5BC]">{fresh.source}</p>
    </div>
  );
}

/* ----------------------------------------------------------------- areas */

export function AreasCopy({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <ActEyebrow id="areas" label="Five areas" />
      <h2 className={compact ? `mt-3 ${H2_COMPACT}` : `mt-4 ${H2}`}>
        {OVERVIEW.explore.title}. <span className={SOFT}>Each area, led by its cores.</span>
      </h2>
      {compact ? null : <p className={`mt-4 ${BODY} [@media(max-height:820px)]:hidden`}>{OVERVIEW.explore.summary}</p>}
    </div>
  );
}

/** The five capability pages; the one lit in 3D is highlighted. */
export function AreaList({ mv, compact = false }: { mv: MotionValue<number>; compact?: boolean }) {
  const film = useOverview();
  const step = useStep(
    mv,
    AREA_BEATS.map((b) => film.at("areas", b)),
  );
  return (
    <ul className={compact ? "space-y-1" : "space-y-1.5"} aria-label="Capability pages">
      {CAPABILITIES.map((c, i) => {
        const on = step === i;
        return (
          <li key={c.slug}>
            <Link
              href={capabilityPath(c.slug)}
              className={`group flex items-center gap-3 rounded-xl border px-3 transition-colors ${compact ? "py-1.5" : "py-2 [@media(max-height:800px)]:py-1.5"} ${on ? "border-[rgba(168,222,194,0.6)] bg-[rgba(168,222,194,0.07)]" : "border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.2)]"}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${on ? "border-[rgba(168,222,194,0.6)] text-[#A8DEC2]" : "border-[rgba(255,255,255,0.1)] text-[#B7C5BC]"}`}>
                <AppGlyph name={APPS[i].glyph} size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-[#F2F5F2]">{c.title}</span>
                {compact ? null : on ? (
                  <span className={`${MONO} block truncate text-[9.5px] text-[#A8DEC2]`}>Led by {APPS[i].lead.map((id) => AI_CORES.find((k) => k.id === id)!.label.replace(" core", "")).join(" · ")} cores</span>
                ) : (
                  <span className="block truncate text-[12px] text-[#8A9295]">{c.tagline}</span>
                )}
              </span>
              <span className={`${MONO} shrink-0 text-[9.5px] ${on ? "text-[#A8DEC2]" : "text-[#92A399] group-hover:text-[#C9CFD1]"}`}>Explore →</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export { useOverview };
