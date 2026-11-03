"use client";

// Hero of a capability page: its own 3D centrepiece and its hero copy.
import dynamic from "next/dynamic";
import Link from "next/link";
import { AiOrb, BODY, EYEBROW, GHOST_LINK, GOLD_CTA, H1, HAIR, HeroTitle, MONO } from "@/modules/afvarOs";
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
        <nav aria-label="Breadcrumb" className={`${MONO} mb-3 flex flex-wrap gap-1.5 text-[#92A399]`}>
          {t.crumb.map((c, i) => (
            <span key={c.label} className="flex gap-1.5">
              {i ? <span aria-hidden="true">/</span> : null}
              {c.href ? (
                <Link href={c.href} prefetch={false} className="inline-flex min-h-10 items-center hover:text-[#F2F5F2]">
                  {c.label}
                </Link>
              ) : (
                <span className="inline-flex min-h-10 items-center text-[#B7C5BC]">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <p className={EYEBROW}>{t.eyebrow}</p>
      <HeroTitle twin={compact} className={compact ? "mt-3 text-[clamp(2.05rem,8.8vw,3rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-[#F2F5F2]" : `mt-5 ${H1}`}>
        {t.title} <span className="text-[#A8DEC2]">{t.gold}</span>
      </HeroTitle>
      <p className={compact ? "mt-3 text-[14.5px] leading-relaxed text-[#B7C5BC]" : `mt-6 max-w-[31rem] ${BODY}`}>{compact ? t.short : t.body}</p>
      <div className={`${compact ? "mt-5" : "mt-8"} flex flex-nowrap items-center gap-2.5 sm:gap-5`}>
        <Link href={REGISTER_URL} prefetch={false} className={GOLD_CTA}>
          Register Now
        </Link>
        <a href={t.second?.href ?? "#features"} className={GHOST_LINK}>
          {t.second?.label ?? "See the features"}
        </a>
      </div>
      <div className={`${compact ? "mt-5 pt-3" : "mt-10 pt-5"} flex flex-wrap items-center gap-x-6 gap-y-2 border-t ${HAIR}`}>
        {t.facts.map((f, i) => (
          <span key={f} className={`${MONO} flex items-center gap-2 ${i === 0 ? "text-[#A8DEC2]" : "text-[#92A399]"}`}>
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

export function PageHero({ kind, variant, id, label, text }: { kind: PageHeroKind; variant?: string; id: string; label: string; text: CapHeroText }) {
  return <HeroStage id={id} label={label} copy={(compact) => <CapHeroCopy t={text} compact={compact} />} scene={(a) => <PageHeroScene kind={kind} variant={variant} a={a} />} />;
}
