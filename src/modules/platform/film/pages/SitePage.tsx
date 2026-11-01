import type { ReactNode } from "react";
import { GHOST_LINK } from "@/modules/afvarOs";
import { BTN_PRIMARY } from "@/modules/home/kit";
import { SiteFrame } from "@/modules/homeDemo";
import { EarthHorizon } from "../../components/closing/EarthHorizon";
import { REGISTER_URL } from "../../routes";

/**
 * The site pages outside Platform (About, Pricing, Markets, Resources): the
 * home's frame, the page's own 3D hero and OS sections (`film`), then any
 * working content the page keeps (`after`), closing on the Earth.
 */
export function SitePage({
  film,
  after,
  closing,
  soft,
  second,
  id,
}: {
  film: ReactNode;
  after?: ReactNode;
  closing: string;
  soft: string;
  second: { label: string; href: string };
  id: string;
}) {
  return (
    <SiteFrame
      closing={
        <EarthHorizon labelledBy={`${id}-closing-title`}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 id={`${id}-closing-title`} className="text-[clamp(2.1rem,4.2vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#F5F7F7]">
              {closing} <span className="text-[#A3AAAC]">{soft}</span>
            </h2>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-6">
              <a href={REGISTER_URL} className={BTN_PRIMARY}>
                Register Now
              </a>
              <a href={second.href} className={GHOST_LINK}>
                {second.label}
              </a>
            </div>
          </div>
        </EarthHorizon>
      }
    >
      {film}
      {after}
    </SiteFrame>
  );
}

/** A plain directory block after the sections: the page's real links, in the OS palette. */
export function Directory({ id, title, soft, children }: { id: string; title: string; soft?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-24 bg-[#050607] px-5 py-24 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <h2 id={`${id}-t`} className="text-[clamp(1.7rem,2.6vw,2.4rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#F5F7F7]">
          {title} {soft ? <span className="text-[#A3AAAC]">{soft}</span> : null}
        </h2>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

/** One linked card in a Directory grid. */
export function DirCard({ href, title, body, tag }: { href: string; title: string; body?: string; tag?: string }) {
  return (
    <a href={href} className="group block rounded-[14px] border border-[rgba(255,255,255,0.1)] bg-[#0B0E10] p-5 transition-colors hover:border-[rgba(233,180,76,0.55)]">
      {tag ? <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6D7578]">{tag}</p> : null}
      <p className="mt-1 text-[15.5px] font-semibold text-[#F5F7F7] group-hover:text-[#E9B44C]">{title} →</p>
      {body ? <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#A3AAAC]">{body}</p> : null}
    </a>
  );
}
