import { translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";
import type { IconTone, PlatformIcon } from "@/modules/platform";
import { marketCopy } from "../content";
import { BRIEFS, CATEGORIES, INSTRUMENTS, type CategoryId } from "../data";
import { AppIcon, Chevron, ClosingBand, CountUp, Heading, PageHero, PIcon, PrimaryLink, Reveal, SECTION, Scene, ScrollWords, Status, Tile } from "./about/kit";
import { InstrumentSwiper } from "./about/InstrumentSwiper";
import { LiveTug } from "./about/LiveTug";
import type { Translate } from "./ui";

/** Icon and tone per market, shared with the category pages. */
/** Hero silk tint per market. */
export const MARKET_TONE = { commodities: "gold", forex: "cyan", crypto: "violet" } as const;

export const MARKET_ICON: Record<CategoryId, { icon: PlatformIcon; tone: IconTone }> = {
  commodities: { icon: "layers", tone: "gold" },
  forex: { icon: "globe", tone: "cyan" },
  crypto: { icon: "link", tone: "purple" },
};

const FIELD_ICONS: PlatformIcon[] = ["link", "grid", "wallet", "clock", "gauge", "zap"];

/** W3.1 · Markets Overview, paced like /about: one idea per section (W3.1.1 – W3.1.5), cards instead of lists. */
export async function MarketsOverview() {
  const edition = await getServerEdition();
  const t: Translate = (key, vars) => translate(edition, key, vars);
  const copy = marketCopy(edition);
  const c = copy.overview;
  const available = INSTRUMENTS.filter((instrument) => instrument.coverage === "available").length;

  return (
    <>
      <PageHero eyebrow={c.eyebrow} title={c.title} lede={c.lede}>
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
          <PrimaryLink href="#markets">{c.choose}</PrimaryLink>
          <Chevron href="/platform/market-data">{c.charts}</Chevron>
        </div>
      </PageHero>
      <InstrumentSwiper
        label={t("mk.cat.instruments")}
        items={INSTRUMENTS.map((instrument) => ({
          href: `/market/${instrument.category}/${instrument.slug}`,
          symbol: instrument.displaySymbol,
          name: t(instrument.nameKey),
          market: t(CATEGORIES.find((category) => category.id === instrument.category)!.titleKey),
          status: t(`mk.coverage.${instrument.coverage}`),
          available: instrument.coverage === "available",
        }))}
      />

      <section aria-label={c.eyebrow} className={SECTION}>
        <ScrollWords text={c.purpose} className="pf-title mx-auto max-w-4xl text-center" />
      </section>

      {/* the three markets as one live model */}
      <section aria-labelledby="desk-heading" className={SECTION}>
        <Heading id="desk-heading" title={c.markets.title} lede={c.markets.lede} />
        <Scene kind="markets" label={c.scene[0]} caption={c.scene[1]} hint={copy.hint} />
      </section>

      {/* W3.1.1 — choose a market → W3.2 / W3.3 / W3.4 */}
      <section id="markets" aria-labelledby="markets-heading" className={`${SECTION} scroll-mt-24`}>
        <Heading id="markets-heading" title={c.markets.sub} />
        <div className="mx-auto mt-8 max-w-3xl">
          <LiveTug />
        </div>
        <div className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3">
          {CATEGORIES.map((category, index) => {
            const title = t(category.titleKey);
            return (
              <Tile key={category.id} delay={index * 0.07} className="flex flex-col p-7">
                <AppIcon icon={MARKET_ICON[category.id].icon} tone={MARKET_ICON[category.id].tone} size={52} />
                <h3 className="mt-5 text-[21px] font-semibold text-(--text-primary)">{title}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-(--text-secondary)">{t(category.blurbKey)}</p>
                <p className="mt-5 font-mono text-[12.5px] tracking-wide text-(--accent)">
                  {INSTRUMENTS.filter((instrument) => instrument.category === category.id)
                    .map((instrument) => instrument.displaySymbol)
                    .join("  ·  ")}
                </p>
                <Chevron href={`/market/${category.id}`} className="mt-auto pt-5 text-[15px]! after:absolute after:inset-0 after:z-10 after:content-['']">
                  {t("mk.showcase.explore", { market: title })}
                </Chevron>
              </Tile>
            );
          })}
        </div>
      </section>

      {/* W3.1.3 — sources, freshness & availability */}
      <section aria-labelledby="sources-heading" className={SECTION}>
        <Heading id="sources-heading" title={c.sources.title} lede={c.sources.lede} />
        <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.sources.fields.map(([label, body], index) => (
            <Tile key={label} delay={index * 0.05} className="p-6">
              <span className="grid size-10 place-items-center rounded-[11px] bg-(--accent-soft) text-(--accent)">
                <PIcon name={FIELD_ICONS[index]} size={18} />
              </span>
              <h3 className="mt-4 text-[17px] font-semibold text-(--text-primary)">{label}</h3>
              <p className="mt-1 text-[14px] leading-relaxed text-(--text-secondary)">{body}</p>
            </Tile>
          ))}
        </div>
        <Reveal delay={0.05} className="mx-auto mt-14 max-w-6xl">
          <p className="text-center text-[13px] font-semibold tracking-wide text-(--text-tertiary) uppercase">{c.sources.labelsTitle}</p>
        </Reveal>
        <div className="mx-auto mt-5 grid max-w-6xl gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {c.sources.labels.map(([label, body], index) => (
            <Tile key={label} delay={index * 0.05} className="rounded-[20px]! p-5 text-center">
              <p className="text-[15px] font-semibold text-(--accent)">{label}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-(--text-secondary)">{body}</p>
            </Tile>
          ))}
        </div>
      </section>

      {/* W3.1.2 confirmed instruments & coverage · W3.1.5 available / planned */}
      <section aria-labelledby="coverage-heading" className={SECTION}>
        <Heading id="coverage-heading" title={c.coverage.title} lede={c.coverage.lede} />
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
          {[
            { label: c.split.available, count: available, on: true },
            { label: c.split.planned, count: INSTRUMENTS.length - available, on: false },
          ].map((item, index) => (
            <Tile key={item.label[0]} delay={index * 0.07} className="p-8">
              <Status available={item.on}>{item.label[0]}</Status>
              <p className="mt-4 flex items-baseline gap-3">
                <CountUp value={item.count} className="text-[64px] font-semibold leading-none tracking-tight text-(--text-primary)" />
                <span className="text-[15px] text-(--text-tertiary)">{c.split.count}</span>
              </p>
              <p className="mt-4 text-[14px] leading-relaxed text-(--text-secondary)">{item.label[1]}</p>
            </Tile>
          ))}
        </div>
      </section>

      {/* W3.1.4 Market Briefs → W3.7 · chart capabilities → W2.2 */}
      <section aria-labelledby="more-heading" className={SECTION}>
        <h2 id="more-heading" className="sr-only">
          {c.briefs.title}
        </h2>
        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
          {[
            { icon: "news" as const, tone: "gold" as const, title: c.briefs.title, body: c.briefs.lede, note: BRIEFS.length === 0 ? c.briefs.empty : null, href: "/market/briefs", link: c.briefs.link },
            { icon: "chart" as const, tone: "cyan" as const, title: c.chartCaps[0], body: c.chartCaps[1], note: null, href: "/platform/market-data", link: c.chartLink },
          ].map((tile, index) => (
            <Tile key={tile.href} delay={index * 0.07} className="flex flex-col p-7">
              <AppIcon icon={tile.icon} tone={tile.tone} size={52} />
              <h3 className="mt-5 text-[21px] font-semibold text-(--text-primary)">{tile.title}</h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-(--text-secondary)">{tile.body}</p>
              {tile.note && <p className="mt-3 text-[13px] leading-relaxed text-(--text-tertiary)">{tile.note}</p>}
              <Chevron href={tile.href} className="mt-auto pt-5 text-[15px]! after:absolute after:inset-0 after:z-10 after:content-['']">
                {tile.link}
              </Chevron>
            </Tile>
          ))}
        </div>
      </section>

      <ClosingBand id="markets-closing" title={c.closing.title} lede={c.closing.lede}>
        <PrimaryLink>{t("mk.nav.register")}</PrimaryLink>
        <Chevron href="/market/briefs">{c.briefs.link}</Chevron>
      </ClosingBand>
    </>
  );
}
