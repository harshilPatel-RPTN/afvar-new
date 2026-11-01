import Link from "next/link";

/** Header of a single guide or help topic, in the site's AI OS style: no animated backdrop. */
export function ArticleHead({ crumb, eyebrow, title, lede }: { crumb: { label: string; href: string }[]; eyebrow: string; title: string; lede: string }) {
  return (
    <header className="px-5 pt-16 sm:px-8 sm:pt-20 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#6D7578]">
          <Link href="/resources" className="inline-flex min-h-6 items-center hover:text-[#F5F7F7]">
            Resources
          </Link>
          {crumb.map((c, i) => (
            <span key={c.href} className="flex gap-1.5">
              <span aria-hidden="true">/</span>
              {i === crumb.length - 1 ? (
                <span className="inline-flex min-h-6 items-center text-[#A3AAAC]">{c.label}</span>
              ) : (
                <Link href={c.href} className="inline-flex min-h-6 items-center hover:text-[#F5F7F7]">
                  {c.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-[#E9B44C]">{eyebrow}</p>
        <h1 id="resources-hero-title" className="mt-3 max-w-4xl text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-[#F5F7F7]">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-[#A3AAAC]">{lede}</p>
      </div>
    </header>
  );
}
