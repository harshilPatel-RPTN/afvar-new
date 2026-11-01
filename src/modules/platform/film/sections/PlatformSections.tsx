"use client";

// /platform after the hero: what AFVAR is and how it works, shown in the
// AFVAR OS itself — seven sections, the avatar speaks once (section 04).
import Link from "next/link";
import { AppGlyph, Ask, AvatarLine, Chip, DeskLabel, Note, OsSection, Row, Win } from "@/modules/afvarOs";
import { capabilityPath } from "../../routes";
import { ChartWin, Para, ScrollSteps, StatusChip, sourceLine, useQuote } from "./shared";

export function PlatformSections() {
  return (
    <>
      <TwoWays />
      <SpeakOrType />
      <StopOrCancel />
      <ToVerified />
      <Workspace />
      <Trust />
      <FiveAreas />
    </>
  );
}

function TwoWays() {
  return (
    <OsSection n={2} label="Two ways" title="By hand or by asking." soft="The same result." body="Every window can be opened, moved and closed by hand. Ask instead and the AI does the same, then checks it." app="Market data" active="charts">
      <DeskLabel at={0.05} x={40} y={10}>
        By hand
      </DeskLabel>
      <ChartWin k="XAUUSD" at={0.08} x={40} y={34} w={540} h={330} />
      <DeskLabel at={0.3} x={620} y={10}>
        By asking
      </DeskLabel>
      <Ask at={0.32} x={620} y={34} w={540} text="Open the Gold chart, 1H" />
      <ChartWin k="XAUUSD" at={0.5} x={620} y={96} w={540} h={330} />
      <Note at={0.7} x={820} y={446} w={340} title="Opened and verified" sub="Same window · two ways" />
    </OsSection>
  );
}

function SpeakOrType() {
  return (
    <OsSection n={3} label="Voice" title="Type it or say it." soft="In English or हिन्दी." body="Speak a request and AFVAR shows what it heard before it acts. Stop it at any moment." app="Voice" active="charts">
      <Win at={0.06} x={40} y={30} w={540} h={290} title="Voice · listening" glyph="phone" ai>
        <div className="afv-voice flex h-12 items-center gap-[3px]" aria-hidden="true">
          {Array.from({ length: 44 }, (_, i) => (
            <span key={i} className="w-[4px] rounded-full bg-[#A8DEC2]" style={{ height: 8 + Math.round(30 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23))), animationDelay: `${(i % 7) * 0.09}s` }} />
          ))}
        </div>
        <p className="mt-4 text-[16px] text-[#F2F5F2]">“गोल्ड का एक घंटे वाला चार्ट खोलो”</p>
        <p className="mt-2 font-mono text-[11px] tracking-[0.1em] text-[#A8DEC2]">UNDERSTOOD · OPEN THE GOLD CHART, 1H</p>
        <div className="mt-4 flex gap-2">
          <Chip tone="gold">हिन्दी</Chip>
          <Chip>Stop anytime</Chip>
        </div>
      </Win>
      <Ask at={0.3} x={40} y={340} w={540} text="…or type it: Open the Gold chart, 1H" />
      <ChartWin k="XAUUSD" at={0.48} x={620} y={30} w={540} h={360} />
      <Note at={0.66} x={620} y={410} w={540} title="Opened from your voice" sub="हिन्दी · menus can switch too" />
    </OsSection>
  );
}

function StopOrCancel() {
  return (
    <OsSection n={4} label="Stop or cancel" title="Stop the voice, keep the work." soft="Or cancel what is left." body="Stopping speech never stops a task. Cancelling ends the steps not yet done; finished work stays." app="Tasks" active="charts">
      <Win at={0.06} x={40} y={30} w={580} h={250} title="Task · open three charts" glyph="layouts">
        <Row k="Gold chart" v={<span className="text-[#00E676]">✓ Opened and verified</span>} />
        <Row k="Dollar chart" v={<span className="text-[#F6B94A]">● Checking outcome</span>} />
        <Row k="Ten-year yield" v="Not started" />
        <div className="mt-4 flex items-center gap-2.5">
          <Chip tone="gold">Running</Chip>
          <span className="flex-1" />
          <span className="rounded-full border border-[rgba(255,255,255,0.18)] px-3 py-1 text-[12px]">Stop speaking</span>
          <span className="rounded-full border border-[rgba(255,77,77,0.6)] px-3 py-1 text-[12px] text-[#FF8A8A]">Cancel task</span>
        </div>
      </Win>
      <ChartWin k="XAUUSD" at={0.14} x={660} y={30} w={500} h={300} />
      <AvatarLine at={0.3} x={700} y={380} text="Opening your three charts now, Gold first." />
      <Note at={0.55} x={40} y={310} w={420} title="Playback stopped" sub="The task keeps running" />
      <Note at={0.78} x={40} y={390} w={420} title="Cancelled the rest" sub="The opened Gold chart stays open" />
    </OsSection>
  );
}

function ToVerified() {
  return (
    <OsSection n={5} label="To verified" title="Every request, checked." soft="Six steps, every time." body="A request is resolved, passed through the policy gate, carried out, then verified. Orders never pass the gate." app="Activity" active="charts">
      <Ask at={0.04} x={40} y={10} w={540} text="Open Gold and Silver side by side" />
      <Win at={0.08} x={40} y={70} w={540} h={330} title="Activity · request" glyph="layouts">
        <ScrollSteps
          items={[
            { label: "Request", detail: "typed in Spotlight" },
            { label: "Backend", detail: "session valid · context ready" },
            { label: "Resolve", detail: "local command · no model needed" },
            { label: "Policy gate", detail: "allowed: open charts" },
            { label: "Action runner", detail: "Market data app" },
            { label: "Verify", detail: "Verify core · both windows open" },
          ]}
          at={[0.12, 0.18, 0.24, 0.3, 0.36, 0.42]}
        />
      </Win>
      <ChartWin k="XAUUSD" at={0.4} x={610} y={70} w={270} h={220} head={false} title="Gold · 1H" last={30} />
      <ChartWin k="XAGUSD" at={0.43} x={890} y={70} w={270} h={220} head={false} title="Silver · 1H" last={30} />
      <Ask at={0.56} x={610} y={310} w={550} text="Place an order for 1 lot of Gold" />
      <Win at={0.62} x={610} y={370} w={550} h={150} title="Activity · refused" glyph="risk">
        <ScrollSteps items={[{ label: "Request", detail: "typed in Spotlight" }, { label: "Policy gate", detail: "refused" }]} at={[0.64, 0.7]} refusedAt={1} />
        <Para>AFVAR never places, modifies or closes orders.</Para>
      </Win>
    </OsSection>
  );
}

function Workspace() {
  return (
    <OsSection n={6} label="Workspace" title="It remembers how you work." soft="Layouts, notes, languages." body="Save a layout, switch spaces and come back to it. Pin notes to charts. Connections are listed, and read-only." app="Workspace" active="charts">
      <ChartWin k="XAUUSD" at={0.06} x={40} y={20} w={560} h={340} />
      <Win at={0.18} x={640} y={20} w={520} h={180} title="Layouts" glyph="layouts">
        <Row k="Morning desk" v={<span className="text-[#A8DEC2]">✓ saved 08:12</span>} />
        <Row k="News check" v="saved 07:40" />
      </Win>
      <Win at={0.34} x={360} y={300} w={300} h={110} title="Note · Gold" glyph="journal">
        <Para>Wait for the London close.</Para>
      </Win>
      <Win at={0.5} x={640} y={220} w={520} h={140} title="Connections" glyph="settings">
        <Row k="Broker account" v={<Chip tone="gold">Read-only</Chip>} />
        <Row k="News feed" v="connected" />
      </Win>
      <Win at={0.66} x={640} y={380} w={520} h={130} title="Language" glyph="settings">
        <div className="flex items-center gap-3">
          <Chip>EN</Chip>
          <span className="text-[#A8DEC2]">⇄</span>
          <Chip tone="gold">हिन्दी</Chip>
          <span className="text-[12px] text-[#B7C5BC]">menus switch, your layout stays</span>
        </div>
      </Win>
    </OsSection>
  );
}

function QuoteWin({ k, at, x, y, label }: { k: string; at: number; x: number; y: number; label?: string }) {
  const q = useQuote(k);
  return (
    <Win at={at} x={x} y={y} w={270} h={160} title={label ?? k} glyph="chart">
      <p className="text-[22px] font-semibold text-[#F2F5F2]">{q ? q.last.toLocaleString("en-US", { minimumFractionDigits: q.decimals, maximumFractionDigits: q.decimals }) : "—"}</p>
      <div className="my-2">
        <StatusChip q={q} />
      </div>
      <p className="truncate font-mono text-[10.5px] text-[#B7C5BC]">{sourceLine(q)}</p>
    </Win>
  );
}

function Trust() {
  return (
    <OsSection n={7} label="Trust" title="Every number says where it came from." soft="And how fresh it is." body="Live, delayed, stale or sample — the label is on the number, not in the small print." app="Market data" active="charts">
      <QuoteWin k="XAUUSD" at={0.06} x={40} y={20} label="Gold" />
      <QuoteWin k="WTI" at={0.14} x={330} y={20} label="Crude oil" />
      <QuoteWin k="EURUSD" at={0.22} x={40} y={200} label="EUR/USD" />
      <Win at={0.3} x={330} y={200} w={270} h={160} title="Sample chart" glyph="chart">
        <p className="text-[22px] font-semibold text-[#B7C5BC]">—</p>
        <div className="my-2">
          <Chip tone="sample">Sample</Chip>
        </div>
        <p className="font-mono text-[10.5px] text-[#B7C5BC]">illustration · not live</p>
      </Win>
      <Win at={0.42} x={640} y={20} w={520} h={300} title="What AFVAR promises" glyph="risk" ai>
        <Row k="✓ Never places, changes or closes orders" />
        <Row k="✓ Accounts connect read-only" />
        <Row k="✓ Every number shows its source and time" />
        <Row k="✓ Nothing runs until you confirm" />
        <Row k="✓ Samples are always marked" />
      </Win>
    </OsSection>
  );
}

const AREAS = [
  { slug: "charts", name: "Market data", glyph: "chart", line: "quotes, candles, watchlists" },
  { slug: "research", name: "Research", glyph: "research", line: "calendar, news, briefs" },
  { slug: "alerts", name: "Alerts", glyph: "alerts", line: "rules, scans, strategy tests" },
  { slug: "trade-review", name: "Risk review", glyph: "risk", line: "exposure, limits, journal" },
  { slug: "community", name: "Community", glyph: "community", line: "rooms, shared charts" },
] as const;

function FiveAreas() {
  return (
    <OsSection n={8} label="Five areas" title="Five areas, one workspace." soft="Each has its own page." body="Open any area from the dock. Every page shows that area at work, in the same OS." app="Market data" active="charts">
      {AREAS.slice(1)
        .reverse()
        .map((a, i) => (
          <Win key={a.slug} at={0.06 + i * 0.05} x={420 + (3 - i) * 26} y={10 + i * 24} w={420} h={220} title={`${a.name}`} glyph={a.glyph}>
            <Para>{a.line}</Para>
          </Win>
        ))}
      <ChartWin k="XAUUSD" at={0.3} x={40} y={150} w={560} h={360} z={20} />
      <Win at={0.4} x={640} y={150} w={520} h={360} title="The five areas" glyph="layouts" z={21}>
        <ul aria-label="Capability pages">
          {AREAS.map((a) => (
            <li key={a.slug} className="border-b border-[rgba(255,255,255,0.06)] last:border-b-0">
              <Link href={capabilityPath(a.slug)} className="flex items-center justify-between py-2.5 text-[13px] text-[#F2F5F2] hover:text-[#A8DEC2]">
                <span className="flex items-center gap-2.5 text-[#A8DEC2]">
                  <AppGlyph name={a.glyph} size={15} />
                  <span className="text-[#F2F5F2]">{a.name}</span>
                </span>
                <span className="font-mono text-[11px] text-[#B7C5BC]">{a.line} →</span>
              </Link>
            </li>
          ))}
        </ul>
      </Win>
    </OsSection>
  );
}
