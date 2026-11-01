"use client";

// Hero of a capability page: its own 3D centrepiece and its hero copy.
import dynamic from "next/dynamic";
import Link from "next/link";
import { AiOrb, BODY, EYEBROW, GHOST_LINK, GOLD_CTA, H1, HAIR, MONO } from "@/modules/afvarOs";
import { REGISTER_URL } from "../../routes";
import type { CapHeroKind } from "./CapHeroScenes";
import type { PageHeroKind } from "./PageHeroScenes";
import { HeroStage } from "./HeroStage";

const CapHeroScene = dynamic(() => import("./CapHeroScenes"), { ssr: false });
const PageHeroScene = dynamic(() => import("./PageHeroScenes"), { ssr: false });

export interface CapHeroText {
  eyebrow: string;
  title: string;
  gold: string;
  body: string;
  short: string;
  facts: readonly string[];
  /** The second link (default: the page's feature list). */
  second?: { label: string; href: string };
  /** Small line above the eyebrow, e.g. a breadcrumb. */
  crumb?: readonly { label: string; href?: string }[];
}

export function CapHeroCopy({ t, compact = false }: { t: CapHeroText; compact?: boolean }) {
  return (
    <div>
      {t.crumb ? (
        <nav aria-label="Breadcrumb" className={`${MONO} mb-3 flex flex-wrap gap-1.5 text-[#6D7578]`}>
          {t.crumb.map((c, i) => (
            <span key={c.label} className="flex gap-1.5">
              {i ? <span aria-hidden="true">/</span> : null}
              {c.href ? (
                <Link href={c.href} prefetch={false} className="inline-flex min-h-6 items-center hover:text-[#F5F7F7]">
                  {c.label}
                </Link>
              ) : (
                <span className="inline-flex min-h-6 items-center text-[#A3AAAC]">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <p className={EYEBROW}>{t.eyebrow}</p>
      <h1 className={compact ? "mt-3 text-[clamp(2.05rem,8.8vw,3rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-[#F5F7F7]" : `mt-5 ${H1}`}>
        {t.title} <span className="text-[#E9B44C]">{t.gold}</span>
      </h1>
      <p className={compact ? "mt-3 text-[14.5px] leading-relaxed text-[#A3AAAC]" : `mt-6 max-w-[31rem] ${BODY}`}>{compact ? t.short : t.body}</p>
      <div className={`${compact ? "mt-5" : "mt-8"} flex flex-wrap items-center gap-5`}>
        <Link href={REGISTER_URL} prefetch={false} className={GOLD_CTA}>
          Register Now
        </Link>
        <a href={t.second?.href ?? "#features"} className={GHOST_LINK}>
          {t.second?.label ?? "See the features"}
        </a>
      </div>
      <div className={`${compact ? "mt-5 pt-3" : "mt-10 pt-5"} flex flex-wrap items-center gap-x-6 gap-y-2 border-t ${HAIR}`}>
        {t.facts.map((f, i) => (
          <span key={f} className={`${MONO} flex items-center gap-2 ${i === 0 ? "text-[#E9B44C]" : "text-[#6D7578]"}`}>
            {i === 0 ? <AiOrb size={8} /> : null}
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CapHero({ kind, id, label, text }: { kind: CapHeroKind; id: string; label: string; text: CapHeroText }) {
  return <HeroStage id={id} label={label} copy={(compact) => <CapHeroCopy t={text} compact={compact} />} scene={(a) => <CapHeroScene kind={kind} a={a} />} />;
}

export function PageHero({ kind, id, label, text }: { kind: PageHeroKind; id: string; label: string; text: CapHeroText }) {
  return <HeroStage id={id} label={label} copy={(compact) => <CapHeroCopy t={text} compact={compact} />} scene={(a) => <PageHeroScene kind={kind} a={a} />} />;
}
