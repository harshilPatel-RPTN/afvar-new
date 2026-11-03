"use client";

// Research & Analysis after the hero: seven OS sections; the avatar speaks once (05).
import { Ask, AvatarLine, Chip, Note, OsSection, Pct, Row, Steps, Win } from "@/modules/afvarOs";
import { useMemo } from "react";
import { ChartWin, Para, SYM, StatusChip, fmt, sourceLine, useQuote, useRange } from "./shared";

/** One market from the feed: last price and change over the newest 44 hourly candles. */
function LiveRow({ k }: { k: string }) {
  const r = useRange(k);
  return (
    <Row
      k={SYM[k] ?? k}
      v={
        <span className="flex items-center gap-3">
          <span>{r ? fmt(r.last, r.d) : "—"}</span>
          {r ? <Pct v={r.chg} /> : null}
        </span>
      }
    />
  );
}

/** Source and freshness of one market, as a header line. */
function SourceHead({ k }: { k: string }) {
  const q = useQuote(k);
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <StatusChip q={q} />
      <span className="min-w-0 truncate font-mono text-[10px] text-[#92A399]">{sourceLine(q)}</span>
    </div>
  );
}

export function ResearchSections() {
  return (
    <>
      <OsSection n={2} label="Calendar" title="The week ahead." soft="And what matters to you." body="Every scheduled release, with its time in IST and how much it usually moves markets. Ask which ones matter for what you follow." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={580} h={236} title="Economic calendar · sample week" glyph="calendar">
          <Row k="Tue · US CPI" v="18:00 IST · high" gold />
          <Row k="Wed · FOMC minutes" v="23:30 IST · medium" />
          <Row k="Thu · ECB decision" v="18:15 IST · high" />
          <Row k="Fri · US payrolls" v="19:00 IST · high" gold />
          <div className="mt-3">
            <Chip tone="sample">Sample week</Chip>
          </div>
        </Win>
        <ChartWin k="EURUSD" at={0.2} x={40} y={276} w={580} h={234} title="Market data · EUR/USD · 1H · the dollar side" />
        <Ask at={0.3} x={660} y={20} w={500} text="What matters for Gold this week?" />
        <Win at={0.45} x={660} y={80} w={500} h={146} title="Answer" glyph="research" ai>
          <Para>
            Two events: <b className="text-[#A8DEC2]">US CPI</b> on Tuesday and <b className="text-[#A8DEC2]">US payrolls</b> on Friday. Both move the dollar, the currency Gold is priced in.
          </Para>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tone="gold">[1] Economic calendar</Chip>
            <Chip tone="gold">[2] Your watchlist</Chip>
          </div>
        </Win>
        <ChartWin k="XAUUSD" at={0.6} x={660} y={246} w={500} h={264} />
      </OsSection>

      <OsSection n={3} label="Event analysis" title="Before an event." soft="What it may mean." body="Scenarios in plain words and how the market reacted to past releases — possibilities, not predictions." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={560} h={248} title="Event analysis · US CPI" glyph="research" ai>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[rgba(255,255,255,0.12)] p-2.5">
              <b className="text-[13px] text-[#F2F5F2]">Hotter than forecast</b>
              <p className="mt-1 text-[12.5px] text-[#B7C5BC]">Dollar often firms; Gold often eases.</p>
            </div>
            <div className="rounded-lg border border-[rgba(255,255,255,0.12)] p-2.5">
              <b className="text-[13px] text-[#F2F5F2]">Cooler than forecast</b>
              <p className="mt-1 text-[12.5px] text-[#B7C5BC]">Dollar often softens; Gold often lifts.</p>
            </div>
          </div>
          <p className="mb-1 mt-4 font-mono text-[10.5px] tracking-[0.12em] text-[#92A399]">PAST RELEASES · FIRST HOUR</p>
          <Row k="Each release, with Gold's first-hour move" v="from the candles" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tone="sample">Sample layout</Chip>
            <Chip tone="gold">Each line links its source</Chip>
          </div>
        </Win>
        <GoldNow at={0.2} x={40} y={288} w={560} h={222} />
        <ChartWin k="XAUUSD" at={0.35} x={630} y={20} w={530} h={490} />
      </OsSection>

      <OsSection n={4} label="News and sentiment" title="Headlines, sorted for you." soft="With source and time." body="Each headline is tagged to the instruments it touches. AI groups them by the markets you follow and says which way they lean." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={640} h={236} title="News · sample headlines" glyph="news">
          <Row k="US data beats forecasts; dollar firms" v="06:31 · newswire" />
          <Row k="Oil output talks extended" v="06:12 · newswire" />
          <Row k="Central bank buying continues" v="05:58 · newswire" />
          <Row k="Euro slips after PMI" v="05:40 · newswire" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip>XAU · USD</Chip>
            <Chip>WTI</Chip>
            <Chip tone="sample">Sample headlines</Chip>
          </div>
        </Win>
        <ChartWin k="XAUUSD" at={0.25} x={40} y={276} w={640} h={234} title="Market data · Gold · 1H · tagged in 3 headlines" />
        <Win at={0.4} x={710} y={20} w={450} h={170} title="Grouped for your markets" glyph="research" ai>
          <Row k="Gold" v="3 headlines · leaning negative" />
          <Row k="Crude oil" v="1 headline · mixed" />
          <Row k="EUR/USD" v="1 headline · negative" />
        </Win>
        <ChartWin k="WTI" at={0.55} x={710} y={210} w={450} h={300} />
      </OsSection>

      <OsSection n={5} label="Explain a move" title="Why did it move?" soft="Asked and answered." body="Point at a move on the candles and ask. The answer comes with numbered sources; open any of them." app="Research" active="research">
        <Ask at={0.04} x={40} y={6} w={640} text="Why did Gold drop here?" />
        <DropChart />
        <Win at={0.35} x={710} y={6} w={450} h={262} title="Answer" glyph="research" ai>
          <Para>
            Two reasons, both sourced: US data beat forecasts <span className="text-[#A8DEC2]">[1]</span>, and the dollar rose against most currencies <span className="text-[#A8DEC2]">[2]</span>.
          </Para>
          <p className="mb-1 mt-3 font-mono text-[10.5px] tracking-[0.12em] text-[#92A399]">SOURCES</p>
          <Row k="[1] Newswire" v="headline · 06:31 UTC" />
          <Row k="[2] Market data" v="dollar pairs · hourly candles" />
          <div className="mt-3">
            <Chip tone="sample">Sample answer · sources linked</Chip>
          </div>
        </Win>
        <AvatarLine at={0.55} x={832} y={300} text="Two reasons, both with sources. Tap [1] to read it." />
        <Note at={0.72} x={710} y={400} w={450} title="[1] Newswire · 06:31 UTC" sub="US data beats forecasts; dollar firms" />
      </OsSection>

      <OsSection n={6} label="Market briefs" title="The market in two minutes." soft="Morning, evening, weekly." body="Short editions on a fixed schedule, each line numbered to its source." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={360} h={204} title="Briefs" glyph="journal">
          <Row k="Morning brief" v="07:00 IST" gold />
          <Row k="Evening wrap" v="18:30 IST" />
          <Row k="Weekly outlook" v="Sunday" />
          <Row k="Event preview" v="before big releases" />
        </Win>
        <Win at={0.22} x={430} y={20} w={730} h={250} title="Morning brief · sample edition" glyph="journal">
          <p className="font-mono text-[10.5px] text-[#A8DEC2]">GOLD</p>
          <Para>Lower as the dollar firmed after US data [1] [2]</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#A8DEC2]">DOLLAR</p>
          <Para>Higher against most majors this morning [3]</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#A8DEC2]">TODAY</p>
          <Para>US CPI at 18:00 IST [4]</Para>
          <div className="mt-3">
            <Chip tone="sample">Sample edition</Chip>
          </div>
        </Win>
        <Win at={0.38} x={430} y={290} w={730} h={220} title="Markets in this brief · from the feed" glyph="chart">
          <SourceHead k="XAUUSD" />
          <LiveRow k="XAUUSD" />
          <LiveRow k="EURUSD" />
          <LiveRow k="USDJPY" />
          <p className="mt-2 text-[12px] text-[#B7C5BC]">Last price and change over the newest 44 hourly candles.</p>
        </Win>
        <ChartWin k="XAUUSD" at={0.52} x={40} y={244} w={360} h={266} />
      </OsSection>

      <OsSection n={7} label="Deep research" title="Longer questions." soft="Researched step by step." body="AFVAR gathers sources, reads them, checks every claim, then writes. Stop it at any step; what is done stays." app="Research" active="research">
        <Ask at={0.04} x={40} y={6} w={1120} text="Research: what drives Gold in a strong-dollar week?" />
        <Win at={0.12} x={40} y={62} w={460} h={192} title="Deep research" glyph="research" ai>
          <Steps
            items={[
              { label: "Gather", detail: "12 sources", state: "ok" },
              { label: "Read", detail: "12 of 12", state: "ok" },
              { label: "Check", detail: "claims against sources", state: "ok" },
              { label: "Write", detail: "report", state: "idle" },
            ]}
          />
        </Win>
        <ChartWin k="XAUUSD" at={0.26} x={40} y={274} w={460} h={236} />
        <Win at={0.4} x={530} y={62} w={630} h={204} title="Report · draft" glyph="journal" ai>
          <p className="font-mono text-[10.5px] text-[#A8DEC2]">1 · THE DOLLAR LINK</p>
          <Para>Gold is priced in dollars, so a firmer dollar often weighs on it [1] [2]</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#A8DEC2]">2 · RATES</p>
          <Para>Higher yields raise the cost of holding Gold [3]</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#A8DEC2]">3 · DEMAND</p>
          <Para>Central bank buying can offset it [4]</Para>
        </Win>
        <ChartWin k="EURUSD" at={0.56} x={530} y={286} w={630} h={224} title="Market data · EUR/USD · 1H · the dollar side" />
      </OsSection>

      <OsSection n={8} label="Supporting sources" title="Tap any claim." soft="See where it came from." body="Every explanation keeps its sources: what they are, where they are from and when." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={560} h={84} title="Morning brief" glyph="journal">
          <Para>
            Gold fell <span className="border-b border-[#A8DEC2] bg-[rgba(168,222,194,0.15)]">as the dollar firmed after US data</span> <span className="text-[#A8DEC2]">[1]</span>. Central bank buying continues <span className="text-[#A8DEC2]">[3]</span>.
          </Para>
        </Win>
        <ChartWin k="XAUUSD" at={0.18} x={40} y={124} w={560} h={386} />
        <Win at={0.3} x={630} y={20} w={530} h={204} title="Sources for the highlighted claim" glyph="settings">
          <Row k="[1] Newswire" v="headline · 06:31 UTC" />
          <Row k="[2] Gold-API" v="price · spot" />
          <Row k="[3] Newswire" v="headline · 05:58 UTC" />
          <div className="mt-3">
            <span className="rounded-full border border-[rgba(255,255,255,0.18)] px-3 py-1 text-[12px]">Open source →</span>
          </div>
        </Win>
        <GoldNow at={0.48} x={630} y={244} w={530} h={266} title="[2] Gold price · as received" price />
      </OsSection>
    </>
  );
}

/** Gold from the feed: last price, range of the newest 44 hourly candles and the 20-hour average. */
function GoldNow({ at, x, y, w, h, title = "Gold now · from the feed", price = false }: { at: number; x: number; y: number; w: number; h: number; title?: string; price?: boolean }) {
  const g = useRange("XAUUSD");
  return (
    <Win at={at} x={x} y={y} w={w} h={h} title={title} glyph="chart">
      {price ? <p className="text-[26px] font-semibold leading-tight text-[#F2F5F2]">{g ? fmt(g.last, g.d) : "—"}</p> : null}
      <SourceHead k="XAUUSD" />
      {price ? null : <Row k="Last price" v={g ? fmt(g.last, g.d) : "—"} gold />}
      <Row k="High · last 44 hours" v={g ? fmt(g.hi, g.d) : "—"} />
      <Row k="Low · last 44 hours" v={g ? fmt(g.lo, g.d) : "—"} />
      <Row k="20-hour average" v={g?.sma20 ? fmt(g.sma20, g.d) : "—"} />
      {price ? <Row k="Change · last 44 hours" v={g ? <Pct v={g.chg} /> : "—"} /> : null}
    </Win>
  );
}

/** Gold's chart with the band on the steepest four-candle drop in the window, so "drop here" points at a real fall. */
function DropChart() {
  const q = useQuote("XAUUSD");
  const band = useMemo(() => {
    const c = (q?.candles ?? []).slice(-44);
    if (c.length < 6) return undefined;
    let best = 0;
    let at = -1;
    for (let i = 0; i + 4 < c.length; i++) {
      const drop = c[i].o - c[i + 4].c;
      if (drop > best) {
        best = drop;
        at = i;
      }
    }
    return at < 0 ? undefined : ([at, at + 4] as const);
  }, [q]);
  return <ChartWin k="XAUUSD" at={0.1} x={40} y={62} w={640} h={450} band={band} />;
}
