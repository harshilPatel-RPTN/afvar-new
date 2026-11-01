"use client";

// Research & Analysis after the hero: seven OS sections; the avatar speaks once (05).
import { Ask, AvatarLine, Chip, Note, OsSection, Row, Steps, Win } from "@/modules/afvarOs";
import { ChartWin, Para } from "./shared";

export function ResearchSections() {
  return (
    <>
      <OsSection n={2} label="Calendar" title="The week ahead." soft="And what matters to you." body="Every scheduled release, with its time in IST and how much it usually moves markets. Ask which ones matter for what you follow." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={580} h={330} title="Economic calendar · sample week" glyph="calendar">
          <Row k="Tue · US CPI" v="18:00 IST · high" gold />
          <Row k="Wed · FOMC minutes" v="23:30 IST · medium" />
          <Row k="Thu · ECB decision" v="18:15 IST · high" />
          <Row k="Fri · US payrolls" v="19:00 IST · high" gold />
          <div className="mt-3">
            <Chip tone="sample">Sample week</Chip>
          </div>
        </Win>
        <Ask at={0.3} x={660} y={20} w={500} text="What matters for Gold this week?" />
        <Win at={0.45} x={660} y={80} w={500} h={260} title="Answer" glyph="research" ai>
          <Para>
            Two events: <b className="text-[#E9B44C]">US CPI</b> on Tuesday and <b className="text-[#E9B44C]">US payrolls</b> on Friday. Both move the dollar, the currency Gold is priced in.
          </Para>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tone="gold">[1] Economic calendar</Chip>
            <Chip tone="gold">[2] Your watchlist</Chip>
          </div>
        </Win>
      </OsSection>

      <OsSection n={3} label="Event analysis" title="Before an event." soft="What it may mean." body="Scenarios in plain words and how the market reacted to past releases — possibilities, not predictions." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={560} h={490} title="Event analysis · US CPI" glyph="research" ai>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[rgba(255,255,255,0.12)] p-2.5">
              <b className="text-[13px] text-[#F5F7F7]">Hotter than forecast</b>
              <p className="mt-1 text-[12.5px] text-[#A3AAAC]">Dollar often firms; Gold often eases.</p>
            </div>
            <div className="rounded-lg border border-[rgba(255,255,255,0.12)] p-2.5">
              <b className="text-[13px] text-[#F5F7F7]">Cooler than forecast</b>
              <p className="mt-1 text-[12.5px] text-[#A3AAAC]">Dollar often softens; Gold often lifts.</p>
            </div>
          </div>
          <p className="mb-1 mt-4 font-mono text-[10.5px] tracking-[0.12em] text-[#6D7578]">PAST RELEASES · FIRST HOUR</p>
          <Row k="Each release, with Gold's first-hour move" v="from the candles" />
          <div className="mt-3 flex gap-2">
            <Chip tone="sample">Sample layout</Chip>
            <Chip tone="gold">Each line links its source</Chip>
          </div>
        </Win>
        <ChartWin k="XAUUSD" at={0.35} x={630} y={20} w={530} h={490} />
      </OsSection>

      <OsSection n={4} label="News and sentiment" title="Headlines, sorted for you." soft="With source and time." body="Each headline is tagged to the instruments it touches. AI groups them by the markets you follow and says which way they lean." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={640} h={400} title="News · sample headlines" glyph="news">
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
        <Win at={0.4} x={710} y={20} w={450} h={280} title="Grouped for your markets" glyph="research" ai>
          <Row k="Gold" v="3 headlines · leaning negative" />
          <Row k="Crude oil" v="1 headline · mixed" />
          <Row k="EUR/USD" v="1 headline · negative" />
        </Win>
      </OsSection>

      <OsSection n={5} label="Explain a move" title="Why did it move?" soft="Asked and answered." body="Point at a move on the candles and ask. The answer comes with numbered sources; open any of them." app="Research" active="research">
        <Ask at={0.04} x={40} y={6} w={640} text="Why did Gold drop here?" />
        <ChartWin k="XAUUSD" at={0.1} x={40} y={62} w={640} h={450} band={[30, 34]} />
        <Win at={0.35} x={710} y={62} w={450} h={250} title="Answer" glyph="research" ai>
          <Para>
            Two reasons, both sourced: US data beat forecasts <span className="text-[#E9B44C]">[1]</span>, and the dollar rose against most currencies <span className="text-[#E9B44C]">[2]</span>.
          </Para>
          <div className="mt-3">
            <Chip tone="sample">Sample answer · sources linked</Chip>
          </div>
        </Win>
        <AvatarLine at={0.55} x={760} y={340} text="Two reasons, both with sources. Tap [1] to read it." />
        <Note at={0.72} x={710} y={440} w={450} title="[1] Newswire · 06:31 UTC" sub="US data beats forecasts; dollar firms" />
      </OsSection>

      <OsSection n={6} label="Market briefs" title="The market in two minutes." soft="Morning, evening, weekly." body="Short editions on a fixed schedule, each line numbered to its source." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={360} h={490} title="Briefs" glyph="journal">
          <Row k="Morning brief" v="07:00 IST" gold />
          <Row k="Evening wrap" v="18:30 IST" />
          <Row k="Weekly outlook" v="Sunday" />
          <Row k="Event preview" v="before big releases" />
        </Win>
        <Win at={0.3} x={430} y={20} w={730} h={490} title="Morning brief · sample edition" glyph="journal">
          <p className="font-mono text-[10.5px] text-[#E9B44C]">GOLD</p>
          <Para>Lower as the dollar firmed after US data [1] [2]</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#E9B44C]">DOLLAR</p>
          <Para>Higher against most majors this morning [3]</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#E9B44C]">TODAY</p>
          <Para>US CPI at 18:00 IST [4]</Para>
          <div className="mt-3">
            <Chip tone="sample">Sample edition</Chip>
          </div>
        </Win>
      </OsSection>

      <OsSection n={7} label="Deep research" title="Longer questions." soft="Researched step by step." body="AFVAR gathers sources, reads them, checks every claim, then writes. Stop it at any step; what is done stays." app="Research" active="research">
        <Ask at={0.04} x={40} y={6} w={700} text="Research: what drives Gold in a strong-dollar week?" />
        <Win at={0.12} x={40} y={62} w={460} h={300} title="Deep research" glyph="research" ai>
          <Steps
            items={[
              { label: "Gather", detail: "12 sources", state: "ok" },
              { label: "Read", detail: "12 of 12", state: "ok" },
              { label: "Check", detail: "claims against sources", state: "ok" },
              { label: "Write", detail: "report", state: "idle" },
            ]}
          />
        </Win>
        <Win at={0.4} x={530} y={62} w={630} h={450} title="Report · draft" glyph="journal" ai>
          <p className="font-mono text-[10.5px] text-[#E9B44C]">1 · THE DOLLAR LINK</p>
          <Para>Gold is priced in dollars, so a firmer dollar often weighs on it [1] [2]</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#E9B44C]">2 · RATES</p>
          <Para>Higher yields raise the cost of holding Gold [3]</Para>
          <p className="mt-3 font-mono text-[10.5px] text-[#E9B44C]">3 · DEMAND</p>
          <Para>Central bank buying can offset it [4]</Para>
        </Win>
      </OsSection>

      <OsSection n={8} label="Supporting sources" title="Tap any claim." soft="See where it came from." body="Every explanation keeps its sources: what they are, where they are from and when." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={560} h={300} title="Morning brief" glyph="journal">
          <Para>
            Gold fell <span className="border-b border-[#E9B44C] bg-[rgba(233,180,76,0.15)]">as the dollar firmed after US data</span> <span className="text-[#E9B44C]">[1]</span>. Central bank buying continues <span className="text-[#E9B44C]">[3]</span>.
          </Para>
        </Win>
        <Win at={0.3} x={630} y={20} w={530} h={490} title="Sources for the highlighted claim" glyph="settings">
          <Row k="[1] Newswire" v="headline · 06:31 UTC" />
          <Row k="[2] Gold-API" v="price · spot" />
          <Row k="[3] Newswire" v="headline · 05:58 UTC" />
          <div className="mt-3">
            <span className="rounded-full border border-[rgba(255,255,255,0.18)] px-3 py-1 text-[12px]">Open source →</span>
          </div>
        </Win>
      </OsSection>
    </>
  );
}
