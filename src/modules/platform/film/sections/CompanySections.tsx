"use client";

// About and Pricing after their heroes: six OS sections each; the avatar speaks once per page.
import { Ask, AvatarLine, Chip, Note, OsSection, Row, Win } from "@/modules/afvarOs";
import { COMPANY_FACTS, CONTACT } from "@/modules/company/kit";
import { PRICING_FAQS, PRICING_TIERS, PRICING_USAGE } from "@/modules/home/kit";
import { ChartWin, Count, Para, ScrollSteps, Seq } from "./shared";

/* ------------------------------------------------------------------ About */

export { AboutSections } from "./about";

/* ---------------------------------------------------------------- Pricing */

const TIER_PRICE = (m: number) => (m === 0 ? "Free" : `$${m} / month`);
const PER_MONTH = (m: number) => `$${m} / month`;
/** When each tick column of the compare table fills: tier 01, then 02, then 03. */
const COL_AT = [0.14, 0.24, 0.34];

export function PricingSections() {
  return (
    <>
      <OsSection n={2} label="Three tiers" title="Three tiers." soft="Prices indicative until launch." body="Start without paying, then move up when you need the AI analyst, testing and risk tools, or larger allowances." app="Settings">
        {PRICING_TIERS.map((t, i) => {
          // Each tier: its price counts up, its features follow one by one, then the label pops on.
          const at = 0.06 + i * 0.16;
          return (
            <Win key={t.tag} at={at} x={40 + i * 380} y={20 + (t.highlighted ? 0 : 30)} w={360} h={t.highlighted ? 430 : 400} title={t.tag} glyph={i === 0 ? "chart" : i === 1 ? "research" : "risk"} ai={t.highlighted}>
              <p className={`text-[30px] font-semibold ${t.highlighted ? "text-[#A8DEC2]" : "text-[#F2F5F2]"}`}>{t.monthly ? <Count at={at + 0.03} to={t.monthly} format={PER_MONTH} /> : TIER_PRICE(0)}</p>
              <p className="mb-3 text-[12.5px] text-[#B7C5BC]">{t.blurb}</p>
              <Seq at={at + 0.05} step={0.025}>
                {t.features.map((f) => (
                  <Row key={f} k={f} />
                ))}
              </Seq>
              <Seq at={at + 0.07 + t.features.length * 0.025} pop className="mt-3">
                <span className="inline-block">
                  <Chip tone="delayed">Indicative · name TBC</Chip>
                </span>
              </Seq>
            </Win>
          );
        })}
      </OsSection>

      <OsSection n={3} label="Side by side" title="What each tier adds." soft="On one table." body="The same desk at every tier. Higher tiers add the AI analyst, deeper tools and more room to use them." app="Settings">
        <Win at={0.06} x={40} y={20} w={760} h={490} title="Compare tiers" glyph="layouts">
          <div className="grid grid-cols-[1fr_40px_40px_40px] sm:grid-cols-[1fr_80px_80px_80px] gap-y-0 font-mono text-[10.5px] tracking-[0.08em] text-[#92A399]">
            <span>CAPABILITY</span>
            <span className="text-center">01</span>
            <span className="text-center text-[#A8DEC2]">02</span>
            <span className="text-center">03</span>
          </div>
          {/* Rows slide in, then the ticks fill column by column: what tier 01 has, what 02 adds, what 03 adds. */}
          <Seq at={0.08} step={0.012}>
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
            ).map(([k, a, b, c], r) => (
              <div key={k} className="grid grid-cols-[1fr_40px_40px_40px] sm:grid-cols-[1fr_80px_80px_80px] items-center border-b border-[rgba(255,255,255,0.06)] py-[6px] text-[13px] last:border-b-0">
                <span className="text-[#F2F5F2]">{k}</span>
                {[a, b, c].map((x, j) =>
                  x ? (
                    <Seq key={j} at={COL_AT[j] + r * 0.012} pop className={`text-center ${j === 1 ? "text-[#A8DEC2]" : "text-[#C9CFD1]"}`}>
                      <span className="inline-block">✓</span>
                    </Seq>
                  ) : (
                    <span key={j} className="text-center text-[#2A3F35]">—</span>
                  ),
                )}
              </div>
            ))}
          </Seq>
        </Win>
        <Note at={0.42} x={830} y={20} w={330} title="Placement may change" sub="Final split across tiers is confirmed before launch" />
        <Win at={0.6} x={830} y={130} w={330} h={260} title="Every tier" glyph="chart">
          <Para>Analysis only. No tier places, changes or closes an order.</Para>
          <Seq at={0.64} className="mt-3">
            <Row k="Labels on every price" v="yes" />
            <Row k="Broker accounts" v="read-only" />
            <Row k="English · हिन्दी" v="yes" />
          </Seq>
        </Win>
      </OsSection>

      <OsSection n={4} label="Allowances" title="Usage and limits." soft="Stated before you pay." body="How much analysis, how many alerts and scans, and what happens at the limit are published with the final prices." app="Settings">
        <Win at={0.06} x={40} y={20} w={620} h={330} title="Usage and limits" glyph="settings">
          <Seq at={0.1} step={0.03}>
            {PRICING_USAGE.map(([k, val]) => (
              <Row key={k} k={k} v={val} />
            ))}
          </Seq>
        </Win>
        <Ask at={0.3} x={690} y={20} w={470} text="How many AI questions does Tier 02 include?" />
        <Win at={0.44} x={690} y={84} w={470} h={230} title="Answer" glyph="research" ai>
          <Para>That number is not set yet. It will be on this page, next to the price, before anyone is asked to pay.</Para>
          <Seq at={0.5} step={0.04} className="mt-3">
            <Row k="Status" v="not confirmed" />
            <Row k="Published" v="before launch" gold />
          </Seq>
        </Win>
        <AvatarLine at={0.62} x={720} y={350} text="I will not guess an allowance. When it is confirmed, you will see it here." />
      </OsSection>

      <OsSection n={5} label="Market data" title="Data at every tier." soft="Labelled the same way." body="Every plan sees the same coverage and the same honesty: each number shows its source, time and whether it is delayed." app="Market data" active="charts">
        <ChartWin k="BTC-USD" at={0.06} x={40} y={20} w={640} h={490} />
        <Win at={0.32} x={710} y={20} w={450} h={300} title="Coverage" glyph="chart">
          <Seq at={0.36}>
            <Row k="Gold · Silver · Crude oil" v="metals and energy" />
            <Row k="EUR/USD · USD/JPY · GBP/USD · NZD/USD" v="majors" />
            <Row k="Bitcoin and listed coins" v="24 / 7" gold />
            <Row k="Futures quotes" v="delayed, labelled" />
          </Seq>
        </Win>
        <Note at={0.6} x={710} y={350} w={450} title="Same labels on every plan" sub="Live · delayed · stored · sample" />
      </OsSection>

      <OsSection n={6} label="Launch offers" title="Two launch offers." soft="One account, one queue." body="Everyone who registers is in the Launch Queue. Those who choose identity checks can also qualify for the Verified Launch Queue offer." app="Settings">
        <Win at={0.06} x={40} y={20} w={540} h={300} title="Launch Queue" glyph="calendar">
          <Seq at={0.1}>
            <Row k="Needs" v="mobile and email verified" />
            <Row k="Queue position" v="set when you register" />
            <Row k="Offer terms" v="confirmed before launch" />
          </Seq>
        </Win>
        <Win at={0.26} x={620} y={20} w={540} h={300} title="Verified Launch Queue" glyph="risk" ai>
          <Seq at={0.3}>
            <Row k="Needs" v="optional identity check" gold />
            <Row k="Queue position" v="unchanged by the check" />
            <Row k="Offer terms" v="confirmed before launch" />
          </Seq>
        </Win>
        <Note at={0.56} x={40} y={360} w={1120} title="Verification changes which offer applies — never your place, invitation order or access" sub="Offer amounts, capacity and duration are set under approved terms" />
      </OsSection>

      <OsSection n={7} label="Billing questions" title="Before you choose." soft="Short answers." body="The questions people ask most about paying, offers and the queue." app="Settings">
        <Win at={0.06} x={40} y={20} w={1120} h={490} title="Billing questions" glyph="research">
          <Seq at={0.1} step={0.06}>
            {PRICING_FAQS.map((f) => (
              <div key={f.q} className="border-b border-[rgba(255,255,255,0.06)] py-2.5 last:border-b-0">
                <b className="text-[13.5px] text-[#F2F5F2]">{f.q}</b>
                <p className="mt-0.5 text-[13px] leading-relaxed text-[#B7C5BC]">{f.a}</p>
              </div>
            ))}
          </Seq>
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
            <p key={n} className="flex gap-2.5 border-b border-[rgba(255,255,255,0.06)] py-2.5 text-[13.5px] text-[#F2F5F2] last:border-b-0">
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
