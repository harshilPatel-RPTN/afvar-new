"use client";

// W1.1.4 — markets covered: a master-detail mini terminal. Real quotes only
// (useLiveMarket); the left list selects, the right panel shows the full
// series with honest provenance. Replaces the old QuickLook modal.
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CRYPTO_NOTE, MARKETS_SUB, MARKET_GROUPS } from "../content";
import { AreaChart, BTN_OUTLINE, ChangePill, DOWN_TEXT, FlashPrice, GUTTER, Icon, LiveChip, PANEL, SectionHead, Spark, SymbolDisc, TerrainRidge, UP_TEXT, fade, rise, useOnce, usePauseOffscreen } from "./bits";
import { CandleCard, RollNumber } from "./marketMotion";
import { CandleSnake } from "./CandleSnake";
import { PriceSeam } from "./Sections";
import { fmtPrice, useLiveMarket } from "./useLiveMarket";
import { BearSwipe } from "./BearSwipe";
import { FxSymbol } from "./CurrencyText";
import { SessionClock } from "./SessionClock";
import { OilDrum } from "./OilDrum";
import { GoldBar } from "./GoldBar";
import { TugOfWar } from "./TugOfWar";
import { BitcoinCoin } from "./BitcoinCoin";

/** The three labelled lanes: content groups plus the crypto lane with its note. */
const GROUPS: { title: string; symbols: string[]; note: string }[] = [
  ...MARKET_GROUPS.map((group) => ({ title: group.title, symbols: [...group.symbols], note: group.note })),
  { title: "Crypto", symbols: ["BTC-USD"], note: CRYPTO_NOTE },
];

const ALL_SYMBOLS = GROUPS.flatMap((group) => group.symbols);

export function MarketsCovered() {
  const { quotes, updatedAt } = useLiveMarket();
  const [selected, setSelected] = useState("XAUUSD");
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const detailRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [listRef, listIn] = useOnce<HTMLDivElement>();
  const [detailInRef, detailIn] = useOnce<HTMLDivElement>();
  const pulseRef = usePauseOffscreen<HTMLSpanElement>();

  // "updated Xs ago" clock: a 5s interval stores Date.now() in state so the
  // provenance line keeps ticking (render itself stays pure).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, []);

  const select = (symbol: string) => {
    setSelected(symbol);
    // Mobile: the detail panel sits below the list — bring it into view.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      detailRef.current?.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    }
  };

  // Roving keyboard support: ArrowUp/Down moves focus across all rows (across
  // group boundaries); Enter/click on a row selects it.
  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const focusedSymbol = (event.target as HTMLElement).closest<HTMLElement>("[data-symbol]")?.dataset.symbol;
    const current = focusedSymbol ? ALL_SYMBOLS.indexOf(focusedSymbol) : ALL_SYMBOLS.indexOf(selected);
    if (current === -1) return;
    event.preventDefault();
    const count = ALL_SYMBOLS.length;
    const next = ALL_SYMBOLS[(current + (event.key === "ArrowDown" ? 1 : -1) + count) % count];
    rowRefs.current.get(next)?.focus();
  };

  const quote = quotes[selected] ?? quotes.XAUUSD;
  const up = quote.changePct >= 0;
  const low = Math.min(...quote.closes);
  const high = Math.max(...quote.closes);
  const ageSeconds = updatedAt === null ? null : now === null ? 0 : Math.max(0, Math.round((now - updatedAt) / 1000));

  return (
    <section id="markets" className="relative overflow-hidden">
      <CandleSnake from="left" />
      <TerrainRidge seed={23} />
      <div className={`${GUTTER} relative py-20 md:py-24`}>
      {/* Transition C: the same price-line language leads into the real market terminal. */}
      <PriceSeam />
      <SectionHead
        kicker="Markets"
        title="International markets. Covered deeply."
        currency
        tape
        sub={MARKETS_SUB}
        action={
          <Link href="/market" className={BTN_OUTLINE}>
            View all markets
            <Icon name="arrow" className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        }
      />

      <TugOfWar quotes={quotes} />

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,44fr)_minmax(0,56fr)] lg:items-start">
        {/* ── Master list: 8 real instruments in 3 labelled lanes ── */}
        <motion.div
          ref={listRef}
          data-inview={listIn || undefined}
          initial="hidden"
          animate={listIn ? "visible" : "hidden"}
        >
          <CandleCard index={0}>
          <div role="listbox" aria-label="Covered instruments" onKeyDown={onListKeyDown} className={`p-4 transition-colors duration-200 hover:border-white/[.2] ${PANEL}`}>
            {GROUPS.map((group, groupIndex) => (
              <div key={group.title} className={groupIndex > 0 ? "mt-4 border-t border-white/[.07] pt-4" : "relative"}>
                <motion.p variants={fade(reduceMotion, 0.1 + groupIndex * 0.12)} className="px-2 text-[11px] font-semibold uppercase tracking-[.14em] text-(--mk-faint)">
                  {group.title}
                </motion.p>
                <ul className="mt-1.5 space-y-0.5">
                  {group.symbols.map((symbol) => {
                    const rowQuote = quotes[symbol];
                    if (!rowQuote) return null;
                    const rowUp = rowQuote.changePct >= 0;
                    const isSelected = selected === symbol;
                    const order = ALL_SYMBOLS.indexOf(symbol);
                    return (
                      <motion.li key={symbol} variants={rise(reduceMotion, 0.14 + order * 0.05, 8)} className="relative">
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          data-symbol={symbol}
                          tabIndex={isSelected ? 0 : -1}
                          ref={(el) => {
                            if (el) rowRefs.current.set(symbol, el);
                            else rowRefs.current.delete(symbol);
                          }}
                          onClick={() => select(symbol)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-2.5 py-2.5 text-left transition-colors ${
                            isSelected ? "border-white/[.16] bg-[#171B1D]" : "border-transparent hover:bg-white/[.05]"
                          }`}
                        >
                          <SymbolDisc symbol={symbol} />
                          <span className="min-w-0 shrink">
                            <FxSymbol symbol={symbol} className="block text-[13.5px] font-semibold text-(--mk-text)" />
                            <span className="block text-[11px] text-(--mk-faint)">{rowQuote.name}</span>
                          </span>
                          <FlashPrice value={rowQuote.last} live={rowQuote.live} className="ml-auto shrink-0 whitespace-nowrap font-mono text-[13px] tabular-nums text-(--mk-text)">
                            <RollNumber value={fmtPrice(rowQuote.last, rowQuote.decimals)} />
                          </FlashPrice>
                          <span className="hidden shrink-0 min-[400px]:inline-flex"><Spark closes={rowQuote.closes.slice(-18)} up={rowUp} w={52} h={20} draw delay={0.3 + order * 0.05} /></span>
                          <ChangePill pct={rowQuote.changePct} />
                        </button>
                        {symbol === "XAUUSD" && <GoldBar />}
                        {symbol === "XAGUSD" && <GoldBar metal="silver" at={0.16} />}
                        {symbol === "BTC-USD" && <BitcoinCoin />}
                      </motion.li>
                    );
                  })}
                </ul>
                <motion.p variants={fade(reduceMotion, 0.3 + groupIndex * 0.12)} className="mt-2 px-2 text-[11px] leading-snug text-(--mk-faint)">
                  {group.note}
                </motion.p>
                {group.title === "Forex" && <SessionClock />}
                {group.title === "Commodities" && <OilDrum label={group.title} />}
              </div>
            ))}
          </div>
          </CandleCard>
        </motion.div>

        {/* ── Detail panel: full series, stats and provenance for the selection ── */}
        <motion.div
          ref={detailInRef}
          data-inview={detailIn || undefined}
          initial="hidden"
          animate={detailIn ? "visible" : "hidden"}
        >
          <CandleCard index={1} delay={0.08} spark={false} snakeTarget>
          <div ref={detailRef} className={`p-5 transition-colors duration-200 hover:border-white/[.2] sm:p-6 ${PANEL}`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selected}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <SymbolDisc symbol={selected} className="h-12 w-12" />
                  <div>
                    <p data-testid="market-detail-symbol" className="text-[18px] font-semibold text-(--mk-text)">{selected}</p>
                    <p className="text-[12px] text-(--mk-faint)">{quote.name}</p>
                  </div>
                  <span className="ml-auto">
                    <LiveChip live={quote.live} />
                  </span>
                </div>

                <BearSwipe>
                  <div className="mt-5 flex flex-wrap items-baseline gap-3">
                    <FlashPrice value={quote.last} live={quote.live} className="font-mono text-[34px] font-semibold tabular-nums tracking-[-.02em] text-(--mk-text) sm:text-[38px]">
                      {fmtPrice(quote.last, quote.decimals)}
                    </FlashPrice>
                    <ChangePill pct={quote.changePct} />
                  </div>
                </BearSwipe>

                <div className="mt-4 rounded-xl border border-(--mk-line) bg-(--afvar-charcoal) p-3">
                  <AreaChart closes={quote.closes} up={up} className="h-[260px] w-full" draw />
                  <div className="mt-1 flex justify-between px-1 font-mono text-[9.5px] text-(--mk-faint)" aria-hidden="true">
                    <span>series start</span>
                    <span>now</span>
                  </div>
                </div>

                <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
                  <div>
                    <dt className="text-[10.5px] uppercase tracking-[.12em] text-(--mk-faint)">range (shown series)</dt>
                    <dd className="mt-0.5 font-mono text-[13px] tabular-nums text-(--mk-text)">
                      {fmtPrice(low, quote.decimals)} – {fmtPrice(high, quote.decimals)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] uppercase tracking-[.12em] text-(--mk-faint)">change</dt>
                    <dd className={`mt-0.5 font-mono text-[13px] font-semibold tabular-nums ${up ? UP_TEXT : DOWN_TEXT}`}>
                      {up ? "+" : ""}{quote.changePct.toFixed(2)}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] uppercase tracking-[.12em] text-(--mk-faint)">series points</dt>
                    <dd className="mt-0.5 font-mono text-[13px] tabular-nums text-(--mk-text)">{quote.closes.length}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.07] pt-4">
                  <p className="flex items-center gap-2 text-[11.5px] text-(--mk-faint)">
                    <span
                      ref={pulseRef}
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${ageSeconds === null ? "bg-[#6D7578]" : "bg-[#00E676] motion-safe:animate-pulse"}`}
                    />
                    <span>
                    {ageSeconds === null
                      ? "Yahoo-proxy via the AFVAR data layer · futures delayed · snapshot — not updating"
                      : `Yahoo-proxy via the AFVAR data layer · futures delayed · updated ${ageSeconds}s ago`}
                    {" · not investment advice"}
                    </span>
                  </p>
                  <Link href="/platform/market-data" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-(--mk-text) underline-offset-4 hover:text-white hover:underline">
                    Open in the desk
                    <Icon name="arrow" className="h-3.5 w-3.5" strokeWidth={2} />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          </CandleCard>
        </motion.div>
      </div>
      </div>
    </section>
  );
}

export { LiveChip };
