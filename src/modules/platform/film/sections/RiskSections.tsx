"use client";

// Risk & Trade Review after the hero: seven OS sections; the avatar speaks once (05).
// Account figures here are samples and always marked; prices come from the feed.
import { Ask, AvatarLine, Chip, Note, OsSection, Row, Win } from "@/modules/afvarOs";
import { ChartWin, Para, SYM, ScrollSteps, StatusChip, fmt, useQuote, useRange } from "./shared";

/** A sample position with its market's last price from the feed. */
function PosRow({ k, side, size }: { k: string; side: string; size: string }) {
  const q = useQuote(k);
  return <Row k={`${SYM[k] ?? k} · ${side}`} v={`${size} · now ${q ? fmt(q.last, q.decimals) : "—"}`} />;
}

/** The last price of a market from the feed, with its status. */
function LastRow({ k, label }: { k: string; label?: string }) {
  const q = useQuote(k);
  return (
    <Row
      k={label ?? `${SYM[k] ?? k} · last`}
      v={
        <span className="flex items-center gap-2">
          {q ? fmt(q.last, q.decimals) : "—"}
          <StatusChip q={q} />
        </span>
      }
    />
  );
}

export function RiskSections() {
  return (
    <>
      <ReadOnly />
      <Portfolio />
      <Limits />
      <Guardian />
      <Replay />
      <Journal />
      <Performance />
    </>
  );
}

function ReadOnly() {
  return (
    <OsSection n={2} label="Read-only connection" title="Connect to look, never to trade." soft="Read-only, by design." body="A supported account connects with read-only access. AFVAR can see positions and history; it cannot place, change or close an order." app="Risk review" active="risk">
      <Win at={0.06} x={40} y={20} w={560} h={200} title="Connect an account" glyph="settings">
        <ScrollSteps
          items={[
            { label: "Choose broker", detail: "supported list" },
            { label: "Grant access", detail: "read-only scope" },
            { label: "Check scope", detail: "no trading permission" },
            { label: "Sync", detail: "positions and history" },
          ]}
          at={[0.12, 0.22, 0.32, 0.42]}
        />
      </Win>
      <Win at={0.4} x={630} y={20} w={530} h={200} title="Permissions" glyph="risk" ai>
        <Row k="See positions" v={<span className="text-[#00E676]">✓ allowed</span>} />
        <Row k="See trade history" v={<span className="text-[#00E676]">✓ allowed</span>} />
        <Row k="Place or change orders" v={<span className="text-[#FF8A8A]">✕ never</span>} />
        <Row k="Move money" v={<span className="text-[#FF8A8A]">✕ never</span>} />
      </Win>
      <Note at={0.56} x={40} y={236} w={560} title="Account connected · read-only" sub="Disconnect at any time from Settings" />
      <Win at={0.64} x={40} y={310} w={560} h={200} title="Connections" glyph="settings">
        <Row k="Sample broker account" v={<Chip tone="gold">Read-only</Chip>} />
        <Row k="Shares with AFVAR" v="positions · trade history" />
        <Row k="Trading permission" v="not requested" />
        <Row k="Prices shown" v="from AFVAR’s market data feed" />
      </Win>
      <Win at={0.74} x={630} y={240} w={530} h={270} title="After sync · sample account" glyph="risk">
        <PosRow k="XAUUSD" side="long" size="0.5 lot" />
        <PosRow k="XAGUSD" side="long" size="1.0 lot" />
        <PosRow k="EURUSD" side="short" size="0.3 lot" />
        <PosRow k="USDJPY" side="long" size="0.2 lot" />
        <p className="mt-2 text-[12px] text-[#B7C5BC]">Positions are a sample; “now” prices are the latest from the feed.</p>
        <div className="mt-3">
          <Chip tone="sample">Sample account</Chip>
        </div>
      </Win>
    </OsSection>
  );
}

function Portfolio() {
  return (
    <OsSection n={3} label="Portfolio" title="What you hold." soft="And where it leans." body="Open positions grouped by market and by currency, so two trades that are really the same bet show up together." app="Risk review" active="risk">
      <Win at={0.06} x={40} y={20} w={560} h={218} title="Positions · sample account" glyph="risk">
        <PosRow k="XAUUSD" side="long" size="0.5 lot" />
        <PosRow k="XAGUSD" side="long" size="1.0 lot" />
        <PosRow k="EURUSD" side="short" size="0.3 lot" />
        <PosRow k="USDJPY" side="long" size="0.2 lot" />
        <div className="mt-3">
          <Chip tone="sample">Sample account</Chip>
        </div>
      </Win>
      <Win at={0.3} x={630} y={20} w={530} h={218} title="Exposure" glyph="research" ai>
        <ExposureBar label="Precious metals" pct={58} gold />
        <ExposureBar label="Short US dollar" pct={71} />
        <ExposureBar label="Japanese yen" pct={12} />
        <p className="mt-3 text-[12.5px] leading-relaxed text-[#B7C5BC]">Gold and Silver both rise when the dollar falls — most of this account is one idea.</p>
      </Win>
      <ChartWin k="XAGUSD" at={0.55} x={40} y={258} w={1120} h={252} head={false} title="Silver · 1H · the second metals position" last={60} />
    </OsSection>
  );
}

function ExposureBar({ label, pct, gold = false }: { label: string; pct: number; gold?: boolean }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-[12.5px]">
        <span className="text-[#F2F5F2]">{label}</span>
        <span className="font-mono text-[#B7C5BC]">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.08)]">
        <div className={`h-full rounded-full ${gold ? "bg-[#A8DEC2]" : "bg-[#B7C5BC]"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Limits() {
  const g = useRange("XAUUSD");
  return (
    <OsSection n={4} label="Personal limits" title="Your limits, written down." soft="Shown before you need them." body="Set a daily loss limit, a size per trade and how many trades a day. AFVAR shows where you stand against each one." app="Risk review" active="risk">
      <Win at={0.06} x={40} y={20} w={560} h={230} title="Personal limits" glyph="settings">
        <LimitRow k="Daily loss limit" used={40} v="₹4,000 of ₹10,000" />
        <LimitRow k="Size per trade" used={50} v="0.5 of 1.0 lot" />
        <LimitRow k="Trades today" used={60} v="3 of 5" />
        <div className="mt-2">
          <Chip tone="sample">Sample limits</Chip>
        </div>
      </Win>
      <ChartWin k="XAUUSD" at={0.2} x={40} y={270} w={560} h={240} title="Market data · Gold · 1H · your largest open risk" />
      <Ask at={0.32} x={630} y={20} w={530} text="How close am I to my daily limit?" />
      <Win at={0.44} x={630} y={84} w={530} h={330} title="Answer" glyph="risk" ai>
        <Para>You have used 40% of today’s loss limit, with 2 trades left. Your largest open risk is the Gold position.</Para>
        <div className="mt-3">
          <Row k="Loss used today" v="₹4,000 of ₹10,000" gold />
          <Row k="Trades left today" v="2 of 5" />
          <Row k="Largest open risk" v="Gold · long 0.5 lot" />
          <LastRow k="XAUUSD" label="Gold · last price" />
          <Row k="Gold · 20-hour average" v={g?.sma20 ? fmt(g.sma20, g.d) : "—"} />
        </div>
        <div className="mt-3">
          <Chip tone="sample">Sample limits · live Gold price</Chip>
        </div>
      </Win>
      <Note at={0.68} x={630} y={434} w={530} title="Limits are yours to set" sub="AFVAR shows them; it never blocks or places a trade" />
    </OsSection>
  );
}

function LimitRow({ k, used, v }: { k: string; used: number; v: string }) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex justify-between text-[13px]">
        <span className="text-[#F2F5F2]">{k}</span>
        <span className="font-mono text-[11.5px] text-[#B7C5BC]">{v}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.08)]">
        <div className="h-full rounded-full bg-[#A8DEC2]" style={{ width: `${used}%` }} />
      </div>
    </div>
  );
}

function Guardian() {
  return (
    <OsSection n={5} label="Risk Guardian" title="A second look before you act." soft="Calm, specific, sourced." body="Risk Guardian points out what you might miss: a news event soon, a position that doubles one you hold, a limit getting close." app="Risk review" active="risk">
      <ChartWin k="XAUUSD" at={0.06} x={40} y={20} w={620} h={490} event={{ i: 43, label: "CPI soon" }} />
      <Win at={0.26} x={690} y={20} w={470} h={290} title="Risk Guardian" glyph="risk" ai>
        <Row k="Event soon" v="US CPI in 40 minutes" gold />
        <Row k="Overlap" v="Gold and Silver lean the same way" />
        <Row k="Limit" v="40% of daily loss used" />
        <LastRow k="XAUUSD" />
        <LastRow k="XAGUSD" />
        <div className="mt-3">
          <Chip tone="sample">Sample account</Chip>
        </div>
      </Win>
      <AvatarLine at={0.5} x={832} y={332} text="CPI is out in 40 minutes, and your two metals trades lean the same way." />
      <Note at={0.74} x={690} y={440} w={470} title="Information, not advice" sub="The decision stays with you" />
    </OsSection>
  );
}

const ENTRY = 14;

function Replay() {
  const g = useRange("XAUUSD");
  const q = useQuote("XAUUSD");
  // The sample exit sits on the sharpest red hourly candle after the entry, so "left after a sharp drop" matches the candles.
  const candles = (q?.candles ?? []).slice(-44);
  let exit = 29;
  let worst = 0;
  for (let i = ENTRY + 4; i < candles.length - 3; i++) {
    const drop = candles[i].o - candles[i].c;
    if (drop > worst) {
      worst = drop;
      exit = i;
    }
  }
  return (
    <OsSection n={6} label="Trade replay" title="Replay a past trade." soft="On the candles it happened on." body="See where you entered and left, what the market did around it, and what you wrote at the time." app="Risk review" active="risk">
      <ChartWin
        k="XAUUSD"
        at={0.06}
        x={40}
        y={20}
        w={720}
        h={490}
        title="Trade replay · Gold · 1H · sample trade"
        marks={[
          { i: ENTRY, side: "buy", label: "Entry" },
          { i: exit, side: "sell", label: "Exit" },
        ]}
        band={[ENTRY, exit]}
      />
      <Win at={0.32} x={790} y={20} w={370} h={266} title="This trade" glyph="journal">
        <Row k="Held" v={`${exit - ENTRY} hours`} />
        <Row k="Size" v="0.5 lot" />
        <Row k="Planned exit" v="at the range high" />
        <Row k="Range high · feed" v={g ? fmt(g.hi, g.d) : "—"} />
        <Row k="Exit candle close · feed" v={candles[exit] ? fmt(candles[exit].c, g?.d) : "—"} />
        <div className="mt-3">
          <Chip tone="sample">Sample trade · real candles</Chip>
        </div>
      </Win>
      <Win at={0.56} x={790} y={306} w={370} h={204} title="What changed" glyph="research" ai>
        <Para>You left before your planned exit, right after a sharp hourly drop.</Para>
        <p className="mt-3 font-mono text-[10.5px] tracking-[0.1em] text-[#A8DEC2]">YOU WROTE AT THE TIME</p>
        <p className="mt-1 text-[13px] italic leading-relaxed text-[#F2F5F2]">“Plan: hold to range high. Left early after one red candle.”</p>
        <div className="mt-3">
          <Chip tone="sample">From the sample journal · Mon</Chip>
        </div>
      </Win>
    </OsSection>
  );
}

function Journal() {
  return (
    <OsSection n={7} label="Journal" title="Write down the why." soft="Read it back later." body="Each trade gets a note: the plan, how you felt and what you would change. AFVAR links it to the chart and finds patterns over time." app="Risk review" active="risk">
      <Win at={0.06} x={40} y={20} w={600} h={490} title="Journal · sample entries" glyph="journal">
        <JournalEntry d="Mon" t="Gold long" note="Plan: hold to range high. Left early after one red candle." />
        <JournalEntry d="Tue" t="USD/JPY long" note="Closed as soon as it turned red, well before my exit." />
        <JournalEntry d="Wed" t="EUR/USD short" note="Followed the plan. Small loss, within limit." />
        <JournalEntry d="Thu" t="Silver long" note="Entered before CPI without checking the calendar." />
        <JournalEntry d="Fri" t="Gold long" note="Opened just before payrolls, then closed early when it jumped." />
        <div className="mt-3">
          <Chip tone="sample">Sample journal</Chip>
        </div>
      </Win>
      <Ask at={0.36} x={670} y={20} w={490} text="What keeps going wrong in my journal?" />
      <Win at={0.48} x={670} y={78} w={490} h={180} title="Patterns" glyph="research" ai>
        <Row k="Early exits" v="3 of the last 5 trades · Mon, Tue, Fri" gold />
        <Row k="Trades near big events" v="2 of the last 5 · Thu, Fri" />
        <Row k="Plan followed" v="1 of the last 5 · Wed" />
        <p className="mt-3 text-[12.5px] text-[#B7C5BC]">Drawn only from what you wrote.</p>
      </Win>
      <ChartWin k="XAUUSD" at={0.62} x={670} y={278} w={490} h={232} title="Linked chart · Gold · 1H" />
    </OsSection>
  );
}

function JournalEntry({ d, t, note }: { d: string; t: string; note: string }) {
  return (
    <div className="mb-3 rounded-lg border border-[rgba(255,255,255,0.1)] p-3">
      <p className="font-mono text-[10.5px] tracking-[0.1em] text-[#92A399]">
        {d.toUpperCase()} · {t.toUpperCase()}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-[#F2F5F2]">{note}</p>
    </div>
  );
}

function Stat({ at, x, title, glyph, n, of, line }: { at: number; x: number; title: string; glyph: "chart" | "risk" | "journal"; n: number; of: number; line: string }) {
  return (
    <Win at={at} x={x} y={20} w={360} h={160} title={title} glyph={glyph}>
      <p className="text-[34px] font-semibold leading-tight text-[#F2F5F2]">
        {n} of {of}
      </p>
      <p className="text-[12.5px] text-[#B7C5BC]">{line}</p>
      <div className="mt-3 h-1.5 rounded-full bg-[rgba(255,255,255,0.08)]">
        <div className="h-full rounded-full bg-[#A8DEC2]" style={{ width: `${Math.round((n / of) * 100)}%` }} />
      </div>
    </Win>
  );
}

function Performance() {
  return (
    <OsSection n={8} label="Performance" title="How you trade, over time." soft="Discipline, not just results." body="Plans kept, limits respected and how you handled losing streaks — measured from your own record, for you alone." app="Risk review" active="risk">
      <Stat at={0.06} x={40} title="Plans kept" glyph="chart" n={7} of={12} line="trades followed the written plan" />
      <Stat at={0.16} x={420} title="Limits respected" glyph="risk" n={19} of={20} line="days within the daily loss limit" />
      <Stat at={0.26} x={800} title="After a loss" glyph="journal" n={2} of={4} line="next trades were larger than planned" />
      <Win at={0.44} x={40} y={200} w={560} h={240} title="Monthly review" glyph="research" ai>
        <Para>Your plans work best when you hold to them. The month’s weak spot was size after a loss — worth a limit of its own.</Para>
        <p className="mb-1 mt-3 font-mono text-[10.5px] tracking-[0.1em] text-[#A8DEC2]">WORTH A LIMIT OF ITS OWN</p>
        <Row k="Size after a loss" v="2 of 4 next trades larger than planned" gold />
        <Row k="Where to set it" v="Personal limits · size per trade" />
        <div className="mt-3">
          <Chip tone="sample">Sample month</Chip>
        </div>
      </Win>
      <Win at={0.56} x={630} y={200} w={530} h={310} title="How each figure is counted" glyph="settings">
        <Row k="Trades counted" v="12 this month" />
        <Row k="Days counted" v="20 this month" />
        <Row k="Plans kept" v="trade matched its written plan" />
        <Row k="Limits respected" v="day ended within the loss limit" />
        <Row k="After a loss" v="next trade’s size against the plan" />
        <p className="mt-3 text-[12.5px] leading-relaxed text-[#B7C5BC]">Counted from your journal and synced trade history only.</p>
        <div className="mt-3">
          <Chip tone="sample">Sample month</Chip>
        </div>
      </Win>
      <Note at={0.7} x={40} y={456} w={560} title="Private by default" sub="Only you see your record unless you share it" />
    </OsSection>
  );
}
