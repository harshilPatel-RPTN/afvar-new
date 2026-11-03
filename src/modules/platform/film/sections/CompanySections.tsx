"use client";

// About and Pricing after their heroes: six OS sections each; the avatar speaks once per page.
import { Ask, AvatarLine, Chip, Note, OsSection, Row, Win } from "@/modules/afvarOs";
import { COMPANY_FACTS, CONTACT } from "@/modules/company/kit";
import { PRICING_FAQS, PRICING_TIERS, PRICING_USAGE } from "@/modules/home/kit";
import { ChartWin, Count, Para, SYM, ScrollSteps, Seq, StatusChip, fmt, useQuote } from "./shared";

/** One market's last price from the live feed, with its freshness label. */
function LiveRow({ k }: { k: string }) {
  const q = useQuote(k);
  return (
    <Row
      k={SYM[k] ?? k}
      v={
        <span className="flex items-center gap-2">
          {fmt(q?.last, q?.decimals)}
          <StatusChip q={q} />
        </span>
      }
    />
  );
}

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
            <Win key={t.tag} at={at} x={40 + i * 380} y={20 + (t.highlighted ? 0 : 30)} w={360} h={t.highlighted ? 355 : 335} title={t.tag} glyph={i === 0 ? "chart" : i === 1 ? "research" : "risk"} ai={t.highlighted}>
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
        <Win at={0.62} x={40} y={408} w={1120} h={92} title="Before launch" glyph="settings">
          <Para>Indicative pricing shown for orientation. Final plan names, prices and the exact placement of capabilities across tiers are confirmed before launch under approved terms.</Para>
        </Win>
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
              <div key={k} className="grid grid-cols-[1fr_40px_40px_40px] sm:grid-cols-[1fr_80px_80px_80px] items-center border-b border-[rgba(255,255,255,0.06)] py-[12px] text-[13px] last:border-b-0 [.afv-stack_&]:py-[6px]">
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
        <Win at={0.56} x={830} y={118} w={330} h={225} title="Every tier" glyph="chart">
          <Para>Analysis only. No tier places, changes or closes an order.</Para>
          <Seq at={0.6} className="mt-3">
            <Row k="Labels on every price" v="yes" />
            <Row k="Broker accounts" v="read-only" />
            <Row k="English · हिन्दी" v="yes" />
          </Seq>
        </Win>
        <Win at={0.72} x={830} y={365} w={330} h={145} title="Indicative prices" glyph="settings">
          <div className="grid grid-cols-3 gap-2">
            {PRICING_TIERS.map((t) => (
              <div key={t.tag} className={`rounded-lg border px-2 py-2 ${t.highlighted ? "border-[rgba(168,222,194,0.6)]" : "border-[rgba(255,255,255,0.1)]"}`}>
                <p className="font-mono text-[10px] tracking-[0.08em] text-[#92A399]">{t.tag.toUpperCase()}</p>
                <p className={`text-[13.5px] font-semibold ${t.highlighted ? "text-[#A8DEC2]" : "text-[#F2F5F2]"}`}>{t.monthly ? `$${t.monthly}` : "Free"}</p>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[12px] text-[#B7C5BC]">Per month · indicative until launch</p>
        </Win>
      </OsSection>

      <OsSection n={4} label="Allowances" title="Usage and limits." soft="Stated before you pay." body="How much analysis, how many alerts and scans, and what happens at the limit are published with the final prices." app="Settings">
        <Win at={0.06} x={40} y={20} w={620} h={240} title="Usage and limits" glyph="settings">
          <Seq at={0.1} step={0.03}>
            {PRICING_USAGE.map(([k, val]) => (
              <Row key={k} k={k} v={val} />
            ))}
          </Seq>
        </Win>
        <Win at={0.2} x={40} y={290} w={620} h={205} title="Published before you pay" glyph="settings">
          <Seq at={0.24} step={0.03}>
            <Row k="Included allowances" v="per tier, next to the price" />
            <Row k="At the limit" v="what happens, stated up front" />
            <Row k="Top-ups" v="price and expiry, stated" />
            <Row k="Payment now" v="none · registration is free" gold />
          </Seq>
        </Win>
        <Ask at={0.3} x={690} y={20} w={470} text="How many AI questions does Tier 02 include?" />
        <Win at={0.44} x={690} y={84} w={470} h={190} title="Answer" glyph="research" ai>
          <Para>That number is not set yet. It will be on this page, next to the price, before anyone is asked to pay.</Para>
          <Seq at={0.5} step={0.04} className="mt-3">
            <Row k="Status" v="not confirmed" />
            <Row k="Published" v="before launch" gold />
          </Seq>
        </Win>
        <Note at={0.56} x={690} y={300} w={470} title="No payment needed now" sub="Registration is free; allowances come with the final prices" />
        <AvatarLine at={0.68} x={832} y={420} text="I will not guess an allowance. When it is confirmed, you will see it here." />
      </OsSection>

      <OsSection n={5} label="Market data" title="Data at every tier." soft="Labelled the same way." body="Every plan sees the same coverage and the same honesty: each number shows its source, time and whether it is delayed." app="Market data" active="charts">
        <ChartWin k="BTC-USD" at={0.06} x={40} y={20} w={640} h={490} />
        <Win at={0.32} x={710} y={20} w={450} h={350} title="Coverage · eight lanes, live" glyph="chart">
          <Seq at={0.36} step={0.02}>
            {Object.keys(SYM).map((k) => (
              <LiveRow key={k} k={k} />
            ))}
          </Seq>
        </Win>
        <Win at={0.6} x={710} y={390} w={450} h={130} title="Same labels on every plan" glyph="settings">
          <Row k="Every number" v="source · venue · delay · cache age" />
          <Row k="Labels" v="live · delayed · stored · sample" gold />
        </Win>
      </OsSection>

      <OsSection n={6} label="Launch offers" title="Two launch offers." soft="One account, one queue." body="Everyone who registers is in the Launch Queue. Those who choose identity checks can also qualify for the Verified Launch Queue offer." app="Settings">
        <Win at={0.06} x={40} y={20} w={540} h={170} title="Launch Queue" glyph="calendar">
          <Seq at={0.1}>
            <Row k="Needs" v="mobile and email verified" />
            <Row k="Queue position" v="set when you register" />
            <Row k="Offer terms" v="confirmed before launch" />
          </Seq>
        </Win>
        <Win at={0.22} x={620} y={20} w={540} h={170} title="Verified Launch Queue" glyph="risk" ai>
          <Seq at={0.3}>
            <Row k="Needs" v="optional identity check" gold />
            <Row k="Queue position" v="unchanged by the check" />
            <Row k="Offer terms" v="confirmed before launch" />
          </Seq>
        </Win>
        <Win at={0.38} x={40} y={215} w={540} h={200} title="How to join" glyph="calendar">
          <ScrollSteps
            items={[
              { label: "Register", detail: "free, no payment needed now" },
              { label: "Verify", detail: "mobile number and email" },
              { label: "Queue record", detail: "one per account" },
              { label: "Identity check", detail: "optional" },
            ]}
            at={[0.42, 0.47, 0.52, 2]}
          />
        </Win>
        <Win at={0.5} x={620} y={215} w={540} h={200} title="After launch" glyph="settings">
          <Seq at={0.54}>
            <Row k="Offer benefits" v="activate under approved terms" />
            <Row k="Queue order and access" v="never changed by an offer" gold />
            <Row k="Payment now" v="none" />
          </Seq>
        </Win>
        <Note at={0.66} x={40} y={445} w={1120} title="Verification changes which offer applies — never your place, invitation order or access" sub="Offer amounts, capacity and duration are set under approved terms" />
      </OsSection>

      <OsSection n={7} label="Billing questions" title="Before you choose." soft="Short answers." body="The questions people ask most about paying, offers and the queue." app="Settings">
        <Win at={0.06} x={40} y={20} w={1120} h={410} title="Billing questions" glyph="research">
          <Seq at={0.1} step={0.06}>
            {PRICING_FAQS.map((f) => (
              <div key={f.q} className="border-b border-[rgba(255,255,255,0.06)] py-2.5 last:border-b-0">
                <b className="text-[13.5px] text-[#F2F5F2]">{f.q}</b>
                <p className="mt-0.5 text-[13px] leading-relaxed text-[#B7C5BC]">{f.a}</p>
              </div>
            ))}
          </Seq>
        </Win>
        <Note at={0.5} x={40} y={455} w={1120} title="More questions?" sub="The full FAQs are under Resources → FAQs" />
      </OsSection>
    </>
  );
}

/* ---------------------------------------------------------------- Contact */

export function ContactSections() {
  return (
    <>
      <OsSection n={2} label="Two lanes" title="Two lanes in." soft="Pick the right one." body="Enquiries about the company go to the team. Problems with your account or the product go to Help, where they are picked up first." app="Mail">
        <Win at={0.06} x={40} y={20} w={540} h={245} title="Team · enquiries" glyph="phone">
          {CONTACT.topics.map((t, i) => (
            <Row key={t} k={t} v="→ team" gold={i === 0} />
          ))}
        </Win>
        <Win at={0.28} x={620} y={20} w={540} h={245} title="Help · product and account" glyph="settings" ai>
          <Row k="A code did not arrive" v="→ help" />
          <Row k="Queue status" v="→ help" />
          <Row k="A price looks wrong" v="→ help" />
          <Row k="Workspace will not open" v="→ help" />
          <Row k="I can’t sign in" v="→ help" />
        </Win>
        <Note at={0.5} x={40} y={285} w={1120} title="One support system" sub="Nothing gets lost between inboxes" />
        <Win at={0.62} x={40} y={368} w={540} h={135} title="Replies from the team" glyph="phone">
          <Row k="Reply by" v="email" />
          <Row k="Reply time" v="not stated yet" />
        </Win>
        <Win at={0.72} x={620} y={368} w={540} h={135} title="Help & Support" glyph="settings">
          <Row k="Where" v="Resources → Help & Support" gold />
          <Row k="Picked up" v="first, with troubleshooting and status help" />
        </Win>
      </OsSection>

      <OsSection n={3} label="Routing" title="Not sure which lane?" soft="Ask, and it is routed." body="Describe the problem in a sentence. AFVAR points you to the team or to the exact help topic." app="Mail">
        <Ask at={0.04} x={40} y={10} w={620} text="my verification code never came" />
        <Win at={0.16} x={40} y={74} w={620} h={175} title="Routed to Help" glyph="settings" ai>
          <Row k="Topic" v="A verification code didn’t arrive" gold />
          <Row k="First check" v="the country code on the number" />
          <Row k="Then" v="spam and promotions folders" />
        </Win>
        <AvatarLine at={0.3} x={832} y={16} text="Account problems are faster through Help. I can take you straight to the right fix." />
        <Win at={0.42} x={690} y={105} w={470} h={165} title="How routing works" glyph="research">
          <ScrollSteps
            items={[
              { label: "You describe it", detail: "in one sentence" },
              { label: "AFVAR matches", detail: "a help topic or the team" },
              { label: "You go", detail: "straight to the right place" },
            ]}
            at={[0.46, 0.5, 0.54]}
          />
        </Win>
        <Win at={0.54} x={40} y={275} w={620} h={205} title="Also routed to Help" glyph="settings">
          <Row k="Queue status" v="→ help" />
          <Row k="A price looks wrong" v="→ help" />
          <Row k="Workspace will not open" v="→ help" />
          <Row k="I can’t sign in" v="→ help" />
        </Win>
        <Win at={0.66} x={690} y={295} w={470} h={205} title="Still the team’s job" glyph="phone">
          <Row k="Partnership proposal" v="→ team" />
          <Row k="Press request" v="→ team" />
          <Row k="Role you are interested in" v="→ team" />
          <Row k="Anything else about the company" v="→ team" />
        </Win>
      </OsSection>

      <OsSection n={4} label="Your enquiry" title="Three fields." soft="Nothing more." body="A topic, an email to reply to and your message. No phone number, no documents, no account needed." app="Mail">
        <Win at={0.06} x={40} y={20} w={640} h={290} title="New enquiry" glyph="phone">
          <Row k="Topic" v="Partnerships" />
          <Row k="Email" v="you@company.com" />
          <div className="mt-3 min-h-[100px] rounded-lg border border-[rgba(255,255,255,0.12)] p-3 text-[13px] leading-relaxed text-[#C9CFD1] [.afv-stack_&]:min-h-0">We run a trading education programme in Pune and would like to talk about using AFVAR with our students after launch.</div>
          <div className="mt-3 flex gap-2">
            <Chip tone="sample">Sample enquiry</Chip>
          </div>
        </Win>
        <Win at={0.28} x={710} y={20} w={450} h={205} title="Good to include" glyph="journal">
          <Row k="General enquiry" v="what it is about" />
          <Row k="Press" v="outlet and deadline" />
          <Row k="Partnerships" v="who you are, what you propose" />
          <Row k="Careers" v="the work you want to do" />
        </Win>
        <Win at={0.42} x={710} y={250} w={450} h={240} title="Topics to choose from" glyph="layouts">
          {CONTACT.topics.map((t, i) => (
            <Row key={t} k={t} v="→ team" gold={i === 1} />
          ))}
        </Win>
        <Win at={0.56} x={40} y={335} w={640} h={170} title="Not needed" glyph="risk">
          <Row k="Phone number" v="not asked" />
          <Row k="Documents" v="not asked" />
          <Row k="An account" v="not needed" />
        </Win>
      </OsSection>

      <OsSection n={5} label="After you send" title="What happens next." soft="Said honestly." body={CONTACT.formNote} app="Mail">
        <Win at={0.06} x={40} y={20} w={600} h={225} title="Enquiry status" glyph="calendar">
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
        <Win at={0.34} x={670} y={20} w={490} h={225} title="No promises we cannot keep" glyph="risk" ai>
          <Para>No reply times are stated until the team can meet them. Nothing is called delivered before it is.</Para>
          <div className="mt-3">
            <Row k="Reply time" v="not stated yet" />
            <Row k="Your draft" v="stays on this device" gold />
            <Row k="Marked sent" v="only once it is" />
          </div>
        </Win>
        <Win at={0.5} x={40} y={270} w={600} h={165} title="Kept on this device" glyph="settings">
          <Row k="What is kept" v="topic, email and message" />
          <Row k="Where" v="this device only" />
          <Row k="Until" v="the line opens at launch" />
        </Win>
        <Win at={0.6} x={670} y={270} w={490} h={165} title="When the line opens" glyph="phone">
          <Row k="Delivery" v="activates at launch" />
          <Row k="Your kept enquiry" v="can be sent then" />
          <Row k="Answer" v="by email, from the team" gold />
        </Win>
        <Note at={0.72} x={40} y={455} w={1120} title="Pre-launch preview" sub="Nothing is called delivered before it is" />
      </OsSection>

      <OsSection n={6} label="Verified details" title="Who you are writing to." soft="Registered facts." body={CONTACT.verified.note} app="Mail">
        <Win at={0.06} x={40} y={20} w={640} h={205} title="Company" glyph="settings">
          {COMPANY_FACTS.map(([k, val]) => (
            <Row key={k} k={k} v={val} />
          ))}
        </Win>
        <Win at={0.3} x={710} y={20} w={450} h={205} title="Direct channels" glyph="phone">
          <Row k="Email address" v="published once verified" />
          <Row k="Phone line" v="published once verified" />
          <p className="mt-3 text-[12.5px] leading-relaxed text-[#B7C5BC]">Until then, use the enquiry form on this page.</p>
          <div className="mt-3">
            <Chip tone="delayed">Awaiting verification</Chip>
          </div>
        </Win>
        <Win at={0.48} x={40} y={250} w={1120} h={170} title="AFVAR will never request" glyph="risk">
          <Row k="Funds or payment" v="never requested over chat apps or social media" />
          <Row k="Passwords or credentials" v="never requested" />
          <Row k="Verification codes" v="never requested" />
        </Win>
        <Note at={0.64} x={40} y={450} w={1120} title="Unsure if a message is real?" sub="Report it through Help & Support" />
      </OsSection>

      <OsSection n={7} label="Stay safe" title="How to spot a fake AFVAR." soft="Before you reply." body="Anyone can copy a name. These are the things the real team will never do." app="Mail">
        <Win at={0.06} x={40} y={20} w={720} h={305} title="The AFVAR team never" glyph="risk">
          {(
            [
              ["Asks for money, crypto or payment before launch.", "Registration is free; no payment is needed now."],
              ["Asks for passwords, codes or API keys.", "AFVAR never requests credentials or codes over chat apps or social media."],
              ["Writes to you first on WhatsApp, Telegram or social media.", "Direct channels are published on the Contact page once verified."],
              ["Offers tips, signals or guaranteed returns.", "AFVAR is analysis only and never places trades."],
            ] as const
          ).map(([n, why]) => (
            <p key={n} className="flex gap-2.5 border-b border-[rgba(255,255,255,0.06)] py-2.5 text-[13.5px] text-[#F2F5F2] last:border-b-0">
              <span className="text-[#FF8A8A]">✕</span>
              <span className="min-w-0">
                {n}
                <span className="mt-0.5 block text-[12.5px] leading-snug text-[#B7C5BC]">{why}</span>
              </span>
            </p>
          ))}
        </Win>
        <Win at={0.3} x={40} y={350} w={720} h={165} title="The real team" glyph="phone">
          <Row k="Replies" v="by email, to your enquiry" />
          <Row k="Direct channels" v="published once verified" />
          <Row k="Payment before launch" v="never asked" />
        </Win>
        <Note at={0.44} x={790} y={20} w={370} title="Got one of these?" sub="Report it through Help & Support" />
        <Win at={0.54} x={790} y={103} w={370} h={200} title="If one reaches you" glyph="risk">
          <ScrollSteps
            items={[
              { label: "Don’t reply", detail: "or pay, or share a code" },
              { label: "Check", detail: "channels on Contact" },
              { label: "Report it", detail: "via Help & Support" },
              { label: "Block", detail: "the sender" },
            ]}
            at={[0.58, 0.62, 0.66, 0.7]}
          />
        </Win>
        <Win at={0.72} x={790} y={328} w={370} h={170} title="Verified channels" glyph="settings">
          <Row k="Email address" v="once verified" />
          <Row k="Phone line" v="once verified" />
          <Row k="Chat apps" v="never used to write first" />
        </Win>
      </OsSection>
    </>
  );
}
