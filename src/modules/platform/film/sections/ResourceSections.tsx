"use client";

// The Resources family after its heroes: the hub, Getting started, Guides,
// Help, FAQs and Sources & evidence — six OS sections each, the avatar once.
import { Ask, AvatarLine, Chip, Note, OsSection, Row, Win } from "@/modules/afvarOs";
import { CATEGORIES, EVIDENCE, FAQ_GROUPS, GETTING_STARTED, GUIDE_GROUPS, GUIDES, HELP, TROUBLESHOOTING, getGuide, getTopic, type Guide } from "@/modules/resources/kit";
import { ChartWin, Para, ScrollSteps, fmt, useQuote, useRange } from "./shared";
import { STATUS_LABEL, asOfText } from "../market/analysis";

const guide = (slug: string) => getGuide(slug) as Guide;
const topic = (slug: string) => getTopic(slug)!;
const faq = (id: string) => FAQ_GROUPS.find((g) => g.id === id)!;

/* -------------------------------------------------------------------- Hub */

export function HubSections() {
  return (
    <>
      <OsSection n={2} label="Five places" title="Five places, each with one job." soft="Pick the one you need." body="Start, learn a task, check a number, find an answer or get help — each has its own page." app="Resources">
        {CATEGORIES.map((c, i) => (
          <Win key={c.id} at={0.05 + i * 0.1} x={40 + (i % 3) * 380} y={i < 3 ? 20 : 290} w={360} h={230} title={c.title} glyph={(["calendar", "journal", "settings", "research", "phone"] as const)[i]} ai={i === 2}>
            <Para>{c.summary}</Para>
          </Win>
        ))}
      </OsSection>

      <OsSection n={3} label="Search" title="Search all of it." soft="One box." body="Guides, steps, answers and fixes are searched together, so the right page comes first whatever kind it is." app="Resources">
        <Ask at={0.04} x={40} y={10} w={620} text="how do I set an alert" />
        <Win at={0.14} x={40} y={74} w={620} h={436} title="Results · 4" glyph="research" ai>
          <Row k={guide("create-an-alert").title} v="guide" gold />
          <Row k={topic("alert-clarification").title} v="help" />
          <Row k={guide("set-risk-limits").title} v="guide" />
          <Row k={faq("markets").items[4].q} v="answer" />
        </Win>
        <Win at={0.4} x={690} y={74} w={470} h={260} title={guide("create-an-alert").title} glyph="alerts">
          <ScrollSteps items={guide("create-an-alert").steps.map((s) => ({ label: s.title.split(" ").slice(0, 2).join(" "), detail: s.title }))} at={[0.46, 0.52, 0.58, 0.64]} />
        </Win>
      </OsSection>

      <OsSection n={4} label="Start here" title="New here?" soft="Five steps." body={GETTING_STARTED.lede} app="Resources">
        <Win at={0.06} x={40} y={20} w={620} h={360} title="Getting started" glyph="calendar">
          <ScrollSteps items={GETTING_STARTED.steps.map((s, i) => ({ label: `Step ${i + 1}`, detail: s.title }))} at={[0.12, 0.2, 2, 2, 2]} />
        </Win>
        <Note at={0.4} x={690} y={20} w={470} title="2 of 5 done" sub="Verified · in the queue" />
        <Win at={0.56} x={690} y={110} w={470} h={270} title="Your device" glyph="layouts">
          <Para>{GETTING_STARTED.device}</Para>
        </Win>
      </OsSection>

      <OsSection n={5} label="Check a number" title="Is this price fresh?" soft="The badge says." body="Every number carries five facts about itself. Sources & evidence explains each one." app="Market data" active="charts">
        <ChartWin k="XAUUSD" at={0.06} x={40} y={20} w={640} h={490} />
        <BadgeWin k="XAUUSD" at={0.3} x={710} w={450} />
        <AvatarLine at={0.58} x={740} y={360} text="If a number has no badge, I will not use it." />
      </OsSection>

      <OsSection n={6} label="Quick answers" title="Asked most often." soft="Answered in a line." body="The questions people ask before anything else, with the short answer first." app="Resources">
        <Win at={0.06} x={40} y={20} w={1120} h={490} title="Top questions" glyph="research">
          {[faq("status").items[0], faq("status").items[1], faq("markets").items[0], faq("devices").items[0], faq("priority").items[0]].map((f) => (
            <div key={f.q} className="border-b border-[rgba(255,255,255,0.06)] py-2.5 last:border-b-0">
              <b className="text-[13.5px] text-[#F5F7F7]">{f.q}</b>
              <p className="mt-0.5 text-[13px] leading-relaxed text-[#A3AAAC]">{f.a}</p>
            </div>
          ))}
        </Win>
      </OsSection>

      <OsSection n={7} label="Still stuck" title="Still stuck?" soft="A person reads it." body="Try the fix for your problem first. If it does not help, send one request to the shared support desk." app="Resources">
        <Win at={0.06} x={40} y={20} w={560} h={360} title="Fixes" glyph="settings">
          {TROUBLESHOOTING.map((t, i) => (
            <Row key={t.slug} k={t.title} gold={i === 0} />
          ))}
        </Win>
        <Win at={0.34} x={630} y={20} w={530} h={360} title="Support request" glyph="phone">
          <p className="mb-2 font-mono text-[10.5px] tracking-[0.1em] text-[#6D7578]">TOPIC</p>
          <div className="flex flex-wrap gap-2">
            {HELP.topics.slice(0, 6).map((t, i) => (
              <Chip key={t} tone={i === 2 ? "gold" : "plain"}>
                {t}
              </Chip>
            ))}
          </div>
          <div className="mt-4 h-[96px] rounded-lg border border-[rgba(255,255,255,0.12)] p-2.5 text-[13px] text-[#6D7578]">Describe what happened…</div>
        </Win>
      </OsSection>
    </>
  );
}

function BadgeWin({ k, at, x, w }: { k: string; at: number; x: number; w: number }) {
  const q = useQuote(k);
  return (
    <Win at={at} x={x} y={20} w={w} h={310} title="Badge · this price" glyph="settings" ai>
      <Row k="Price" v={q?.last != null ? fmt(q.last, q.decimals) : "—"} gold />
      <Row k="Source" v={q?.source ?? "—"} />
      <Row k="Status" v={q ? STATUS_LABEL[q.status] : "—"} />
      <Row k="Time" v={q ? asOfText(q.asOf) : "—"} />
      <Row k="Venue" v="spot / exchange, per source" />
    </Win>
  );
}

/* --------------------------------------------------------- Getting started */

export function StartSections() {
  const [verify, queue, identity, preview, invite] = GETTING_STARTED.steps;
  return (
    <>
      <OsSection n={2} label="Verify" title="Step 1 · Verify your mobile and email." soft="Two codes." body={verify.body} app="Account">
        <Win at={0.06} x={40} y={20} w={520} h={340} title="Register" glyph="phone">
          <Row k="Mobile" v="+91 ••••• ••210" />
          <Row k="Mobile code" v={<span className="text-[#00E676]">✓ verified</span>} />
          <Row k="Email" v="you@••••.com" />
          <Row k="Email code" v={<span className="text-[#00E676]">✓ verified</span>} />
          <div className="mt-3">
            <Chip tone="sample">Sample details</Chip>
          </div>
        </Win>
        <Win at={0.32} x={600} y={20} w={560} h={240} title="You will need" glyph="settings">
          {verify.needs.map((n) => (
            <Row key={n} k={n} />
          ))}
        </Win>
        <Note at={0.6} x={600} y={290} w={560} title="One account · one queue record" sub="Created the moment both codes check out" />
      </OsSection>

      <OsSection n={3} label="Queue" title="Step 2 · Follow your place." soft="It does not move." body={queue.body} app="Account">
        <Win at={0.06} x={40} y={20} w={560} h={330} title="Launch queue" glyph="calendar">
          <Row k="Status" v="in queue" gold />
          <Row k="Joined" v="recorded at registration" />
          <Row k="Invitations" v="sent in queue order" />
          <Row k="Moves with offers or checks" v="no" />
        </Win>
        <Win at={0.34} x={630} y={20} w={530} h={330} title="What changes your place" glyph="risk" ai>
          <Para>Nothing you choose later. Not a launch offer, not identity verification.</Para>
        </Win>
      </OsSection>

      <OsSection n={4} label="Identity" title="Step 3 · Identity, if you want it." soft="Never required." body={identity.body} app="Account">
        <Win at={0.06} x={40} y={20} w={540} h={300} title="Identity verification · optional" glyph="risk">
          <Row k="Required to join" v="no" />
          <Row k="Changes your offer" v="yes" gold />
          <Row k="Changes your place" v="no" />
          <Row k="Changes your access" v="no" />
        </Win>
        <Win at={0.32} x={620} y={20} w={540} h={300} title="Two offers" glyph="layouts">
          <Row k="Launch Queue" v="everyone who registers" />
          <Row k="Verified Launch Queue" v="after an identity check" />
        </Win>
      </OsSection>

      <OsSection n={5} label="Preview" title="Step 4 · Look around now." soft="Labelled, on any device." body={preview.body} app="Market data" active="charts">
        <ChartWin k="EURUSD" at={0.06} x={40} y={20} w={640} h={490} />
        <Win at={0.32} x={710} y={20} w={450} h={300} title="Reading the preview" glyph="settings">
          <Row k="Real price" v={<Chip tone="live">Live</Chip>} />
          <Row k="Real, older" v={<Chip tone="delayed">Delayed</Chip>} />
          <Row k="Illustration" v={<Chip tone="sample">Sample</Chip>} />
        </Win>
      </OsSection>

      <OsSection n={6} label="First session" title="Step 5 · Your first session." soft="Set up once." body={invite.body} app="Workspace">
        <Win at={0.06} x={40} y={20} w={540} h={330} title="Welcome · set up" glyph="settings">
          <ScrollSteps
            items={[
              { label: "Edition", detail: "English or हिन्दी" },
              { label: "Region", detail: "where you trade from" },
              { label: "Time zone", detail: "clocks follow it" },
              { label: "Tour", detail: "runs once, skip any time" },
            ]}
            at={[0.14, 0.24, 0.34, 0.44]}
          />
        </Win>
        <AvatarLine at={0.5} x={660} y={60} text="On your first day I will walk you round the desk once. After that I only answer when you ask." />
        <Note at={0.68} x={620} y={280} w={540} title="Invitation · ready to sign in" sub="Desktop or laptop · screen 1000 px or wider" />
      </OsSection>

      <OsSection n={7} label="Device check" title="Check your screen." soft="Before the day comes." body="The workspace needs room for several windows at once. Phones and tablets keep this website, the queue and support." app="Workspace">
        <Win at={0.06} x={40} y={20} w={560} h={300} title="Device check" glyph="layouts">
          <Row k="Desktop or laptop" v={<span className="text-[#00E676]">✓ workspace</span>} />
          <Row k="Screen 1000 px or wider" v={<span className="text-[#00E676]">✓ workspace</span>} />
          <Row k="Phone or tablet" v="website, queue, support" />
        </Win>
        <Win at={0.32} x={630} y={20} w={530} h={300} title="Next" glyph="journal">
          <Row k={guide("open-a-chart").title} v="guide" />
          <Row k={guide("arrange-your-workspace").title} v="guide" />
        </Win>
      </OsSection>
    </>
  );
}

/* ------------------------------------------------------------------ Guides */

export function GuidesSections() {
  const chart = guide("open-a-chart");
  const alert = guide("create-an-alert");
  const broker = guide("connect-your-broker-read-only");
  const ask = guide("ask-the-os-agent");
  return (
    <>
      <OsSection n={2} label="Groups" title="Guides by task." soft="Five groups." body="Each group matches one part of the workspace, so you can go from what you want to do to the steps." app="Resources">
        {GUIDE_GROUPS.map((g, i) => {
          const list = GUIDES.filter((x) => x.group === g.id);
          return (
            <Win key={g.id} at={0.05 + i * 0.1} x={40 + (i % 3) * 380} y={i < 3 ? 20 : 290} w={360} h={230} title={`${g.title} · ${list.length}`} glyph={(["chart", "alerts", "risk", "community", "settings"] as const)[i]}>
              {list.slice(0, 4).map((x) => (
                <Row key={x.slug} k={x.title} />
              ))}
            </Win>
          );
        })}
      </OsSection>

      <OsSection n={3} label="A guide’s shape" title="Every guide, the same shape." soft="Task, steps, result." body="What you will do, what you need first, a few numbered steps, and what you will have at the end." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={480} h={490} title={chart.title} glyph="journal">
          <p className="text-[12.5px] text-[#A3AAAC]">{chart.task}</p>
          <div className="mt-3">
            <ScrollSteps items={chart.steps.map((s) => ({ label: s.title.split(" ").slice(0, 2).join(" "), detail: s.title }))} at={[0.16, 0.28, 0.4, 0.52]} />
          </div>
          <p className="mt-3 font-mono text-[10.5px] tracking-[0.1em] text-[#E9B44C]">RESULT</p>
          <Para>{chart.result}</Para>
        </Win>
        <ChartWin k="XAUUSD" at={0.36} x={550} y={20} w={610} h={490} />
      </OsSection>

      <OsSection n={4} label="Ask instead" title="Or just ask." soft="Typed or spoken." body={ask.task} app="Workspace">
        <Ask at={0.04} x={40} y={10} w={560} text="gold 4h and the calendar, side by side" />
        <ChartWin k="XAUUSD" at={0.16} x={40} y={74} w={560} h={436} title="Market data · Gold · 4H" />
        <Win at={0.26} x={630} y={74} w={530} h={250} title="Calendar · sample week" glyph="calendar">
          <Row k="Tue · US CPI" v="18:00 IST" gold />
          <Row k="Fri · US payrolls" v="19:00 IST" />
        </Win>
        <AvatarLine at={0.5} x={680} y={360} text="Ask me to open things for you. I never place trades." />
      </OsSection>

      <OsSection n={5} label="Alerts guide" title={alert.title + "."} soft="Read back, then confirmed." body={alert.task} app="Alerts" active="alerts">
        <Win at={0.06} x={40} y={20} w={560} h={360} title="Guide steps" glyph="journal">
          <ScrollSteps items={alert.steps.map((s) => ({ label: s.title.split(" ").slice(0, 2).join(" "), detail: s.title }))} at={[0.12, 0.24, 0.36, 0.48]} />
        </Win>
        <Win at={0.3} x={630} y={20} w={530} h={250} title="Read-back" glyph="alerts" ai>
          <Row k="Watches" v="Gold · daily candles" />
          <Row k="Condition" v="close above the weekly high" gold />
        </Win>
        <Note at={0.56} x={630} y={300} w={530} title="Result" sub={alert.result} />
      </OsSection>

      <OsSection n={6} label="Broker guide" title="Connect an account, read-only." soft="Investor password only." body={broker.task} app="Risk review" active="risk">
        <Win at={0.06} x={40} y={20} w={560} h={330} title={broker.title} glyph="journal">
          <ScrollSteps items={broker.steps.map((s) => ({ label: s.title.split(" ").slice(0, 2).join(" "), detail: s.title }))} at={[0.14, 0.28, 0.42]} />
        </Win>
        <Win at={0.36} x={630} y={20} w={530} h={240} title="Access" glyph="risk">
          <Row k="Investor (read-only) password" v={<span className="text-[#00E676]">✓ accepted</span>} />
          <Row k="Master or trading password" v={<span className="text-[#FF8A8A]">✕ never</span>} />
        </Win>
        <Note at={0.6} x={630} y={290} w={530} title="Positions · read-only" sub={broker.result} />
      </OsSection>

      <OsSection n={7} label="What you get" title="Where each guide leaves you." soft="The result, up front." body="Read the end before the start: each guide says what you will have when you finish." app="Resources">
        <Win at={0.06} x={40} y={20} w={1120} h={490} title="Results" glyph="research">
          {GUIDES.filter((g) => !["open-a-chart", "create-an-alert", "connect-your-broker-read-only"].includes(g.slug)).slice(0, 8).map((g, i) => (
            <Row key={g.slug} k={g.title} v={g.result.length > 70 ? g.result.slice(0, 68) + "…" : g.result} gold={i === 0} />
          ))}
        </Win>
      </OsSection>
    </>
  );
}

/* -------------------------------------------------------------------- Help */

export function HelpSections() {
  const price = topic("price-looks-wrong");
  const code = topic("verification-code");
  return (
    <>
      <OsSection n={2} label="Topics" title="Start with what went wrong." soft="Six common problems." body="Each topic names the symptom, the checks to run in order and what fixed looks like." app="Help">
        <Win at={0.06} x={40} y={20} w={620} h={420} title="Troubleshooting" glyph="settings">
          {TROUBLESHOOTING.map((t, i) => (
            <Row key={t.slug} k={t.capability} v={`${t.checks.length} checks`} gold={i === 2} />
          ))}
        </Win>
        <Win at={0.34} x={690} y={20} w={470} h={240} title="Every topic" glyph="layouts" ai>
          <Row k="1 · Symptom" v="what you see" />
          <Row k="2 · Checks" v="in the order to try them" />
          <Row k="3 · Fixed when" v="what working looks like" />
        </Win>
      </OsSection>

      <OsSection n={3} label="Price checks" title="A price looks wrong." soft="Four checks, in order." body="Most surprises are explained by the label: a delayed feed, a closed market or a genuinely missing value." app="Market data" active="charts">
        <ChartWin k="WTI" at={0.06} x={40} y={20} w={620} h={490} />
        <Win at={0.3} x={690} y={20} w={470} h={330} title="Checks" glyph="settings" ai>
          <ScrollSteps items={price.checks.map((c, i) => ({ label: `Check ${i + 1}`, detail: c.length > 44 ? c.slice(0, 42) + "…" : c }))} at={[0.36, 0.44, 0.52, 0.6]} />
        </Win>
        <Note at={0.66} x={690} y={380} w={470} title="Fixed when" sub={price.recovery} />
      </OsSection>

      <OsSection n={4} label="Codes" title="A code did not arrive." soft="Check before resending." body={code.symptom} app="Account">
        <Win at={0.06} x={40} y={20} w={600} h={340} title="Checks" glyph="phone">
          {code.checks.map((c) => (
            <Row key={c} k={c} />
          ))}
        </Win>
        <Note at={0.38} x={670} y={20} w={490} title="A newer code replaces the older one" sub="Use the latest code you received" />
        <Win at={0.56} x={670} y={110} w={490} h={250} title="Fixed when" glyph="calendar">
          <Para>{code.recovery}</Para>
        </Win>
      </OsSection>

      <OsSection n={5} label="Never asked" title="What AFVAR never asks for." soft="If it does, it is not us." body="These requests are always a scam, whoever claims to send them." app="Help">
        <Win at={0.06} x={40} y={20} w={680} h={360} title="AFVAR will never" glyph="risk">
          {HELP.never.map((n) => (
            <p key={n} className="flex gap-2.5 border-b border-[rgba(255,255,255,0.06)] py-2.5 text-[13px] leading-relaxed text-[#F5F7F7] last:border-b-0">
              <span className="text-[#FF8A8A]">✕</span>
              {n}
            </p>
          ))}
        </Win>
        <AvatarLine at={0.44} x={780} y={60} text="If someone asks for your trading password in my name, it is not me. Report it." />
      </OsSection>

      <OsSection n={6} label="Request" title="Send one request." soft="To one desk." body="Pick a topic, describe what happened and send. Product and account questions share the same support destination." app="Help">
        <Win at={0.06} x={40} y={20} w={720} h={420} title="Support request" glyph="phone">
          <p className="mb-2 font-mono text-[10.5px] tracking-[0.1em] text-[#6D7578]">TOPIC</p>
          <div className="flex flex-wrap gap-2">
            {HELP.topics.map((t, i) => (
              <Chip key={t} tone={i === 1 ? "gold" : "plain"}>
                {t}
              </Chip>
            ))}
          </div>
          <div className="mt-4 h-[120px] rounded-lg border border-[rgba(255,255,255,0.12)] p-2.5 text-[13px] text-[#C9CFD1]">I registered yesterday but cannot see my queue status…</div>
          <div className="mt-3 flex items-center gap-2">
            <Chip tone="sample">Sample request</Chip>
          </div>
        </Win>
        <Win at={0.4} x={790} y={20} w={370} h={260} title="Try first" glyph="settings">
          <Row k={topic("queue-status").title} />
        </Win>
      </OsSection>

      <OsSection n={7} label="Account help" title="Account and preview help." soft="Quick links." body="Short answers on registration, the queue, identity checks and what the preview shows." app="Help">
        <Win at={0.06} x={40} y={20} w={540} h={330} title="Account" glyph="settings">
          {HELP.account.map((a) => (
            <Row key={a.title} k={a.title} v={a.body.length > 34 ? a.body.slice(0, 32) + "…" : a.body} />
          ))}
        </Win>
        <Win at={0.3} x={620} y={20} w={540} h={330} title="Preview" glyph="layouts">
          {HELP.preview.map((a) => (
            <Row key={a.title} k={a.title} v={a.body.length > 34 ? a.body.slice(0, 32) + "…" : a.body} />
          ))}
        </Win>
      </OsSection>
    </>
  );
}

/* -------------------------------------------------------------------- FAQs */

const FAQ_GLYPH = ["research", "chart", "layouts", "calendar", "risk", "alerts"] as const;
/** Per group: section label, a lead line, how a trader might ask it, and a short answer. The full answers sit in the group's window. */
const FAQ_SECTION: Record<string, { label: string; body: string; ask: string; short: string }> = {
  status: { label: "Status", body: "Where AFVAR stands today, and what it will and will not do for you.", ask: "can I use afvar yet?", short: "In development. Registering joins the queue; the full workspace opens at launch." },
  markets: { label: "Markets and data", body: "What is covered, where prices come from and what their labels mean.", ask: "which markets does afvar follow?", short: "Eight lanes: Gold, Silver, crude oil, four major currency pairs and crypto." },
  devices: { label: "Devices", body: "Which screens can open what, before and after launch.", ask: "will it run on my phone?", short: "The website works on a phone. The workspace needs a laptop or desktop." },
  offers: { label: "Launch offers", body: "The two offers, and what decides which one you get.", ask: "what offers are there at launch?", short: "One for everyone in the queue, and one for those who also complete an identity check." },
  verification: { label: "Verification", body: "What you confirm when you register, and what is optional.", ask: "what do I have to verify to join?", short: "Your mobile number and email. Identity checks are your choice." },
  priority: { label: "Queue priority", body: "What can and cannot change your place in line.", ask: "can I get in earlier by verifying?", short: "No. Nothing you choose later changes your place." },
};

export function FaqSections() {
  return (
    <>
      {FAQ_GROUPS.map((g, n) => {
        const c = FAQ_SECTION[g.id];
        return (
          <div key={g.id} id={g.id} className="scroll-mt-20">
            <OsSection n={n + 2} label={c.label} title={`${g.title}.`} soft={`${g.items.length} answers.`} body={c.body} app="Resources">
              <Ask at={0.04} x={40} y={10} w={560} text={c.ask} />
              <Win at={0.14} x={40} y={74} w={560} h={200} title="Short answer" glyph={FAQ_GLYPH[n]} ai>
                <Para>{c.short}</Para>
              </Win>
              {n === 1 ? <AvatarLine at={0.34} x={90} y={310} text="Ask me anything on this page in your own words. I will point to the answer." /> : null}
              <Win at={0.3} x={630} y={10} w={530} h={500} title={`${g.title} · all answers`} glyph="research">
                {g.items.map((f) => (
                  <div key={f.q} className="border-b border-[rgba(255,255,255,0.06)] py-2 last:border-b-0">
                    <b className="text-[13px] text-[#F5F7F7]">{f.q}</b>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#A3AAAC]">{f.a}</p>
                  </div>
                ))}
              </Win>
            </OsSection>
          </div>
        );
      })}
    </>
  );
}

/* --------------------------------------------------------- Sources & evidence */

export function EvidenceSections() {
  return (
    <>
      <OsSection n={2} label="The badge" title="Five facts on every number." soft="Read them first." body="Source, venue, time, delay and cache age travel with each price, so you can tell how far to trust it." app="Market data" active="charts">
        <ChartWin k="BTC-USD" at={0.06} x={40} y={20} w={620} h={490} />
        <Win at={0.3} x={690} y={20} w={470} h={490} title="Badge fields" glyph="settings" ai>
          {EVIDENCE.badge.map((b) => (
            <div key={b.key} className="border-b border-[rgba(255,255,255,0.06)] py-2 last:border-b-0">
              <div className="flex justify-between">
                <b className="text-[13px] text-[#F5F7F7]">{b.label}</b>
                <span className="font-mono text-[11px] text-[#E9B44C]">{b.sample}</span>
              </div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-[#A3AAAC]">{b.body.split(". ")[0]}.</p>
            </div>
          ))}
        </Win>
      </OsSection>

      <OsSection n={3} label="Labels" title="Seven labels." soft="One per kind of number." body="A number is live, delayed, stored, closed, derived, a sample — or unavailable, and then it is left empty." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={1120} h={490} title="Labels" glyph="settings">
          {EVIDENCE.labels.map((l) => (
            <Row key={l.id} k={<Chip tone={l.id === "live" ? "live" : l.id === "delayed" ? "delayed" : l.id === "sample" ? "sample" : l.id === "unavailable" ? "red" : "stale"}>{l.label}</Chip>} v={l.body.split(" — ")[0].split(". ")[0]} />
          ))}
        </Win>
      </OsSection>

      <OsSection n={4} label="An analysis" title="How a view is built." soft="Every number linked." body="A view says BULLISH, BEARISH or WAIT, gives a watch zone, where it would be wrong and where it expects price to go — and links each number to its calculation." app="Research" active="research">
        <ViewChart />
        <Win at={0.36} x={760} y={20} w={400} h={330} title="View · sample" glyph="research" ai>
          {EVIDENCE.analysis.parts.map((p) => (
            <Row key={p.key} k={p.label} v={p.key === "view" ? "BULLISH" : p.key === "calc" ? "[calc #3]" : "on the chart"} gold={p.key === "view"} />
          ))}
        </Win>
        <AvatarLine at={0.62} x={790} y={390} text="Every number in my reasoning links to the code that worked it out." />
      </OsSection>

      <OsSection n={5} label="Graded record" title="Every call is graded." soft="WAIT included." body="Code compares each call with what price did next. Nobody picks which calls count." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={600} h={330} title="How grading works" glyph="settings">
          {EVIDENCE.records.points.map((p) => (
            <Row key={p} k={p.length > 70 ? p.slice(0, 68) + "…" : p} />
          ))}
        </Win>
        <Win at={0.34} x={670} y={20} w={490} h={200} title="How a result reads" glyph="chart">
          <p className="font-mono text-[14px] text-[#F5F7F7]">right 27 of 41 · expectancy +0.6R</p>
          <div className="mt-3">
            <Chip tone="sample">Format only · not a result</Chip>
          </div>
        </Win>
        <Note at={0.6} x={670} y={250} w={490} title="No records published yet" sub="Grading starts when analysis goes live" />
      </OsSection>

      <OsSection n={6} label="Strategy tests" title="Tests state their assumptions." soft="Next to the result." body={EVIDENCE.backtest.intro} app="Alerts" active="alerts">
        <Win at={0.06} x={40} y={20} w={560} h={360} title="Every test lists" glyph="settings">
          <ScrollSteps items={EVIDENCE.backtest.fields.map((f, i) => ({ label: `${i + 1}`, detail: f }))} at={[0.1, 0.18, 0.26, 0.34, 0.42, 0.5]} />
        </Win>
        <Win at={0.4} x={630} y={20} w={530} h={240} title="Status" glyph="calendar">
          <Para>Strategy testing is in development. No results are published yet.</Para>
          <div className="mt-3">
            <Chip tone="stale">In development</Chip>
          </div>
        </Win>
      </OsSection>

      <OsSection n={7} label="Limits" title="What a record cannot tell you." soft="Said plainly." body="A good record is about the past. Read the count beside every rate, and never treat it as a promise." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={760} h={330} title="Limits" glyph="risk">
          {EVIDENCE.records.limits.map((l) => (
            <p key={l} className="border-b border-[rgba(255,255,255,0.06)] py-2.5 text-[13.5px] text-[#F5F7F7] last:border-b-0">
              {l}
            </p>
          ))}
        </Win>
        <Note at={0.4} x={830} y={20} w={330} title="Analysis, not advice" sub="Decisions stay with you" />
      </OsSection>
    </>
  );
}

function ViewChart() {
  const r = useRange("XAUUSD");
  const zone = r?.sma20 ?? null;
  return (
    <ChartWin
      k="XAUUSD"
      at={0.06}
      x={40}
      y={20}
      w={690}
      h={490}
      title="Analysis · Gold · 1H · sample view on real candles"
      levels={r && zone ? [{ v: zone, label: "Watch zone", tone: "gold", solid: true }, { v: r.lo, label: "Invalidation", tone: "ink" }, { v: r.hi, label: "Objective", tone: "gold" }] : undefined}
      drawFrom={[0.2, 0.42]}
    />
  );
}
