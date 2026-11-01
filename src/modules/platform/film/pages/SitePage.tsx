import type { ReactNode } from "react";
import { ClosingCopy, SiteFrame } from "@/modules/homeDemo";

/**
 * The site pages outside Platform (About, Pricing, Markets, Resources): the
 * home's frame, the page's own 3D hero and OS sections (`film`), then any
 * working content the page keeps (`after`), closing on the point globe.
 */
export function SitePage({
  film,
  after,
  closing,
  soft,
  second,
}: {
  film: ReactNode;
  after?: ReactNode;
  closing: string;
  soft: string;
  second: { label: string; href: string };
  /** Kept for callers; the globe closing reads its fixed heading id. */
  id?: string;
}) {
  return (
    <SiteFrame closing={<ClosingCopy title={closing} soft={soft} second={second} />}
    >
      {film}
      {after}
    </SiteFrame>
  );
}

/** A plain directory block after the sections: the page's real links, in the OS palette. */
export function Directory({ id, title, soft, children }: { id: string; title: string; soft?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-24 bg-transparent px-5 py-24 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <h2 id={`${id}-t`} className="text-[clamp(1.7rem,2.6vw,2.4rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#F2F5F2]">
          {title} {soft ? <span className="text-[#B7C5BC]">{soft}</span> : null}
        </h2>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

/** One linked card in a Directory grid. */
export function DirCard({ href, title, body, tag }: { href: string; title: string; body?: string; tag?: string }) {
  return (
    <a href={href} className="group block rounded-[14px] border border-[rgba(255,255,255,0.1)] bg-[#06110C] p-5 transition-colors hover:border-[rgba(168,222,194,0.55)]">
      {tag ? <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#92A399]">{tag}</p> : null}
      <p className="mt-1 text-[15.5px] font-semibold text-[#F2F5F2] group-hover:text-[#A8DEC2]">{title} →</p>
      {body ? <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#B7C5BC]">{body}</p> : null}
    </a>
  );
}
