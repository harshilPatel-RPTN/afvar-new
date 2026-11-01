"use client";

// Alerts & Strategy Tools after the hero: seven OS sections; the avatar speaks once (02).
import { Ask, AvatarLine, Chip, Note, OsSection, Pct, Row, Win } from "@/modules/afvarOs";
import { ChartWin, Para, SYM, ScrollSteps, fmt, useRange } from "./shared";

export function AlertsSections() {
  return (
    <>
      <RuleInWords />
      <AlertTypes />
      <AlertFires />
      <Screeners />
      <Scans />
      <StrategyTest />
      <Results />
    </>
  );
}

function RuleInWords() {
  return (
    <OsSection n={2} label="Rule in plain words" title="Say what to watch." soft="Confirm before it runs." body="Describe a condition the way you would to a friend. AFVAR writes it back as a rule you can read, and nothing runs until you confirm." app="Alerts" active="alerts">
      <Ask at={0.04} x={40} y={10} w={620} text="Tell me when Gold closes above its 20-hour average" />
      <Win at={0.14} x={40} y={74} w={620} h={300} title="New rule · check before confirming" glyph="alerts" ai>
        <Row k="Watches" v="Gold · hourly candles" />
        <Row k="Condition" v="close above the 20-hour average" gold />
        <Row k="When met" v="notify me once · app and phone" />
        <Row k="Runs until" v="you pause or delete it" />
        <div className="mt-4 flex items-center gap-2.5">
          <span className="rounded-full bg-[#E9B44C] px-3.5 py-1 text-[12px] font-semibold text-[#0B0E10]">Confirm rule</span>
          <span className="rounded-full border border-[rgba(255,255,255,0.18)] px-3 py-1 text-[12px]">Edit</span>
        </div>
      </Win>
      <AvatarLine at={0.36} x={720} y={60} text="Here is your rule in plain words. Confirm it and I will watch Gold for you." />
      <Note at={0.62} x={700} y={250} w={460} title="Rule active" sub="Gold · close above 20-hour average · confirmed by you" />
      <Win at={0.74} x={700} y={340} w={460} h={170} title="What a rule never does" glyph="risk">
        <Para>A rule only watches and tells you. It never places, changes or closes an order.</Para>
      </Win>
    </OsSection>
  );
}

function AlertTypes() {
  const g = useRange("XAUUSD");
  return (
    <OsSection n={3} label="Alert types" title="Price, level or condition." soft="Pick what fits the idea." body="Alert on a price, on a level you drew, on a change in percent, or on a condition across the candles." app="Alerts" active="alerts">
      <Win at={0.06} x={40} y={20} w={500} h={490} title="Alert types" glyph="alerts">
        <Row k="Price crosses" v={g ? `Gold above ${fmt(g.hi, g.d)}` : "a price you set"} gold />
        <Row k="Level touched" v="a line you drew on the chart" />
        <Row k="Percent move" v="± 1% within an hour" />
        <Row k="Condition" v="close above the 20-hour average" />
        <Row k="Event reminder" v="15 minutes before US CPI" />
        <p className="mt-4 text-[12px] leading-relaxed text-[#A3AAAC]">The first example uses the high of the last 44 hourly candles from the feed.</p>
      </Win>
      <ChartWin k="XAUUSD" at={0.3} x={570} y={20} w={590} h={490} levels={g ? [{ v: g.hi, label: "Alert · range high", tone: "gold", solid: true }, { v: g.lo, label: "Range low", tone: "ink" }] : undefined} drawFrom={[0.4, 0.55]} />
    </OsSection>
  );
}

function AlertFires() {
  const g = useRange("XAUUSD");
  return (
    <OsSection n={4} label="Alert fires" title="When it happens, you hear first." soft="With what happened and why." body="The alert names the rule that fired, the price at that moment and its source — then leaves the decision to you." app="Alerts" active="alerts">
      <ChartWin k="XAUUSD" at={0.06} x={40} y={20} w={680} h={490} levels={g?.sma20 ? [{ v: g.sma20, label: "20-hour average", tone: "gold" }] : undefined} drawFrom={[0.1, 0.25]} />
      <Note at={0.32} x={750} y={20} w={410} title="Gold · rule met" sub={g ? `Closed ${g.last >= (g.sma20 ?? 0) ? "above" : "below"} the 20-hour average · ${fmt(g.last, g.d)}` : "Waiting for candles from the feed"} />
      <Win at={0.48} x={750} y={110} w={410} h={250} title="Alert detail" glyph="alerts" ai>
        <Row k="Rule" v="close above 20-hour average" />
        <Row k="Price" v={g ? fmt(g.last, g.d) : "—"} />
        <Row k="Average" v={g?.sma20 ? fmt(g.sma20, g.d) : "—"} />
        <Row k="Source" v="hourly candles · feed" />
      </Win>
      <Win at={0.66} x={750} y={380} w={410} h={130} title="Next" glyph="layouts">
        <div className="flex flex-wrap gap-2">
          <Chip>Open chart</Chip>
          <Chip>Snooze 1 hour</Chip>
          <Chip>Pause rule</Chip>
        </div>
      </Win>
    </OsSection>
  );
}

const SCREEN = ["XAUUSD", "XAGUSD", "WTI", "EURUSD", "USDJPY", "GBPUSD", "BTC-USD"] as const;

function ScreenRow({ k }: { k: string }) {
  const r = useRange(k);
  const above = r?.sma20 != null ? r.last > r.sma20 : null;
  return (
    <Row
      k={SYM[k] ?? k}
      v={
        <span className="flex items-center gap-3">
          {r ? <Pct v={r.chg} /> : <span className="text-[#6D7578]">—</span>}
          <span className={above == null ? "text-[#6D7578]" : above ? "text-[#E9B44C]" : "text-[#A3AAAC]"}>{above == null ? "no candles" : above ? "✓ matches" : "no match"}</span>
        </span>
      }
    />
  );
}

function Screeners() {
  return (
    <OsSection n={5} label="Screeners" title="Find what matches." soft="Across your markets at once." body="Run one condition over many instruments. Results come from the same hourly candles, and you can see why each one matched." app="Alerts" active="alerts">
      <Ask at={0.04} x={40} y={10} w={560} text="Which markets are above their 20-hour average?" />
      <Win at={0.12} x={40} y={74} w={560} h={436} title="Screener · above 20-hour average" glyph="alerts" ai>
        {SCREEN.map((k) => (
          <ScreenRow key={k} k={k} />
        ))}
        <p className="mt-3 text-[12px] text-[#A3AAAC]">Change is over the last 44 hourly candles.</p>
      </Win>
      <ChartWin k="XAGUSD" at={0.42} x={630} y={74} w={530} h={436} averages={[{ len: 20 }]} drawFrom={[0.5, 0.65]} />
    </OsSection>
  );
}

function Scans() {
  return (
    <OsSection n={6} label="Scheduled scans" title="Run it on a timetable." soft="Results waiting when you open." body="Save a screener and choose when it runs — before London opens, after the US close, or every hour." app="Alerts" active="alerts">
      <Win at={0.06} x={40} y={20} w={520} h={300} title="Scheduled scans" glyph="calendar">
        <Row k="Before London open" v="12:15 IST · weekdays" gold />
        <Row k="After US close" v="02:45 IST · weekdays" />
        <Row k="Every hour" v="on the hour" />
        <div className="mt-3">
          <Chip tone="sample">Sample schedule</Chip>
        </div>
      </Win>
      <Win at={0.3} x={590} y={20} w={570} h={300} title="Scan history" glyph="layouts">
        <Row k="Today 12:15" v="3 matches" />
        <Row k="Yesterday 02:45" v="2 matches" />
        <Row k="Yesterday 12:15" v="4 matches" />
        <div className="mt-3">
          <Chip tone="sample">Sample history</Chip>
        </div>
      </Win>
      <Note at={0.6} x={40} y={360} w={520} title="Scan finished · 12:15 IST" sub="3 matches · open to see why each matched" />
      <StatusRow at={0.72} />
    </OsSection>
  );
}

function StatusRow({ at }: { at: number }) {
  return (
    <Win at={at} x={590} y={360} w={570} h={150} title="Data used" glyph="settings">
      <Para>Each scan states the candles it used and how fresh they were, so a stale feed is never hidden.</Para>
    </Win>
  );
}

function StrategyTest() {
  return (
    <OsSection n={7} label="Strategy test" title="Test the idea on history." soft="With every cost on the table." body="Run an idea over past candles. Fees, slippage and data coverage are listed before the result, not after it." app="Alerts" active="alerts">
      <ChartWin
        k="XAUUSD"
        at={0.06}
        x={40}
        y={20}
        w={640}
        h={490}
        title="Strategy test · Gold · 1H · sample entries"
        averages={[{ len: 20 }]}
        marks={[
          { i: 10, side: "buy", label: "In" },
          { i: 18, side: "sell", label: "Out" },
          { i: 27, side: "buy", label: "In" },
          { i: 36, side: "sell", label: "Out" },
        ]}
        drawFrom={[0.15, 0.35]}
      />
      <Win at={0.3} x={710} y={20} w={450} h={260} title="Run" glyph="alerts" ai>
        <ScrollSteps
          items={[
            { label: "Load candles", detail: "hourly · feed" },
            { label: "Apply rule", detail: "cross of 20-hour average" },
            { label: "Add costs", detail: "fees · slippage" },
            { label: "Summarise", detail: "trades · drawdown" },
          ]}
          at={[0.34, 0.42, 0.5, 0.58]}
        />
      </Win>
      <Win at={0.5} x={710} y={300} w={450} h={210} title="Costs & assumptions" glyph="settings">
        <Row k="Fees" v="per trade, as you set" />
        <Row k="Slippage" v="per trade, as you set" />
        <Row k="Data" v="hourly candles · gaps listed" />
        <div className="mt-2">
          <Chip tone="sample">Marks are sample entries</Chip>
        </div>
      </Win>
    </OsSection>
  );
}

function Results() {
  return (
    <OsSection n={8} label="Results and review" title="Read the result honestly." soft="No promises about tomorrow." body="Every result shows how many trades it rests on, the worst stretch, and what it assumed. History does not predict future returns." app="Alerts" active="alerts">
      <Win at={0.06} x={40} y={20} w={560} h={330} title="Results · sample test" glyph="chart">
        <Row k="Trades" v="24" />
        <Row k="Winning trades" v="11 of 24" />
        <Row k="Worst stretch" v="5 losing trades in a row" />
        <Row k="After costs" v="shown with fees and slippage" />
        <div className="mt-3 flex gap-2">
          <Chip tone="sample">Sample result</Chip>
        </div>
      </Win>
      <Win at={0.32} x={630} y={20} w={530} h={330} title="Review" glyph="research" ai>
        <Para>24 trades is a small sample. The result leans on two long moves; without them the test is roughly flat.</Para>
        <p className="mt-3 font-mono text-[10.5px] tracking-[0.1em] text-[#E9B44C]">WORTH CHECKING</p>
        <Para>Run it on another period, and with higher costs.</Para>
      </Win>
      <QuoteStrip at={0.6} />
      <Note at={0.76} x={630} y={380} w={530} title="Historical results do not predict future returns" sub="Tests are information, not a signal to trade" />
    </OsSection>
  );
}

function QuoteStrip({ at }: { at: number }) {
  return (
    <Win at={at} x={40} y={380} w={560} h={130} title="Data status" glyph="chart">
      <div className="flex items-center gap-3">
        <Chip tone="delayed">Stored candles</Chip>
        <span className="text-[12.5px] text-[#A3AAAC]">Tests run on stored candles; live prices are labelled where they appear.</span>
      </div>
    </Win>
  );
}
