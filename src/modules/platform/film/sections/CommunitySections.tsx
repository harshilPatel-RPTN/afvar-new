"use client";

// Community after the hero: ten OS sections; the avatar speaks once (10).
// Members, posts and records here are samples and always marked. No profit
// rankings anywhere; identity checks and verified records are kept apart.
import type { ReactNode } from "react";
import { Ask, AvatarLine, Chip, Note, OsSection, Row, Win } from "@/modules/afvarOs";
import { ChartWin, Para, ScrollSteps } from "./shared";

export function CommunitySections() {
  return (
    <>
      <Rooms />
      <Discussions />
      <SharedCharts />
      <EventRoom />
      <Profiles />
      <Verified />
      <Explorer />
      <Brokers />
      <Summaries />
      <Rules />
    </>
  );
}

const ROOMS = [
  ["Gold & Silver", "metals"],
  ["Crude & Energy", "energy"],
  ["Forex majors", "currencies"],
  ["Crypto", "Bitcoin and more"],
  ["Indian markets", "NSE · MCX"],
  ["Beginners’ corner", "ask anything"],
  ["Events & data", "CPI, payrolls, central banks"],
  ["Journals & discipline", "share your process"],
] as const;

function Rooms() {
  return (
    <OsSection n={2} label="Official rooms" title="Eight rooms to start." soft="One for each kind of market." body="Join the rooms for what you trade. Each is run by AFVAR moderators, with its own pinned guides." app="Community" active="community">
      <Win at={0.06} x={40} y={20} w={640} h={490} title="Community · rooms" glyph="community">
        <div className="grid grid-cols-2 gap-2">
          {ROOMS.map(([n, d], i) => (
            <div key={n} className={`rounded-lg border p-3 ${i === 0 ? "border-[rgba(168,222,194,0.6)] bg-[rgba(168,222,194,0.06)]" : "border-[rgba(255,255,255,0.1)]"}`}>
              <p className="text-[13.5px] font-semibold text-[#F2F5F2]"># {n}</p>
              <p className="mt-0.5 text-[12px] text-[#B7C5BC]">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Chip tone="plain">Official · moderated</Chip>
        </div>
      </Win>
      <Win at={0.36} x={710} y={20} w={450} h={260} title="# Gold & Silver · pinned" glyph="journal">
        <Row k="Room guide" v="what belongs here" />
        <Row k="Key levels thread" v="updated daily" />
        <Row k="Event calendar" v="metals-related releases" />
      </Win>
      <Note at={0.62} x={710} y={310} w={450} title="Joined # Gold & Silver" sub="Mute or leave any time" />
    </OsSection>
  );
}

function Post({ who, tag, children, gold = false }: { who: string; tag?: string; children: ReactNode; gold?: boolean }) {
  return (
    <div className={`mb-2.5 rounded-lg border p-3 ${gold ? "border-[rgba(168,222,194,0.5)]" : "border-[rgba(255,255,255,0.1)]"}`}>
      <p className="flex items-center gap-2 text-[12px]">
        <span className="font-semibold text-[#F2F5F2]">{who}</span>
        {tag ? <span className="font-mono text-[10px] text-[#92A399]">{tag}</span> : null}
      </p>
      <div className="mt-1 text-[13px] leading-relaxed text-[#D7DCDD]">{children}</div>
    </div>
  );
}

function Discussions() {
  return (
    <OsSection n={3} label="Discussions" title="Talk it through." soft="In threads that stay on topic." body="Start a thread, reply, quote a chart. Threads keep each idea in one place, so a good question does not get lost." app="Community" active="community">
      <Win at={0.06} x={40} y={20} w={640} h={490} title="# Gold & Silver · thread" glyph="community">
        <Post who="Meera" tag="member · 2 years">Does the dollar matter more than yields for Gold this month?</Post>
        <Post who="Arjun" tag="member">I watch both, but the dollar moved first on the last two data days.</Post>
        <Post who="Kabir" tag="moderator" gold>
          Good thread. Linked the room’s event calendar so everyone sees the dates.
        </Post>
        <div className="mt-2">
          <Chip tone="sample">Sample thread</Chip>
        </div>
      </Win>
      <Win at={0.4} x={710} y={20} w={450} h={230} title="Reply" glyph="journal">
        <p className="text-[13px] text-[#B7C5BC]">Write a reply…</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip>Attach chart</Chip>
          <Chip>Quote</Chip>
          <Chip>हिन्दी</Chip>
        </div>
      </Win>
      <Note at={0.64} x={710} y={280} w={450} title="Opinions, not advice" sub="Posts are members’ views; check before you act" />
    </OsSection>
  );
}

function SharedCharts() {
  return (
    <OsSection n={4} label="Shared charts" title="Share the chart, not just words." soft="It opens live for everyone." body="Post a chart with your levels drawn. Others open the same chart on live candles and can see when you shared it." app="Community" active="community">
      <ChartWin k="XAUUSD" at={0.06} x={40} y={20} w={660} h={490} title="Shared by Meera · Gold · 1H" averages={[{ len: 20 }]} drawFrom={[0.12, 0.3]} />
      <Win at={0.32} x={730} y={20} w={430} h={240} title="Meera’s note" glyph="journal">
        <Para>Watching the 20-hour average. If it holds after CPI, I stay patient.</Para>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip>Shared 06:40 UTC</Chip>
          <Chip tone="sample">Sample post</Chip>
        </div>
      </Win>
      <Win at={0.52} x={730} y={280} w={430} h={230} title="Replies · 3" glyph="community">
        <Row k="Arjun" v="Same level on my chart" />
        <Row k="Sana" v="Saved to my layout" />
        <Row k="Dev" v="What timeframe for the exit?" />
      </Win>
    </OsSection>
  );
}

function EventRoom() {
  return (
    <OsSection n={5} label="Live event room" title="Big releases, together." soft="Opened before, closed after." body="For major data such as US CPI, a live room opens with a countdown, the forecast and a moderator — then a recap when it ends." app="Community" active="community">
      <Win at={0.06} x={40} y={20} w={460} h={260} title="Live room · US CPI" glyph="calendar">
        <p className="font-mono text-[11px] tracking-[0.12em] text-[#A8DEC2]">STARTS IN</p>
        <p className="text-[38px] font-semibold text-[#F2F5F2]">00:40:00</p>
        <Row k="Forecast" v="from the calendar" />
        <Row k="In the room" v="1,240 members" />
        <div className="mt-2">
          <Chip tone="sample">Sample room</Chip>
        </div>
      </Win>
      <ChartWin k="XAUUSD" at={0.26} x={530} y={20} w={630} h={330} event={{ i: 40, label: "CPI" }} />
      <Win at={0.5} x={40} y={300} w={460} h={210} title="Room chat" glyph="community">
        <Post who="Kabir" tag="moderator" gold>
          Room is open. Please keep calls to buy or sell out of here.
        </Post>
      </Win>
      <Note at={0.7} x={530} y={380} w={630} title="Recap posted" sub="What the release showed and how markets moved, with sources" />
    </OsSection>
  );
}

function Profiles() {
  return (
    <OsSection n={6} label="Profiles" title="See who you learn from." soft="Their process, not their profit." body="A profile shows what a member trades, how long they have been here and what they have shared — never a profit leaderboard." app="Community" active="community">
      <Win at={0.06} x={40} y={20} w={520} h={490} title="Profile · Meera" glyph="community">
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[rgba(168,222,194,0.15)] text-[18px] font-semibold text-[#A8DEC2]">M</span>
          <div>
            <p className="text-[15px] font-semibold text-[#F2F5F2]">Meera</p>
            <p className="text-[12px] text-[#B7C5BC]">Member for 2 years · Mumbai</p>
          </div>
        </div>
        <Row k="Trades mostly" v="Gold · EUR/USD" />
        <Row k="Style" v="swing · a few days" />
        <Row k="Shared charts" v="48" />
        <Row k="Identity" v={<Chip tone="gold">ID checked</Chip>} />
        <Row k="Trading record" v="not shared" />
        <div className="mt-3">
          <Chip tone="sample">Sample member</Chip>
        </div>
      </Win>
      <Win at={0.36} x={590} y={20} w={570} h={260} title="What a profile never shows" glyph="risk">
        <Row k="✕ Profit rankings or leaderboards" />
        <Row k="✕ Account balances" />
        <Row k="✕ Anything you did not choose to share" />
      </Win>
      <Note at={0.62} x={590} y={310} w={570} title="ID checked ≠ verified record" sub="An identity check says who someone is, not how they trade" />
    </OsSection>
  );
}

function Verified() {
  return (
    <OsSection n={7} label="Verified records" title="What “verified” means." soft="Checked, and how." body="A record is verified only when trades come from a read-only account connection. Anything typed in by hand stays marked as self-reported." app="Community" active="community">
      <Win at={0.06} x={40} y={20} w={560} h={330} title="How a record is verified" glyph="risk" ai>
        <ScrollSteps
          items={[
            { label: "Read-only connection", detail: "from the member’s broker" },
            { label: "Trades imported", detail: "not typed by hand" },
            { label: "Checked against prices", detail: "times and levels match" },
            { label: "Labelled", detail: "verified · with dates covered" },
          ]}
          at={[0.12, 0.22, 0.32, 0.42]}
        />
      </Win>
      <Win at={0.36} x={630} y={20} w={530} h={330} title="Labels you will see" glyph="settings">
        <Row k="Verified record" v={<Chip tone="gold">Verified · Jan–Oct</Chip>} />
        <Row k="Self-reported" v={<Chip>Self-reported</Chip>} />
        <Row k="Identity checked" v={<Chip tone="plain">ID checked</Chip>} />
        <p className="mt-3 text-[12.5px] leading-relaxed text-[#B7C5BC]">Each label is separate. One never implies another.</p>
      </Win>
      <Note at={0.66} x={40} y={380} w={560} title="A verified record is not a recommendation" sub="It shows what happened, not what will" />
    </OsSection>
  );
}

function Explorer() {
  return (
    <OsSection n={8} label="Trade explorer" title="Learn from shared trades." soft="Filtered by market, not by profit." body="Browse trades members chose to share, on the candles they happened on. Filter by market, style or event — there is no sort by profit." app="Community" active="community">
      <Win at={0.06} x={40} y={20} w={420} h={490} title="Trade explorer · filters" glyph="research">
        <Row k="Market" v="Gold" gold />
        <Row k="Style" v="swing" />
        <Row k="Around an event" v="US CPI" />
        <Row k="Record" v="verified only" />
        <Row k="Sort" v="newest first" />
        <div className="mt-3">
          <Chip tone="sample">Sample filters</Chip>
        </div>
      </Win>
      <ChartWin
        k="XAUUSD"
        at={0.3}
        x={490}
        y={20}
        w={670}
        h={340}
        title="Shared trade · Arjun · Gold · 1H"
        marks={[
          { i: 20, side: "buy", label: "In" },
          { i: 33, side: "sell", label: "Out" },
        ]}
      />
      <Win at={0.54} x={490} y={380} w={670} h={130} title="Arjun’s reason" glyph="journal">
        <Para>Bought the retest of the range low; sold into the next high. Verified record · sample.</Para>
      </Win>
    </OsSection>
  );
}

function Brokers() {
  return (
    <OsSection n={9} label="Broker comparison" title="Compare brokers on facts." soft="Criteria stated, sources linked." body="Compare brokers on regulation, costs, platforms and how they connect to AFVAR. Members add experiences; facts carry sources." app="Community" active="community">
      <Win at={0.06} x={40} y={20} w={760} h={400} title="Broker comparison · sample" glyph="layouts">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-y-2 text-[12.5px]">
          {[
            ["", "Broker A", "Broker B", "Broker C"],
            ["Regulator", "listed", "listed", "listed"],
            ["Gold spread", "from source", "from source", "from source"],
            ["Read-only connection", "✓", "✓", "coming"],
            ["Platforms", "web · app", "web", "web · app"],
            ["Member notes", "12", "7", "4"],
          ].map((r, i) =>
            r.map((c, j) => (
              <span key={`${i}-${j}`} className={i === 0 ? "font-semibold text-[#F2F5F2]" : j === 0 ? "text-[#B7C5BC]" : "text-[#F2F5F2]"}>
                {c}
              </span>
            )),
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Chip tone="sample">Sample brokers</Chip>
          <Chip>Each fact links its source</Chip>
        </div>
      </Win>
      <Win at={0.4} x={830} y={20} w={330} h={260} title="Not an endorsement" glyph="risk">
        <Para>AFVAR does not rank brokers or take referral fees for this table.</Para>
      </Win>
    </OsSection>
  );
}

function Summaries() {
  return (
    <OsSection n={10} label="AI summaries" title="Catch up in a minute." soft="Every point linked to the post." body="Missed a long thread? Ask for a summary. AFVAR lists the main views, where people disagreed and the open questions — each linked to the post." app="Community" active="community">
      <Ask at={0.04} x={40} y={10} w={620} text="Summarise today’s # Gold & Silver" />
      <Win at={0.14} x={40} y={74} w={620} h={436} title="Summary · 214 posts" glyph="research" ai>
        <p className="font-mono text-[10.5px] tracking-[0.1em] text-[#A8DEC2]">MAIN VIEWS</p>
        <Para>Most members are waiting for CPI before acting [12] [40]</Para>
        <p className="mt-3 font-mono text-[10.5px] tracking-[0.1em] text-[#A8DEC2]">DISAGREEMENT</p>
        <Para>Whether the dollar or yields matter more this month [3] [77]</Para>
        <p className="mt-3 font-mono text-[10.5px] tracking-[0.1em] text-[#A8DEC2]">OPEN QUESTION</p>
        <Para>How Silver reacts if industrial data is weak [151]</Para>
        <div className="mt-3">
          <Chip tone="sample">Sample summary</Chip>
        </div>
      </Win>
      <AvatarLine at={0.42} x={720} y={60} text="214 posts, three main points. Tap a number to read the post." />
      <Note at={0.66} x={700} y={260} w={460} title="[12] Meera · 09:14" sub="Waiting for CPI before adding to Gold" />
      <Win at={0.78} x={700} y={350} w={460} h={160} title="What a summary leaves out" glyph="risk">
        <Para>It reports what members said. It does not add its own view or a call to trade.</Para>
      </Win>
    </OsSection>
  );
}

function Rules() {
  return (
    <OsSection n={11} label="Rules safety and privacy" title="How the community stays useful." soft="Rules, safety and privacy." body="Clear rules, real moderators and privacy controls you set. Anyone offering guaranteed returns or asking for money is removed." app="Community" active="community">
      <Win at={0.06} x={40} y={20} w={400} h={490} title="Participation rules" glyph="journal">
        <Row k="✓ Share reasons, not tips" />
        <Row k="✓ Mark opinions as opinions" />
        <Row k="✓ Be kind to beginners" />
        <Row k="✕ No buy or sell calls" />
        <Row k="✕ No guaranteed returns" />
        <Row k="✕ No paid groups or DMs for money" />
      </Win>
      <Win at={0.24} x={470} y={20} w={340} h={300} title="Safety" glyph="risk">
        <Row k="Report a post" v="one tap" />
        <Row k="Moderator review" v="every report" />
        <Row k="Block a member" v="any time" />
        <Row k="Scam warnings" v="on suspicious links" />
      </Win>
      <Win at={0.42} x={830} y={20} w={330} h={300} title="Privacy" glyph="settings">
        <Row k="Profile" v="you choose fields" />
        <Row k="Trading record" v="off by default" />
        <Row k="Direct messages" v="members you allow" />
      </Win>
      <Note at={0.66} x={470} y={350} w={690} title="Posts are members’ opinions, not financial advice" sub="Identity checks and verified records are different things" />
    </OsSection>
  );
}
