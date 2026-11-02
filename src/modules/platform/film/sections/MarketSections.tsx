"use client";

// The Markets family after its heroes: overview, one market group, one
// instrument and the briefs index — six OS sections each, the avatar once.
import { Ask, AvatarLine, Chip, Note, OsSection, Pct, Row, Win } from "@/modules/afvarOs";
import { GROUP, GROUP_IDS, INST, type GroupId, type InstInfo } from "./marketMap";
import { ChartWin, Para, StatusChip, fmt, sourceLine, useQuote, useRange } from "./shared";

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

/* ---------------------------------------------------------- Markets overview */

export function MarketsSections() {
  return (
    <>
      <OsSection n={2} label="Three markets" title="Three markets, ten instruments." soft="Grouped the way you trade them." body="Metals and energy, the major currency pairs, and crypto. Each group opens to its own page." app="Market data" active="charts">
        {GROUP_IDS.map((g, n) => (
          <Win key={g} at={0.06 + n * 0.16} x={40 + n * 380} y={20 + n * 24} w={360} h={330} title={GROUP[g].name} glyph={n === 2 ? "phone" : "chart"}>
            <p className="mb-2 font-mono text-[10.5px] tracking-[0.1em] text-[#92A399]">{GROUP[g].short.toUpperCase()}</p>
            {GROUP[g].items.map((s) => (
              <MoveRow key={s} slug={s} />
            ))}
          </Win>
        ))}
        <Note at={0.66} x={40} y={420} w={520} title="Change over the last 44 hourly candles" sub="Worked out from the feed · not a forecast" />
      </OsSection>

      <OsSection n={3} label="Live board" title="One chart from each group." soft="Real hourly candles." body="Gold, the euro and Bitcoin side by side — each with its source, its status and the time of its last price." app="Market data" active="charts">
        <ChartWin k="XAUUSD" at={0.06} x={40} y={20} w={370} h={490} last={36} />
        <ChartWin k="EURUSD" at={0.22} x={425} y={20} w={370} h={490} last={36} />
        <ChartWin k="BTC-USD" at={0.38} x={810} y={20} w={350} h={490} last={36} />
      </OsSection>

      <OsSection n={4} label="Trading hours" title="When each market is open." soft="In India time." body="Currencies follow the sessions from Sydney to New York, metals and oil trade most of the week, and crypto never closes." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={620} h={330} title="Sessions · IST · winter" glyph="calendar">
          <Row k="Sydney" v="02:30 – 11:30" />
          <Row k="Tokyo" v="05:30 – 14:30" />
          <Row k="London" v="13:30 – 22:30" gold />
          <Row k="New York" v="18:30 – 03:30" gold />
          <p className="mt-3 text-[12px] text-[#B7C5BC]">London and New York overlap from 18:30 to 22:30 — usually the busiest hours.</p>
        </Win>
        <Win at={0.32} x={690} y={20} w={470} h={200} title="Crypto" glyph="phone">
          <Para>Open 24 hours, 7 days. Weekend moves can be large with fewer traders.</Para>
          <div className="mt-2">
            <Row k="Bitcoin" v="live · 24 / 7" gold />
            <Row k="Weekends" v="thinner trading" />
          </div>
        </Win>
        <Note at={0.56} x={690} y={250} w={470} title="Times move by an hour when clocks change" sub="Europe and the US change on different dates" />
      </OsSection>

      <OsSection n={5} label="Biggest moves" title="What moved most?" soft="Sorted, with reasons." body="Ask across every market at once. The list comes from the candles; the reasons come with sources." app="Market data" active="charts">
        <Ask at={0.04} x={40} y={10} w={620} text="Which markets moved most in the last two days?" />
        <Win at={0.14} x={40} y={74} w={620} h={436} title="Biggest moves · 44 hourly candles" glyph="chart" ai>
          {["gold", "silver", "oil", "eurusd", "usdjpy", "gbpusd", "nzdusd", "btc"].map((s) => (
            <MoveRow key={s} slug={s} />
          ))}
        </Win>
        <AvatarLine at={0.44} x={720} y={60} text="These come straight from the candles. Ask me why any of them moved." />
        <Win at={0.62} x={690} y={250} w={470} h={260} title="Read it this way" glyph="research">
          <Para>A big move on a quiet market and a big move after a data release are different stories. Open the chart before drawing a conclusion.</Para>
          <div className="mt-2">
            <Row k="1 · Scheduled release?" v="check the calendar" />
            <Row k="2 · Bigger than usual?" v="compare the hourly range" />
            <Row k="3 · Did neighbours move?" v="same driver, or its own" />
          </div>
        </Win>
      </OsSection>

      <OsSection n={6} label="Connections" title="Markets lean on each other." soft="The dollar sits in the middle." body="Gold and the euro are both priced against the dollar, so a dollar move often shows up in both." app="Market data" active="charts">
        <ChartWin k="EURUSD" at={0.06} x={40} y={20} w={560} h={490} title="EUR/USD · 1H" last={44} />
        <ChartWin k="XAUUSD" at={0.22} x={620} y={20} w={540} h={300} title="Gold · 1H" last={44} head={false} />
        <Win at={0.48} x={620} y={340} w={540} h={170} title="How to read the pair" glyph="research" ai>
          <Para>When both rise together, the dollar is usually the reason. When they split, look for a cause of their own.</Para>
        </Win>
      </OsSection>

      <OsSection n={7} label="Coverage" title="What the preview carries." soft="And what it does not yet." body="Eight instruments have candles in this preview. Two are listed but wait for a licensed source." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={760} h={490} title="Coverage status" glyph="settings">
          {Object.values(INST).map((i) => (
            <Row key={i.slug} k={`${i.name} · ${i.sym}`} v={i.key ? <Chip tone="live">In preview feed</Chip> : <Chip tone="stale">No source yet</Chip>} />
          ))}
        </Win>
        <Note at={0.4} x={830} y={20} w={330} title="Gaps are shown, never filled" sub="A missing price stays missing" />
      </OsSection>
    </>
  );
}

/* ------------------------------------------------------------- Market group */

const GROUP_COPY: Record<GroupId, { drivers: [string, string][]; events: [string, string][]; ask: string; answer: string; avatar: string }> = {
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
    ask: "Why did USD/JPY fall this morning?",
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
    ask: "Is this Bitcoin move happening on thin volume?",
    answer: "It started late on Saturday, when volume is usually lowest. Treat the size of the move with care.",
    avatar: "Crypto never closes, so I watch the quiet hours too.",
  },
};

export function GroupSections({ group }: { group: GroupId }) {
  const g = GROUP[group];
  const c = GROUP_COPY[group];
  const lead = INST[g.items[0]];
  return (
    <>
      <OsSection n={2} label="Instruments" title={`${g.items.length} instruments in ${g.name}.`} soft="Prices with their source." body="Each row shows the change over the last 44 hourly candles and opens the instrument’s own page." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={560} h={360} title={`${g.name} · watchlist`} glyph="chart">
          {g.items.map((s, n) => (
            <MoveRow key={s} slug={s} gold={n === 0} />
          ))}
        </Win>
        <PriceCard i={lead} at={0.34} />
        <Note at={0.62} x={630} y={400} w={530} title="Open any row for its own page" sub="Chart · levels · events · alerts" />
      </OsSection>

      <OsSection n={3} label="Lead chart" title={`${lead.name}, hour by hour.`} soft="With its 20-hour average." body="The group’s lead instrument on real hourly candles, the average drawn in as you scroll." app="Market data" active="charts">
        <InstChart i={lead} at={0.06} x={40} y={20} w={760} h={490} averages={[{ len: 20 }]} drawFrom={[0.25, 0.45]} />
        <Win at={0.4} x={830} y={20} w={330} h={260} title="Read-out" glyph="research" ai>
          <RangeRows i={lead} />
        </Win>
      </OsSection>

      <OsSection n={4} label="What moves it" title={`What moves ${g.name.toLowerCase()}.`} soft="The usual suspects." body="The forces that most often explain a move in this group, in the order AFVAR checks them." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={600} h={330} title="Drivers" glyph="research" ai>
          {c.drivers.map(([k, val], n) => (
            <Row key={k} k={k} v={val} gold={n === 0} />
          ))}
        </Win>
        <Win at={0.34} x={670} y={20} w={490} h={330} title="Checked in this order" glyph="layouts">
          {c.drivers.map(([k], n) => (
            <p key={k} className="border-b border-[rgba(255,255,255,0.06)] py-2 text-[13px] text-[#F2F5F2] last:border-b-0">
              <span className="mr-2 font-mono text-[#A8DEC2]">{n + 1}</span>
              {k}
            </p>
          ))}
        </Win>
      </OsSection>

      <OsSection n={5} label="Ask about it" title="Ask about the group." soft="Answered with sources." body="Questions across instruments get one answer that names every source it used." app="Research" active="research">
        <Ask at={0.04} x={40} y={10} w={640} text={c.ask} />
        <InstChart i={lead} at={0.12} x={40} y={74} w={640} h={436} band={[30, 36]} />
        <Win at={0.36} x={710} y={74} w={450} h={230} title="Answer" glyph="research" ai>
          <Para>{c.answer}</Para>
          <div className="mt-3">
            <Chip tone="sample">Sample answer</Chip>
          </div>
        </Win>
        <AvatarLine at={0.58} x={740} y={340} text={c.avatar} />
      </OsSection>

      <OsSection n={6} label="Events" title="Dates that matter here." soft="Times in IST." body="The scheduled releases that most often move this group, with a reminder you can set for each." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={620} h={300} title={`Calendar · ${g.name} · sample week`} glyph="calendar">
          {c.events.map(([k, val], n) => (
            <Row key={k} k={k} v={val} gold={n === 0} />
          ))}
          <div className="mt-3">
            <Chip tone="sample">Sample week</Chip>
          </div>
        </Win>
        <Note at={0.36} x={690} y={20} w={470} title="Reminder set · 15 minutes before" sub={`${c.events[0][0]} · ${g.name}`} />
        <Win at={0.52} x={690} y={110} w={470} h={210} title="Before an event" glyph="alerts">
          <Para>Spreads can widen and prices can jump. A reminder gives you time to decide what to do first.</Para>
          <div className="mt-2">
            <Row k="Reminder" v="15 minutes before" gold />
            <Row k="Then" v="the release, live" />
          </div>
        </Win>
      </OsSection>

      <OsSection n={7} label="Compare" title="Side by side." soft="Highs, lows and where price sits." body="The range of each instrument over the last 44 hourly candles, and where the last price sits inside it." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={1120} h={360} title={`${g.name} · ranges`} glyph="chart">
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
        </Win>
        <Note at={0.5} x={40} y={410} w={560} title="Worked out from the feed’s hourly candles" sub="Instruments without a source show a dash" />
      </OsSection>
    </>
  );
}

function PriceCard({ i, at }: { i: InstInfo; at: number }) {
  const q = useQuote(i.key ?? "");
  return (
    <Win at={at} x={630} y={20} w={530} h={360} title={`${i.name} · last price`} glyph="chart">
      <p className="font-mono text-[34px] font-semibold text-[#F2F5F2]">{q?.last != null ? fmt(q.last, q.decimals) : "—"}</p>
      <div className="mt-2 flex items-center gap-2">
        <StatusChip q={q} />
      </div>
      <p className="mt-3 font-mono text-[10.5px] text-[#92A399]">{i.key ? sourceLine(q) : "No source yet"}</p>
    </Win>
  );
}

function RangeRows({ i }: { i: InstInfo }) {
  const r = useRange(i.key ?? "");
  return (
    <>
      <Row k="High · 44 candles" v={r ? fmt(r.hi, r.d) : "—"} />
      <Row k="Low · 44 candles" v={r ? fmt(r.lo, r.d) : "—"} />
      <Row k="20-hour average" v={r?.sma20 ? fmt(r.sma20, r.d) : "—"} gold />
      <Row k="Last" v={r ? fmt(r.last, r.d) : "—"} />
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

/* --------------------------------------------------------------- Instrument */

export function InstrumentSections({ slug }: { slug: string }) {
  const i = INST[slug];
  const g = GROUP[i.group];
  const siblings = g.items.filter((s) => s !== slug);
  return (
    <>
      <OsSection n={2} label="Price" title={`${i.name} right now.`} soft="With where the number came from." body="The last price, its status and its source, on real hourly candles." app="Market data" active="charts">
        <InstChart i={i} at={0.06} x={40} y={20} w={740} h={490} />
        <Win at={0.34} x={810} y={20} w={350} h={300} title="Read-out" glyph="research">
          <RangeRows i={i} />
        </Win>
        <Note at={0.6} x={810} y={350} w={350} title="Every price shows its status" sub="Live · delayed · stored" />
      </OsSection>

      <OsSection n={3} label="Levels" title="The levels on the chart." soft="Drawn from the candles." body="The recent high and low and the 20-hour average, worked out by code and drawn as you scroll." app="Market data" active="charts">
        <LevelsChart i={i} />
        <Win at={0.44} x={830} y={20} w={330} h={260} title="How these were found" glyph="settings">
          <Para>Worked out by code from the feed. No guessing.</Para>
          <div className="mt-2">
            <Row k="Recent high" v="highest of 44 candles" gold />
            <Row k="Recent low" v="lowest of 44 candles" />
            <Row k="Average" v="mean of 20 closes" />
          </div>
        </Win>
      </OsSection>

      <OsSection n={4} label="Ask" title={`Ask about ${i.name}.`} soft="In your own words." body="Type or speak a question. The answer points at the candles and names its sources." app="Research" active="research">
        <Ask at={0.04} x={40} y={10} w={640} text={`What is driving ${i.name} today?`} />
        <InstChart i={i} at={0.12} x={40} y={74} w={640} h={436} band={[34, 40]} />
        <Win at={0.36} x={710} y={74} w={450} h={230} title="Answer" glyph="research" ai>
          <Para>The latest stretch, shaded on the chart, followed a firmer dollar. Each reason links to where it came from.</Para>
          <div className="mt-3">
            <Chip tone="sample">Sample answer</Chip>
          </div>
        </Win>
        <AvatarLine at={0.58} x={740} y={340} text={`I can explain any candle on ${i.name}. Point at it and ask.`} />
      </OsSection>

      <OsSection n={5} label="Events" title="Coming up for it." soft="And how it reacted before." body="Scheduled releases that usually touch this instrument, with past first-hour reactions from the candles." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={600} h={300} title={`Events · ${i.name} · sample week`} glyph="calendar">
          {GROUP_COPY[i.group].events.map(([k, val], n) => (
            <Row key={k} k={k} v={val} gold={n === 0} />
          ))}
          <div className="mt-3">
            <Chip tone="sample">Sample week</Chip>
          </div>
        </Win>
        <Win at={0.36} x={670} y={20} w={490} h={300} title="Past reactions" glyph="research" ai>
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
      </OsSection>

      <OsSection n={6} label="Alert" title="Watch a level for you." soft="Confirmed before it runs." body="Turn any level on this page into an alert. AFVAR reads the rule back in plain words first." app="Alerts" active="alerts">
        <AlertDraft i={i} />
        <Note at={0.56} x={690} y={330} w={470} title="Alert active · confirmed by you" sub={`${i.name} · close above the recent high`} />
      </OsSection>

      <OsSection n={7} label="Related" title={`Also in ${g.name}.`} soft="One tap away." body="The other instruments in this group, with their latest change." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={600} h={330} title={`${g.name} · watchlist`} glyph="chart">
          {siblings.map((s) => (
            <MoveRow key={s} slug={s} />
          ))}
        </Win>
        {siblings[0] ? <InstChart i={INST[siblings[0]]} at={0.3} x={670} y={20} w={490} h={330} last={36} /> : null}
      </OsSection>
    </>
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
      <Ask at={0.04} x={40} y={10} w={620} text={`Tell me if ${i.name} closes above its recent high`} />
      <Win at={0.16} x={40} y={74} w={620} h={300} title="New alert · check before confirming" glyph="alerts" ai>
        <Row k="Watches" v={`${i.name} · hourly candles`} />
        <Row k="Condition" v={r ? `close above ${fmt(r.hi, r.d)}` : "close above the recent high"} gold />
        <Row k="When met" v="tell me once" />
        <div className="mt-4 flex items-center gap-2.5">
          <span className="rounded-full bg-[#A8DEC2] px-3.5 py-1 text-[12px] font-semibold text-[#06110C]">Confirm</span>
          <span className="rounded-full border border-[rgba(255,255,255,0.18)] px-3 py-1 text-[12px]">Edit</span>
        </div>
      </Win>
      <Win at={0.36} x={690} y={74} w={470} h={230} title="An alert only tells you" glyph="risk">
        <Para>It never opens or closes a trade.</Para>
        <div className="mt-2">
          <Row k="Checked" v="on closed candles" />
          <Row k="Arrives" v="in app, push or voice" gold />
        </div>
      </Win>
    </>
  );
}

/* ------------------------------------------------------------------- Briefs */

export function BriefsSections() {
  return (
    <>
      <OsSection n={2} label="Schedule" title="Four kinds of edition." soft="On a fixed clock." body="A morning brief before Asia is fully awake, an evening wrap after London, a weekly outlook on Sunday and a preview before big releases." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={560} h={330} title="Edition schedule · IST" glyph="calendar">
          <Row k="Morning brief" v="07:00 · weekdays" gold />
          <Row k="Evening wrap" v="18:30 · weekdays" />
          <Row k="Weekly outlook" v="Sunday" />
          <Row k="Event preview" v="before high-impact releases" />
        </Win>
        <Note at={0.34} x={630} y={20} w={530} title="Morning brief · ready" sub="07:00 IST · Commodities · Forex · Crypto" />
        <Win at={0.5} x={630} y={110} w={530} h={240} title="Length" glyph="journal">
          <Para>About two minutes to read.</Para>
          <div className="mt-2">
            <Row k="Overview" v="two or three lines" />
            <Row k="Each market" v="one or two lines" gold />
            <Row k="Calendar" v="today’s releases" />
          </div>
        </Win>
      </OsSection>

      <OsSection n={3} label="Inside an edition" title="What an edition holds." soft="Section by section." body="Overview, then each market in a line or two, then the day’s calendar — every line numbered to its source." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={720} h={490} title="Evening wrap · sample edition" glyph="journal">
          <p className="font-mono text-[10.5px] text-[#A8DEC2]">OVERVIEW</p>
          <Para>A quiet London session turned busy after US data [1].</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#A8DEC2]">COMMODITIES</p>
          <Para>Gold gave back early gains as the dollar firmed [2]. Crude held its range [3].</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#A8DEC2]">FOREX</p>
          <Para>The euro slipped against the dollar after weak surveys [4].</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#A8DEC2]">TOMORROW</p>
          <Para>ECB decision at 18:15 IST [5].</Para>
          <div className="mt-3">
            <Chip tone="sample">Sample edition</Chip>
          </div>
        </Win>
        <Win at={0.38} x={790} y={20} w={370} h={300} title="Markets covered" glyph="layouts">
          <Row k="Commodities" v="Gold · Silver · Crude" />
          <Row k="Forex" v="four majors" />
          <Row k="Crypto" v="Bitcoin" />
        </Win>
      </OsSection>

      <OsSection n={4} label="Sources" title="Open any number." soft="See where it came from." body="Tap a numbered line to open its source with the time it was published or observed." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={560} h={260} title="Evening wrap" glyph="journal">
          <Para>
            Gold gave back early gains <span className="border-b border-[#A8DEC2] bg-[rgba(168,222,194,0.15)]">as the dollar firmed</span> <span className="text-[#A8DEC2]">[2]</span>.
          </Para>
        </Win>
        <Win at={0.3} x={630} y={20} w={530} h={330} title="[2] Source" glyph="settings">
          <Row k="Type" v="price data · dollar index" />
          <Row k="Observed" v="15:10 UTC" />
          <Row k="Status" v="delayed 15 min" />
          <div className="mt-3">
            <Chip tone="sample">Sample source</Chip>
          </div>
        </Win>
      </OsSection>

      <OsSection n={5} label="Archive" title="Find a past edition." soft="By market or by word." body="Filter the archive by market or search it. Only editions with full sources are ever published." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={640} h={360} title="Briefs archive" glyph="journal">
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
        <AvatarLine at={0.4} x={740} y={60} text="I would rather show an empty shelf than a brief without sources." />
        <Note at={0.62} x={710} y={260} w={450} title="Published only with sources attached" sub="An edition without provenance is not released" />
      </OsSection>

      <OsSection n={6} label="Brief to chart" title="From a line to the candles." soft="One tap." body="Each market line opens its chart with the period it describes shaded." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={420} h={200} title="Evening wrap · Gold" glyph="journal">
          <Para>Gold gave back early gains as the dollar firmed [2].</Para>
        </Win>
        <ChartWin k="XAUUSD" at={0.26} x={490} y={20} w={670} h={490} band={[30, 38]} />
        <Note at={0.56} x={40} y={250} w={420} title="Shaded: the hours the line describes" sub="Real candles · sample brief" />
      </OsSection>

      <OsSection n={7} label="Delivery" title="Where editions reach you." soft="When they are ready." body="Read editions in the workspace or on this website. A notification when a new one is out is planned." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={560} h={300} title="Delivery" glyph="settings">
          <Row k="In the AFVAR workspace" v="at launch" gold />
          <Row k="On this website" v="at launch" />
          <Row k="Notification when ready" v="planned" />
        </Win>
        <Win at={0.32} x={630} y={20} w={530} h={300} title="Your markets first" glyph="research" ai>
          <Para>Pick the markets you follow and their sections come first in every edition.</Para>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tone="gold">Gold</Chip>
            <Chip tone="gold">EUR/USD</Chip>
            <Chip>Silver</Chip>
            <Chip>Bitcoin</Chip>
          </div>
        </Win>
      </OsSection>
    </>
  );
}
