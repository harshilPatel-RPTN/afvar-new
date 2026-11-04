import Link from "next/link";

/** Header of a single guide or help topic, in the site's AI OS style: no animated backdrop. */
export function ArticleHead({ crumb, eyebrow, title, lede }: { crumb: { label: string; href: string }[]; eyebrow: string; title: string; lede: string }) {
  return (
    <header className="px-5 pt-16 sm:px-8 sm:pt-20 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb">
          {/* One baseline for every crumb: links keep a 40px tap height, separators and the current page sit centred beside them. */}
          <ol className="flex flex-wrap items-center gap-x-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#92A399]">
            <li>
              <Link href="/resources" className="inline-flex min-h-10 items-center hover:text-[#F2F5F2]">
                Resources
              </Link>
            </li>
            {crumb.map((c, i) => (
              <li key={c.href} className="flex min-w-0 items-center gap-1.5">
                <span aria-hidden="true">/</span>
                {i === crumb.length - 1 ? (
                  <span aria-current="page" className="py-2 leading-snug text-[#B7C5BC]">
                    {c.label}
                  </span>
                ) : (
                  <Link href={c.href} className="inline-flex min-h-10 items-center hover:text-[#F2F5F2]">
                    {c.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-[#A8DEC2]">{eyebrow}</p>
        <h1 id="resources-hero-title" className="mt-3 max-w-4xl text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-[#F2F5F2]">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-[#B7C5BC]">{lede}</p>
      </div>
    </header>
  );
}
