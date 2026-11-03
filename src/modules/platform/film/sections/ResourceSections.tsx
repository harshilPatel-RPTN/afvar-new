"use client";

// The Resources family after its heroes: the hub, Getting started, Guides,
// Help, FAQs and Sources & evidence — six OS sections each, the avatar once.
// Desk layouts fill the 1200×558 desktop (x 40–1160, y 10–510); window heights
// follow their content (title 30 + padding 28, Row ≈ 35, step ≈ 33, Para line ≈ 22).
import type { ReactNode } from "react";
import { Ask, AvatarLine, Chip, Note, OsSection, Row, Win } from "@/modules/afvarOs";
import { CATEGORIES, EVIDENCE, FAQ_GROUPS, GETTING_STARTED, GUIDE_GROUPS, GUIDES, HELP, TROUBLESHOOTING, getGuide, getTopic, type Guide } from "@/modules/resources/kit";
import { ChartWin, Para, SYM, ScrollSteps, StatusChip, fmt, useQuote, useRange } from "./shared";
import { STATUS_LABEL, asOfText } from "../market/analysis";

const guide = (slug: string) => getGuide(slug) as Guide;
const FAQ_TOTAL = FAQ_GROUPS.reduce((n, g) => n + g.items.length, 0);
const HUB_COUNT: Record<string, string> = {
  start: `${GETTING_STARTED.steps.length} STEPS`,
  guides: `${GUIDES.length} GUIDES · ${GUIDE_GROUPS.length} GROUPS`,
  evidence: `${EVIDENCE.badge.length} BADGE FIELDS · ${EVIDENCE.labels.length} LABELS`,
  faqs: `${FAQ_TOTAL} ANSWERS`,
  help: `${TROUBLESHOOTING.length} TOPICS · ONE DESK`,
};
/** What each hub window lists: the first entries of that page. */
const HUB_LIST: Record<string, string[]> = {
  start: GETTING_STARTED.steps.slice(0, 2).map((s) => s.title),
  guides: GUIDES.slice(0, 2).map((g) => g.title),
  evidence: [EVIDENCE.badge.map((b) => b.label).join(" · "), "Labels, analysis and graded records"],
  faqs: FAQ_GROUPS.slice(0, 2).map((g) => g.title),
  help: TROUBLESHOOTING.slice(0, 2).map((t) => t.title),
};
const topic = (slug: string) => getTopic(slug)!;
const faq = (id: string) => FAQ_GROUPS.find((g) => g.id === id)!;
const MONO = "font-mono text-[10.5px] tracking-[0.1em]";
const ok = (t: string) => <span className="text-[#00E676]">✓ {t}</span>;

/**
 * Guide steps as one-line pairs for the desk's step lists (the label column is
 * 120 px and the detail a single line). Each pair restates that guide's own step.
 */
const STEP_LINES: Record<string, { label: string; detail: string }[]> = {
  "open-a-chart": [
    { label: "Palette", detail: "⌘K on a Mac · Ctrl+K on Windows" },
    { label: "Instrument", detail: "type it with a timeframe · “gold 4h”" },
    { label: "Timeframe", detail: "15m, 1h, 4h or 1d from the toolbar" },
    { label: "Badge", detail: "source, venue, time, delay, cache age" },
  ],
  "ask-the-os-agent": [
    { label: "Type or talk", detail: "write it, or hold to talk" },
    { label: "Ask to see", detail: "“gold 4h”, “open my risk panel”" },
    { label: "Combine", detail: "“close everything, open gold and the calendar”" },
    { label: "The boundary", detail: "“buy 2 lots” is declined · AFVAR never trades" },
  ],
  "create-an-alert": [
    { label: "Describe", detail: "the condition, in plain words" },
    { label: "Read back", detail: "AFVAR repeats it · asks if unclear" },
    { label: "Confirm", detail: "nothing is saved until you do" },
    { label: "Receive", detail: "in-app, by push or by voice" },
  ],
  "connect-your-broker-read-only": [
    { label: "Open Risk", detail: "Risk & Positions, from the dock" },
    { label: "Password", detail: "the read-only investor password" },
    { label: "Check", detail: "positions appear, marked read-only" },
  ],
  "set-risk-limits": [
    { label: "Say the rule", detail: "“Warn me at 2% daily loss” · read back" },
    { label: "Let it watch", detail: "daily loss, drawdown and margin" },
    { label: "Read the warning", detail: "it only warns · any action stays yours" },
  ],
};
/** The four price checks (help topic "price-looks-wrong") as one-line pairs. */
const PRICE_CHECKS = [
  { label: "Badge", detail: "source, venue, time, delay, cache age" },
  { label: "Futures", detail: "delayed and labelled · like with like" },
  { label: "Market hours", detail: "closed keeps its last price and time" },
  { label: "Unavailable", detail: "no trustworthy value · never guessed" },
];

/** A question and its answer inside a window. */
function Qa({ q, a, pad = "py-2" }: { q: string; a: string; pad?: string }) {
  return (
    <div className={`border-b border-[rgba(255,255,255,0.06)] ${pad} last:border-b-0`}>
      <b className="text-[13px] text-[#F2F5F2]">{q}</b>
      <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#B7C5BC]">{a}</p>
    </div>
  );
}

/** A mono label with a paragraph under it (e.g. RESULT · …). */
function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <p className={`mt-3 ${MONO} text-[#A8DEC2]`}>{label}</p>
      <div className="mt-1">
        <Para>{children}</Para>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------- Hub */

export function HubSections() {
  const alert = guide("create-an-alert");
  const clarify = topic("alert-clarification");
  const results = [
    { t: alert.title, kind: "guide", s: alert.task },
    { t: clarify.title, kind: "help", s: clarify.symptom },
    { t: guide("set-risk-limits").title, kind: "guide", s: guide("set-risk-limits").task },
    { t: faq("markets").items[4].q, kind: "answer", s: faq("markets").items[4].a },
  ];
  return (
    <>
      <OsSection n={2} label="Five places" title="Five places, each with one job." soft="Pick the one you need." body="Start, learn a task, check a number, find an answer or get help — each has its own page." app="Resources">
        {CATEGORIES.map((c, i) => (
          <Win key={c.id} at={0.05 + i * 0.1} x={40 + (i % 3) * 380} y={i < 3 ? 20 : 280} w={360} h={230} title={c.title} glyph={(["calendar", "journal", "settings", "research", "phone"] as const)[i]} ai={i === 2}>
            <Para>{c.summary}</Para>
            <p className={`mt-3 ${MONO} text-[#A8DEC2]`}>{HUB_COUNT[c.id]}</p>
            <div className="mt-1.5">
              {HUB_LIST[c.id].map((t) => (
                <Row key={t} k={t} />
              ))}
            </div>
          </Win>
        ))}
        <Win at={0.55} x={800} y={280} w={360} h={230} title="Which page?" glyph="research">
          <Row k="New here" v="Getting Started" />
          <Row k="Learn a task" v="Product Guides" />
          <Row k="Check a number" v="Sources & Evidence" />
          <Row k="Quick answer" v="FAQs" />
          <Row k="Something broke" v="Help & Support" />
        </Win>
      </OsSection>

      <OsSection n={3} label="Search" title="Search all of it." soft="One box." body="Guides, steps, answers and fixes are searched together, so the right page comes first whatever kind it is." app="Resources">
        <Ask at={0.04} x={40} y={10} w={620} text="how do I set an alert" />
        <Win at={0.14} x={40} y={74} w={620} h={292} title="Results · 4" glyph="research" ai>
          {results.map((r, i) => (
            <div key={r.t} className="border-b border-[rgba(255,255,255,0.06)] py-2 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <b className={`min-w-0 truncate text-[13.5px] ${i === 0 ? "text-[#A8DEC2]" : "text-[#F2F5F2]"}`}>{r.t}</b>
                <span className="shrink-0 font-mono text-[11px] text-[#92A399]">{r.kind}</span>
              </div>
              <p className="mt-0.5 truncate text-[12.5px] text-[#B7C5BC]">{r.s}</p>
            </div>
          ))}
        </Win>
        <Win at={0.26} x={40} y={390} w={620} h={120} title="Searched together" glyph="layouts">
          <div className="flex flex-wrap gap-2">
            <Chip tone="gold">{`${GUIDES.length} guides`}</Chip>
            <Chip>{`${GETTING_STARTED.steps.length} steps`}</Chip>
            <Chip>{`${FAQ_TOTAL} answers`}</Chip>
            <Chip>{`${TROUBLESHOOTING.length} fixes`}</Chip>
          </div>
          <div className="mt-3">
            <Para>The best match comes first, whatever kind of page it is.</Para>
          </div>
        </Win>
        <Win at={0.4} x={690} y={10} w={470} h={226} title={alert.title} glyph="alerts">
          <p className="text-[12.5px] text-[#B7C5BC]">{alert.task}</p>
          <div className="mt-3">
            <ScrollSteps items={STEP_LINES["create-an-alert"]} at={[0.46, 0.52, 0.58, 0.64]} />
          </div>
        </Win>
        <Win at={0.66} x={690} y={256} w={470} h={254} title={clarify.title} glyph="settings">
          <p className="text-[12.5px] text-[#B7C5BC]">{clarify.symptom}</p>
          <div className="mt-2">
            {clarify.checks.map((c) => (
              <Row key={c} k={c} />
            ))}
          </div>
          <Labelled label="FIXED WHEN">{clarify.recovery}</Labelled>
        </Win>
      </OsSection>

      <OsSection n={4} label="Start here" title="New here?" soft="Five steps." body={GETTING_STARTED.lede} app="Resources">
        <Win at={0.06} x={40} y={20} w={620} h={245} title="Getting started" glyph="calendar">
          <ScrollSteps items={GETTING_STARTED.steps.map((s, i) => ({ label: `Step ${i + 1}`, detail: s.title }))} at={[0.12, 0.2, 2, 2, 2]} />
        </Win>
        <Win at={0.24} x={690} y={20} w={470} h={404} title="What each step needs" glyph="journal">
          {GETTING_STARTED.steps.map((s, i) => (
            <div key={s.id} className="border-b border-[rgba(255,255,255,0.06)] py-2.5 last:border-b-0">
              <b className="block truncate text-[13px] text-[#F2F5F2]">{`${i + 1} · ${s.title}`}</b>
              {s.needs.map((n) => (
                <p key={n} className="truncate font-mono text-[11px] text-[#B7C5BC]">
                  {n}
                </p>
              ))}
            </div>
          ))}
        </Win>
        <Win at={0.42} x={40} y={289} w={620} h={221} title="Your device" glyph="layouts">
          <Para>{GETTING_STARTED.device}</Para>
          <div className="mt-2">
            <Row k="Workspace" v="1000 px and wider" gold />
            <Row k="Website" v="any screen" />
            <Row k="Second monitor" v="panels can pop out" />
          </div>
        </Win>
        <Note at={0.58} x={690} y={452} w={470} title="2 of 5 done" sub="Verified · in the queue" />
      </OsSection>

      <OsSection n={5} label="Check a number" title="Is this price fresh?" soft="The badge says." body="Every number carries five facts about itself. Sources & evidence explains each one." app="Market data" active="charts">
        <ChartWin k="XAUUSD" at={0.06} x={40} y={20} w={640} h={490} />
        <BadgeWin k="XAUUSD" at={0.3} x={710} y={20} w={450} />
        <Win at={0.44} x={710} y={280} w={450} h={164} title="What the status means" glyph="research">
          <Row k={<Chip tone="live">Live</Chip>} v="no stated delay" />
          <Row k={<Chip tone="delayed">Delayed</Chip>} v="real, minutes behind" />
          <Row k={<Chip tone="stale">Snapshot</Chip>} v="stored real value" />
        </Win>
        <AvatarLine at={0.58} x={760} y={452} text="If a number has no badge, I won’t use it." />
      </OsSection>

      <OsSection n={6} label="Quick answers" title="Asked most often." soft="Answered in a line." body="The questions people ask before anything else, with the short answer first." app="Resources">
        <Win at={0.06} x={40} y={20} w={1120} h={490} title="Top questions" glyph="research">
          {[faq("status").items[0], faq("status").items[1], faq("markets").items[0], faq("markets").items[2], faq("devices").items[0], faq("priority").items[0]].map((f) => (
            <div key={f.q} className="border-b border-[rgba(255,255,255,0.06)] py-2.5 last:border-b-0">
              <b className="text-[13.5px] text-[#F2F5F2]">{f.q}</b>
              <p className="mt-0.5 text-[13px] leading-relaxed text-[#B7C5BC]">{f.a}</p>
            </div>
          ))}
        </Win>
      </OsSection>

      <OsSection n={7} label="Still stuck" title="Still stuck?" soft="A person reads it." body="Try the fix for your problem first. If it does not help, send one request to the shared support desk." app="Resources">
        <Win at={0.06} x={40} y={20} w={560} h={300} title="Fixes" glyph="settings">
          {TROUBLESHOOTING.map((t, i) => (
            <Row key={t.slug} k={t.title} gold={i === 0} />
          ))}
        </Win>
        <Win at={0.2} x={630} y={20} w={530} h={300} title="Support request" glyph="phone">
          <p className={`mb-2 ${MONO} text-[#92A399]`}>TOPIC</p>
          <div className="flex flex-wrap gap-2">
            {HELP.topics.slice(0, 6).map((t, i) => (
              <Chip key={t} tone={i === 2 ? "gold" : "plain"}>
                {t}
              </Chip>
            ))}
          </div>
          <div className="mt-4 h-[96px] rounded-lg border border-[rgba(255,255,255,0.12)] p-2.5 text-[13px] text-[#92A399]">Describe what happened…</div>
        </Win>
        <Win at={0.34} x={40} y={344} w={560} h={166} title="Every fix" glyph="layouts" ai>
          <Row k="1 · Symptom" v="what you see" />
          <Row k="2 · Checks" v="in the order to try them" />
          <Row k="3 · Fixed when" v="what working looks like" />
        </Win>
        <Win at={0.48} x={630} y={344} w={530} h={166} title="Where it goes" glyph="phone">
          <Row k="Product questions" v="shared support desk" />
          <Row k="Account questions" v="shared support desk" />
          <Row k="Read by" v="a person" gold />
        </Win>
      </OsSection>
    </>
  );
}

/** The five facts of one live price (rows from the real quote; "—" until it arrives). */
function BadgeWin({ k, at, x, y, w, h = 236, venue = true, title = "Badge · this price" }: { k: string; at: number; x: number; y: number; w: number; h?: number; venue?: boolean; title?: string }) {
  const q = useQuote(k);
  return (
    <Win at={at} x={x} y={y} w={w} h={h} title={title} glyph="settings" ai>
      <Row k="Price" v={q?.last != null ? fmt(q.last, q.decimals) : "—"} gold />
      <Row k="Source" v={q?.source ?? "—"} />
      <Row k="Status" v={q ? STATUS_LABEL[q.status] : "—"} />
      <Row k="Time" v={q ? asOfText(q.asOf) : "—"} />
      {venue ? <Row k="Venue" v="spot / exchange, per source" /> : null}
    </Win>
  );
}

/* --------------------------------------------------------- Getting started */

export function StartSections() {
  const [verify, queue, identity, preview, invite] = GETTING_STARTED.steps;
  const code = topic("verification-code");
  const layout = guide("arrange-your-workspace");
  return (
    <>
      <OsSection n={2} label="Verify" title="Step 1 · Verify your mobile and email." soft="Two codes." body={verify.body} app="Account">
        <Win at={0.06} x={40} y={20} w={560} h={252} title="Register" glyph="phone">
          <Row k="Mobile" v="+91 ••••• ••210" />
          <Row k="Mobile code" v={ok("verified")} />
          <Row k="Email" v="you@••••.com" />
          <Row k="Email code" v={ok("verified")} />
          <div className="mt-3">
            <Chip tone="sample">Sample details</Chip>
          </div>
        </Win>
        <Win at={0.2} x={630} y={20} w={530} h={128} title="You will need" glyph="settings">
          {verify.needs.map((n) => (
            <Row key={n} k={n} />
          ))}
        </Win>
        <Note at={0.32} x={630} y={172} w={530} title="One account · one queue record" sub="Created the moment both codes check out" />
        <Win at={0.44} x={40} y={296} w={560} h={214} title="If a code is late" glyph="settings">
          {code.checks.map((c) => (
            <Row key={c} k={c} />
          ))}
        </Win>
        <Win at={0.56} x={630} y={254} w={530} h={256} title="Then · four more steps" glyph="calendar">
          <p className={`mb-2 ${MONO} text-[#92A399]`}>AFTER YOU VERIFY</p>
          {GETTING_STARTED.steps.slice(1).map((s, i) => (
            <Row key={s.id} k={s.title} v={`Step ${i + 2}`} gold={i === 0} />
          ))}
        </Win>
      </OsSection>

      <OsSection n={3} label="Queue" title="Step 2 · Follow your place." soft="It does not move." body={queue.body} app="Account">
        <Win at={0.06} x={40} y={20} w={560} h={224} title="Launch queue" glyph="calendar">
          <Row k="Status" v="in queue" gold />
          <Row k="Joined" v="recorded at registration" />
          <Row k="Invitations" v="sent in queue order" />
          <Row k="Moves with offers or checks" v="no" />
        </Win>
        <Win at={0.24} x={630} y={20} w={530} h={224} title="What changes your place" glyph="risk" ai>
          <Para>Nothing you choose later. Not a launch offer, not identity verification.</Para>
          <div className="mt-3">
            <Row k="Launch offer" v="no change" />
            <Row k="Identity check" v="no change" />
            <Row k="Your place" v="set when you registered" gold />
          </div>
        </Win>
        <Win at={0.4} x={40} y={268} w={1120} h={242} title="From registration to invitation" glyph="calendar">
          <ScrollSteps
            items={[
              { label: "Register", detail: "your place is recorded" },
              { label: "Verify", detail: "both codes — an unverified registration is incomplete" },
              { label: "Wait", detail: "offers and identity checks never move your place" },
              { label: "Invitation", detail: "sent in queue order" },
              { label: "Sign in", detail: "on a desktop or laptop" },
            ]}
            at={[0.46, 0.54, 0.62, 2, 2]}
          />
        </Win>
      </OsSection>

      <OsSection n={4} label="Identity" title="Step 3 · Identity, if you want it." soft="Never required." body={identity.body} app="Account">
        <Win at={0.06} x={40} y={20} w={540} h={210} title="Identity verification · optional" glyph="risk">
          <Row k="Required to join" v="no" />
          <Row k="Changes your offer" v="yes" gold />
          <Row k="Changes your place" v="no" />
          <Row k="Changes your access" v="no" />
        </Win>
        <Win at={0.24} x={620} y={20} w={540} h={210} title="Two offers" glyph="layouts">
          <Row k="Launch Queue" v="everyone who registers" />
          <Row k="Verified Launch Queue" v="after an identity check" />
          <Row k="Shared by both" v="one account · one queue record" />
          <Row k="Payment now" v="none required" />
        </Win>
        <Win at={0.42} x={40} y={254} w={1120} h={256} title="Asked about identity" glyph="research">
          {[faq("verification").items[0], faq("priority").items[0], faq("offers").items[1]].map((f) => (
            <Qa key={f.q} q={f.q} a={f.a} pad="py-2.5" />
          ))}
        </Win>
      </OsSection>

      <OsSection n={5} label="Preview" title="Step 4 · Look around now." soft="Labelled, on any device." body={preview.body} app="Market data" active="charts">
        <ChartWin k="EURUSD" at={0.06} x={40} y={20} w={640} h={490} />
        <Win at={0.32} x={710} y={20} w={450} h={232} title="Reading the preview" glyph="settings">
          <Row k="Real price" v={<Chip tone="live">Live</Chip>} />
          <Row k="Real, older" v={<Chip tone="delayed">Delayed</Chip>} />
          <Row k="Stored real value" v={<Chip tone="stale">Snapshot</Chip>} />
          <Row k="Market shut" v={<Chip tone="stale">Closed</Chip>} />
          <Row k="Illustration" v={<Chip tone="sample">Sample</Chip>} />
        </Win>
        <BadgeWin k="EURUSD" at={0.5} x={710} y={276} w={450} h={234} title="This chart · its badge" />
      </OsSection>

      <OsSection n={6} label="First session" title="Step 5 · Your first session." soft="Set up once." body={invite.body} app="Workspace">
        <Win at={0.06} x={40} y={20} w={540} h={212} title="Welcome · set up" glyph="settings">
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
        <Win at={0.2} x={620} y={20} w={540} h={292} title={layout.title} glyph="layouts">
          <p className="text-[12.5px] text-[#B7C5BC]">{layout.task}</p>
          <div className="mt-3">
            <Row k="Move a window" v="drag its title bar" />
            <Row k="Resize" v="drag any edge or corner" />
            <Row k="Second monitor" v="drag a panel to the edge" />
            <Row k="Let it save" v="saved to your account" gold />
          </div>
          <Labelled label="RESULT">{layout.result}</Labelled>
        </Win>
        <Win at={0.36} x={40} y={256} w={540} h={254} title="Your invitation" glyph="calendar">
          <Row k="Sent" v="in queue order" />
          <Row k="Sign in on" v="desktop or laptop" />
          <Row k="Screen" v="1000 px or wider" />
          <Row k="Guided tour" v="runs once · skip any time" />
          <Row k="Your layout" v="restored next time" />
        </Win>
        <Note at={0.5} x={620} y={332} w={540} title="Invitation · ready to sign in" sub="Desktop or laptop · screen 1000 px or wider" />
        <AvatarLine at={0.62} x={830} y={416} text="On your first day I will walk you round the desk once. After that I only answer when you ask." />
      </OsSection>

      <OsSection n={7} label="Device check" title="Check your screen." soft="Before the day comes." body="The workspace needs room for several windows at once. Phones and tablets keep this website, the queue and support." app="Workspace">
        <Win at={0.06} x={40} y={20} w={560} h={234} title="Device check" glyph="layouts">
          <Row k="Desktop or laptop" v={ok("workspace")} />
          <Row k="Screen 1000 px or wider" v={ok("workspace")} />
          <Row k="Full screen" v="recommended · top bar" />
          <Row k="Second monitor" v="panels can pop out" />
          <Row k="Phone or tablet" v="website, queue, support" />
        </Win>
        <Win at={0.24} x={630} y={20} w={530} h={234} title="Next" glyph="journal">
          {["open-a-chart", "arrange-your-workspace", "ask-the-os-agent", "language-currency-time-zone", "supported-devices"].map((s, i) => (
            <Row key={s} k={guide(s).title} v="guide" gold={i === 0} />
          ))}
        </Win>
        <Win at={0.42} x={40} y={278} w={1120} h={232} title={topic("workspace-on-small-screen").title} glyph="settings">
          {topic("workspace-on-small-screen").checks.map((c) => (
            <Row key={c} k={c} />
          ))}
          <Labelled label="FIXED WHEN">{topic("workspace-on-small-screen").recovery}</Labelled>
        </Win>
      </OsSection>
    </>
  );
}

/* ------------------------------------------------------------------ Guides */

/** Where each guide group sits on the desk (masonry: windows sized to their lists). */
const GROUP_POS = [
  { x: 40, y: 20, w: 540, h: 232 },
  { x: 40, y: 272, w: 540, h: 104 },
  { x: 620, y: 20, w: 540, h: 128 },
  { x: 40, y: 396, w: 540, h: 104 },
  { x: 620, y: 168, w: 540, h: 128 },
] as const;

export function GuidesSections() {
  const chart = guide("open-a-chart");
  const alert = guide("create-an-alert");
  const broker = guide("connect-your-broker-read-only");
  const limits = guide("set-risk-limits");
  const ask = guide("ask-the-os-agent");
  const positions = topic("positions-not-showing");
  return (
    <>
      <OsSection n={2} label="Groups" title="Guides by task." soft="Five groups." body="Each group matches one part of the workspace, so you can go from what you want to do to the steps." app="Resources">
        {GUIDE_GROUPS.map((g, i) => {
          const list = GUIDES.filter((x) => x.group === g.id);
          return (
            <Win key={g.id} at={0.05 + i * 0.1} {...GROUP_POS[i]} title={`${g.title} · ${list.length}`} glyph={(["chart", "alerts", "risk", "community", "settings"] as const)[i]}>
              {list.map((x) => (
                <Row key={x.slug} k={x.title} v={`${x.steps.length} steps`} />
              ))}
            </Win>
          );
        })}
        <Win at={0.55} x={620} y={316} w={540} h={194} title="Every guide" glyph="journal" ai>
          <Row k="Task" v="what you will do" />
          <Row k="Before you start" v="what you need first" />
          <Row k="Steps" v="a few, numbered" />
          <Row k="Result" v="what you will have" />
        </Win>
      </OsSection>

      <OsSection n={3} label="A guide’s shape" title="Every guide, the same shape." soft="Task, steps, result." body="What you will do, what you need first, a few numbered steps, and what you will have at the end." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={480} h={314} title={chart.title} glyph="journal">
          <p className="text-[12.5px] text-[#B7C5BC]">{chart.task}</p>
          <div className="mt-3">
            <ScrollSteps items={STEP_LINES[chart.slug]} at={[0.16, 0.28, 0.4, 0.52]} />
          </div>
          <Labelled label="RESULT">{chart.result}</Labelled>
        </Win>
        <Win at={0.24} x={40} y={354} w={480} h={156} title="Before you start" glyph="settings">
          {chart.prerequisites.map((p) => (
            <Row key={p} k={p} />
          ))}
          <p className="mt-2 font-mono text-[11px] text-[#92A399]">{chart.access}</p>
        </Win>
        <ChartWin k="XAUUSD" at={0.36} x={550} y={20} w={610} h={490} />
      </OsSection>

      <OsSection n={4} label="Ask instead" title="Or just ask." soft="Typed or spoken." body={ask.task} app="Workspace">
        <Ask at={0.04} x={40} y={10} w={560} text="gold 4h and the calendar, side by side" />
        <ChartWin k="XAUUSD" at={0.16} x={40} y={74} w={560} h={436} title="Market data · Gold · 4H" />
        <Win at={0.26} x={630} y={74} w={530} h={130} title="Calendar · sample week" glyph="calendar">
          <Row k="Tue · US CPI" v="18:00 IST" gold />
          <Row k="Fri · US payrolls" v="19:00 IST" />
        </Win>
        <Win at={0.36} x={630} y={224} w={530} h={192} title={ask.title} glyph="journal" ai>
          <ScrollSteps items={STEP_LINES[ask.slug]} at={[0.4, 0.46, 0.52, 0.58]} />
        </Win>
        <AvatarLine at={0.62} x={800} y={440} text="Ask me to open things for you. I never place trades." />
      </OsSection>

      <OsSection n={5} label="Alerts guide" title={alert.title + "."} soft="Read back, then confirmed." body={alert.task} app="Alerts" active="alerts">
        <Win at={0.06} x={40} y={20} w={560} h={194} title="Guide steps" glyph="journal">
          <ScrollSteps items={STEP_LINES[alert.slug]} at={[0.12, 0.24, 0.36, 0.48]} />
        </Win>
        <AlertChart at={0.22} x={40} y={234} w={560} h={276} />
        <Win at={0.3} x={630} y={20} w={530} h={198} title="Read-back" glyph="alerts" ai>
          <Row k="Watches" v="Gold · daily candles" />
          <Row k="Condition" v="close above the weekly high" gold />
          <Row k="If the wording is unclear" v="it asks, never guesses" />
          <Row k="Saved" v="only after you confirm" />
        </Win>
        <Win at={0.44} x={630} y={238} w={530} h={164} title="How it arrives" glyph="alerts">
          <Row k="Checked" v="by code, on closed candles" />
          <Row k="Delivered" v="in-app · push · voice" />
          <Row k="Fires" v="only on the approved condition" />
        </Win>
        <Note at={0.58} x={630} y={422} w={530} title="Result" sub={alert.result} />
      </OsSection>

      <OsSection n={6} label="Broker guide" title="Connect an account, read-only." soft="Investor password only." body={broker.task} app="Risk review" active="risk">
        <Win at={0.06} x={40} y={20} w={560} h={256} title={broker.title} glyph="journal">
          <ScrollSteps items={STEP_LINES[broker.slug]} at={[0.14, 0.28, 0.42]} />
          <p className={`mb-1 mt-3 ${MONO} text-[#A8DEC2]`}>BEFORE YOU START</p>
          {broker.prerequisites.map((p) => (
            <Row key={p} k={p} />
          ))}
        </Win>
        <Win at={0.3} x={630} y={20} w={530} h={162} title="Access" glyph="risk">
          <Row k="Investor (read-only) password" v={ok("accepted")} />
          <Row k="Master or trading password" v={<span className="text-[#FF8A8A]">✕ never</span>} />
          <Row k="Place, modify or close a trade" v={<span className="text-[#FF8A8A]">✕ never</span>} />
        </Win>
        <Note at={0.4} x={630} y={202} w={530} title="Positions · read-only" sub={broker.result} />
        <Win at={0.5} x={40} y={296} w={560} h={214} title={`Next · ${limits.title}`} glyph="risk">
          <ScrollSteps items={STEP_LINES[limits.slug]} at={[0.56, 0.62, 0.68]} />
          <div className="mt-3">
            <Para gold>{limits.result}</Para>
          </div>
        </Win>
        <Win at={0.6} x={630} y={290} w={530} h={220} title={positions.title} glyph="settings">
          {positions.checks.map((c) => (
            <Row key={c} k={c} />
          ))}
          <Labelled label="FIXED WHEN">{positions.recovery}</Labelled>
        </Win>
      </OsSection>

      <OsSection n={7} label="What you get" title="Where each guide leaves you." soft="The result, up front." body="Read the end before the start: each guide says what you will have when you finish." app="Resources">
        <Win at={0.06} x={40} y={20} w={1120} h={490} title={`Results · all ${GUIDES.length} guides`} glyph="research">
          <div className="grid grid-flow-col grid-cols-2 gap-x-8" style={{ gridTemplateRows: `repeat(${Math.ceil(GUIDES.length / 2)}, auto)` }}>
            {GUIDES.map((g, i) => (
              <div key={g.slug} className={`py-2.5 ${i % Math.ceil(GUIDES.length / 2) ? "border-t border-[rgba(255,255,255,0.06)]" : ""}`}>
                <b className={`text-[13px] ${i === 0 ? "text-[#A8DEC2]" : "text-[#F2F5F2]"}`}>{g.title}</b>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#B7C5BC]">{g.result}</p>
              </div>
            ))}
          </div>
        </Win>
      </OsSection>
    </>
  );
}

/** Gold on real candles, with the newest range's high drawn — the kind of level an alert watches. */
function AlertChart({ at, x, y, w, h }: { at: number; x: number; y: number; w: number; h: number }) {
  const r = useRange("XAUUSD");
  return <ChartWin k="XAUUSD" at={at} x={x} y={y} w={w} h={h} title="Market data · Gold · 1H · what the alert watches" levels={r ? [{ v: r.hi, label: "Recent high", tone: "gold" }] : undefined} drawFrom={[0.3, 0.44]} />;
}

/* -------------------------------------------------------------------- Help */

export function HelpSections() {
  const price = topic("price-looks-wrong");
  const code = topic("verification-code");
  const guided = [...new Set(TROUBLESHOOTING.flatMap((t) => (t.guide ? [t.guide] : [])))];
  const tryFirst = [topic("queue-status"), ...TROUBLESHOOTING.filter((t) => t.slug !== "queue-status")];
  return (
    <>
      <OsSection n={2} label="Topics" title="Start with what went wrong." soft="Six common problems." body="Each topic names the symptom, the checks to run in order and what fixed looks like." app="Help">
        <Win at={0.06} x={40} y={20} w={620} h={490} title="Troubleshooting" glyph="settings">
          {TROUBLESHOOTING.map((t, i) => (
            <div key={t.slug} className="border-b border-[rgba(255,255,255,0.06)] py-3 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <b className={`min-w-0 truncate text-[13px] ${i === 2 ? "text-[#A8DEC2]" : "text-[#F2F5F2]"}`}>{t.title}</b>
                <span className="shrink-0 font-mono text-[11px] text-[#92A399]">{`${t.checks.length} checks`}</span>
              </div>
              <p className="mt-0.5 truncate text-[12.5px] leading-relaxed text-[#B7C5BC]">{t.symptom}</p>
            </div>
          ))}
        </Win>
        <Win at={0.3} x={690} y={20} w={470} h={198} title="Every topic" glyph="layouts" ai>
          <Row k="1 · Symptom" v="what you see" />
          <Row k="2 · Checks" v="in the order to try them" />
          <Row k="3 · Fixed when" v="what working looks like" />
          <Row k="4 · Guide" v="the task, where there is one" />
        </Win>
        <Win at={0.44} x={690} y={238} w={470} h={196} title="Guides the topics point to" glyph="journal">
          {guided.map((s) => {
            const n = TROUBLESHOOTING.filter((t) => t.guide === s).length;
            return <Row key={s} k={guide(s).title} v={`${n} topic${n > 1 ? "s" : ""}`} />;
          })}
        </Win>
        <Note at={0.58} x={690} y={454} w={470} title="Still blocked?" sub="Send one request · the shared support desk" />
      </OsSection>

      <OsSection n={3} label="Price checks" title="A price looks wrong." soft="Four checks, in order." body="Most surprises are explained by the label: a delayed feed, a closed market or a genuinely missing value." app="Market data" active="charts">
        <ChartWin k="WTI" at={0.06} x={40} y={20} w={620} h={490} />
        <Win at={0.3} x={690} y={20} w={470} h={184} title={`Checks · ${price.checks.length}, in order`} glyph="settings" ai>
          <ScrollSteps items={PRICE_CHECKS} at={[0.36, 0.44, 0.52, 0.6]} />
        </Win>
        <BadgeWin k="WTI" at={0.42} x={690} y={224} w={470} h={196} venue={false} title={`Badge · ${SYM.WTI}`} />
        <Note at={0.66} x={690} y={440} w={470} title="Fixed when" sub={price.recovery} />
      </OsSection>

      <OsSection n={4} label="Codes" title="A code did not arrive." soft="Check before resending." body={code.symptom} app="Account">
        <Win at={0.06} x={40} y={20} w={600} h={216} title="Checks" glyph="phone">
          {code.checks.map((c) => (
            <Row key={c} k={c} />
          ))}
        </Win>
        <Note at={0.22} x={670} y={20} w={490} title="A newer code replaces the older one" sub="Use the latest code you received" />
        <Win at={0.34} x={670} y={98} w={490} h={170} title="Fixed when" glyph="calendar">
          <Para>{code.recovery}</Para>
          <div className="mt-2">
            <Row k="Mobile" v={ok("verified")} />
            <Row k="Email" v={ok("verified")} />
          </div>
        </Win>
        <Win at={0.46} x={40} y={256} w={600} h={254} title="Register · codes" glyph="phone">
          <Row k="Mobile" v="+91 ••••• ••210" />
          <Row k="Mobile code" v={<span className="text-[#F6B94A]">waiting</span>} />
          <Row k="Email" v="you@••••.com" />
          <Row k="Email code" v={ok("verified")} />
          <div className="mt-3">
            <Chip tone="sample">Sample details</Chip>
          </div>
        </Win>
        <Win at={0.58} x={670} y={288} w={490} h={222} title="Still no code?" glyph="phone">
          <Para>Send one support request under this topic:</Para>
          <div className="mt-2">
            <Chip tone="gold">{HELP.topics[1]}</Chip>
          </div>
          <div className="mt-3">
            <Row k="Goes to" v="one shared support desk" />
            <Row k="Read by" v="a person" />
          </div>
        </Win>
      </OsSection>

      <OsSection n={5} label="Never asked" title="What AFVAR never asks for." soft="If it does, it is not us." body="These requests are always a scam, whoever claims to send them." app="Help">
        <Win at={0.06} x={40} y={20} w={680} h={270} title="AFVAR will never" glyph="risk">
          {HELP.never.map((n) => (
            <p key={n} className="flex gap-2.5 border-b border-[rgba(255,255,255,0.06)] py-2.5 text-[13px] leading-relaxed text-[#F2F5F2] last:border-b-0">
              <span className="text-[#FF8A8A]">✕</span>
              {n}
            </p>
          ))}
        </Win>
        <AvatarLine at={0.3} x={820} y={20} text="If someone asks for your trading password in my name, it is not me. Report it." />
        <Win at={0.4} x={750} y={120} w={410} h={170} title="Only inside AFVAR" glyph="settings">
          <Row k="Broker access" v="investor password" />
          <Row k="Communities" v="8 official, in the app" />
          <Row k="Trades" v="yours, at your broker" />
        </Win>
        <Win at={0.55} x={40} y={314} w={1120} h={196} title="If someone asks" glyph="phone">
          <Row k="Do not share it" v="no password, code, money, crypto or API key" />
          <Row k="Check where it came from" v="the 8 official rooms are inside AFVAR" />
          <Row k="Report it" v="Help & Support · one request" gold />
          <Row k="Your account" v="AFVAR never trades on it" />
        </Win>
      </OsSection>

      {/* `#support` is the anchor the troubleshooting pages link back to. */}
      <div id="support" className="scroll-mt-20">
        <OsSection n={6} label="Request" title="Send one request." soft="To one desk." body="Pick a topic, describe what happened and send. Product and account questions share the same support destination." app="Help">
          <Win at={0.06} x={40} y={20} w={720} h={340} title="Support request" glyph="phone">
            <p className={`mb-2 ${MONO} text-[#92A399]`}>TOPIC</p>
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
          <Win at={0.3} x={790} y={20} w={370} h={270} title="Try first" glyph="settings">
            {tryFirst.map((t, i) => (
              <Row key={t.slug} k={t.title} gold={i === 0} />
            ))}
          </Win>
          <Win at={0.44} x={40} y={384} w={720} h={126} title="What happens next" glyph="phone">
            <Row k="Product and account questions" v="one shared support desk" />
            <Row k="Read by" v="a person" gold />
          </Win>
          <Win at={0.56} x={790} y={312} w={370} h={198} title="A good request says" glyph="journal">
            <Row k="What happened" v="in your words" />
            <Row k="When" v="date and time" />
            <Row k="Where" v="page or window" />
            <Row k="What you tried" v="the checks you ran" />
          </Win>
        </OsSection>
      </div>

      <OsSection n={7} label="Account help" title="Account and preview help." soft="Quick links." body="Short answers on registration, the queue, identity checks and what the preview shows." app="Help">
        <Win at={0.06} x={40} y={20} w={540} h={248} title="Account" glyph="settings">
          {HELP.account.map((a) => (
            <Qa key={a.title} q={a.title} a={a.body} pad="py-2.5" />
          ))}
        </Win>
        <Win at={0.22} x={620} y={20} w={540} h={248} title="Preview" glyph="layouts">
          {HELP.preview.map((a) => (
            <Qa key={a.title} q={a.title} a={a.body} pad="py-2.5" />
          ))}
        </Win>
        <Win at={0.38} x={40} y={292} w={540} h={218} title="Account questions" glyph="research">
          {[faq("verification").items[0], faq("priority").items[0]].map((f) => (
            <Qa key={f.q} q={f.q} a={f.a} />
          ))}
        </Win>
        <Win at={0.5} x={620} y={292} w={540} h={218} title="Preview questions" glyph="research">
          {[faq("devices").items[1], faq("devices").items[0]].map((f) => (
            <Qa key={f.q} q={f.q} a={f.a} />
          ))}
        </Win>
      </OsSection>
    </>
  );
}

/* -------------------------------------------------------------------- FAQs */

const FAQ_GLYPH = ["research", "chart", "layouts", "calendar", "risk", "alerts"] as const;
/** Per group: section label, a lead line, how a trader might ask it, a short answer and a one-line fact. The full answers sit in the group's window. */
const FAQ_SECTION: Record<string, { label: string; body: string; ask: string; short: string; note: [string, string] }> = {
  status: { label: "Status", body: "Where AFVAR stands today, and what it will and will not do for you.", ask: "can I use afvar yet?", short: "In development. Registering joins the queue; the full workspace opens at launch.", note: ["Analysis, not advice", "Decisions stay with you"] },
  markets: { label: "Markets and data", body: "What is covered, where prices come from and what their labels mean.", ask: "which markets does afvar follow?", short: "Eight lanes: Gold, Silver, crude oil, four major currency pairs and crypto.", note: ["Every number carries its badge", "Source · venue · time · delay · cache age"] },
  devices: { label: "Devices", body: "Which screens can open what, before and after launch.", ask: "will it run on my phone?", short: "The website works on a phone. The workspace needs a laptop or desktop.", note: ["Workspace · 1000 px and wider", "Website, queue and support · any screen"] },
  offers: { label: "Launch offers", body: "The two offers, and what decides which one you get.", ask: "what offers are there at launch?", short: "One for everyone in the queue, and one for those who also complete an identity check.", note: ["No payment is required now", "Terms confirmed before launch"] },
  verification: { label: "Verification", body: "What you confirm when you register, and what is optional.", ask: "what do I have to verify to join?", short: "Your mobile number and email. Identity checks are your choice.", note: ["Identity checks are optional", "They change offer eligibility only"] },
  priority: { label: "Queue priority", body: "What can and cannot change your place in line.", ask: "can I get in earlier by verifying?", short: "No. Nothing you choose later changes your place.", note: ["Your place is set at registration", "Nothing you choose later moves it"] },
};

/** The other Resources pages, for the space under a short answers list. */
const MORE_PAGES = CATEGORIES.filter((c) => c.id !== "faqs");
/** Estimated desk height of an answers window (500 px wide: question line + ~76 characters per answer line). */
const answersH = (items: readonly { a: string }[]) => Math.ceil(60 + items.reduce((h, f) => h + 38.5 + Math.ceil(f.a.length / 76) * 20.3, 0)) + 6;
const listH = (rows: number) => Math.ceil(62 + rows * 34.5);

/** What goes under the answers window: as many page rows as fit, plus a fact note when there is room. */
function faqFill(top: number) {
  const avail = 510 - top;
  let best = { rows: 0, note: false, used: 0 };
  for (let r = 0; r <= MORE_PAGES.length; r++) {
    const win = r ? listH(r) : 0;
    if (win > avail) break;
    const note = avail - win - (r ? 20 : 0) >= 58;
    const used = win + (note ? (r ? 20 : 0) + 58 : 0);
    if (used >= best.used) best = { rows: r, note, used };
  }
  return best;
}

export function FaqSections() {
  return (
    <>
      {FAQ_GROUPS.map((g, n) => {
        const c = FAQ_SECTION[g.id];
        const h = Math.min(500, answersH(g.items));
        const top = 10 + h + 20;
        const fill = faqFill(top);
        const others = FAQ_GROUPS.filter((o) => o.id !== g.id);
        return (
          <div key={g.id} id={g.id} className="scroll-mt-20">
            <OsSection n={n + 2} label={c.label} title={`${g.title}.`} soft={`${g.items.length} answers.`} body={c.body} app="Resources">
              <Ask at={0.04} x={40} y={10} w={560} text={c.ask} />
              <Win at={0.14} x={40} y={74} w={560} h={106} title="Short answer" glyph={FAQ_GLYPH[n]} ai>
                <Para>{c.short}</Para>
              </Win>
              <Win at={0.3} x={630} y={10} w={530} h={h} title={`${g.title} · all answers`} glyph="research">
                {g.items.map((f) => (
                  <Qa key={f.q} q={f.q} a={f.a} />
                ))}
              </Win>
              <Win at={0.42} x={40} y={204} w={560} h={232} title="Other answers" glyph="research">
                {others.map((o) => (
                  <Row key={o.id} k={o.title} v={`${o.items.length} answers`} />
                ))}
              </Win>
              {fill.rows ? (
                <Win at={0.5} x={630} y={top} w={530} h={listH(fill.rows)} title="More in Resources" glyph="journal">
                  {MORE_PAGES.slice(0, fill.rows).map((p) => (
                    <Row key={p.id} k={p.title} v={HUB_COUNT[p.id]} />
                  ))}
                </Win>
              ) : null}
              {fill.note ? <Note at={0.56} x={630} y={top + (fill.rows ? listH(fill.rows) + 20 : 0)} w={530} title={c.note[0]} sub={c.note[1]} /> : null}
              {n === 1 ? <AvatarLine at={0.6} x={240} y={436} text="Ask me anything on this page in your own words. I will point to the answer." /> : <Note at={0.6} x={40} y={452} w={560} title="Not answered here?" sub="Help & Support · one request, one desk" />}
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
        <BadgeFields k="BTC-USD" at={0.3} x={690} y={20} w={470} h={490} />
      </OsSection>

      <OsSection n={3} label="Labels" title="Seven labels." soft="One per kind of number." body="A number is live, delayed, stored, closed, derived, a sample — or unavailable, and then it is left empty." app="Market data" active="charts">
        <Win at={0.06} x={40} y={20} w={1120} h={304} title="Labels" glyph="settings">
          {EVIDENCE.labels.map((l) => (
            <Row key={l.id} k={<Chip tone={l.id === "live" ? "live" : l.id === "delayed" ? "delayed" : l.id === "sample" ? "sample" : l.id === "unavailable" ? "red" : "stale"}>{l.label}</Chip>} v={l.body.split(" — ")[0].split(". ")[0]} />
          ))}
        </Win>
        <LabelsNow at={0.4} x={40} y={346} w={545} h={164} />
        <Win at={0.52} x={615} y={346} w={545} h={164} title="Unavailable · left empty" glyph="risk">
          <Para>When AFVAR has no trustworthy value, the field stays empty instead of being filled with a guess.</Para>
          <div className="mt-2">
            <Row k={<Chip tone="red">Unavailable</Chip>} v="field left empty" />
            <Row k="Filled with a guess" v="never" />
          </div>
        </Win>
      </OsSection>

      <OsSection n={4} label="An analysis" title="How a view is built." soft="Every number linked." body="A view says BULLISH, BEARISH or WAIT, gives a watch zone, where it would be wrong and where it expects price to go — and links each number to its calculation." app="Research" active="research">
        <ViewChart />
        <ViewWin at={0.36} x={760} y={20} w={400} />
        <Win at={0.48} x={760} y={276} w={400} h={164} title="Read it this way" glyph="settings">
          <Row k="WAIT" v="signals disagree — a real answer" />
          <Row k="Invalidation" v="stated before, not after" />
          <Row k="[calc #n]" v="the logged code calculation" />
        </Win>
        <AvatarLine at={0.62} x={790} y={448} text="Every number in my reasoning links to the code that worked it out." />
      </OsSection>

      <OsSection n={5} label="Graded record" title="Every call is graded." soft="WAIT included." body="Code compares each call with what price did next. Nobody picks which calls count." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={600} h={230} title="How grading works" glyph="settings">
          {EVIDENCE.records.points.map((p) => (
            <p key={p} className="border-b border-[rgba(255,255,255,0.06)] py-2.5 text-[13px] leading-relaxed text-[#F2F5F2] last:border-b-0">
              {p}
            </p>
          ))}
        </Win>
        <Win at={0.2} x={670} y={20} w={490} h={115} title="How a result reads" glyph="chart">
          <p className="font-mono text-[14px] text-[#F2F5F2]">right 27 of 41 · expectancy +0.6R</p>
          <div className="mt-3">
            <Chip tone="sample">Format only · not a result</Chip>
          </div>
        </Win>
        <Note at={0.32} x={670} y={155} w={490} title="No records published yet" sub="Grading starts when analysis goes live" />
        <Win at={0.42} x={40} y={274} w={600} h={236} title="One call, start to grade" glyph="research">
          <ScrollSteps
            items={[
              { label: "View", detail: "BULLISH, BEARISH or WAIT" },
              { label: "Levels", detail: "zone, invalidation and objective, stated first" },
              { label: "Price", detail: "what it actually did next" },
              { label: "Grade", detail: "worked out by code" },
              { label: "Published", detail: "per instrument and timeframe" },
            ]}
            at={[0.48, 0.54, 0.6, 0.66, 2]}
          />
        </Win>
        <Win at={0.54} x={670} y={233} w={490} h={277} title="Read with every rate" glyph="chart">
          <Row k="Count" v="the calls behind it" gold />
          <Row k="Instrument" v="graded on its own" />
          <Row k="Timeframe" v="graded on its own" />
          <Row k="WAIT" v="graded like any call" />
          <Row k="Which calls count" v="all of them" />
          <Row k="What it describes" v="the past, not a promise" />
        </Win>
      </OsSection>

      <OsSection n={6} label="Strategy tests" title="Tests state their assumptions." soft="Next to the result." body={EVIDENCE.backtest.intro} app="Alerts" active="alerts">
        <Win at={0.06} x={40} y={20} w={560} h={258} title="Every test lists" glyph="settings">
          <ScrollSteps items={EVIDENCE.backtest.fields.map((f, i) => ({ label: (["Instrument", "Period", "Data", "Costs", "Rules", "Sample"] as const)[i] ?? `${i + 1}`, detail: f }))} at={[0.1, 0.18, 0.26, 0.34, 0.42, 0.5]} />
        </Win>
        <Win at={0.24} x={630} y={20} w={530} h={136} title="Status" glyph="calendar">
          <Para>Strategy testing is in development. No results are published yet.</Para>
          <div className="mt-3">
            <Chip tone="stale">In development</Chip>
          </div>
        </Win>
        <ChartWin k="XAUUSD" at={0.36} x={630} y={180} w={530} h={330} title="Data source and delay · Gold · 1H" />
        <Win at={0.52} x={40} y={302} w={560} h={208} title="Why each one matters" glyph="research">
          <Row k="Data source and its delay" v="what the test could see" />
          <Row k="Costs, spread and slippage" v="what a real fill costs" />
          <Row k="Test period" v="one stretch of the past" />
          <Row k="Sample size" v="small samples swing" gold />
        </Win>
      </OsSection>

      <OsSection n={7} label="Limits" title="What a record cannot tell you." soft="Said plainly." body="A good record is about the past. Read the count beside every rate, and never treat it as a promise." app="Research" active="research">
        <Win at={0.06} x={40} y={20} w={760} h={200} title="Limits" glyph="risk">
          {EVIDENCE.records.limits.map((l) => (
            <p key={l} className="border-b border-[rgba(255,255,255,0.06)] py-2.5 text-[13.5px] text-[#F2F5F2] last:border-b-0">
              {l}
            </p>
          ))}
        </Win>
        <Win at={0.2} x={830} y={20} w={330} h={200} title="A record says" glyph="research">
          <Row k="How past calls went" v="yes" />
          <Row k="What comes next" v="no" />
          <Row k="A small sample" v="swings" />
          <Row k="A promise" v="never" />
        </Win>
        <ChartWin k="XAUUSD" at={0.34} x={40} y={244} w={760} h={266} title="The past · Gold · 1H · real candles" />
        <Win at={0.46} x={830} y={244} w={330} h={164} title="Read beside every rate" glyph="chart">
          <Row k="Count" v="calls behind it" gold />
          <Row k="Instrument" v="graded alone" />
          <Row k="Timeframe" v="graded alone" />
        </Win>
        <Note at={0.58} x={830} y={432} w={330} title="Analysis, not advice" sub="Decisions stay with you" />
      </OsSection>
    </>
  );
}

/** The five badge fields, each beside what this live price carries for it (the fields the feed does not send stay plain). */
function BadgeFields({ k, at, x, y, w, h }: { k: string; at: number; x: number; y: number; w: number; h: number }) {
  const q = useQuote(k);
  const now: Record<string, string | undefined> = {
    source: q?.source ?? undefined,
    venue: "spot / exchange, per source",
    time: q ? asOfText(q.asOf) : undefined,
    delay: q ? STATUS_LABEL[q.status] : undefined,
  };
  return (
    <Win at={at} x={x} y={y} w={w} h={h} title={`Badge fields · ${SYM[k] ?? k}`} glyph="settings" ai>
      {EVIDENCE.badge.map((b) => (
        <div key={b.key} className="border-b border-[rgba(255,255,255,0.06)] py-2.5 last:border-b-0">
          <div className="flex justify-between gap-3">
            <b className="text-[13px] text-[#F2F5F2]">{b.label}</b>
            {now[b.key] ? <span className="truncate font-mono text-[11px] text-[#A8DEC2]">{now[b.key]}</span> : null}
          </div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[#B7C5BC]">{b.body}</p>
        </div>
      ))}
    </Win>
  );
}

/** Which label three real feeds carry right now. */
function LabelsNow({ at, x, y, w, h }: { at: number; x: number; y: number; w: number; h: number }) {
  const gold = useQuote("XAUUSD");
  const btc = useQuote("BTC-USD");
  const wti = useQuote("WTI");
  return (
    <Win at={at} x={x} y={y} w={w} h={h} title="Labels right now" glyph="chart" ai>
      {(
        [
          ["XAUUSD", gold],
          ["BTC-USD", btc],
          ["WTI", wti],
        ] as const
      ).map(([k, q]) => (
        <Row
          key={k}
          k={SYM[k]}
          v={
            <span className="flex items-center gap-2">
              {q ? asOfText(q.asOf) : "—"}
              <StatusChip q={q} />
            </span>
          }
        />
      ))}
    </Win>
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

/** The sample view's parts, with the levels the chart draws (worked out from the real candles). */
function ViewWin({ at, x, y, w }: { at: number; x: number; y: number; w: number }) {
  const r = useRange("XAUUSD");
  const level: Record<string, string> = { zone: fmt(r?.sma20, r?.d), invalidation: fmt(r?.lo, r?.d), objective: fmt(r?.hi, r?.d) };
  return (
    <Win at={at} x={x} y={y} w={w} h={236} title="View · sample" glyph="research" ai>
      {EVIDENCE.analysis.parts.map((p) => (
        <Row key={p.key} k={p.label} v={p.key === "view" ? "BULLISH" : p.key === "calc" ? "[calc #3]" : level[p.key]} gold={p.key === "view"} />
      ))}
    </Win>
  );
}
