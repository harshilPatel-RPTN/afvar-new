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
import { RevealItem, RevealList, RevealMark, RevealRing, RuleDraw, WordLight } from "../motion";

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
    <section id="features" aria-labelledby="features-title" className="relative scroll-mt-24 bg-transparent px-5 py-24 sm:px-8 lg:px-16">
      <RuleDraw />
      <div className="mx-auto max-w-[1240px]">
        <p className={EYEBROW}>Inside {c.title}</p>
        <h2 id="features-title" className={`mt-4 ${H2}`}>
          {numberWord(c.features.length)} features. <span className={SOFT}>Each one plays in the film above.</span>
        </h2>
        <RevealList className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {c.features.map((f, i) => {
            const act = actOf[f.title];
            return (
              <RevealItem key={f.title} i={i} className={`${CARD} flex flex-col p-5`}>
                <span className="flex items-center justify-between">
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#A8DEC2]">
                    <RevealRing className="rounded-xl border border-[rgba(168,222,194,0.35)]" />
                    <PIcon name={f.icon} size={18} />
                  </span>
                  <span className="font-mono text-[10px] text-[#7E8F85]">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <h3 className="mt-4 text-[15px] font-semibold leading-snug text-[#F2F5F2]">{f.title}</h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-[#8A9295]">{f.description}</p>
                <span className={`mt-5 flex items-center justify-between border-t pt-3 ${HAIR}`}>
                  <span className={`${MONO} text-[9.5px] text-[#92A399]`}>{AVAILABILITY_LABEL[f.availability]}</span>
                  {act ? (
                    <button
                      type="button"
                      onClick={() => jumpToAct(filmId, act)}
                      className={`${MONO} rounded-full border border-[rgba(168,222,194,0.4)] px-2.5 py-1 text-[9.5px] text-[#A8DEC2] transition-colors hover:border-[#A8DEC2] hover:bg-[rgba(168,222,194,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8DEC2]`}
                      aria-label={`Show ${f.title} in the film`}
                    >
                      Show me ↑
                    </button>
                  ) : null}
                </span>
              </RevealItem>
            );
          })}
        </RevealList>
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
    <section aria-labelledby="outcome-title" className="relative bg-transparent px-5 py-24 sm:px-8 lg:px-16">
      <RuleDraw />
      <div className="mx-auto max-w-[1040px]">
        <p id="outcome-title" className={EYEBROW}>
          {c.outcome.title}
        </p>
        <WordLight text={c.outcome.description} className="mt-6 text-[clamp(1.8rem,3.6vw,3rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-[#F2F5F2]" />
      </div>
    </section>
  );
}

/* ---------------------------------------------------- notes and related */

export function NotesAndRelated({ capability: c, notes }: { capability: Capability; notes: readonly string[] }) {
  const all = [...(c.note ? [c.note] : []), ...notes, "Feature availability and sources will be confirmed before publication."];
  return (
    <section aria-labelledby="notes-title" className="relative bg-transparent px-5 py-20 sm:px-8 lg:px-16">
      <RuleDraw />
      <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 id="notes-title" className={EYEBROW}>
            Notes
          </h2>
          <RevealList step={0.18} className={`mt-5 border-t ${HAIR}`}>
            {all.map((n, i) => (
              <RevealItem key={n} i={i} className={`flex gap-3 border-b ${HAIR} py-3 text-[14px] leading-relaxed text-[#B7C5BC]`}>
                <RevealMark className="text-[#A8DEC2]">›</RevealMark>
                {n}
              </RevealItem>
            ))}
          </RevealList>
        </div>
        <div>
          <h2 className={EYEBROW}>Related</h2>
          <RevealList className="mt-5 grid gap-3 sm:grid-cols-2">
            {c.related.map((r, i) => (
              <RevealItem key={`${r.route}-${r.title}`} i={i}>
                <Link href={pathOf(r.route)} className={`${CARD} group flex h-full items-start gap-3 p-4 transition-colors hover:border-[rgba(255,255,255,0.22)]`}>
                  <span className="mt-0.5 text-[#A8DEC2]">
                    <PIcon name={r.icon} size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-[#F2F5F2]">{r.title}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-[#8A9295]">{r.description}</span>
                  </span>
                  <span className="ml-auto text-[#92A399] transition-transform group-hover:translate-x-0.5 group-hover:text-[#C9CFD1]">→</span>
                </Link>
              </RevealItem>
            ))}
          </RevealList>
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
    <section aria-labelledby="areas-title" className="relative bg-transparent px-5 py-24 sm:px-8 lg:px-16">
      <RuleDraw />
      <div className="mx-auto max-w-[1240px]">
        <p className={EYEBROW}>Platform</p>
        <h2 id="areas-title" className={`mt-4 ${H2}`}>
          The other four areas. <span className={SOFT}>The same AI runs all five.</span>
        </h2>
        <RevealList className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Other capability pages">
          {others.map((o, i) => (
            <RevealItem key={o.slug} i={i}>
              <Link href={capabilityPath(o.slug)} className={`${CARD} group flex h-full flex-col p-5 transition-colors hover:border-[rgba(168,222,194,0.45)]`}>
                <span className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#A8DEC2]">
                  <RevealRing className="rounded-xl border border-[rgba(168,222,194,0.35)]" />
                  <AppGlyph name={APPS.find((a) => a.slug === o.slug)!.glyph} size={18} />
                </span>
                <h3 className="mt-4 text-[16px] font-semibold text-[#F2F5F2]">{o.title}</h3>
                <p className="mt-1 flex-1 text-[13px] leading-snug text-[#8A9295]">{o.tagline}</p>
                <span className={`${MONO} mt-5 block text-[9.5px] text-[#A8DEC2]`}>Led by {coreNames(o.slug)}</span>
                <span className={`${MONO} mt-2 block text-[9.5px] text-[#92A399] group-hover:text-[#C9CFD1]`}>Explore →</span>
              </Link>
            </RevealItem>
          ))}
        </RevealList>
      </div>
    </section>
  );
}
