"use client";

// The sections under every capability film, in the AI OS theme:
//
//   FeatureJumpGrid   the page's features; each card jumps the film to the act
//                     that shows it
//   OutcomeLine       the page's outcome, as one large line
//   NotesAndRelated   notes on sources and availability, and onward links
//   OtherAreas        the other four capability pages, with the cores that lead them
import Link from "next/link";
import { AI_CORES, AppGlyph, CARD, EYEBROW, H2, HAIR, MONO, SOFT, prefersReducedMotion } from "@/modules/afvarOs";
import { AVAILABILITY_LABEL, CAPABILITIES } from "../../content";
import { capabilityPath, pathOf } from "../../routes";
import type { Capability, CapabilitySlug } from "../../types";
import { PIcon } from "../../components/mac/icons";
import { APPS } from "../overviewFilm";

/* ------------------------------------------------------------- features */

/** Scroll the film on `filmId` to act `act` (the act's caption fully shown). */
export function jumpToAct(filmId: string, act: string) {
  // OS sections: `act` is the section's id — land where its windows are on screen.
  const sec = document.getElementById(act);
  if (sec && sec.tagName === "SECTION") {
    const smooth = prefersReducedMotion() ? "auto" : "smooth";
    const span = Math.max(0, sec.offsetHeight - window.innerHeight);
    window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY + span * 0.55, behavior: smooth });
    return;
  }
  const track = document.getElementById(filmId);
  if (!track) return;
  const smooth = prefersReducedMotion() ? "auto" : "smooth";
  if (track.dataset.mode === "stacked") {
    document.getElementById(`${filmId}-${act}`)?.scrollIntoView({ behavior: smooth, block: "start" });
    return;
  }
  const ranges = track.dataset.acts ? (JSON.parse(track.dataset.acts) as Record<string, [number, number]>) : null;
  const r = ranges?.[act];
  if (!r) return;
  const span = track.offsetHeight - window.innerHeight;
  const top = track.getBoundingClientRect().top + window.scrollY + span * (r[0] + (r[1] - r[0]) * 0.45);
  window.scrollTo({ top, behavior: smooth });
}

export function FeatureJumpGrid({ capability: c, filmId, actOf }: { capability: Capability; filmId: string; actOf: Record<string, string> }) {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-24 border-t border-[rgba(255,255,255,0.06)] bg-[#050607] px-5 py-24 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-[1240px]">
        <p className={EYEBROW}>Inside {c.title}</p>
        <h2 id="features-title" className={`mt-4 ${H2}`}>
          {numberWord(c.features.length)} features. <span className={SOFT}>Each one plays in the film above.</span>
        </h2>
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {c.features.map((f, i) => {
            const act = actOf[f.title];
            return (
              <li key={f.title} className={`${CARD} flex flex-col p-5`}>
                <span className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(233,180,76,0.35)] text-[#E9B44C]">
                    <PIcon name={f.icon} size={18} />
                  </span>
                  <span className="font-mono text-[10px] text-[#5E6669]">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <h3 className="mt-4 text-[15px] font-semibold leading-snug text-[#F5F7F7]">{f.title}</h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-[#8A9295]">{f.description}</p>
                <span className={`mt-5 flex items-center justify-between border-t pt-3 ${HAIR}`}>
                  <span className={`${MONO} text-[9.5px] text-[#6D7578]`}>{AVAILABILITY_LABEL[f.availability]}</span>
                  {act ? (
                    <button
                      type="button"
                      onClick={() => jumpToAct(filmId, act)}
                      className={`${MONO} rounded-full border border-[rgba(233,180,76,0.4)] px-2.5 py-1 text-[9.5px] text-[#E9B44C] transition-colors hover:border-[#E9B44C] hover:bg-[rgba(233,180,76,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E9B44C]`}
                      aria-label={`Show ${f.title} in the film`}
                    >
                      Show me ↑
                    </button>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function numberWord(n: number): string {
  return ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"][n] ?? String(n);
}

/* -------------------------------------------------------------- outcome */

export function OutcomeLine({ capability: c }: { capability: Capability }) {
  return (
    <section aria-labelledby="outcome-title" className="border-t border-[rgba(255,255,255,0.06)] bg-[#050607] px-5 py-24 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-[1040px]">
        <p id="outcome-title" className={EYEBROW}>
          {c.outcome.title}
        </p>
        <p className="mt-6 text-[clamp(1.8rem,3.6vw,3rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-[#F5F7F7]">{c.outcome.description}</p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- notes and related */

export function NotesAndRelated({ capability: c, notes }: { capability: Capability; notes: readonly string[] }) {
  const all = [...(c.note ? [c.note] : []), ...notes, "Feature availability and sources will be confirmed before publication."];
  return (
    <section aria-labelledby="notes-title" className="border-t border-[rgba(255,255,255,0.06)] bg-[#050607] px-5 py-20 sm:px-8 lg:px-16">
      <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 id="notes-title" className={EYEBROW}>
            Notes
          </h2>
          <ul className={`mt-5 border-t ${HAIR}`}>
            {all.map((n) => (
              <li key={n} className={`flex gap-3 border-b ${HAIR} py-3 text-[14px] leading-relaxed text-[#A3AAAC]`}>
                <span className="text-[#E9B44C]">›</span>
                {n}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className={EYEBROW}>Related</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {c.related.map((r) => (
              <li key={`${r.route}-${r.title}`}>
                <Link href={pathOf(r.route)} className={`${CARD} group flex h-full items-start gap-3 p-4 transition-colors hover:border-[rgba(255,255,255,0.22)]`}>
                  <span className="mt-0.5 text-[#E9B44C]">
                    <PIcon name={r.icon} size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-[#F5F7F7]">{r.title}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-[#8A9295]">{r.description}</span>
                  </span>
                  <span className="ml-auto text-[#6D7578] transition-transform group-hover:translate-x-0.5 group-hover:text-[#C9CFD1]">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- other areas */

const coreNames = (slug: CapabilitySlug) =>
  APPS.find((a) => a.slug === slug)!
    .lead.map((id) => AI_CORES.find((k) => k.id === id)!.label.replace(" core", ""))
    .join(" · ");

export function OtherAreas({ current }: { current: CapabilitySlug }) {
  const others = CAPABILITIES.filter((o) => o.slug !== current);
  return (
    <section aria-labelledby="areas-title" className="border-t border-[rgba(255,255,255,0.06)] bg-[#050607] px-5 py-24 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-[1240px]">
        <p className={EYEBROW}>Platform</p>
        <h2 id="areas-title" className={`mt-4 ${H2}`}>
          The other four areas. <span className={SOFT}>The same AI runs all five.</span>
        </h2>
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Other capability pages">
          {others.map((o) => (
            <li key={o.slug}>
              <Link href={capabilityPath(o.slug)} className={`${CARD} group flex h-full flex-col p-5 transition-colors hover:border-[rgba(233,180,76,0.45)]`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(233,180,76,0.35)] text-[#E9B44C]">
                  <AppGlyph name={APPS.find((a) => a.slug === o.slug)!.glyph} size={18} />
                </span>
                <h3 className="mt-4 text-[16px] font-semibold text-[#F5F7F7]">{o.title}</h3>
                <p className="mt-1 flex-1 text-[13px] leading-snug text-[#8A9295]">{o.tagline}</p>
                <span className={`${MONO} mt-5 block text-[9.5px] text-[#E9B44C]`}>Led by {coreNames(o.slug)}</span>
                <span className={`${MONO} mt-2 block text-[9.5px] text-[#6D7578] group-hover:text-[#C9CFD1]`}>Explore →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
