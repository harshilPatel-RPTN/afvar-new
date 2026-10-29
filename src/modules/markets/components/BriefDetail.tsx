import Link from "next/link";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";
import { marketCopy } from "../content";
import { findBrief, findCategory, findInstrument } from "../data";
import { Chevron, ClosingBand, Heading, PageHero, PIcon, PrimaryLink, Record, Reveal, SECTION } from "./about/kit";
import { Breadcrumb, type Translate } from "./ui";

/** W3.6 · Market Brief template: date & edition, overview, key events, related instruments, sources & updated time. */
export async function BriefDetail({ edition: editionId }: { edition: string }) {
  const brief = findBrief(editionId);
  const category = brief && findCategory(brief.category);
  if (!brief || !category) notFound();

  const edition = await getServerEdition();
  const t: Translate = (key, vars) => translate(edition, key, vars);
  const b = marketCopy(edition).brief;
  const format = new Intl.DateTimeFormat(DEFAULT_LOCALE[edition], { dateStyle: "long", timeStyle: "short", timeZone: "UTC" });
  const categoryName = t(category.titleKey);
  const instruments = (brief.instruments ?? []).map((slug) => findInstrument(brief.category, slug)).filter((item) => item !== undefined);

  return (
    <>
      <PageHero
        top={<Breadcrumb t={t} items={[{ label: t("mk.briefs.title"), href: "/market/briefs" }, { label: brief.edition }]} />}
        eyebrow={categoryName}
        title={[t(brief.titleKey)]}
      >
        <p className="text-[15px] text-(--text-secondary)">
          <time dateTime={brief.publishedUtc}>{format.format(new Date(brief.publishedUtc))} UTC</time> · {b.edition} {brief.edition}
        </p>
      </PageHero>

      {brief.overviewKey && (
        <section aria-labelledby="overview-heading" className={SECTION}>
          <Heading id="overview-heading" title={b.overview} lede={t(brief.overviewKey)} />
        </section>
      )}

      {brief.eventKeys && brief.eventKeys.length > 0 && (
        <section aria-labelledby="events-heading" className={SECTION}>
          <Heading id="events-heading" title={b.events} />
          <Reveal y={24} className="pf-group mx-auto mt-10 max-w-3xl">
            {brief.eventKeys.map((key) => (
              <p key={key} className="flex gap-3 px-5 py-4 text-[15px] text-(--text-primary)">
                <PIcon name="calendar" size={16} className="mt-0.5 shrink-0 text-(--accent)" />
                {t(key)}
              </p>
            ))}
          </Reveal>
        </section>
      )}

      <section aria-labelledby="related-heading" className={SECTION}>
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
          <div>
            <h2 id="related-heading" className="text-[24px] font-semibold text-(--text-primary)">
              {b.instruments}
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {instruments.map((instrument) => (
                <li key={instrument.slug}>
                  <Link href={`/market/${instrument.category}/${instrument.slug}`} className="pf-tile inline-flex min-h-11 items-center gap-2 rounded-full! px-4 text-[14px] text-(--text-primary) hover:bg-(--surface-2)">
                    {t(instrument.nameKey)} <span className="font-mono text-(--text-secondary)">{instrument.displaySymbol}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Record
            title={b.sources}
            rows={[
              ...(brief.sources ?? []).map((source) => [b.sources, source.url ? <a key="u" href={source.url} className="text-(--accent) hover:underline">{source.name}</a> : source.name] as const),
              [b.updated, `${format.format(new Date(brief.updatedUtc ?? brief.publishedUtc))} UTC`],
            ]}
          />
        </div>
      </section>

      <ClosingBand id="brief-closing" title={marketCopy(edition).category.closingTitle} lede={marketCopy(edition).category.closingLede}>
        <PrimaryLink>{t("mk.nav.register")}</PrimaryLink>
        <Chevron href="/market/briefs">{b.back}</Chevron>
      </ClosingBand>
    </>
  );
}
