"use client";

// The Markets family after its heroes: overview, one market group, one
// instrument and the briefs index — six OS sections each, the avatar once.
//
// Desktop layout: windows fill the 1200×558 desktop (x 40–1160, y 10–~515) with
// ~20 px gutters; a window's `h` follows its content (title bar 30 + padding 28,
// a Row ≈ 34, a Para line ≈ 22), and charts take whatever height is left.
import { useMemo } from "react";
import { Ask, AvatarLine, Chip, Note, OsSection, Pct, Row, Win } from "@/modules/afvarOs";
import { useLiveMarket } from "@/modules/home/kit";
import { asOfText } from "../market/analysis";
import { GROUP, GROUP_IDS, INST, type GroupId, type InstInfo } from "./marketMap";
import { ChartWin, Para, StatusChip, fmt, sourceLine, useQuote, useRange } from "./shared";

/** Window chrome + padding (title bar 30, p-3.5 top and bottom, a little slack). */
const CHROME = 64;
/** One `Row`. */
const ROW = 34;
/** Bottom edge of the usable desktop (the dock sits below 558). */
const FLOOR = 510;

/** One row per instrument: change over the last 44 hourly candles, or why there is none. */
function MoveRow({ slug, gold = false }: { slug: string; gold?: boolean }) {
  const i = INST[slug];
  const r = useRange(i.key ?? "", 44);
  return <Row k={`${i.name} · ${i.sym}`} v={!i.key ? <span className="text-[#92A399]">not in preview feed</span> : r ? <Pct v={r.chg} /> : <span className="text-[#92A399]">—</span>} gold={gold} />;
}

/** A chart of the instrument's real candles, or an honest note when the feed lacks it. */
function InstChart(props: { i: InstInfo; at?: number; x: number; y: number; w: number; h: number; title?: string } & Partial<Parameters<typeof ChartWin>[0]>) {
  const { i, ...rest } = props;
  if (!i.key)
    return (
      <Win at={rest.at} x={rest.x} y={rest.y} w={rest.w} h={rest.h} title={`Market data · ${i.name} · 1H`} glyph="chart">
        <Para>Candles for {i.name} are not in the preview feed yet. They appear here once a licensed source is connected.</Para>
        <div className="mt-3">
          <Chip tone="stale">No source yet</Chip>
        </div>
      </Win>
    );
  return <ChartWin k={i.key} {...rest} />;
}

/** A small mono heading inside a window. */
function Label({ children, first = false }: { children: string; first?: boolean }) {
  return <p className={`${first ? "" : "mt-3"} mb-1 font-mono text-[10.5px] tracking-[0.1em] text-[#92A399]`}>{children}</p>;
}

/* ---------------------------------------------------------- Markets overview */

const MOVERS = ["gold", "silver", "oil", "eurusd", "usdjpy", "gbpusd", "nzdusd", "btc"];

/** Instruments sorted by the size of their move over the last 44 hourly candles (feed-less ones last). */
function useMoves(slugs: readonly string[]) {
  const { quotes } = useLiveMarket();
  return useMemo(
    () =>
      slugs
        .map((s) => {
          const c = (quotes[INST[s].key ?? ""]?.candles ?? []).slice(-44);
          return { s, chg: c.length >= 2 ? ((c[c.length - 1].c - c[0].o) / c[0].o) * 100 : null };
        })
        .sort((a, b) => (a.chg == null ? 1 : 0) - (b.chg == null ? 1 : 0) || Math.abs(b.chg ?? 0) - Math.abs(a.chg ?? 0)),
    [quotes, slugs],
  );
}

function BiggestMoves() {
  const moves = useMoves(MOVERS);
  const top = INST[moves.find((m) => m.chg != null)?.s ?? "gold"];
  return (
    <>
      <Win at={0.14} x={40} y={74} w={620} h={CHROME + MOVERS.length * ROW + 28} title="Biggest moves · 44 hourly candles" glyph="chart" ai>
        {moves.map((m, n) => (
          <MoveRow key={m.s} slug={m.s} gold={n === 0 && m.chg != null} />
        ))}
        <p className="mt-3 font-mono text-[10.5px] text-[#92A399]">Largest first · change from the first to the last of 44 hourly candles</p>
      </Win>
      <ChartWin k={top.key ?? "XAUUSD"} at={0.44} x={690} y={92} w={470} h={196} title={`Biggest move · ${top.name} · 1H`} last={44} />
    </>
  );
}

export function MarketsSections() {
  const moversH = CHROME + MOVERS.length * ROW + 28;
  return (
    <>
      <OsSection n={2} label="Three markets" title="Three markets, ten instruments." soft="Grouped the way you trade them." body="Metals and energy, the major currency pairs, and crypto. Each group opens to its own page." app="Market data" active="charts">
        {GROUP_IDS.map((g, n) => {
          const items = GROUP[g].items;
          const c = GROUP_COPY[g];
          return (
            <Win key={g} at={0.06 + n * 0.16} x={40 + n * 380} y={20} w={360} h={390} title={GROUP[g].name} glyph={n === 2 ? "phone" : "chart"}>
              <Label first>{GROUP[g].short.toUpperCase()}</Label>
              {items.map((s) => (
                <MoveRow key={s} slug={s} />
              ))}
              {c.hours.map(([k, v]) => (
                <Row key={k} k={k} v={v} />
              ))}
              <Label>WHAT MOVES IT</Label>
              {c.drivers.slice(0, Math.min(4, 8 - items.length - c.hours.length)).map(([k, v]) => (
                <Row key={k} k={k} v={v} />
              ))}
            </Win>
          );
        })}
        <Note at={0.66} x={40} y={430} w={1120} title="Change over the last 44 hourly candles" sub="Worked out from the feed · not a forecast" />
      </OsSection>

      <OsSection n={3} label="Live board" title="One chart from each group." soft="Real hourly candles." body="Gold, the euro and Bitcoin side by side — each with its source, its status and the time of its last price." app="Market data" active="charts">
        <ChartWin k="XAUUSD" at={0.06} x={40} y={20} w={370} h={490} last={36} />
        <ChartWin k="EURUSD" at={0.22} x={425} y={20} w={370} h={490} last={36} />
        <ChartWin k="BTC-USD" at={0.38} x={810} y={20} w={350} h={490} last={36} />
      </OsSection>

      <OsSection n={4} label="Trading hours" title="When each market is open." soft="In India time." body="Currencies follow the sessions from Sydney to New York, metals and oil trade most of the week, and crypto never closes." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={620} h={226} title="Sessions · IST · winter" glyph="calendar">
          <Row k="Sydney" v="02:30 – 11:30" />
          <Row k="Tokyo" v="05:30 – 14:30" />
          <Row k="London" v="13:30 – 22:30" gold />
          <Row k="New York" v="18:30 – 03:30" gold />
          <p className="mt-3 text-[12px] text-[#B7C5BC]">London and New York overlap from 18:30 to 22:30 — usually the busiest hours.</p>
        </Win>
        <Win at={0.22} x={40} y={266} w={620} h={232} title="Open by market" glyph="chart">
          <OpenRow k="Gold and Silver" v="most of the week · short daily break" q="XAUUSD" />
          <OpenRow k="Crude oil" v="most of the week · short daily break" q="WTI" />
          <OpenRow k="Forex pairs" v="24 hours · Monday to Friday" q="EURUSD" />
          <OpenRow k="Bitcoin" v="24 hours · 7 days" q="BTC-USD" gold />
          <p className="mt-3 text-[12px] text-[#B7C5BC]">At the weekend only crypto trades; the others reopen on Monday morning in Asia.</p>
        </Win>
        <Win at={0.38} x={690} y={20} w={470} h={184} title="Crypto" glyph="phone">
          <Para>Open 24 hours, 7 days. Weekend moves can be large with fewer traders.</Para>
          <div className="mt-2">
            <CryptoRows />
          </div>
        </Win>
        <Win at={0.5} x={690} y={220} w={470} h={196} title="Clock changes" glyph="calendar">
          <Para>Summer: London and New York open an hour earlier in IST.</Para>
          <div className="mt-2">
            <Row k="Europe" v="last Sunday of March and October" />
            <Row k="United States" v="second Sun of March, first of November" />
            <Row k="India" v="no clock change" gold />
          </div>
        </Win>
        <Note at={0.64} x={690} y={438} w={470} title="Times move by an hour when clocks change" sub="Europe and the US change on different dates" />
      </OsSection>

      <OsSection n={5} label="Biggest moves" title="What moved most?" soft="Sorted, with reasons." body="Ask across every market at once. The list comes from the candles; the reasons come with sources." app="Market data" active="charts">
        <Ask at={0.04} x={40} y={10} w={620} text="Which markets moved most in the last two days?" />
        <BiggestMoves />
        <Note at={0.34} x={40} y={74 + moversH + 20} w={620} title="Moves come from the candles" sub="Reasons come with sources · not a forecast" />
        <AvatarLine at={0.3} x={830} y={14} text="These come straight from the candles. Ask me why any of them moved." />
        <Win at={0.62} x={690} y={306} w={470} h={212} title="Read it this way" glyph="research">
          <Para>A big move on a quiet day and one after a data release are different stories.</Para>
          <div className="mt-2">
            <Row k="1 · Scheduled release?" v="check the calendar" />
            <Row k="2 · Bigger than usual?" v="compare the hourly range" />
            <Row k="3 · Did neighbours move?" v="same driver, or its own" />
          </div>
        </Win>
      </OsSection>

      <OsSection n={6} label="Connections" title="Markets lean on each other." soft="The dollar sits in the middle." body="Gold and the euro are both priced against the dollar, so a dollar move often shows up in both." app="Market data" active="charts">
        <ChartWin k="EURUSD" at={0.06} x={40} y={20} w={560} h={490} title="EUR/USD · 1H" last={44} />
        <ChartWin k="XAUUSD" at={0.22} x={620} y={20} w={540} h={360} title="Gold · 1H" last={44} head={false} />
        <Win at={0.48} x={620} y={400} w={540} h={110} title="How to read the pair" glyph="research" ai>
          <Para>When both rise together, the dollar is usually the reason. When they split, look for a cause of their own.</Para>
        </Win>
      </OsSection>

      <OsSection n={7} label="Coverage" title="What the preview carries." soft="And what it does not yet." body="Eight instruments have candles in this preview. Two are listed but wait for a licensed source." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={620} h={490} title="Coverage status" glyph="settings">
          {GROUP_IDS.map((g, n) => (
            <div key={g}>
              <Label first={n === 0}>{GROUP[g].name.toUpperCase()}</Label>
              {GROUP[g].items.map((s) => {
                const i = INST[s];
                return <Row key={s} k={`${i.name} · ${i.sym}`} v={i.key ? <Chip tone="live">In preview feed</Chip> : <Chip tone="stale">No source yet</Chip>} />;
              })}
            </div>
          ))}
        </Win>
        <Win at={0.24} x={690} y={20} w={470} h={196} title="Feeds behind the preview" glyph="chart">
          <FeedRow k="Spot metals" q="XAUUSD" />
          <FeedRow k="Futures · crude oil" q="WTI" />
          <FeedRow k="Forex" q="EURUSD" />
          <FeedRow k="Crypto" q="BTC-USD" />
        </Win>
        <Win at={0.4} x={690} y={236} w={470} h={200} title="Waiting for a source" glyph="settings">
          <Para>Listed, but no licensed feed yet. Until one is connected their rows show a dash, never a guess.</Para>
          <div className="mt-2">
            {Object.values(INST)
              .filter((i) => !i.key)
              .map((i) => (
                <Row key={i.slug} k={`${i.name} · ${i.sym}`} v="no candles yet" />
              ))}
          </div>
        </Win>
        <Note at={0.56} x={690} y={456} w={470} title="Gaps are shown, never filled" sub="A missing price stays missing" />
      </OsSection>
    </>
  );
}

/** A market's usual hours, with the live status of its feed. */
function OpenRow({ k, v, q, gold = false }: { k: string; v: string; q: string; gold?: boolean }) {
  const quote = useQuote(q);
  return (
    <Row
      k={k}
      gold={gold}
      v={
        <span className="flex items-center gap-2">
          {v} <StatusChip q={quote} />
        </span>
      }
    />
  );
}

/** Bitcoin's hours with the real status and time of its latest quote. */
function CryptoRows() {
  const q = useQuote("BTC-USD");
  return (
    <>
      <OpenRow k="Bitcoin" v="24 / 7" q="BTC-USD" gold />
      <Row k="Weekends" v="thinner trading" />
      <Row k="Last quote" v={q ? asOfText(q.asOf) : "—"} />
    </>
  );
}

/** One feed: its provider and the status of its latest quote. */
function FeedRow({ k, q }: { k: string; q: string }) {
  const quote = useQuote(q);
  return (
    <Row
      k={k}
      v={
        <span className="flex items-center gap-2">
          {quote?.source ?? "stored"} <StatusChip q={quote} />
        </span>
      }
    />
  );
}

/* ------------------------------------------------------------- Market group */

const GROUP_COPY: Record<GroupId, { drivers: [string, string][]; events: [string, string][]; hours: [string, string][]; ask: string; /** Instrument the question is about (default: the group lead). */ askOn?: string; answer: string; avatar: string }> = {
  commodities: {
    drivers: [
      ["The US dollar", "metals are priced in it"],
      ["Interest rates", "the cost of holding metal"],
      ["Supply news", "output, stocks, shipping"],
      ["Central bank buying", "steady demand for Gold"],
    ],
    events: [
      ["US CPI", "inflation · moves the dollar"],
      ["Oil inventories", "weekly · moves crude"],
      ["FOMC decision", "rates · moves everything here"],
    ],
    hours: [["Open", "most of the week"]],
    ask: "Why are Gold and Silver moving together?",
    answer: "Both are priced in dollars, and the dollar moved first. Silver tends to swing further because its market is smaller.",
    avatar: "Metals and oil share one driver more than any other: the dollar.",
  },
  forex: {
    drivers: [
      ["Rate differences", "between the two central banks"],
      ["Economic data", "jobs, inflation, growth"],
      ["Sessions", "London and New York carry most volume"],
      ["Risk mood", "the yen often firms when markets worry"],
    ],
    events: [
      ["US payrolls", "jobs · moves every dollar pair"],
      ["ECB decision", "rates · moves EUR/USD"],
      ["BoJ decision", "rates · moves USD/JPY"],
    ],
    hours: [["Open", "24 hours · Monday to Friday"]],
    ask: "Why did USD/JPY fall this morning?",
    askOn: "usdjpy",
    answer: "US yields eased overnight, which narrows the gap with Japan. Sources are linked on each line.",
    avatar: "A currency pair is two economies in one price. I keep both in view.",
  },
  crypto: {
    drivers: [
      ["Flows", "money into and out of funds"],
      ["Liquidity", "thin weekends move further"],
      ["Exchange trust", "reserves and withdrawals"],
      ["The dollar and rates", "less than metals, but present"],
    ],
    events: [
      ["US CPI", "inflation · moves risk assets"],
      ["FOMC decision", "rates · moves risk assets"],
      ["Weekend", "fewer traders, larger gaps"],
    ],
    hours: [
      ["Open", "24 hours · 7 days"],
      ["Weekends", "thinner trading"],
    ],
    ask: "Is this Bitcoin move happening on thin volume?",
    answer: "It started late on Saturday, when volume is usually lowest. Treat the size of the move with care.",
    avatar: "Crypto never closes, so I watch the quiet hours too.",
  },
};

export function GroupSections({ group }: { group: GroupId }) {
  const g = GROUP[group];
  const c = GROUP_COPY[group];
  const lead = INST[g.items[0]];
  const asked = INST[c.askOn ?? g.items[0]];
  const watchH = CHROME + g.items.length * ROW;
  // Compare: one chart per instrument with candles (up to three), side by side under the table.
  const keyed = g.items.filter((s) => INST[s].key).slice(0, g.items.length > 3 ? 2 : 3);
  const rangesH = CHROME + 16 + g.items.length * 37 + 16;
  const chartY = 20 + rangesH + 20;
  const chartW = Math.floor((1120 - (keyed.length - 1) * 20) / Math.max(1, keyed.length));
  return (
    <>
      <OsSection n={2} label="Instruments" title={`${g.items.length} instruments in ${g.name}.`} soft="Prices with their source." body="Each row shows the change over the last 44 hourly candles and opens the instrument’s own page." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={560} h={watchH} title={`${g.name} · watchlist`} glyph="chart">
          {g.items.map((s, n) => (
            <MoveRow key={s} slug={s} gold={n === 0} />
          ))}
        </Win>
        <InstChart i={lead} at={0.34} x={40} y={20 + watchH + 20} w={560} h={FLOOR - (20 + watchH + 20)} last={44} />
        <PriceCard i={lead} at={0.2} />
        <Win at={0.46} x={630} y={290} w={530} h={160} title={`${g.name} · at a glance`} glyph="layouts">
          <Row k="Trades" v={c.hours[0][1]} />
          <Row k="In the preview feed" v={`${g.items.filter((s) => INST[s].key).length} of ${g.items.length} instruments`} />
          <Row k="Checked first" v={c.drivers[0][0].toLowerCase()} gold />
        </Win>
        <Note at={0.62} x={630} y={468} w={530} title="Open any row for its own page" sub="Chart · levels · events · alerts" />
      </OsSection>

      <OsSection n={3} label="Lead chart" title={`${lead.name}, hour by hour.`} soft="With its 20-hour average." body="The group’s lead instrument on real hourly candles, the average drawn in as you scroll." app="Market data" active="charts">
        <InstChart i={lead} at={0.06} x={40} y={20} w={760} h={490} averages={[{ len: 20 }]} drawFrom={[0.25, 0.45]} />
        <Win at={0.4} x={830} y={20} w={330} h={230} title="Read-out" glyph="research" ai>
          <RangeRows i={lead} extra="vsAvg" />
        </Win>
        <Win at={0.52} x={830} y={270} w={330} h={160} title="How these are worked out" glyph="settings">
          <Para>By code, from the feed.</Para>
          <div className="mt-2">
            <Row k="High / low" v="of 44 hourly candles" />
            <Row k="20-hour average" v="mean of 20 closes" gold />
          </div>
        </Win>
        <Note at={0.66} x={830} y={450} w={330} title="Drawn from the candles" sub="Not a forecast" />
      </OsSection>

      <OsSection n={4} label="What moves it" title={`What moves ${g.name.toLowerCase()}.`} soft="The usual suspects." body="The forces that most often explain a move in this group, in the order AFVAR checks them." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={600} h={210} title="Drivers" glyph="research" ai>
          {c.drivers.map(([k, val], n) => (
            <Row key={k} k={k} v={val} gold={n === 0} />
          ))}
        </Win>
        <Win at={0.26} x={670} y={20} w={490} h={210} title="Checked in this order" glyph="layouts">
          {c.drivers.map(([k], n) => (
            <p key={k} className="border-b border-[rgba(255,255,255,0.06)] py-2 text-[13px] text-[#F2F5F2] last:border-b-0">
              <span className="mr-2 font-mono text-[#A8DEC2]">{n + 1}</span>
              {k}
            </p>
          ))}
        </Win>
        <InstChart i={lead} at={0.44} x={40} y={250} w={1120} h={260} title={`Market data · ${lead.name} · 1H · the moves these explain`} last={44} />
      </OsSection>

      <OsSection n={5} label="Ask about it" title="Ask about the group." soft="Answered with sources." body="Questions across instruments get one answer that names every source it used." app="Research" active="research">
        <Ask at={0.04} x={40} y={10} w={1120} text={c.ask} />
        <InstChart i={asked} at={0.12} x={40} y={74} w={640} h={436} band={[30, 36]} />
        <AnswerWins i={asked} answer={c.answer} avatar={c.avatar} />
      </OsSection>

      <OsSection n={6} label="Events" title="Dates that matter here." soft="Times in IST." body="The scheduled releases that most often move this group, with a reminder you can set for each." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={620} h={196} title={`Calendar · ${g.name} · sample week`} glyph="calendar">
          {c.events.map(([k, val], n) => (
            <Row key={k} k={k} v={val} gold={n === 0} />
          ))}
          <div className="mt-3">
            <Chip tone="sample">Sample week</Chip>
          </div>
        </Win>
        <InstChart i={lead} at={0.3} x={40} y={236} w={620} h={274} last={44} />
        <Note at={0.36} x={690} y={20} w={470} title="Reminder set · 15 minutes before" sub={`${c.events[0][0]} · ${g.name}`} />
        <Win at={0.48} x={690} y={100} w={470} h={180} title="Before an event" glyph="alerts">
          <Para>Spreads can widen and prices can jump. A reminder gives you time to decide what to do first.</Para>
          <div className="mt-2">
            <Row k="Reminder" v="15 minutes before" gold />
            <Row k="Then" v="the release, live" />
          </div>
        </Win>
        <RemindersWin events={c.events} at={0.6} x={690} y={300} w={470} h={200} />
      </OsSection>

      <OsSection n={7} label="Compare" title="Side by side." soft="Highs, lows and where price sits." body="The range of each instrument over the last 44 hourly candles, and where the last price sits inside it." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={1120} h={rangesH} title={`${g.name} · ranges`} glyph="chart">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr] font-mono text-[10.5px] tracking-[0.08em] text-[#92A399]">
            <span>INSTRUMENT</span>
            <span>LOW</span>
            <span>HIGH</span>
            <span>LAST</span>
            <span>POSITION IN RANGE</span>
          </div>
          {g.items.map((s) => (
            <RangeLine key={s} i={INST[s]} />
          ))}
          <p className="mt-3 font-mono text-[10.5px] text-[#92A399]">Worked out from the feed’s hourly candles · instruments without a source show a dash</p>
        </Win>
        {keyed.map((s, n) => (
          <InstChart key={s} i={INST[s]} at={0.3 + n * 0.12} x={40 + n * (chartW + 20)} y={chartY} w={chartW} h={FLOOR - chartY} last={keyed.length > 1 ? 36 : 44} />
        ))}
      </OsSection>
    </>
  );
}

function PriceCard({ i, at }: { i: InstInfo; at: number }) {
  const q = useQuote(i.key ?? "");
  const r = useRange(i.key ?? "");
  return (
    <Win at={at} x={630} y={20} w={530} h={250} title={`${i.name} · last price`} glyph="chart">
      <p className="font-mono text-[34px] font-semibold leading-tight text-[#F2F5F2]">{q?.last != null ? fmt(q.last, q.decimals) : "—"}</p>
      <div className="mt-2 flex items-center gap-2">
        <StatusChip q={q} />
        <span className="min-w-0 truncate font-mono text-[10.5px] text-[#92A399]">{i.key ? sourceLine(q) : "No source yet"}</span>
      </div>
      <div className="mt-3">
        <Row k="Change · 44 hourly candles" v={r ? <Pct v={r.chg} /> : "—"} gold />
        <Row k="High · 44 candles" v={r ? fmt(r.hi, r.d) : "—"} />
        <Row k="Low · 44 candles" v={r ? fmt(r.lo, r.d) : "—"} />
      </div>
    </Win>
  );
}

function RangeRows({ i, extra }: { i: InstInfo; extra?: "change" | "vsAvg" }) {
  const r = useRange(i.key ?? "");
  return (
    <>
      <Row k="High · 44 candles" v={r ? fmt(r.hi, r.d) : "—"} />
      <Row k="Low · 44 candles" v={r ? fmt(r.lo, r.d) : "—"} />
      <Row k="20-hour average" v={r?.sma20 ? fmt(r.sma20, r.d) : "—"} gold />
      <Row k="Last" v={r ? fmt(r.last, r.d) : "—"} />
      {extra === "change" ? <Row k="Change · 44 candles" v={r ? <Pct v={r.chg} /> : "—"} /> : null}
      {extra === "vsAvg" ? <Row k="Last vs average" v={r?.sma20 ? (r.last >= r.sma20 ? "above" : "below") : "—"} /> : null}
    </>
  );
}

function RangeLine({ i }: { i: InstInfo }) {
  const r = useRange(i.key ?? "");
  const pos = r && r.hi > r.lo ? ((r.last - r.lo) / (r.hi - r.lo)) * 100 : null;
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr] items-center border-b border-[rgba(255,255,255,0.06)] py-2 font-mono text-[12px] text-[#B7C5BC] last:border-b-0">
      <span className="font-sans text-[13px] text-[#F2F5F2]">{i.name}</span>
      <span>{r ? fmt(r.lo, r.d) : "—"}</span>
      <span>{r ? fmt(r.hi, r.d) : "—"}</span>
      <span className="text-[#F2F5F2]">{r ? fmt(r.last, r.d) : "—"}</span>
      <span className="relative h-1.5 rounded-full bg-[rgba(255,255,255,0.08)]">{pos != null ? <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#A8DEC2]" style={{ left: `${pos}%` }} /> : null}</span>
    </div>
  );
}

/** The right column of an "Ask" section: the (sample) answer, what it was built from, the avatar. */
function AnswerWins({ i, answer, avatar }: { i: InstInfo; answer: string; avatar: string }) {
  const q = useQuote(i.key ?? "");
  return (
    <>
      <Win at={0.36} x={710} y={74} w={450} h={140} title="Answer" glyph="research" ai>
        <Para>{answer}</Para>
        <div className="mt-3">
          <Chip tone="sample">Sample answer</Chip>
        </div>
      </Win>
      <Win at={0.48} x={710} y={234} w={450} h={194} title="Built from" glyph="settings">
        <Row k="Price" v={i.key ? <span className="flex items-center gap-2">{q?.source ?? "stored"} <StatusChip q={q} /></span> : "No source yet"} />
        <Row k="As of" v={i.key && q ? asOfText(q.asOf) : "—"} />
        <Row k="Candles" v={i.key ? "hourly · same feed" : "not in preview feed"} />
        <Row k="Reasons" v="sample · sources linked" gold />
      </Win>
      <AvatarLine at={0.6} x={830} y={450} text={avatar} />
    </>
  );
}

/** Reminders for a group's events (sample state: the first one set). */
function RemindersWin({ events, at, x, y, w, h }: { events: [string, string][]; at: number; x: number; y: number; w: number; h: number }) {
  return (
    <Win at={at} x={x} y={y} w={w} h={h} title="Reminders" glyph="alerts">
      {events.map(([k], n) => (
        <Row key={k} k={k} v={n === 0 ? "15 minutes before" : "not set · tap to add"} gold={n === 0} />
      ))}
      <div className="mt-3">
        <Chip tone="sample">Sample</Chip>
      </div>
    </Win>
  );
}

/* --------------------------------------------------------------- Instrument */

export function InstrumentSections({ slug }: { slug: string }) {
  const i = INST[slug];
  const g = GROUP[i.group];
  const c = GROUP_COPY[i.group];
  const siblings = g.items.filter((s) => s !== slug);
  // Related: the first sibling with candles (or this instrument, when none has any).
  const relChart = INST[siblings.find((s) => INST[s].key) ?? slug];
  const relH = CHROME + siblings.length * ROW;
  return (
    <>
      <OsSection n={2} label="Price" title={`${i.name} right now.`} soft="With where the number came from." body="The last price, its status and its source, on real hourly candles." app="Market data" active="charts">
        <InstChart i={i} at={0.06} x={40} y={20} w={740} h={490} />
        <Win at={0.34} x={810} y={20} w={350} h={230} title="Read-out" glyph="research">
          <RangeRows i={i} extra="change" />
        </Win>
        <SourceWin i={i} at={0.48} />
        <Note at={0.62} x={810} y={450} w={350} title="Every price shows its status" sub="Live · delayed · stored" />
      </OsSection>

      <OsSection n={3} label="Levels" title="The levels on the chart." soft="Drawn from the candles." body="The recent high and low and the 20-hour average, worked out by code and drawn as you scroll." app="Market data" active="charts">
        <LevelsChart i={i} />
        <Win at={0.36} x={830} y={20} w={330} h={196} title="Levels · values" glyph="chart" ai>
          <RangeRows i={i} />
        </Win>
        <Win at={0.5} x={830} y={236} w={330} h={192} title="How these were found" glyph="settings">
          <Para>Worked out by code. No guessing.</Para>
          <div className="mt-2">
            <Row k="Recent high" v="highest of 44 candles" gold />
            <Row k="Recent low" v="lowest of 44 candles" />
            <Row k="Average" v="mean of 20 closes" />
          </div>
        </Win>
        <Note at={0.66} x={830} y={448} w={330} title="Lines are drawn as you scroll" sub="High · low · 20-hour average" />
      </OsSection>

      <OsSection n={4} label="Ask" title={`Ask about ${i.name}.`} soft="In your own words." body="Type or speak a question. The answer points at the candles and names its sources." app="Research" active="research">
        <Ask at={0.04} x={40} y={10} w={1120} text={`What is driving ${i.name} today?`} />
        <InstChart i={i} at={0.12} x={40} y={74} w={640} h={436} band={[34, 40]} />
        <AnswerWins i={i} answer="The latest stretch, shaded on the chart, followed a firmer dollar. Each reason links to where it came from." avatar={`I can explain any candle on ${i.name}. Point at it and ask.`} />
      </OsSection>

      <OsSection n={5} label="Events" title="Coming up for it." soft="And how it reacted before." body="Scheduled releases that usually touch this instrument, with past first-hour reactions from the candles." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={600} h={196} title={`Events · ${i.name} · sample week`} glyph="calendar">
          {c.events.map(([k, val], n) => (
            <Row key={k} k={k} v={val} gold={n === 0} />
          ))}
          <div className="mt-3">
            <Chip tone="sample">Sample week</Chip>
          </div>
        </Win>
        <InstChart i={i} at={0.3} x={40} y={236} w={600} h={274} last={44} />
        <Win at={0.4} x={670} y={20} w={490} h={252} title="Past reactions" glyph="research" ai>
          <Para>For each past release AFVAR lists the first-hour move, taken from the candles — what happened, not what will.</Para>
          <div className="mt-3">
            <Row k="Last release" v="first-hour move · size" />
            <Row k="The one before" v="first-hour move · size" />
            <Row k="Typical hour" v="for comparison" />
            <div className="mt-2">
              <Chip tone="sample">Layout · values at launch</Chip>
            </div>
          </div>
        </Win>
        <RemindersWin events={c.events} at={0.56} x={670} y={292} w={490} h={210} />
      </OsSection>

      <OsSection n={6} label="Alert" title="Watch a level for you." soft="Confirmed before it runs." body="Turn any level on this page into an alert. AFVAR reads the rule back in plain words first." app="Alerts" active="alerts">
        <AlertDraft i={i} />
      </OsSection>

      <OsSection n={7} label="Related" title={`Also in ${g.name}.`} soft="One tap away." body="The other instruments in this group, with their latest change." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={600} h={relH} title={`${g.name} · watchlist`} glyph="chart">
          {siblings.map((s) => (
            <MoveRow key={s} slug={s} />
          ))}
        </Win>
        <InstChart i={relChart} at={0.24} x={40} y={20 + relH + 20} w={600} h={FLOOR - (20 + relH + 20)} last={44} />
        <Win at={0.38} x={670} y={20} w={490} h={226} title={`What moves ${g.name.toLowerCase()}`} glyph="research" ai>
          <Para>One group, so often the same forces behind each price.</Para>
          <div className="mt-2">
            {c.drivers.map(([k, val], n) => (
              <Row key={k} k={k} v={val} gold={n === 0} />
            ))}
          </div>
        </Win>
        <Win at={0.52} x={670} y={266} w={490} h={226} title="Dates the group shares" glyph="calendar">
          <Para>Releases that usually move the whole group.</Para>
          <div className="mt-2">
            {c.events.map(([k, val]) => (
              <Row key={k} k={k} v={val} />
            ))}
          </div>
          <div className="mt-3">
            <Chip tone="sample">Sample week</Chip>
          </div>
        </Win>
      </OsSection>
    </>
  );
}

/** Where the instrument's price comes from: status, provider and time of the last quote. */
function SourceWin({ i, at }: { i: InstInfo; at: number }) {
  const q = useQuote(i.key ?? "");
  return (
    <Win at={at} x={810} y={270} w={350} h={160} title="Where it comes from" glyph="settings">
      {i.key ? (
        <>
          <Row k="Status" v={<StatusChip q={q} />} />
          <Row k="Source" v={q?.source ?? "stored"} />
          <Row k="Last quote" v={q ? asOfText(q.asOf) : "—"} gold />
        </>
      ) : (
        <>
          <Para>Not in the preview feed yet.</Para>
          <div className="mt-3">
            <Chip tone="stale">No source yet</Chip>
          </div>
        </>
      )}
    </Win>
  );
}

function LevelsChart({ i }: { i: InstInfo }) {
  const r = useRange(i.key ?? "");
  return (
    <InstChart
      i={i}
      at={0.06}
      x={40}
      y={20}
      w={760}
      h={490}
      levels={r ? [{ v: r.hi, label: "High", tone: "gold", solid: true }, { v: r.lo, label: "Low", tone: "ink" }, ...(r.sma20 ? [{ v: r.sma20, label: "20h avg", tone: "gold" as const }] : [])] : undefined}
      drawFrom={[0.2, 0.4]}
    />
  );
}

function AlertDraft({ i }: { i: InstInfo }) {
  const r = useRange(i.key ?? "");
  return (
    <>
      <Ask at={0.04} x={40} y={10} w={1120} text={`Tell me if ${i.name} closes above its recent high`} />
      <Win at={0.16} x={40} y={74} w={620} h={204} title="New alert · check before confirming" glyph="alerts" ai>
        <Row k="Watches" v={`${i.name} · hourly candles`} />
        <Row k="Condition" v={r ? `close above ${fmt(r.hi, r.d)}` : "close above the recent high"} gold />
        <Row k="When met" v="tell me once" />
        <div className="mt-4 flex items-center gap-2.5">
          <span className="rounded-full bg-[#A8DEC2] px-3.5 py-1 text-[12px] font-semibold text-[#06110C]">Confirm</span>
          <span className="rounded-full border border-[rgba(255,255,255,0.18)] px-3 py-1 text-[12px]">Edit</span>
        </div>
      </Win>
      <InstChart i={i} at={0.28} x={40} y={298} w={620} h={212} last={44} levels={r ? [{ v: r.hi, label: "Alert level", tone: "gold", solid: true }] : undefined} drawFrom={[0.3, 0.42]} />
      <Win at={0.4} x={690} y={74} w={470} h={160} title="An alert only tells you" glyph="risk">
        <Para>It never opens or closes a trade.</Para>
        <div className="mt-2">
          <Row k="Checked" v="on closed candles" />
          <Row k="Arrives" v="in app, push or voice" gold />
        </div>
      </Win>
      <Note at={0.56} x={690} y={254} w={470} title="Alert active · confirmed by you" sub={`${i.name} · close above the recent high`} />
      <Win at={0.68} x={690} y={334} w={470} h={176} title="Your alerts" glyph="alerts">
        <Row k={`${i.name} · close above recent high`} v={<Chip tone="gold">Active</Chip>} gold />
        <Row k="Level" v={r ? fmt(r.hi, r.d) : "—"} />
        <Row k="Checked" v="on closed candles" />
      </Win>
    </>
  );
}

/* ------------------------------------------------------------------- Briefs */

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEK: [string, number[]][] = [
  ["Morning brief", [1, 1, 1, 1, 1, 0, 0]],
  ["Evening wrap", [1, 1, 1, 1, 1, 0, 0]],
  ["Weekly outlook", [0, 0, 0, 0, 0, 0, 1]],
];

/** The edition schedule as a week: a mark on each day an edition is out. */
function WeekGrid() {
  return (
    <div className="grid grid-cols-[130px_repeat(7,1fr)] items-center gap-x-1.5 text-[13px]">
      <span />
      {DAYS.map((d, n) => (
        <span key={n} className="pb-1 text-center font-mono text-[10.5px] tracking-[0.1em] text-[#92A399]">
          {d}
        </span>
      ))}
      {WEEK.map(([k, on]) => (
        <div key={k} className="contents">
          <span className="flex h-[40px] items-center border-t border-[rgba(255,255,255,0.06)] text-[#F2F5F2]">{k}</span>
          {on.map((v, n) => (
            <span key={n} className="flex h-[40px] items-center justify-center border-t border-[rgba(255,255,255,0.06)]">
              <span className={`h-5 w-full rounded ${v ? "bg-[rgba(168,222,194,0.35)] ring-1 ring-[rgba(168,222,194,0.55)]" : "bg-[rgba(255,255,255,0.04)]"}`} />
            </span>
          ))}
        </div>
      ))}
      <span className="flex h-[40px] items-center border-t border-[rgba(255,255,255,0.06)] text-[#F2F5F2]">Event preview</span>
      <span className="col-span-7 flex h-[40px] items-center border-t border-[rgba(255,255,255,0.06)] font-mono text-[11px] text-[#B7C5BC]">no fixed day · before high-impact releases</span>
    </div>
  );
}

export function BriefsSections() {
  const gold = useQuote("XAUUSD");
  return (
    <>
      <OsSection n={2} label="Schedule" title="Four kinds of edition." soft="On a fixed clock." body="A morning brief before Asia is fully awake, an evening wrap after London, a weekly outlook on Sunday and a preview before big releases." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={560} h={208} title="Edition schedule · IST" glyph="calendar">
          <Row k="Morning brief" v="07:00 · weekdays" gold />
          <Row k="Evening wrap" v="18:30 · weekdays" />
          <Row k="Weekly outlook" v="Sunday" />
          <Row k="Event preview" v="before high-impact releases" />
        </Win>
        <Win at={0.22} x={40} y={248} w={560} h={256} title="A week of editions" glyph="calendar">
          <WeekGrid />
        </Win>
        <Note at={0.34} x={630} y={20} w={530} title="Morning brief · ready" sub="07:00 IST · Commodities · Forex · Crypto" />
        <Win at={0.48} x={630} y={100} w={530} h={190} title="Length" glyph="journal">
          <Para>About two minutes to read.</Para>
          <div className="mt-2">
            <Row k="Overview" v="two or three lines" />
            <Row k="Each market" v="one or two lines" gold />
            <Row k="Calendar" v="today’s releases" />
          </div>
        </Win>
        <Win at={0.62} x={630} y={310} w={530} h={194} title="Event previews" glyph="alerts">
          <Para>Before high-impact releases, such as:</Para>
          <div className="mt-2">
            <Row k="US CPI" v="inflation" />
            <Row k="US payrolls" v="jobs" />
            <Row k="FOMC · ECB · BoJ" v="rate decisions" gold />
          </div>
        </Win>
      </OsSection>

      <OsSection n={3} label="Inside an edition" title="What an edition holds." soft="Section by section." body="Overview, then each market in a line or two, then the day’s calendar — every line numbered to its source." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={720} h={480} title="Evening wrap · sample edition" glyph="journal">
          <p className="font-mono text-[10.5px] text-[#A8DEC2]">OVERVIEW</p>
          <Para>A quiet London session turned busy after US data [1].</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#A8DEC2]">COMMODITIES</p>
          <Para>Gold gave back early gains as the dollar firmed [2]. Crude held its range [3].</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#A8DEC2]">FOREX</p>
          <Para>The euro slipped against the dollar after weak surveys [4].</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#A8DEC2]">TOMORROW</p>
          <Para>ECB decision at 18:15 IST [5].</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#A8DEC2]">SOURCES</p>
          <Row k="[1] US data release" v="economic calendar" />
          <Row k="[2] Dollar index" v="price data" />
          <Row k="[3] Crude oil futures" v="price data" />
          <Row k="[4] Euro-area surveys" v="economic calendar" />
          <Row k="[5] ECB" v="central bank calendar" />
          <div className="mt-3">
            <Chip tone="sample">Sample edition</Chip>
          </div>
        </Win>
        <Win at={0.38} x={790} y={20} w={370} h={166} title="Markets covered" glyph="layouts">
          <Row k="Commodities" v="Gold · Silver · Crude" />
          <Row k="Forex" v="four majors" />
          <Row k="Crypto" v="Bitcoin" />
        </Win>
        <Win at={0.5} x={790} y={206} w={370} h={200} title="Every edition" glyph="settings">
          <Row k="Every line" v="numbered to a source" gold />
          <Row k="Without full sources" v="not published" />
          <Row k="Prices" v="with status and time" />
          <Row k="Advice" v="none · information only" />
        </Win>
        <Note at={0.64} x={790} y={426} w={370} title="Sample edition · not yet published" sub="Editions start at launch" />
      </OsSection>

      <OsSection n={4} label="Sources" title="Open any number." soft="See where it came from." body="Tap a numbered line to open its source with the time it was published or observed." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={560} h={230} title="Evening wrap" glyph="journal">
          <div className="space-y-2">
            <Para>
              A quiet London session turned busy after US data <span className="text-[#A8DEC2]">[1]</span>.
            </Para>
            <Para>
              Gold gave back early gains <span className="border-b border-[#A8DEC2] bg-[rgba(168,222,194,0.15)]">as the dollar firmed</span> <span className="text-[#A8DEC2]">[2]</span>.
            </Para>
            <Para>
              Crude held its range <span className="text-[#A8DEC2]">[3]</span>.
            </Para>
            <Para>
              The euro slipped against the dollar after weak surveys <span className="text-[#A8DEC2]">[4]</span>.
            </Para>
            <Para>
              ECB decision at 18:15 IST <span className="text-[#A8DEC2]">[5]</span>.
            </Para>
          </div>
          <p className="mt-3 font-mono text-[10.5px] text-[#92A399]">Tap a number to open its source</p>
          <div className="mt-3">
            <Chip tone="sample">Sample edition</Chip>
          </div>
        </Win>
        <Win at={0.24} x={40} y={270} w={560} h={232} title="Kinds of source" glyph="research">
          <Para>Every line points at one of these.</Para>
          <div className="mt-2">
            <Row k="Price data" v="with its status and time" gold />
            <Row k="Economic calendar" v="release time and figure" />
            <Row k="Central banks" v="statements and decisions" />
            <Row k="News" v="publisher and time" />
          </div>
        </Win>
        <Win at={0.36} x={630} y={20} w={530} h={230} title="[2] Source" glyph="settings">
          <Row k="Type" v="price data · dollar index" />
          <Row k="Observed" v="15:10 UTC" />
          <Row k="Status" v="delayed 15 min" />
          <Row k="Used in" v="line [2] · Commodities" gold />
          <div className="mt-3">
            <Chip tone="sample">Sample source</Chip>
          </div>
        </Win>
        <Win at={0.52} x={630} y={270} w={530} h={232} title="Freshness labels" glyph="chart">
          <Para>Every number in an edition carries one of these.</Para>
          <div className="mt-2">
            <Row k={<Chip tone="live">Live</Chip>} v="from the provider, as it arrives" />
            <Row k={<Chip tone="delayed">Delayed</Chip>} v="behind by a stated time" />
            <Row k={<Chip tone="stale">Stored</Chip>} v="a saved value, not live" />
            <Row k="Missing" v="shown as a dash, never filled" />
          </div>
        </Win>
      </OsSection>

      <OsSection n={5} label="Archive" title="Find a past edition." soft="By market or by word." body="Filter the archive by market or search it. Only editions with full sources are ever published." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={640} h={230} title="Briefs archive" glyph="journal">
          <div className="mb-3 rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-[13px] text-[#92A399]">Search editions…</div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Chip tone="gold">All markets</Chip>
            <Chip>Commodities</Chip>
            <Chip>Forex</Chip>
            <Chip>Crypto</Chip>
          </div>
          <Para>No editions are published yet. The first appears when analysis goes live at launch.</Para>
          <div className="mt-3">
            <Chip tone="stale">Empty · pre-launch</Chip>
          </div>
        </Win>
        <Win at={0.22} x={40} y={270} w={640} h={240} title="Filed by kind" glyph="calendar">
          <Para>Each edition is filed with its sources, by kind:</Para>
          <div className="mt-2">
            <Row k="Morning briefs" v="07:00 · weekdays" gold />
            <Row k="Evening wraps" v="18:30 · weekdays" />
            <Row k="Weekly outlooks" v="Sunday" />
            <Row k="Event previews" v="before high-impact releases" />
          </div>
        </Win>
        <Note at={0.34} x={710} y={20} w={450} title="Published only with sources attached" sub="An edition without provenance is not released" />
        <Win at={0.48} x={710} y={100} w={450} h={266} title="Before an edition is published" glyph="settings">
          <Para>The same checks run for every kind of edition.</Para>
          <div className="mt-2">
            <Row k="Every line" v="numbered to a source" gold />
            <Row k="Every price" v="live, delayed or stored" />
            <Row k="Verify core" v="checks each line" />
            <Row k="Sample text" v="always labelled sample" />
            <Row k="A source missing" v="edition held back" />
          </div>
        </Win>
        <AvatarLine at={0.64} x={830} y={396} text="I would rather show an empty shelf than a brief without sources." />
      </OsSection>

      <OsSection n={6} label="Brief to chart" title="From a line to the candles." soft="One tap." body="Each market line opens its chart with the period it describes shaded." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={420} h={200} title="Evening wrap · Gold" glyph="journal">
          <Para>Gold gave back early gains as the dollar firmed [2].</Para>
          <div className="mt-3">
            <Row k="Describes" v="the hours it covers" />
            <Row k="Opens" v="Gold · 1H chart" gold />
            <Row k="Source" v="[2] price data" />
          </div>
        </Win>
        <ChartWin k="XAUUSD" at={0.26} x={490} y={20} w={670} h={490} band={[30, 38]} />
        <Note at={0.44} x={40} y={240} w={420} title="Shaded: the hours the line describes" sub="Real candles · sample brief" />
        <Win at={0.58} x={40} y={314} w={420} h={196} title="Gold · now" glyph="chart">
          <Row k="Last" v={gold?.last != null ? fmt(gold.last, gold.decimals) : "—"} gold />
          <Row k="Status" v={<StatusChip q={gold} />} />
          <Row k="Source" v={gold?.source ?? "stored"} />
          <Row k="As of" v={gold ? asOfText(gold.asOf) : "—"} />
        </Win>
      </OsSection>

      <OsSection n={7} label="Delivery" title="Where editions reach you." soft="When they are ready." body="Read editions in the workspace or on this website. A notification when a new one is out is planned." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={560} h={198} title="Delivery" glyph="settings">
          <Row k="In the AFVAR workspace" v="at launch" gold />
          <Row k="On this website" v="at launch" />
          <Row k="Notification when ready" v="planned" />
          <p className="mt-3 text-[12px] text-[#B7C5BC]">The same edition in both places, every line numbered.</p>
        </Win>
        <Win at={0.2} x={40} y={238} w={560} h={268} title="Order in your edition" glyph="journal" ai>
          <Row k="1 · Overview" v="two or three lines" />
          <Row k="2 · Gold" v="your market" gold />
          <Row k="3 · EUR/USD" v="your market" gold />
          <Row k="4 · Silver · Bitcoin" v="your markets" />
          <Row k="5 · Other markets" v="one line each" />
          <Row k="6 · Calendar" v="today’s releases" />
        </Win>
        <Win at={0.34} x={630} y={20} w={530} h={140} title="Your markets first" glyph="research" ai>
          <Para>Pick the markets you follow and their sections come first in every edition.</Para>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tone="gold">Gold</Chip>
            <Chip tone="gold">EUR/USD</Chip>
            <Chip>Silver</Chip>
            <Chip>Bitcoin</Chip>
          </div>
        </Win>
        <Win at={0.48} x={630} y={180} w={530} h={236} title="Your markets · right now" glyph="chart">
          <MoveRow slug="gold" gold />
          <MoveRow slug="eurusd" gold />
          <MoveRow slug="silver" />
          <MoveRow slug="btc" />
          <p className="mt-3 font-mono text-[10.5px] text-[#92A399]">Change over the last 44 hourly candles · from the feed</p>
        </Win>
        <Note at={0.62} x={630} y={436} w={530} title="Notification when ready · planned" sub="Read in the workspace or on this site for now" />
      </OsSection>
    </>
  );
}
