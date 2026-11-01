"use client";

// Risk & Trade Review after the hero: seven OS sections; the avatar speaks once (05).
// Account figures here are samples and always marked; prices come from the feed.
import { Ask, AvatarLine, Chip, Note, OsSection, Row, Win } from "@/modules/afvarOs";
import { ChartWin, Para, ScrollSteps } from "./shared";

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
      <Win at={0.06} x={40} y={20} w={560} h={340} title="Connect an account" glyph="settings">
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
      <Win at={0.4} x={630} y={20} w={530} h={260} title="Permissions" glyph="risk" ai>
        <Row k="See positions" v={<span className="text-[#00E676]">✓ allowed</span>} />
        <Row k="See trade history" v={<span className="text-[#00E676]">✓ allowed</span>} />
        <Row k="Place or change orders" v={<span className="text-[#FF8A8A]">✕ never</span>} />
        <Row k="Move money" v={<span className="text-[#FF8A8A]">✕ never</span>} />
      </Win>
      <Note at={0.64} x={630} y={310} w={530} title="Account connected · read-only" sub="Disconnect at any time from Settings" />
      <Win at={0.74} x={40} y={390} w={560} h={120} title="Connections" glyph="settings">
        <Row k="Sample broker account" v={<Chip tone="gold">Read-only</Chip>} />
      </Win>
    </OsSection>
  );
}

function Portfolio() {
  return (
    <OsSection n={3} label="Portfolio" title="What you hold." soft="And where it leans." body="Open positions grouped by market and by currency, so two trades that are really the same bet show up together." app="Risk review" active="risk">
      <Win at={0.06} x={40} y={20} w={560} h={300} title="Positions · sample account" glyph="risk">
        <Row k="Gold · long" v="0.5 lot" />
        <Row k="Silver · long" v="1.0 lot" />
        <Row k="EUR/USD · short" v="0.3 lot" />
        <Row k="USD/JPY · long" v="0.2 lot" />
        <div className="mt-3">
          <Chip tone="sample">Sample account</Chip>
        </div>
      </Win>
      <Win at={0.3} x={630} y={20} w={530} h={300} title="Exposure" glyph="research" ai>
        <ExposureBar label="Precious metals" pct={58} gold />
        <ExposureBar label="Short US dollar" pct={71} />
        <ExposureBar label="Japanese yen" pct={12} />
        <p className="mt-3 text-[12.5px] leading-relaxed text-[#B7C5BC]">Gold and Silver both rise when the dollar falls — most of this account is one idea.</p>
      </Win>
      <ChartWin k="XAGUSD" at={0.55} x={40} y={340} w={1120} h={170} head={false} title="Silver · 1H · the second metals position" last={60} />
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
  return (
    <OsSection n={4} label="Personal limits" title="Your limits, written down." soft="Shown before you need them." body="Set a daily loss limit, a size per trade and how many trades a day. AFVAR shows where you stand against each one." app="Risk review" active="risk">
      <Win at={0.06} x={40} y={20} w={560} h={330} title="Personal limits" glyph="settings">
        <LimitRow k="Daily loss limit" used={40} v="₹4,000 of ₹10,000" />
        <LimitRow k="Size per trade" used={50} v="0.5 of 1.0 lot" />
        <LimitRow k="Trades today" used={60} v="3 of 5" />
        <div className="mt-2">
          <Chip tone="sample">Sample limits</Chip>
        </div>
      </Win>
      <Ask at={0.32} x={630} y={20} w={530} text="How close am I to my daily limit?" />
      <Win at={0.44} x={630} y={84} w={530} h={200} title="Answer" glyph="risk" ai>
        <Para>You have used 40% of today’s loss limit, with 2 trades left. Your largest open risk is the Gold position.</Para>
      </Win>
      <Note at={0.68} x={630} y={310} w={530} title="Limits are yours to set" sub="AFVAR shows them; it never blocks or places a trade" />
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
      <ChartWin k="XAUUSD" at={0.06} x={40} y={20} w={620} h={490} event={{ i: 40, label: "US CPI in 40 min" }} />
      <Win at={0.26} x={690} y={20} w={470} h={290} title="Risk Guardian" glyph="risk" ai>
        <Row k="Event soon" v="US CPI in 40 minutes" gold />
        <Row k="Overlap" v="Gold and Silver lean the same way" />
        <Row k="Limit" v="40% of daily loss used" />
        <div className="mt-3">
          <Chip tone="sample">Sample account</Chip>
        </div>
      </Win>
      <AvatarLine at={0.5} x={720} y={340} text="CPI is out in 40 minutes, and your two metals trades lean the same way." />
      <Note at={0.74} x={690} y={440} w={470} title="Information, not advice" sub="The decision stays with you" />
    </OsSection>
  );
}

function Replay() {
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
          { i: 14, side: "buy", label: "Entry" },
          { i: 29, side: "sell", label: "Exit" },
        ]}
        band={[14, 29]}
      />
      <Win at={0.32} x={790} y={20} w={370} h={260} title="This trade" glyph="journal">
        <Row k="Held" v="15 hours" />
        <Row k="Size" v="0.5 lot" />
        <Row k="Planned exit" v="at the range high" />
        <div className="mt-3">
          <Chip tone="sample">Sample trade · real candles</Chip>
        </div>
      </Win>
      <Win at={0.56} x={790} y={300} w={370} h={210} title="What changed" glyph="research" ai>
        <Para>You left before your planned exit, right after a sharp hourly drop.</Para>
      </Win>
    </OsSection>
  );
}

function Journal() {
  return (
    <OsSection n={7} label="Journal" title="Write down the why." soft="Read it back later." body="Each trade gets a note: the plan, how you felt and what you would change. AFVAR links it to the chart and finds patterns over time." app="Risk review" active="risk">
      <Win at={0.06} x={40} y={20} w={600} h={490} title="Journal · sample entries" glyph="journal">
        <JournalEntry d="Mon" t="Gold long" note="Plan: hold to range high. Left early after one red candle." />
        <JournalEntry d="Wed" t="EUR/USD short" note="Followed the plan. Small loss, within limit." />
        <JournalEntry d="Thu" t="Silver long" note="Entered before CPI without checking the calendar." />
        <div className="mt-3">
          <Chip tone="sample">Sample journal</Chip>
        </div>
      </Win>
      <Ask at={0.36} x={670} y={20} w={490} text="What keeps going wrong in my journal?" />
      <Win at={0.48} x={670} y={84} w={490} h={260} title="Patterns" glyph="research" ai>
        <Row k="Early exits" v="3 of the last 5 trades" gold />
        <Row k="Trades near big events" v="2 of the last 5" />
        <p className="mt-3 text-[12.5px] text-[#B7C5BC]">Drawn only from what you wrote.</p>
      </Win>
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

function Performance() {
  return (
    <OsSection n={8} label="Performance" title="How you trade, over time." soft="Discipline, not just results." body="Plans kept, limits respected and how you handled losing streaks — measured from your own record, for you alone." app="Risk review" active="risk">
      <Win at={0.06} x={40} y={20} w={360} h={230} title="Plans kept" glyph="chart">
        <p className="text-[34px] font-semibold text-[#F2F5F2]">7 of 12</p>
        <p className="text-[12.5px] text-[#B7C5BC]">trades followed the written plan</p>
      </Win>
      <Win at={0.16} x={420} y={20} w={360} h={230} title="Limits respected" glyph="risk">
        <p className="text-[34px] font-semibold text-[#F2F5F2]">19 of 20</p>
        <p className="text-[12.5px] text-[#B7C5BC]">days within the daily loss limit</p>
      </Win>
      <Win at={0.26} x={800} y={20} w={360} h={230} title="After a loss" glyph="journal">
        <p className="text-[34px] font-semibold text-[#F2F5F2]">2 of 4</p>
        <p className="text-[12.5px] text-[#B7C5BC]">next trades were larger than planned</p>
      </Win>
      <Win at={0.44} x={40} y={280} w={740} h={230} title="Monthly review" glyph="research" ai>
        <Para>Your plans work best when you hold to them. The month’s weak spot was size after a loss — worth a limit of its own.</Para>
        <div className="mt-3">
          <Chip tone="sample">Sample month</Chip>
        </div>
      </Win>
      <Note at={0.66} x={800} y={280} w={360} title="Private by default" sub="Only you see your record unless you share it" />
    </OsSection>
  );
}
