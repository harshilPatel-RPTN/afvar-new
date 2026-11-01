import Link from "next/link";
import { SessionClock } from "@/modules/home/kit";
import { notFound } from "next/navigation";
import { translate } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";
import { marketCopy, type MarketCopy } from "../content";
import { CATEGORIES, findCategory, instrumentsIn, type Instrument } from "../data";
import { AppIcon, Chevron, ClosingBand, Empty, Heading, PageHero, PIcon, PrimaryLink, SECTION, Scene, Status, Tile, Tilt } from "./about/kit";
import { CategoryTabs, InstrumentFilter, type FilterableInstrument } from "./InstrumentFilter";
import { MARKET_ICON, MARKET_TONE } from "./MarketsOverview";
import { Breadcrumb, PriceSlot, type Translate } from "./ui";

/** Instrument card in the /about tile style: identity, reference facts and an explicit price slot. */
function InstrumentTile({ instrument, copy, t }: { instrument: Instrument; copy: MarketCopy; t: Translate }) {
  const name = t(instrument.nameKey);
  const facts = copy.instrument.facts[instrument.slug];
  return (
    <Tilt>
    <article aria-labelledby={`inst-${instrument.slug}`} className="group pf-tile relative flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`inst-${instrument.slug}`} className="text-[19px] font-semibold text-(--text-primary)">
            {name}
          </h3>
          <p className="mt-1 font-mono text-[13px] text-(--text-secondary)">{instrument.displaySymbol}</p>
        </div>
        <Status available={instrument.coverage === "available"}>{t(`mk.coverage.${instrument.coverage}`)}</Status>
      </div>
      {facts && (
        <dl className="mt-4 space-y-1.5 text-[13px]">
          <div className="flex gap-2">
            <dt className="shrink-0 text-(--text-tertiary)">{copy.instrument.labels.kind}</dt>
            <dd className="text-(--text-primary)">{facts.kind}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-(--text-tertiary)">{copy.instrument.labels.unit}</dt>
            <dd className="text-(--text-primary)">{facts.unit}</dd>
          </div>
        </dl>
      )}
      {instrument.noteKey && <p className="mt-3 text-[13px] leading-relaxed text-(--text-secondary)">{t(instrument.noteKey)}</p>}
      <div className="mt-5">
        <PriceSlot quote={instrument.quote} t={t} />
      </div>
      <Link href={`/market/${instrument.category}/${instrument.slug}`} className="mt-auto inline-flex min-h-11 items-center gap-0.5 self-start pt-5 text-[15px] text-(--accent) after:absolute after:inset-0 after:content-[''] group-hover:underline">
        {t("mk.cat.exploreInstrument", { name })}
        <PIcon name="chevron" size={13} weight="bold" />
      </Link>
    </article>
    </Tilt>
  );
}

/** W3.3.2 trading sessions (24h UTC bar) and W3.3.3 economic event types. */
function ForexSections({ copy }: { copy: MarketCopy }) {
  const { sessions, events } = copy.forex;
  const spans = (start: number, end: number) => (start < end ? [[start, end]] : [[start, 24], [0, end]]);
  return (
    <>
      <section aria-labelledby="sessions-heading" className={SECTION}>
        <Heading id="sessions-heading" title={sessions.title} lede={sessions.lede} />
        <div className="mx-auto mt-10 max-w-5xl">
          <Tile className="p-6 sm:p-8">
            <ul className="space-y-4">
              {sessions.list.map((session) => (
                <li key={session.name} className="grid grid-cols-[92px_1fr] items-center gap-4 sm:grid-cols-[120px_1fr_150px]">
                  <span className="text-[15px] font-semibold text-(--text-primary)">{session.name}</span>
                  <span aria-hidden="true" className="relative h-3 rounded-full bg-(--surface-2)">
                    {spans(session.start, session.end).map(([from, to]) => (
                      <span key={from} className="absolute inset-y-0 rounded-full bg-(--accent)/80" style={{ left: `${(from / 24) * 100}%`, width: `${((to - from) / 24) * 100}%` }} />
                    ))}
                  </span>
                  <span className="col-start-2 whitespace-nowrap font-mono text-[13px] text-(--text-secondary) sm:col-start-3 sm:text-right">{session.utc} UTC</span>
                </li>
              ))}
            </ul>
            <div aria-hidden="true" className="mt-3 grid grid-cols-[92px_1fr] gap-4 sm:grid-cols-[120px_1fr_150px]">
              <span />
              <span className="flex justify-between font-mono text-[11px] text-(--text-muted)">
                {["00", "06", "12", "18", "24"].map((hour) => (
                  <span key={hour}>{hour}</span>
                ))}
              </span>
            </div>
            <p className="mt-6 text-[14px] text-(--text-primary)">{sessions.overlap}</p>
            <p className="mt-1 text-[13px] text-(--text-secondary)">{sessions.note}</p>
            {/* "/" live session clock: which sessions are open right now. */}
            <div className="mt-6 border-t border-(--mac-hairline) pt-6">
              <SessionClock />
            </div>
          </Tile>
        </div>
      </section>

      <section aria-labelledby="events-heading" className={SECTION}>
        <Heading id="events-heading" title={events.title} lede={events.lede} />
        <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {events.list.map((event, index) => (
            <Tile key={event.name} delay={index * 0.05} className="flex flex-col p-6">
              <span className="grid size-10 place-items-center rounded-[11px] bg-(--accent-soft) text-(--accent)">
                <PIcon name="calendar" size={18} />
              </span>
              <h3 className="mt-4 text-[16px] font-semibold leading-snug text-(--text-primary)">{event.name}</h3>
              <p className="mt-2 text-[13px] text-(--accent)">{event.cadence}</p>
              <p className="mt-auto pt-3 text-[12.5px] leading-relaxed text-(--text-secondary)">{event.moves}</p>
            </Tile>
          ))}
        </div>
      </section>
    </>
  );
}

/** W3.4.2 context, W3.4.3 trust, W3.4.4 reserves, W3.4.5 withdrawal status. */
function CryptoSections({ copy }: { copy: MarketCopy }) {
  const { context, trust, reserves, withdrawals } = copy.crypto;
  const TRUST_ICONS = ["shield", "search", "flag", "info"] as const;
  return (
    <>
      <section aria-labelledby="context-heading" className={SECTION}>
        <Heading id="context-heading" title={context.title} lede={context.lede} />
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
          {context.facts.map((fact, index) => (
            <Tile key={fact.asset} delay={index * 0.08} className="p-7">
              <h3 className="text-[19px] font-semibold text-(--text-primary)">{fact.asset}</h3>
              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
                {fact.rows.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[12px] font-medium tracking-wide text-(--text-tertiary) uppercase">{label}</dt>
                    <dd className="mt-1 text-[17px] font-semibold text-(--text-primary)">{value}</dd>
                  </div>
                ))}
              </dl>
            </Tile>
          ))}
        </div>
      </section>

      <section aria-labelledby="trust-heading" className={SECTION}>
        <Heading id="trust-heading" title={trust.title} lede={trust.lede} />
        <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trust.list.map(([title, body], index) => (
            <Tile key={title} delay={index * 0.07} className="p-6">
              <AppIcon icon={TRUST_ICONS[index]} tone="purple" size={44} />
              <h3 className="mt-4 text-[17px] font-semibold text-(--text-primary)">{title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-(--text-secondary)">{body}</p>
            </Tile>
          ))}
        </div>
      </section>

      <section aria-labelledby="reserves-heading" className={SECTION}>
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-2">
          <Tile className="flex flex-col p-7">
            <AppIcon icon="wallet" tone="gold" size={48} />
            <h2 id="reserves-heading" className="mt-5 text-[24px] font-semibold text-(--text-primary)">
              {reserves.title}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-(--text-secondary)">{reserves.lede}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {reserves.points.map((point) => (
                <span key={point} className="inline-flex items-center gap-2 rounded-full bg-(--surface-2) px-3.5 py-2 text-[13px] text-(--text-primary)">
                  <PIcon name="check" size={14} className="text-(--accent)" />
                  {point}
                </span>
              ))}
            </div>
            <div className="mt-auto pt-6">
              <Empty>{reserves.empty}</Empty>
            </div>
          </Tile>
          <Tile className="flex flex-col p-7">
            <AppIcon icon="clock" tone="purple" size={48} />
            <h2 id="withdrawals-heading" className="mt-5 text-[24px] font-semibold text-(--text-primary)">
              {withdrawals.title}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-(--text-secondary)">{withdrawals.lede}</p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {withdrawals.fields.map((field) => (
                <div key={field} className="rounded-2xl bg-(--surface-2) px-3.5 py-3">
                  <p className="text-[11.5px] font-medium tracking-wide text-(--text-tertiary) uppercase">{field}</p>
                  <p className="mt-1 text-[13px] text-(--text-secondary)">{copy.status.noReport}</p>
                </div>
              ))}
            </div>
          </Tile>
        </div>
      </section>
    </>
  );
}

/** W3.2 / W3.3 / W3.4 — one template, market-specific sections in the middle. */
export async function MarketCategory({ categoryId }: { categoryId: string }) {
  const category = findCategory(categoryId);
  if (!category) notFound();
  const edition = await getServerEdition();
  const t: Translate = (key, vars) => translate(edition, key, vars);
  const copy = marketCopy(edition);
  const cc = copy.category;
  const title = t(category.titleKey);
  const [instrumentsTitle, instrumentsLede] = cc.instruments[category.id];
  const [sceneLabel, sceneCaption] = cc.scene[category.id];

  const items: FilterableInstrument[] = instrumentsIn(category.id).map((instrument) => ({
    slug: instrument.slug,
    name: t(instrument.nameKey),
    symbol: instrument.displaySymbol,
    coverage: instrument.coverage,
    card: <InstrumentTile instrument={instrument} copy={copy} t={t} />,
  }));

  return (
    <>
      <PageHero
        tone={MARKET_TONE[category.id]}
        top={<Breadcrumb items={[{ label: t("mk.cat.markets"), href: "/market" }, { label: title }]} t={t} />}
        eyebrow={`AFVAR · ${t("mk.cat.markets")}`}
        title={[title, cc.tagline[category.id]]}
        lede={t(category.blurbKey)}
      >
        <div className="flex justify-center">
          <CategoryTabs label={t("mk.cat.tabs")} activeId={category.id} tabs={CATEGORIES.map((item) => ({ id: item.id, label: t(item.titleKey), href: `/market/${item.id}` }))} />
        </div>
      </PageHero>
      <Scene kind={category.id} label={sceneLabel} caption={sceneCaption} hint={copy.hint} />

      {/* Confirmed instruments: W3.2.1–3 · W3.3.1 · W3.4.1 → W3.5 */}
      <section aria-labelledby="instruments-heading" className={SECTION}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col items-center gap-4 text-center">
            <AppIcon icon={MARKET_ICON[category.id].icon} tone={MARKET_ICON[category.id].tone} size={52} />
            <Heading id="instruments-heading" title={instrumentsTitle} lede={instrumentsLede} />
          </div>
          <InstrumentFilter items={items} />
        </div>
      </section>

      {category.id === "forex" && <ForexSections copy={copy} />}
      {category.id === "crypto" && <CryptoSections copy={copy} />}

      {/* Freshness & availability, then available analysis → W3.7 */}
      <section aria-labelledby="freshness-heading" className={SECTION}>
        <Heading id="freshness-heading" title={cc.freshness.title} lede={cc.freshness.lede} />
        <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cc.freshness.rows.map(([label, value], index) => (
            <Tile key={label} delay={index * 0.05} className="p-6">
              <p className="text-[12px] font-medium tracking-wide text-(--text-tertiary) uppercase">{label}</p>
              <p className="mt-2 text-[20px] font-semibold leading-snug text-(--text-primary)">{value}</p>
            </Tile>
          ))}
        </div>
      </section>

      <section aria-labelledby="analysis-heading" className={SECTION}>
        <div className="mx-auto max-w-4xl">
          <Tile className="flex flex-col items-start gap-5 p-8 sm:flex-row sm:items-center">
            <AppIcon icon="sparkle" tone={MARKET_ICON[category.id].tone} size={56} />
            <div className="flex-1">
              <h2 id="analysis-heading" className="text-[24px] font-semibold text-(--text-primary)">
                {cc.analysis.title}
              </h2>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-(--text-secondary)">{cc.analysis.empty}</p>
            </div>
            <Chevron href={`/market/briefs?market=${category.id}`} className="text-[15px]!">
              {cc.analysis.link}
            </Chevron>
          </Tile>
        </div>
      </section>

      <ClosingBand id="category-closing" title={cc.closingTitle} lede={cc.closingLede}>
        <PrimaryLink>{t("mk.nav.register")}</PrimaryLink>
        <Chevron href="/market">{cc.back}</Chevron>
        <Chevron href={`/market/briefs?market=${category.id}`}>{cc.briefs}</Chevron>
      </ClosingBand>
    </>
  );
}
