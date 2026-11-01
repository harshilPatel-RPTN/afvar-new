"use client";

// About and Pricing after their heroes: six OS sections each; the avatar speaks once per page.
import { Ask, AvatarLine, Chip, Note, OsSection, Row, Win } from "@/modules/afvarOs";
import { ABOUT, COMPANY_FACTS, CONTACT } from "@/modules/company/kit";
import { PRICING_FAQS, PRICING_TIERS, PRICING_USAGE } from "@/modules/home/kit";
import { ChartWin, Para, ScrollSteps } from "./shared";

/* ------------------------------------------------------------------ About */

export function AboutSections() {
  return (
    <>
      <OsSection n={2} label="Purpose" title="Why AFVAR exists." soft="Fewer tabs, more proof." body={ABOUT.purpose} app="Workspace">
        <Win at={0.06} x={40} y={20} w={520} h={300} title="A trader’s morning, without AFVAR" glyph="layouts">
          <Row k="Eleven browser tabs" v="three price sources" />
          <Row k="A tip in a chat group" v="no source" />
          <Row k="A screenshot of someone’s profit" v="not checkable" />
          <Row k="A headline from last night" v="time unknown" />
        </Win>
        <Win at={0.32} x={600} y={20} w={560} h={300} title="The same morning, on AFVAR" glyph="research" ai>
          <Row k="One price per market" v="source and time on it" gold />
          <Row k="Analysis with its calculations linked" v="graded afterwards" />
          <Row k="Headlines tagged to your markets" v="with their time" />
          <Row k="The decision" v="stays with you" />
        </Win>
        <Note at={0.62} x={600} y={350} w={560} title="Built in-house in India" sub="RedPhantom Tech Novelty Private Limited" />
      </OsSection>

      <OsSection n={3} label="One desk" title="Five apps that know about each other." soft="One analyst across them." body={ABOUT.vision.body} app="Workspace">
        <ChartWin k="XAUUSD" at={0.06} x={40} y={20} w={600} h={330} />
        <Ask at={0.3} x={670} y={20} w={490} text="सोने में आज क्या बदला?" />
        <Win at={0.42} x={670} y={84} w={490} h={230} title="उत्तर · Answer" glyph="research" ai>
          <Para>डॉलर मज़बूत हुआ, इसलिए सोना दबाव में रहा। स्रोत नीचे दिए गए हैं।</Para>
          <p className="mt-2 text-[12.5px] text-[#A3AAAC]">The dollar firmed, so Gold stayed under pressure. Sources below.</p>
          <div className="mt-3 flex gap-2">
            <Chip tone="sample">Sample answer</Chip>
            <Chip>English · हिन्दी</Chip>
          </div>
        </Win>
        <AvatarLine at={0.6} x={720} y={360} text="I explain what the code worked out — in English or Hindi, your choice." />
        <Win at={0.72} x={40} y={380} w={600} h={130} title="Apps on this desk" glyph="layouts">
          <div className="flex flex-wrap gap-2">
            <Chip tone="gold">Market data</Chip>
            <Chip>Research</Chip>
            <Chip>Alerts</Chip>
            <Chip>Risk review</Chip>
            <Chip>Community</Chip>
          </div>
        </Win>
      </OsSection>

      <OsSection n={4} label="Who it serves" title="Three kinds of trader." soft="One workspace." body="Active traders, careful beginners and people who research before they act each find a different door into the same desk." app="Workspace">
        {ABOUT.serves.map((s, i) => (
          <Win key={s.title} at={0.06 + i * 0.18} x={40 + i * 380} y={20 + i * 30} w={360} h={300} title={s.title} glyph={i === 0 ? "chart" : i === 1 ? "alerts" : "research"} ai={i === 1}>
            <Para>{s.body}</Para>
          </Win>
        ))}
        <Note at={0.7} x={40} y={420} w={480} title="No buy or sell calls, for anyone" sub="Analysis and explanation only" />
      </OsSection>

      <OsSection n={5} label="Principles" title="Five rules the product enforces." soft="Checked in code, not on a poster." body="Each principle maps to something the software refuses to do or always shows." app="Workspace">
        <Win at={0.06} x={40} y={20} w={560} h={490} title="Product principles" glyph="settings">
          <ScrollSteps items={ABOUT.principles.map((p) => ({ label: p.title.split(" ")[0], detail: p.title }))} at={[0.14, 0.26, 0.38, 0.5, 0.62]} />
        </Win>
        {ABOUT.principles.slice(0, 3).map((p, i) => (
          <Win key={p.title} at={0.2 + i * 0.16} x={630} y={20 + i * 168} w={530} h={150} title={p.title} glyph={i === 1 ? "risk" : "research"}>
            <Para>{p.body}</Para>
          </Win>
        ))}
      </OsSection>

      <OsSection n={6} label="Company" title="Who is behind it." soft="Registered facts only." body={ABOUT.people.body} app="Workspace">
        <Win at={0.06} x={40} y={20} w={600} h={300} title="Company record" glyph="settings">
          {COMPANY_FACTS.map(([k, val]) => (
            <Row key={k} k={k} v={val} />
          ))}
        </Win>
        <Win at={0.34} x={670} y={20} w={490} h={300} title="Team profiles" glyph="community">
          <Para>Profiles are added here once each person’s details are confirmed.</Para>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip tone="delayed">Awaiting confirmation</Chip>
            <Chip>No stock photos</Chip>
          </div>
        </Win>
        <Note at={0.62} x={40} y={350} w={600} title="Contact the team" sub="General, partnership and press enquiries · /contact" />
      </OsSection>

      <OsSection n={7} label="Build status" title="Where the build stands." soft="Updated only when verified." body={ABOUT.stage.body} app="Workspace">
        <Win at={0.06} x={40} y={20} w={600} h={330} title="Build status" glyph="calendar">
          <ScrollSteps
            items={[
              { label: "Website", detail: "public preview, labelled" },
              { label: "Launch queue", detail: "registration open" },
              { label: "OS workspace", detail: "in development" },
              { label: "Public grading", detail: "starts with analysis at launch" },
            ]}
            at={[0.12, 0.24, 2, 2]}
          />
        </Win>
        <Win at={0.36} x={670} y={20} w={490} h={330} title="What registering does" glyph="alerts" ai>
          <Row k="Joins the launch queue" v="yes" gold />
          <Row k="Unlocks the full OS" v="not yet" />
          <Row k="Takes payment" v="no" />
          <Row k="Invitations" v="in queue order" />
        </Win>
      </OsSection>
    </>
  );
}

/* ---------------------------------------------------------------- Pricing */

const TIER_PRICE = (m: number) => (m === 0 ? "Free" : `$${m} / month`);

export function PricingSections() {
  return (
    <>
      <OsSection n={2} label="Three tiers" title="Three tiers." soft="Prices indicative until launch." body="Start without paying, then move up when you need the AI analyst, testing and risk tools, or larger allowances." app="Settings">
        {PRICING_TIERS.map((t, i) => (
          <Win key={t.tag} at={0.06 + i * 0.16} x={40 + i * 380} y={20 + (t.highlighted ? 0 : 30)} w={360} h={t.highlighted ? 430 : 400} title={t.tag} glyph={i === 0 ? "chart" : i === 1 ? "research" : "risk"} ai={t.highlighted}>
            <p className={`text-[30px] font-semibold ${t.highlighted ? "text-[#E9B44C]" : "text-[#F5F7F7]"}`}>{TIER_PRICE(t.monthly)}</p>
            <p className="mb-3 text-[12.5px] text-[#A3AAAC]">{t.blurb}</p>
            {t.features.map((f) => (
              <Row key={f} k={f} />
            ))}
            <div className="mt-3">
              <Chip tone="delayed">Indicative · name TBC</Chip>
            </div>
          </Win>
        ))}
      </OsSection>

      <OsSection n={3} label="Side by side" title="What each tier adds." soft="On one table." body="The same desk at every tier. Higher tiers add the AI analyst, deeper tools and more room to use them." app="Settings">
        <Win at={0.06} x={40} y={20} w={760} h={490} title="Compare tiers" glyph="layouts">
          <div className="grid grid-cols-[1fr_80px_80px_80px] gap-y-0 font-mono text-[10.5px] tracking-[0.08em] text-[#6D7578]">
            <span>CAPABILITY</span>
            <span className="text-center">01</span>
            <span className="text-center text-[#E9B44C]">02</span>
            <span className="text-center">03</span>
          </div>
          {(
            [
              ["Charts, watchlists, calendar", 1, 1, 1],
              ["Price and condition alerts", 1, 1, 1],
              ["Community · read", 1, 1, 1],
              ["AI analyst · English and हिन्दी", 0, 1, 1],
              ["Screeners and strategy tests", 0, 1, 1],
              ["Risk Guardian, limits, journal", 0, 1, 1],
              ["Community · full participation", 0, 1, 1],
              ["Deep research and event analysis", 0, 0, 1],
              ["Higher usage allowances", 0, 0, 1],
            ] as const
          ).map(([k, a, b, c]) => (
            <div key={k} className="grid grid-cols-[1fr_80px_80px_80px] items-center border-b border-[rgba(255,255,255,0.06)] py-[6px] text-[13px] last:border-b-0">
              <span className="text-[#F5F7F7]">{k}</span>
              {[a, b, c].map((x, j) => (
                <span key={j} className={`text-center ${x ? (j === 1 ? "text-[#E9B44C]" : "text-[#C9CFD1]") : "text-[#3A4044]"}`}>
                  {x ? "✓" : "—"}
                </span>
              ))}
            </div>
          ))}
        </Win>
        <Note at={0.42} x={830} y={20} w={330} title="Placement may change" sub="Final split across tiers is confirmed before launch" />
        <Win at={0.6} x={830} y={130} w={330} h={260} title="Every tier" glyph="chart">
          <Para>Analysis only. No tier places, changes or closes an order.</Para>
          <div className="mt-3">
            <Row k="Labels on every price" v="yes" />
            <Row k="Broker accounts" v="read-only" />
            <Row k="English · हिन्दी" v="yes" />
          </div>
        </Win>
      </OsSection>

      <OsSection n={4} label="Allowances" title="Usage and limits." soft="Stated before you pay." body="How much analysis, how many alerts and scans, and what happens at the limit are published with the final prices." app="Settings">
        <Win at={0.06} x={40} y={20} w={620} h={330} title="Usage and limits" glyph="settings">
          {PRICING_USAGE.map(([k, val]) => (
            <Row key={k} k={k} v={val} />
          ))}
        </Win>
        <Ask at={0.3} x={690} y={20} w={470} text="How many AI questions does Tier 02 include?" />
        <Win at={0.44} x={690} y={84} w={470} h={230} title="Answer" glyph="research" ai>
          <Para>That number is not set yet. It will be on this page, next to the price, before anyone is asked to pay.</Para>
          <div className="mt-3">
            <Row k="Status" v="not confirmed" />
            <Row k="Published" v="before launch" gold />
          </div>
        </Win>
        <AvatarLine at={0.62} x={720} y={350} text="I will not guess an allowance. When it is confirmed, you will see it here." />
      </OsSection>

      <OsSection n={5} label="Market data" title="Data at every tier." soft="Labelled the same way." body="Every plan sees the same coverage and the same honesty: each number shows its source, time and whether it is delayed." app="Market data" active="charts">
        <ChartWin k="BTC-USD" at={0.06} x={40} y={20} w={640} h={490} />
        <Win at={0.32} x={710} y={20} w={450} h={300} title="Coverage" glyph="chart">
          <Row k="Gold · Silver · Crude oil" v="metals and energy" />
          <Row k="EUR/USD · USD/JPY · GBP/USD · NZD/USD" v="majors" />
          <Row k="Bitcoin and listed coins" v="24 / 7" gold />
          <Row k="Futures quotes" v="delayed, labelled" />
        </Win>
        <Note at={0.6} x={710} y={350} w={450} title="Same labels on every plan" sub="Live · delayed · stored · sample" />
      </OsSection>

      <OsSection n={6} label="Launch offers" title="Two launch offers." soft="One account, one queue." body="Everyone who registers is in the Launch Queue. Those who choose identity checks can also qualify for the Verified Launch Queue offer." app="Settings">
        <Win at={0.06} x={40} y={20} w={540} h={300} title="Launch Queue" glyph="calendar">
          <Row k="Needs" v="mobile and email verified" />
          <Row k="Queue position" v="set when you register" />
          <Row k="Offer terms" v="confirmed before launch" />
        </Win>
        <Win at={0.26} x={620} y={20} w={540} h={300} title="Verified Launch Queue" glyph="risk" ai>
          <Row k="Needs" v="optional identity check" gold />
          <Row k="Queue position" v="unchanged by the check" />
          <Row k="Offer terms" v="confirmed before launch" />
        </Win>
        <Note at={0.56} x={40} y={360} w={1120} title="Verification changes which offer applies — never your place, invitation order or access" sub="Offer amounts, capacity and duration are set under approved terms" />
      </OsSection>

      <OsSection n={7} label="Billing questions" title="Before you choose." soft="Short answers." body="The questions people ask most about paying, offers and the queue." app="Settings">
        <Win at={0.06} x={40} y={20} w={1120} h={490} title="Billing questions" glyph="research">
          {PRICING_FAQS.map((f) => (
            <div key={f.q} className="border-b border-[rgba(255,255,255,0.06)] py-2.5 last:border-b-0">
              <b className="text-[13.5px] text-[#F5F7F7]">{f.q}</b>
              <p className="mt-0.5 text-[13px] leading-relaxed text-[#A3AAAC]">{f.a}</p>
            </div>
          ))}
        </Win>
      </OsSection>
    </>
  );
}

/* ---------------------------------------------------------------- Contact */

export function ContactSections() {
  return (
    <>
      <OsSection n={2} label="Two lanes" title="Two lanes in." soft="Pick the right one." body="Enquiries about the company go to the team. Problems with your account or the product go to Help, where they are picked up first." app="Mail">
        <Win at={0.06} x={40} y={20} w={540} h={330} title="Team · enquiries" glyph="phone">
          {CONTACT.topics.map((t, i) => (
            <Row key={t} k={t} v="→ team" gold={i === 0} />
          ))}
        </Win>
        <Win at={0.28} x={620} y={20} w={540} h={330} title="Help · product and account" glyph="settings" ai>
          <Row k="A code did not arrive" v="→ help" />
          <Row k="Queue status" v="→ help" />
          <Row k="A price looks wrong" v="→ help" />
          <Row k="Workspace will not open" v="→ help" />
        </Win>
        <Note at={0.6} x={40} y={380} w={1120} title="One support system" sub="Nothing gets lost between inboxes" />
      </OsSection>

      <OsSection n={3} label="Routing" title="Not sure which lane?" soft="Ask, and it is routed." body="Describe the problem in a sentence. AFVAR points you to the team or to the exact help topic." app="Mail">
        <Ask at={0.04} x={40} y={10} w={620} text="my verification code never came" />
        <Win at={0.16} x={40} y={74} w={620} h={300} title="Routed to Help" glyph="settings" ai>
          <Row k="Topic" v="A verification code didn’t arrive" gold />
          <Row k="First check" v="the country code on the number" />
          <Row k="Then" v="spam and promotions folders" />
        </Win>
        <AvatarLine at={0.42} x={720} y={60} text="Account problems are faster through Help. I can take you straight to the right fix." />
        <Win at={0.62} x={690} y={250} w={470} h={260} title="Still the team’s job" glyph="phone">
          <Row k="Partnership proposal" v="→ team" />
          <Row k="Press request" v="→ team" />
          <Row k="Role you are interested in" v="→ team" />
        </Win>
      </OsSection>

      <OsSection n={4} label="Your enquiry" title="Three fields." soft="Nothing more." body="A topic, an email to reply to and your message. No phone number, no documents, no account needed." app="Mail">
        <Win at={0.06} x={40} y={20} w={640} h={420} title="New enquiry" glyph="phone">
          <Row k="Topic" v="Partnerships" />
          <Row k="Email" v="you@company.com" />
          <div className="mt-3 rounded-lg border border-[rgba(255,255,255,0.12)] p-3 text-[13px] leading-relaxed text-[#C9CFD1]">We run a trading education programme in Pune and would like to talk about using AFVAR with our students after launch.</div>
          <div className="mt-3 flex gap-2">
            <Chip tone="sample">Sample enquiry</Chip>
          </div>
        </Win>
        <Win at={0.36} x={710} y={20} w={450} h={300} title="Good to include" glyph="journal">
          <Row k="Press" v="outlet and deadline" />
          <Row k="Partnerships" v="who you are, what you propose" />
          <Row k="Careers" v="the work you want to do" />
        </Win>
      </OsSection>

      <OsSection n={5} label="After you send" title="What happens next." soft="Said honestly." body={CONTACT.formNote} app="Mail">
        <Win at={0.06} x={40} y={20} w={600} h={330} title="Enquiry status" glyph="calendar">
          <ScrollSteps
            items={[
              { label: "Checked", detail: "topic, email, message" },
              { label: "Kept", detail: "on this device" },
              { label: "Sent", detail: "when the line opens at launch" },
              { label: "Answered", detail: "by email, from the team" },
            ]}
            at={[0.14, 0.26, 2, 2]}
          />
        </Win>
        <Win at={0.34} x={670} y={20} w={490} h={330} title="No promises we cannot keep" glyph="risk" ai>
          <Para>No reply times are stated until the team can meet them. Nothing is called delivered before it is.</Para>
          <div className="mt-3">
            <Row k="Reply time" v="not stated yet" />
            <Row k="Your draft" v="stays on this device" gold />
            <Row k="Marked sent" v="only once it is" />
          </div>
        </Win>
      </OsSection>

      <OsSection n={6} label="Verified details" title="Who you are writing to." soft="Registered facts." body={CONTACT.verified.note} app="Mail">
        <Win at={0.06} x={40} y={20} w={640} h={300} title="Company" glyph="settings">
          {COMPANY_FACTS.map(([k, val]) => (
            <Row key={k} k={k} v={val} />
          ))}
        </Win>
        <Win at={0.34} x={710} y={20} w={450} h={300} title="Direct channels" glyph="phone">
          <Row k="Email address" v="published once verified" />
          <Row k="Phone line" v="published once verified" />
          <div className="mt-3">
            <Chip tone="delayed">Awaiting verification</Chip>
          </div>
        </Win>
      </OsSection>

      <OsSection n={7} label="Stay safe" title="How to spot a fake AFVAR." soft="Before you reply." body="Anyone can copy a name. These are the things the real team will never do." app="Mail">
        <Win at={0.06} x={40} y={20} w={720} h={360} title="The AFVAR team never" glyph="risk">
          {["Asks for money, crypto or payment before launch.", "Asks for passwords, codes or API keys.", "Writes to you first on WhatsApp, Telegram or social media.", "Offers tips, signals or guaranteed returns."].map((n) => (
            <p key={n} className="flex gap-2.5 border-b border-[rgba(255,255,255,0.06)] py-2.5 text-[13.5px] text-[#F5F7F7] last:border-b-0">
              <span className="text-[#FF8A8A]">✕</span>
              {n}
            </p>
          ))}
        </Win>
        <Note at={0.44} x={790} y={20} w={370} title="Got one of these?" sub="Report it through Help & Support" />
      </OsSection>
    </>
  );
}
