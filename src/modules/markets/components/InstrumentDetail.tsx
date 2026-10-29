import Link from "next/link";
import { notFound } from "next/navigation";
import { translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";
import { marketCopy } from "../content";
import { CATEGORIES, findCategory, findInstrument, instrumentsIn } from "../data";
import { AppIcon, Chevron, ClosingBand, Empty, Heading, PageHero, PIcon, PrimaryLink, Reveal, SECTION, Scene, Status, Tile, Tilt } from "./about/kit";
import { MARKET_ICON, MARKET_TONE } from "./MarketsOverview";
import { Breadcrumb, PriceSlot, type Translate } from "./ui";
import "./instrument-body.css";

const EVIDENCE_HREF = "/resources/sources-evidence";

/** W3.5 · Instrument Detail template (W3.5.1 – W3.5.6), in the /about design language. */
export async function InstrumentDetail({ categoryId, slug }: { categoryId: string; slug: string }) {
  const instrument = findInstrument(categoryId, slug);
  const category = findCategory(categoryId);
  if (!instrument || !category) notFound();

  const edition = await getServerEdition();
  const t: Translate = (key, vars) => translate(edition, key, vars);
  const copy = marketCopy(edition);
  const ci = copy.instrument;
  const facts = ci.facts[instrument.slug];
  const name = t(instrument.nameKey);
  const categoryName = t(category.titleKey);
  const siblings = instrumentsIn(category.id).filter((item) => item.slug !== slug);
  const available = instrument.coverage === "available";

  return (
    <>
      <PageHero
        tone={MARKET_TONE[category.id]}
        top={<Breadcrumb t={t} items={[{ label: t("mk.cat.markets"), href: "/market" }, { label: categoryName, href: `/market/${category.id}` }, { label: name }]} />}
        eyebrow={categoryName}
        title={[name, instrument.displaySymbol]}
        lede={t("mk.instr.lede")}
      >
        <div className="flex flex-col items-center gap-6">
          <Status available={available}>{t(`mk.coverage.${instrument.coverage}`)}</Status>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            <PrimaryLink>{t("mk.nav.register")}</PrimaryLink>
            <Chevron href={EVIDENCE_HREF}>{ci.evidence.link}</Chevron>
          </div>
        </div>
      </PageHero>

      {/* W3.5.1 identity · W3.5.2 price & chart, if available */}
      <section aria-labelledby="price-heading" className={`${SECTION} pt-16!`}>
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <Tile className="p-6 sm:p-8">
            <h2 id="price-heading" className="text-[24px] font-semibold text-(--text-primary)">
              {t("mk.instr.price")}
            </h2>
            <div className="mt-5 max-w-xl">
              <PriceSlot quote={instrument.quote} t={t} />
            </div>
            {/* Value-free stage: faint grid, sweeping beam, pulsing rings. No axes, no data. */}
            <div className="relative isolate mt-6 grid h-[260px] place-items-center overflow-hidden rounded-2xl bg-(--surface-inset) sm:h-[320px]">
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
              <div aria-hidden="true" className="mk-insbody-beam absolute inset-y-0 left-0 -z-10 w-1/3 bg-linear-to-r from-transparent via-(--accent)/12 to-transparent" />
              <span aria-hidden="true" className="mk-insbody-ring absolute h-40 w-40 rounded-full border border-(--accent)/40" />
              <span aria-hidden="true" className="mk-insbody-ring mk-insbody-ring-late absolute h-40 w-40 rounded-full border border-(--accent)/40" />
              <p className="relative max-w-[42ch] px-6 text-center text-[14px] leading-relaxed text-(--text-secondary)">{t("mk.instr.chart.empty")}</p>
            </div>
          </Tile>
          <div className="grid grid-cols-2 gap-3">
            {[
              [t("mk.instr.market"), categoryName],
              [t("mk.instr.symbol"), instrument.displaySymbol],
              ...(facts ? [[ci.labels.kind, facts.kind], [ci.labels.unit, facts.unit], [ci.labels.hours, facts.hours]] : []),
              [ci.labels.venue, t("mk.instr.tbc")],
              [ci.labels.source, t("mk.instr.tbc")],
              [t("mk.instr.coverage"), t(`mk.coverage.${instrument.coverage}`)],
            ].map(([label, value], index) => (
              <Tile key={label} delay={index * 0.04} className={`rounded-[20px]! p-4 ${index === 3 ? "col-span-2" : ""}`}>
                <p className="text-[11.5px] font-medium tracking-wide text-(--text-tertiary) uppercase">{label}</p>
                <p className="mt-1 text-[14px] font-semibold leading-snug text-(--text-primary)">{value}</p>
              </Tile>
            ))}
            <p className="col-span-2 px-1 pt-1 text-[12.5px] leading-relaxed text-(--text-tertiary)">
              {instrument.noteKey ? `${t(instrument.noteKey)} ` : ""}
              {t("mk.instr.provenance")}
            </p>
          </div>
        </div>
      </section>

      <Scene kind={category.id} label={copy.category.scene[category.id][0]} caption={ci.scene} hint={copy.hint} />

      {/* W3.5.3 market context */}
      <section aria-labelledby="context-heading" className={SECTION}>
        <Heading id="context-heading" title={ci.context.title} lede={ci.context.lede} />
        {facts && (
          <Reveal y={24} className="mx-auto mt-10 max-w-3xl">
            <p className="mb-3 text-center text-[13px] font-medium text-(--text-tertiary)">{ci.context.drivers}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {facts.drivers.map((driver, index) => (
                <Tile key={driver} delay={index * 0.05} className="flex items-center gap-3.5 rounded-[20px]! px-5 py-5 text-[15px] font-medium text-(--text-primary)">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-(--accent-soft) text-(--accent)">
                    <PIcon name="trend" size={16} />
                  </span>
                  {driver}
                </Tile>
              ))}
            </div>
            <div className="mt-4">
              <Empty>{ci.context.live}</Empty>
            </div>
          </Reveal>
        )}
      </section>

      {/* W3.5.4 analysis & evidence → W5.4 · W3.5.5 related brief → W3.6 */}
      <section aria-labelledby="evidence-heading" className={SECTION}>
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          {[
            { id: "evidence-heading", icon: "scale" as const, ...ci.evidence, empty: t("mk.instr.analysis.empty"), href: EVIDENCE_HREF },
            { id: "related-heading", icon: "news" as const, ...ci.related, empty: t("mk.instr.briefs.empty"), href: `/market/briefs?market=${category.id}` },
          ].map((block, index) => (
            <Tile key={block.id} delay={index * 0.07} className="flex flex-col p-7">
                <AppIcon icon={block.icon} tone={MARKET_ICON[category.id].tone} size={44} />
                <h2 id={block.id} className="mt-4 text-[21px] font-semibold text-(--text-primary)">
                  {block.title}
                </h2>
                <p className="mt-1.5 text-[14px] leading-relaxed text-(--text-secondary)">{block.lede}</p>
                <div className="mt-auto pt-5">
                  <Empty>{block.empty}</Empty>
                  <Chevron href={block.href} className="mt-2">
                    {block.link}
                  </Chevron>
                </div>
            </Tile>
          ))}
        </div>
      </section>

      {/* Siblings and the other markets */}
      <section aria-labelledby="more-heading" className={SECTION}>
        <div className="mx-auto max-w-6xl">
          {siblings.length > 0 && (
            <>
              <h2 id="more-heading" className="text-[24px] font-semibold text-(--text-primary)">
                {ci.siblings}
              </h2>
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {siblings.map((item) => (
                  <li key={item.slug}>
                    <Tilt>
                    <Link href={`/market/${category.id}/${item.slug}`} className="pf-tile group flex h-full min-h-[104px] flex-col justify-between rounded-[20px]! p-5">
                      <span>
                        <span className="block text-[15px] font-semibold text-(--text-primary)">{t(item.nameKey)}</span>
                        <span className="mt-1 block font-mono text-[12.5px] text-(--text-secondary)">{item.displaySymbol}</span>
                      </span>
                      <PIcon name="chevron" size={14} weight="bold" className="mt-3 text-(--accent) transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    </Tilt>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h2 className="mt-14 text-[24px] font-semibold text-(--text-primary)">{ci.others}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {CATEGORIES.filter((item) => item.id !== category.id).map((item) => (
              <li key={item.id}>
                <Tilt>
                <Link href={`/market/${item.id}`} className="pf-tile group flex h-full items-center gap-4 p-5">
                  <AppIcon icon={MARKET_ICON[item.id].icon} tone={MARKET_ICON[item.id].tone} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold text-(--text-primary)">{t(item.titleKey)}</span>
                    <span className="mt-0.5 block text-[13px] text-(--text-secondary)">{t(item.blurbKey)}</span>
                  </span>
                  <PIcon name="chevron" size={14} weight="bold" className="text-(--accent) transition-transform group-hover:translate-x-0.5" />
                </Link>
                </Tilt>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* W3.5.6 Register Now → W9.2 */}
      <ClosingBand id="instrument-closing" title={copy.category.closingTitle} lede={copy.category.closingLede}>
        <PrimaryLink>{t("mk.nav.register")}</PrimaryLink>
        <Chevron href={`/market/${category.id}`}>{categoryName}</Chevron>
      </ClosingBand>
    </>
  );
}
