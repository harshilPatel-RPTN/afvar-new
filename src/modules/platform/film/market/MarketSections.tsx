"use client";

// Market Data & Charts after the hero: seven OS sections, all on real hourly
// candles from the feeds. The avatar speaks once (section 04).
// Desktop: windows fill the 1200×558 desktop (x 40–1160, y 10–~512) with ~20 px
// gutters; each window's height follows its content and charts take the rest.
import { useMemo } from "react";
import { Ask, AvatarLine, Chip, Note, OsSection, Pct, Row, Win } from "@/modules/afvarOs";
import { LANE_KEYS } from "@/modules/homeDemo/kit";
import { useLiveMarket, type HomeQuote } from "@/modules/home/kit";
import { ChartWin, Para, StatusChip, SYM, sourceLine, useQuote } from "../sections/shared";
import { asOfText, providerName } from "./analysis";

const fmt = (q: HomeQuote | undefined, v?: number) => (q ? (v ?? q.last).toLocaleString("en-US", { minimumFractionDigits: q.decimals, maximumFractionDigits: q.decimals }) : "—");

/** Range, trend and the biggest hourly move — computed from the candles on screen, nothing else. */
function useReading(q: HomeQuote | undefined, n = 44) {
  return useMemo(() => {
    const c = (q?.candles ?? []).slice(-n);
    if (c.length < 2) return null;
    const hi = Math.max(...c.map((k) => k.h));
    const lo = Math.min(...c.map((k) => k.l));
    const third = Math.max(1, Math.floor(c.length / 3));
    const a = c.slice(0, third).reduce((s, k) => s + k.c, 0) / third;
    const b = c.slice(-third).reduce((s, k) => s + k.c, 0) / third;
    const trend = b > a * 1.0015 ? "up" : b < a * 0.9985 ? "down" : "sideways";
    let big = 1;
    c.forEach((k, i) => {
      if (Math.abs((k.c - k.o) / k.o) > Math.abs((c[big].c - c[big].o) / c[big].o)) big = i;
    });
    const sma = (len: number) => (c.length >= len ? c.slice(-len).reduce((s, k) => s + k.c, 0) / len : null);
    return { c, hi, lo, trend, a, b, big, bigPct: ((c[big].c - c[big].o) / c[big].o) * 100, sma10: sma(10), sma20: sma(20), n: c.length };
  }, [q, n]);
}

export function MarketSections() {
  return (
    <>
      <Sources />
      <LiveCandles />
      <AskLevels />
      <Technical />
      <Watchlists />
      <Heatmap />
      <Insight />
    </>
  );
}

const FEEDS = [
  { name: "Spot metals", keys: ["XAUUSD", "XAGUSD"] },
  { name: "Futures", keys: ["WTI"] },
  { name: "Forex", keys: ["EURUSD", "USDJPY", "GBPUSD", "NZDUSD"] },
  { name: "Crypto", keys: ["BTC-USD"] },
] as const;

function WatchRows({ added = [], hot }: { added?: string[]; hot?: string }) {
  const { quotes } = useLiveMarket();
  return (
    <>
      {LANE_KEYS.map(([k]) => {
        const q = quotes[k];
        return (
          <Row
            key={k}
            gold={k === hot}
            k={
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <StatusChip q={q} /> {SYM[k]}
                {added.includes(k) ? <Chip tone="gold">added by AFVAR</Chip> : null}
              </span>
            }
            v={
              <span className="flex flex-wrap items-center justify-end gap-x-3">
                <span className="text-[#F2F5F2]">{fmt(q)}</span>
                {q ? <Pct v={q.changePct} /> : null}
              </span>
            }
          />
        );
      })}
    </>
  );
}

function Sources() {
  const { quotes } = useLiveMarket();
  const mix = LANE_KEYS.reduce((m, [k]) => ({ ...m, [quotes[k]?.status ?? "snapshot"]: (m[quotes[k]?.status ?? "snapshot"] ?? 0) + 1 }), {} as Record<string, number>);
  return (
    <OsSection n={2} label="Sources" title="Every quote arrives labelled." soft="Live, delayed or stored." body="Four public feeds, eight markets. The Market core reads each quote; the Verify core checks its label before it reaches you." app="Market data" active="charts">
      <Win at={0.06} x={40} y={20} w={580} h={228} title="Data sources" glyph="settings">
        {FEEDS.map((f) => {
          const q = quotes[f.keys[0]];
          return <Row key={f.name} k={f.name} v={<span className="flex items-center gap-2">{providerName(q, "stored")} <StatusChip q={q} /></span>} />;
        })}
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip tone="gold">Market core · reading</Chip>
          <Chip tone="gold">Verify core · checked</Chip>
        </div>
      </Win>
      <Win at={0.3} x={660} y={20} w={500} h={336} title="Watchlist" glyph="chart">
        <WatchRows hot="XAUUSD" />
      </Win>
      <Note at={0.55} x={40} y={268} w={580} title={`Gold ${fmt(quotes.XAUUSD)} · arrived`} sub={sourceLine(quotes.XAUUSD)} />
      <ChartWin k="XAUUSD" at={0.62} x={40} y={348} w={580} h={162} title="Gold · 1H · newest candles" last={44} head={false} />
      <Win at={0.7} x={660} y={376} w={500} h={134} title="Labels right now" glyph="settings">
        <Row k="Freshness" v={`${mix.live ?? 0} live · ${mix.delayed ?? 0} delayed · ${mix.snapshot ?? 0} stored`} />
        <Row k="Verify core" v="compares each label with its feed" gold />
      </Win>
    </OsSection>
  );
}

function LiveCandles() {
  const q = useQuote("XAUUSD");
  const r = useReading(q);
  return (
    <OsSection n={3} label="Live candles" title="Real candles, as they form." soft="Open, high, low, close." body="Hourly candles from the feed. Point at any candle to read it; the newest one stays dashed until its hour closes." app="Market data" active="charts">
      <ChartWin k="XAUUSD" at={0.06} x={40} y={10} w={800} h={500} cross={r ? r.n - 8 : undefined} />
      <Win at={0.3} x={870} y={10} w={290} h={232} title="Gold · quote" glyph="chart">
        <Row k="Last" v={fmt(q)} />
        <Row k="Today" v={q ? <Pct v={q.changePct} /> : "—"} />
        <Row k="Range shown" v={r ? `${fmt(q, r.lo)} – ${fmt(q, r.hi)}` : "—"} />
        <Row k="As of" v={q ? asOfText(q.asOf) : "—"} />
        <Row k="Timeframe" v="1H · hourly" gold />
      </Win>
      <Win at={0.5} x={870} y={262} w={290} h={248} title="Reading a candle" glyph="layouts">
        <Row k="Body" v="open to close" />
        <Row k="Wicks" v="high and low" />
        <Row k="Green · red" v="closed up · down" />
        <Row k="Dashed" v="hour still open" gold />
        <Row k="Point at one" v="read its OHLC" />
      </Win>
    </OsSection>
  );
}

function AskLevels() {
  const q = useQuote("XAUUSD");
  const r = useReading(q);
  return (
    <OsSection n={4} label="Ask for the levels" title="Ask for the levels." soft="Drawn in gold." body="Your own lines stay white. Anything AFVAR adds is gold, named, and built only from the candles on the chart." app="Market data" active="charts">
      <Ask at={0.04} x={40} y={6} w={1120} text="Mark the range and trend on Gold" />
      <ChartWin
        k="XAUUSD"
        at={0.1}
        x={40}
        y={62}
        w={760}
        h={450}
        drawFrom={[0.2, 0.36]}
        levels={r ? [{ v: r.hi, label: "AI high", tone: "gold" }, { v: r.lo, label: "AI low", tone: "gold" }] : []}
        trend={r ? [[0, r.a], [r.n - 1, r.b]] : undefined}
      />
      <Win at={0.38} x={830} y={62} w={330} h={264} title="Technical analysis · Gold 1H" glyph="chart" ai>
        <Row k="Range" v={r ? `${fmt(q, r.lo)} – ${fmt(q, r.hi)}` : "—"} />
        <Row k="Trend" v={r?.trend ?? "—"} />
        <Row k="Last" v={fmt(q)} />
        <Row k="Last in range" v={r && q ? (q.last >= (r.hi + r.lo) / 2 ? "upper half" : "lower half") : "—"} />
        <Row k="Built from" v={r ? `${r.n} hourly candles` : "—"} />
        <Row k="AI lines" v="gold · named" gold />
      </Win>
      <AvatarLine at={0.52} x={830} y={346} text="Range and trend come from the hourly candles on this chart." />
      <Note at={0.7} x={830} y={430} w={330} title="Drawn and checked" sub="3 lines · from the candles shown" />
    </OsSection>
  );
}

function Technical() {
  const q = useQuote("XAUUSD");
  const r = useReading(q);
  const below = (v: number | null | undefined) => (v == null || !q ? "—" : q.last < v ? "below" : "above");
  return (
    <OsSection n={5} label="Technical analysis" title="Indicators, in plain words." soft="Never a forecast." body="Ask for averages or momentum and AFVAR draws them, then says what they show — and how each one is built." app="Market data" active="charts">
      <Ask at={0.04} x={40} y={6} w={1120} text="Add the 10 and 20 hour averages" />
      <ChartWin k="XAUUSD" at={0.1} x={40} y={62} w={760} h={450} drawFrom={[0.2, 0.34]} averages={[{ len: 10, dash: true }, { len: 20 }]} />
      <Win at={0.38} x={830} y={62} w={330} h={218} title="Reading · Gold 1H" glyph="chart" ai>
        <Row k="Price vs 10-hour average" v={below(r?.sma10)} />
        <Row k="Price vs 20-hour average" v={below(r?.sma20)} />
        <Row k="Trend over the chart" v={r?.trend ?? "—"} />
        <div className="mt-3">
          <Para>This describes the chart. It is not a forecast and not advice.</Para>
        </div>
      </Win>
      <Win at={0.52} x={830} y={300} w={330} h={212} title="How each line is built" glyph="settings">
        <Row k="10-hour · dashed" v={r?.sma10 != null ? fmt(q, r.sma10) : "—"} />
        <Row k="20-hour · solid" v={r?.sma20 != null ? fmt(q, r.sma20) : "—"} gold />
        <Row k="Built from" v="mean of last 10 / 20 closes" />
        <Row k="Updates" v="as each hour closes" />
      </Win>
    </OsSection>
  );
}

function Watchlists() {
  return (
    <OsSection n={6} label="Watchlists" title="Your markets." soft="Grown by asking." body="Ask for a market and it joins the list, marked as added by AFVAR. Tap a row to open its candles." app="Market data" active="charts">
      <Ask at={0.04} x={40} y={6} w={1120} text="Add GBP/USD, NZD/USD and Bitcoin to my watchlist" />
      <Win at={0.12} x={40} y={62} w={460} h={346} title="Watchlist" glyph="chart">
        <WatchRows added={["GBPUSD", "NZDUSD", "BTC-USD"]} hot="BTC-USD" />
      </Win>
      <Note at={0.32} x={40} y={428} w={460} title="3 markets added by AFVAR" sub="GBP/USD · NZD/USD · Bitcoin · tap a row for its candles" />
      <ChartWin k="BTC-USD" at={0.45} x={530} y={62} w={630} h={450} />
    </OsSection>
  );
}

function Heatmap() {
  const { quotes } = useLiveMarket();
  const big = LANE_KEYS.map(([k]) => k).reduce((a, k) => (Math.abs(quotes[k]?.changePct ?? 0) > Math.abs(quotes[a]?.changePct ?? 0) ? k : a), "XAUUSD");
  const mix = LANE_KEYS.reduce((m, [k]) => ({ ...m, [quotes[k]?.status ?? "snapshot"]: (m[quotes[k]?.status ?? "snapshot"] ?? 0) + 1 }), {} as Record<string, number>);
  const ups = LANE_KEYS.filter(([k]) => (quotes[k]?.changePct ?? 0) >= 0).length;
  return (
    <OsSection n={7} label="Heatmap and overview" title="The whole market." soft="At a glance." body="Eight tiles, coloured by today's move. Freshness and breadth sit underneath, and the biggest move is named." app="Market data" active="charts">
      <Win at={0.06} x={40} y={10} w={680} h={270} title="Heatmap · today" glyph="layouts">
        <div className="grid grid-cols-4 gap-2">
          {LANE_KEYS.map(([k]) => {
            const c = quotes[k]?.changePct ?? 0;
            const a = Math.min(1, Math.abs(c) / 5);
            return (
              <div key={k} className="flex h-[100px] flex-col justify-between rounded-lg p-2.5 font-mono text-[11px] text-[#F2F5F2]" style={{ background: c >= 0 ? `rgba(0,230,118,${0.12 + 0.4 * a})` : `rgba(255,77,77,${0.12 + 0.4 * a})`, outline: k === big ? "1px solid #A8DEC2" : undefined }}>
                <span>{SYM[k]}</span>
                <span>{`${c >= 0 ? "+" : "−"}${Math.abs(c).toFixed(2)}%`}</span>
              </div>
            );
          })}
        </div>
      </Win>
      <Win at={0.3} x={40} y={300} w={680} h={210} title="Market overview" glyph="layouts">
        <Row k="Feeds" v={`${LANE_KEYS.length} markets · ${FEEDS.length} public feeds`} />
        <Row k="Freshness" v={`${mix.live ?? 0} live · ${mix.delayed ?? 0} delayed · ${mix.snapshot ?? 0} stored`} />
        <Row k="Breadth" v={`${ups} up · ${LANE_KEYS.length - ups} down`} />
        <Row gold k="Biggest move · AI" v={`${SYM[big]} ${(quotes[big]?.changePct ?? 0).toFixed(2)}%`} />
      </Win>
      <ChartWin k={big} at={0.5} x={750} y={10} w={410} h={500} />
    </OsSection>
  );
}

function Insight() {
  const q = useQuote("XAUUSD");
  const r = useReading(q);
  return (
    <OsSection n={8} label="Insight" title="One instrument, explained." soft="Each line with its source and time." body="Three lines on Gold, typed in one by one. Each shows where it came from; the Verify core checks all three." app="Market data" active="charts">
      <Win at={0.06} x={40} y={10} w={660} h={196} title="Gold · insight" glyph="research" ai>
        <Row k={<span>Price · {fmt(q)}, {q ? `${q.changePct >= 0 ? "up" : "down"} ${Math.abs(q.changePct).toFixed(2)}% today` : "—"}</span>} v={<StatusChip q={q} />} />
        <Row k={<span>Range · {r ? `${fmt(q, r.lo)} – ${fmt(q, r.hi)} over ${r.n} hourly candles` : "waiting for candles"}</span>} />
        <Row k={<span>Biggest hour · {r ? `${r.bigPct >= 0 ? "+" : "−"}${Math.abs(r.bigPct).toFixed(2)}%` : "—"}</span>} v="from the same candles" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Chip tone="sample">Sample · Verify core checks each line</Chip>
          <span className="font-mono text-[10.5px] text-[#B7C5BC]">information, not advice</span>
        </div>
      </Win>
      <ChartWin k="XAUUSD" at={0.22} x={40} y={226} w={660} h={284} title="Gold · 1H · biggest hour shaded" last={40} band={r ? [Math.max(0, r.big - (r.n - 40)), Math.max(0, r.big - (r.n - 40))] : undefined} />
      <Win at={0.36} x={730} y={10} w={430} h={164} title="Sources" glyph="settings">
        <Row k="Price" v={sourceLine(q)} />
        <Row k="Candles" v="Yahoo GC=F hourly, basis-adjusted" />
        <Row k="Range · biggest hour" v="worked out from the candles" />
      </Win>
      <Win at={0.5} x={730} y={194} w={430} h={234} title="Verify core · checks" glyph="settings" ai>
        <Row k="Price" v="compared with the latest quote" />
        <Row k="Range" v="compared with the candles shown" />
        <Row k="Biggest hour" v="compared with the candles shown" />
        <Row k="Advice" v="none · information only" gold />
        <div className="mt-2">
          <Chip tone="sample">Sample · how the check works</Chip>
        </div>
      </Win>
      <Note at={0.64} x={730} y={448} w={430} title="Each line is checked against its feed" sub="Sample · how the Verify core works" />
    </OsSection>
  );
}
