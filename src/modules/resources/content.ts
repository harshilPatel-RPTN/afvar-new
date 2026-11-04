import { REGISTER_URL, type IconTone, type PlatformIcon } from "@/modules/platform/kit";

/**
 * W5 · Resources content. Sources: the W5 board (W5.1–W5.8), the team's
 * help-page brief (docs/AFWAR_Contact_Support_Help_Pages.md) and facts the
 * public site already states (home, pricing, markets). AFVAR is pre-launch:
 * every product guide describes the planned OS and says so; nothing here is
 * live data, and no data provider, model or cost is named (brief §0.3).
 */

export type CategoryId = "start" | "guides" | "evidence" | "faqs" | "help";

export interface Category {
  id: CategoryId;
  ref: string;
  href: string;
  title: string;
  icon: PlatformIcon;
  tone: IconTone;
  summary: string;
}

export const CATEGORIES: readonly Category[] = [
  {
    id: "start",
    ref: "W5.2",
    href: "/resources/getting-started",
    title: "Getting Started",
    icon: "flag",
    tone: "green",
    summary: "Verify your mobile and email, follow your launch queue status and get ready for your first session.",
  },
  {
    id: "guides",
    ref: "W5.3",
    href: "/resources/guides",
    title: "Product Guides",
    icon: "book",
    tone: "cyan",
    summary: "Step-by-step guides grouped by task — charts, alerts, risk, community and connections.",
  },
  {
    id: "evidence",
    ref: "W5.4",
    href: "/resources/sources-evidence",
    title: "Sources & Evidence",
    icon: "shield",
    tone: "purple",
    summary: "Where every number comes from, how fresh it is, and how analysis is measured and graded.",
  },
  {
    id: "faqs",
    ref: "W5.5",
    href: "/resources/faqs",
    title: "FAQs",
    icon: "message",
    tone: "slate",
    summary: "Straight answers on development status, markets, devices, launch offers and verification.",
  },
  {
    id: "help",
    ref: "W5.6",
    href: "/resources/help",
    title: "Help & Support",
    icon: "info",
    tone: "red",
    summary: "Troubleshooting topics, account and launch-status help, and one shared support destination.",
  },
] as const;

export function category(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id)!;
}

export const RESOURCES_HERO = {
  eyebrow: "AFVAR Resources",
  title: ["Everything you need to know.", "One place to find it."] as const,
  lede: "Getting started, product guides, where every number comes from, answers and help — one destination for each resource category.",
} as const;

export const REGISTER_LINK = { label: "Register Now", href: REGISTER_URL };

export const PRELAUNCH_NOTE =
  "Pre-launch · AFVAR is in development. Guides describe the planned OS workspace; screens and examples are illustrative, not live data.";

export const DISCLAIMER =
  "AFVAR provides market information, analysis and explanation only. It never places, modifies or closes trades, and nothing on AFVAR is investment advice. Trading decisions and their responsibility remain with the user.";

/* ------------------------------------------------ W5.2 · Getting Started */

export interface StartStep {
  id: string;
  ref: string;
  title: string;
  body: string;
  needs: string[];
  icon: PlatformIcon;
  link?: { label: string; href: string };
}

export const GETTING_STARTED = {
  title: ["Getting started.", "Five steps to your first session."] as const,
  lede: "Register once, follow your place in the launch queue, and be ready on the day your invitation arrives.",
  device: "The OS workspace runs on desktop and laptop only — the multi-window desktop needs a screen at least 1000 px wide. This website works everywhere.",
  steps: [
    {
      id: "verify",
      ref: "W5.2.1",
      title: "Verify your mobile and email",
      body: "Register once and confirm a mobile number and an email address. That gives you one account and one launch-queue record.",
      needs: ["A mobile number that can receive a code", "An email address you check"],
      icon: "user",
      link: { label: "Register Now", href: REGISTER_URL },
    },
    {
      id: "queue",
      ref: "W5.2.2",
      title: "Follow your launch queue status",
      body: "Your queue position is recorded when you register. Launch offers and verification never move it — invitations go out in queue order.",
      needs: ["Your verified account"],
      icon: "clock",
    },
    {
      id: "identity",
      ref: "W5.2.3",
      title: "Optional identity verification",
      body: "After joining you may choose identity approval. It is never required: it only changes which launch offer you are eligible for, not your queue order or access.",
      needs: ["Only if you want the verified launch offer"],
      icon: "shield",
      link: { label: "About the two launch offers", href: "/resources/faqs#offers" },
    },
    {
      id: "preview",
      ref: "W5.2.4",
      title: "Explore the available preview",
      body: "Before launch, the public website previews the platform. Screens use sample, clearly labelled data — anything real is marked LIVE or SNAPSHOT with its source.",
      needs: ["Any browser, any device"],
      icon: "desktop",
      link: { label: "Explore the platform", href: "/platform" },
    },
    {
      id: "invite",
      ref: "W5.2.5",
      title: "Invitation and first session",
      body: "When your invitation arrives, sign in on a desktop or laptop. You choose your edition (English or हिन्दी), region and time zone, then a short guided tour runs once.",
      needs: ["A desktop or laptop", "A screen at least 1000 px wide"],
      icon: "sparkle",
    },
  ] satisfies StartStep[],
};

/* -------------------------------------------- W5.3 · Product Guides (+W5.7) */

export type GuideGroupId = "charts" | "alerts" | "risk" | "community" | "access";

export const GUIDE_GROUPS: readonly { id: GuideGroupId; ref: string; title: string; icon: PlatformIcon; tone: IconTone; capability: string }[] = [
  { id: "charts", ref: "W5.3.2", title: "Charts & Research", icon: "trend", tone: "green", capability: "/platform/market-data" },
  { id: "alerts", ref: "W5.3.3", title: "Alerts & Strategy Tools", icon: "bell", tone: "purple", capability: "/platform/alerts" },
  { id: "risk", ref: "W5.3.4", title: "Journal, Portfolio & Risk", icon: "gauge", tone: "red", capability: "/platform/risk-review" },
  { id: "community", ref: "W5.3.5", title: "Community & Sharing", icon: "users", tone: "cyan", capability: "/platform/community" },
  { id: "access", ref: "W5.3.6", title: "Connections & Supported Access", icon: "plug", tone: "slate", capability: "/platform" },
] as const;

export interface Guide {
  slug: string;
  group: GuideGroupId;
  title: string;
  task: string;
  access: string;
  prerequisites: string[];
  steps: { title: string; body: string; keys?: string[] }[];
  result: string;
  next?: string;
  /** Optional illustration rendered by the guide template. */
  sample?: "verdict" | "alert" | "commands" | "windows" | "badge";
}

export const GUIDES: readonly Guide[] = [
  {
    slug: "open-a-chart",
    group: "charts",
    title: "Open a chart and change its timeframe",
    task: "Bring up any instrument in your coverage lanes and read it on the timeframe you trade.",
    access: "OS workspace · desktop or laptop",
    prerequisites: ["Signed in on the OS workspace", "One of the 8 instruments with a live or delayed feed"],
    steps: [
      { title: "Open the command palette", body: "Press ⌘K on a Mac or Ctrl+K on Windows from anywhere on the desktop.", keys: ["⌘", "K"] },
      { title: "Type the instrument and timeframe", body: "For example “gold 4h”. You can also pick the instrument from your Watchlist window." },
      { title: "Switch timeframe", body: "Choose 15m, 1h, 4h or 1d from the chart toolbar." },
      { title: "Check the provenance badge", body: "Every quote shows its source, venue, time, delay and cache age — read it before you rely on a number." },
    ],
    result: "A chart window for the instrument on your timeframe, with a provenance badge on every price.",
    next: "arrange-your-workspace",
    sample: "badge",
  },
  {
    slug: "arrange-your-workspace",
    group: "charts",
    title: "Move, resize and save your windows",
    task: "Lay out charts, news and risk side by side and keep that layout between sessions.",
    access: "OS workspace · desktop or laptop",
    prerequisites: ["Signed in on the OS workspace"],
    steps: [
      { title: "Move a window", body: "Drag it by its title bar." },
      { title: "Resize", body: "Drag any edge or corner." },
      { title: "Use a second monitor", body: "Drag a panel to the screen edge to pop it out." },
      { title: "Let it save", body: "Layouts save automatically to your account — your desktop restores exactly as you left it." },
    ],
    result: "Your workspace arranged the way you work, restored the next time you sign in.",
    next: "ask-the-os-agent",
    sample: "windows",
  },
  {
    slug: "ask-the-os-agent",
    group: "charts",
    title: "Ask AFVAR by typing or by voice",
    task: "Operate the workspace in plain words — in English or हिन्दी.",
    access: "OS workspace · desktop or laptop · microphone optional",
    prerequisites: ["Signed in on the OS workspace", "Microphone permission for voice (optional)"],
    steps: [
      { title: "Type or hold to talk", body: "Write a request, or push to talk. Spoken questions get spoken answers, and actions are confirmed aloud." },
      { title: "Ask for what you want to see", body: "“gold 4h”, “open my risk panel”, “same for silver”, “close this”." },
      { title: "Combine steps", body: "“Close everything, open gold and the calendar side by side.”" },
      { title: "Know the boundary", body: "A request such as “Buy 2 lots of gold” is politely declined — AFVAR never trades. Use your own broker terminal for orders." },
    ],
    result: "The workspace does what you asked and reports the outcome it verified.",
    next: "read-an-analysis",
    sample: "commands",
  },
  {
    slug: "read-an-analysis",
    group: "charts",
    title: "Read an analysis verdict",
    task: "Understand each part of an analysis card before you use it.",
    access: "OS workspace · desktop or laptop",
    prerequisites: ["An open chart or instrument card"],
    steps: [
      { title: "Read the view", body: "BULLISH, BEARISH or WAIT. WAIT means the signals disagree — it is a real answer, not a gap." },
      { title: "Find the levels", body: "The watch zone is where price matters; invalidation is where the view is proven wrong; the objective is where it expects price to reach." },
      { title: "Follow the reasoning", body: "Each number in the rationale links to the logged code calculation that produced it, shown as [calc #n]." },
      { title: "Check its record", body: "Every verdict, including every WAIT, is graded against what price actually did." },
    ],
    result: "You know what the analysis claims, where it would be wrong, and how its record is measured.",
    next: "follow-news-and-calendar",
    sample: "verdict",
  },
  {
    slug: "follow-news-and-calendar",
    group: "charts",
    title: "Follow news, the calendar and the daily brief",
    task: "Keep the context around your instruments in view.",
    access: "OS workspace · desktop or laptop",
    prerequisites: ["Signed in on the OS workspace"],
    steps: [
      { title: "Open the daily brief", body: "One per edition each morning: overnight moves, key levels, today's events and top headlines." },
      { title: "Scan the news", body: "Each headline is tagged with the instruments it affects, its relevance and its sentiment." },
      { title: "Watch the calendar", body: "Countdowns before major releases, with consensus against previous." },
    ],
    result: "The day's context for your instruments, each item with its source.",
    next: "create-an-alert",
  },
  {
    slug: "create-an-alert",
    group: "alerts",
    title: "Create an alert in plain words",
    task: "Get told when a condition you care about happens — without writing code.",
    access: "OS workspace · desktop or laptop",
    prerequisites: ["Signed in on the OS workspace", "One of the 8 instruments with a live or delayed feed"],
    steps: [
      { title: "Describe the condition", body: "For example: “Alert me if gold closes above the weekly high and RSI is above 70.”" },
      { title: "Check the read-back", body: "AFVAR repeats back exactly what it understood. If your wording is unclear it asks a question instead of guessing." },
      { title: "Confirm or edit", body: "Nothing is saved until you confirm." },
      { title: "Receive it", body: "Alerts are checked by code on closed candles and arrive in-app, by push notification or by voice." },
    ],
    result: "A confirmed alert that fires only on the condition you approved.",
    next: "connect-your-broker-read-only",
    sample: "alert",
  },
  {
    slug: "connect-your-broker-read-only",
    group: "risk",
    title: "Connect your MT5 account — read-only",
    task: "Let the risk tools see your positions without any ability to act on them.",
    access: "OS workspace · desktop or laptop",
    prerequisites: ["An MT5 account", "Its read-only investor password — never your master or trading password"],
    steps: [
      { title: "Open Risk & Positions", body: "From the dock or by asking “open my risk panel”." },
      { title: "Use the investor password", body: "AFVAR only accepts read-only investor access. It never holds credentials with trading rights." },
      { title: "Check the connection", body: "Your positions appear marked read-only. AFVAR can never place, modify or close a trade." },
    ],
    result: "Positions visible to the risk tools, with no way for AFVAR to act on the account.",
    next: "set-risk-limits",
  },
  {
    slug: "set-risk-limits",
    group: "risk",
    title: "Set personal risk limits",
    task: "Get warned before a bad day becomes a worse one.",
    access: "OS workspace · desktop or laptop",
    prerequisites: ["A read-only broker connection"],
    steps: [
      { title: "Say the rule", body: "For example: “Warn me at 2% daily loss.” AFVAR confirms the rule back to you." },
      { title: "Let it watch", body: "It tracks daily loss, drawdown and margin against your limits." },
      { title: "Read the warning", body: "Risk tools only ever warn. Any action stays yours, in your own broker terminal." },
    ],
    result: "Your limits on watch, with warnings — never actions — when they are reached.",
    next: "join-a-community-room",
  },
  {
    slug: "join-a-community-room",
    group: "community",
    title: "Join a community room",
    task: "Discuss an instrument with other traders in its official room.",
    access: "OS workspace · desktop or laptop",
    prerequisites: ["Signed in on the OS workspace"],
    steps: [
      { title: "Pick a room", body: "There are exactly 8 official rooms, one per coverage lane: Gold, Silver, Oil, EURUSD, USDJPY, GBPUSD, NZDUSD and Crypto." },
      { title: "Read and post", body: "Join, read and post. Rooms cannot be created, renamed or deleted by users — by design." },
      { title: "Report a problem", body: "To report a post or a user, use Help & Support." },
    ],
    result: "You're in the room for your instrument. Any “AFVAR” group outside the app is not us.",
    next: "language-currency-time-zone",
  },
  {
    slug: "language-currency-time-zone",
    group: "access",
    title: "Set your edition, currency and time zone",
    task: "See AFVAR in your language, your currency and your clock.",
    access: "OS workspace · desktop or laptop",
    prerequisites: ["Signed in on the OS workspace"],
    steps: [
      { title: "Open Settings", body: "From the menu bar or by asking for it." },
      { title: "Choose your edition", body: "English or हिन्दी." },
      { title: "Set currency and time zone", body: "Prices can display in your own currency, and session clocks follow your time zone." },
    ],
    result: "Text, prices and clocks that match where and how you trade.",
    next: "supported-devices",
  },
  {
    slug: "supported-devices",
    group: "access",
    title: "Supported devices and screens",
    task: "Know where the OS workspace runs before your invitation arrives.",
    access: "Any device for this website · desktop or laptop for the OS",
    prerequisites: ["A desktop or laptop", "A screen at least 1000 px wide"],
    steps: [
      { title: "Use a large screen", body: "The multi-window desktop needs at least 1000 px of width. Full screen is recommended and can be toggled from the top bar." },
      { title: "Add a second monitor", body: "Panels can pop out onto another screen." },
      { title: "Phones and tablets", body: "Use them for this website, the launch queue and support — not the OS workspace." },
    ],
    result: "A setup that runs the OS workspace comfortably.",
    next: "open-a-chart",
  },
] as const;

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/* ---------------------------------------------- W5.4 · Sources & Evidence */

export const EVIDENCE = {
  title: ["Sources & evidence.", "Every number can defend itself."] as const,
  lede: "Where AFVAR's numbers come from, how fresh they are, how analysis is built — and how its record is measured, limits included.",
  /** W5.4.1 — fields of the provenance envelope every market number carries. */
  badge: [
    { key: "source", label: "Source", sample: "Named provider", body: "The data provider the number came from. Providers are named on each number once their licensing is confirmed; until then coverage shows “no source yet”." },
    { key: "venue", label: "Venue", sample: "Exchange / OTC", body: "Where the price was set — an exchange, a futures venue or the over-the-counter market." },
    { key: "time", label: "Time", sample: "14:32:05 UTC", body: "When the price was observed, in UTC. Your session clocks can follow your own time zone." },
    { key: "delay", label: "Delay", sample: "delayed 15 min", body: "Live, or delayed by a stated number of minutes. Futures quotes are delayed and labelled as such." },
    { key: "cache", label: "Cache age", sample: "cache 12 s", body: "How long ago AFVAR fetched it. Staleness is computed from this, never guessed." },
  ],
  /** W5.4.2 — the labels a number can carry. */
  labels: [
    { id: "live", label: "LIVE", tone: "up", body: "Streaming from the source with no stated delay. Crypto streams 24/7." },
    { id: "delayed", label: "DELAYED", tone: "warn", body: "Real, but delayed by the number of minutes shown — common for futures." },
    { id: "snapshot", label: "SNAPSHOT", tone: "dim", body: "A stored real value shown while the live feed is unavailable. The time tells you how old it is." },
    { id: "closed", label: "CLOSED", tone: "dim", body: "The market is shut. The last price stays visible with its time." },
    { id: "derived", label: "DERIVED", tone: "dim", body: "Calculated by code from other sourced numbers — the calculation is logged." },
    { id: "sample", label: "SAMPLE", tone: "down", body: "Illustration only. Never a real price — used on pre-launch previews like this one." },
    { id: "unavailable", label: "UNAVAILABLE", tone: "down", body: "No trustworthy value right now. AFVAR shows the gap instead of filling it with a guess." },
  ],
  analysis: {
    view: "XAUUSD 1H · BULLISH",
    parts: [
      { key: "view", label: "View", text: "BULLISH", body: "BULLISH, BEARISH or WAIT. WAIT means the signals disagree — a real answer. AFVAR never says “buy” or “sell”." },
      { key: "zone", label: "Watch zone", text: "watch zone 2,642–2,648", body: "The price area that matters for this view." },
      { key: "invalidation", label: "Invalidation", text: "invalidation below 2,631", body: "Where the view is proven wrong — stated before, not after." },
      { key: "objective", label: "Objective", text: "objective 2,671", body: "Where the view expects price to reach." },
      { key: "calc", label: "Calculation link", text: "[calc #3]", body: "Every number in the rationale links to the logged code calculation that produced it. The AI never guesses a number." },
    ],
    rationale: "Higher low holding above rising EMA-50 [calc #3]; dollar index down 0.4% after CPI [calc #5]; ATR 6.2 supports the objective [calc #6].",
  },
  records: {
    points: [
      "Every verdict — including every WAIT — is graded by code against what price actually did.",
      "Win rate: how often calls were right. Expectancy: the average result per call, in multiples of risk (R).",
      "Results are public, per instrument and timeframe.",
    ],
    format: "Calls like this: right 27 of 41 · expectancy +0.6R",
    limits: [
      "No records are published yet — grading starts when analysis goes live at launch.",
      "A record describes past calls. It does not predict the next one.",
      "Small samples swing: read the count next to every rate.",
    ],
  },
  backtest: {
    intro: "Strategy testing is in development. When results are published, each will state the assumptions it was run under, next to the result.",
    fields: ["Instrument and timeframe", "Test period", "Data source and its delay", "Costs, spread and slippage", "Entry and exit rules", "Sample size"],
  },
} as const;

/* ---------------------------------------------------------- W5.5 · FAQs */

export interface FaqGroup {
  id: string;
  ref: string;
  title: string;
  items: { q: string; a: string }[];
}

export const FAQ_GROUPS: readonly FaqGroup[] = [
  {
    id: "status",
    ref: "W5.5.1",
    title: "Platform & development status",
    items: [
      { q: "Is AFVAR live?", a: "Not yet. AFVAR is in development. This website previews the platform; registering joins the launch queue and does not unlock the full OS." },
      { q: "Can AFVAR place trades for me?", a: "No. No order function exists anywhere in AFVAR — not in the app, not in the API, not in the AI. Use your own broker terminal to trade." },
      { q: "Why won't the AI tell me to buy or sell?", a: "AFVAR gives analysis, not advice. It observes, analyses and explains; the decision is always yours." },
      { q: "Is AFVAR investment advice?", a: "No. AFVAR provides market information, analysis and explanation only." },
    ],
  },
  {
    id: "markets",
    ref: "W5.5.2",
    title: "Markets & data",
    items: [
      { q: "Which markets does AFVAR cover?", a: "Ten instruments in three groups. Eight have a live or delayed feed: gold (XAU/USD), silver (XAG/USD), crude oil (WTI), EUR/USD, USD/JPY, GBP/USD, NZD/USD and Bitcoin (BTC). AUD/USD and Ether (ETH) are listed but their source is still pending, so they show no price yet." },
      { q: "Can I add stocks or other instruments?", a: "Not currently. AFVAR focuses on its ten listed instruments; the two still waiting for a source get prices once one is approved." },
      { q: "Where do the numbers come from?", a: "Every number is calculated by code from a named data source and carries its source, venue, time, delay and cache age. The AI never guesses a number." },
      { q: "Why is a price labelled delayed or snapshot?", a: "The label tells you exactly how fresh the number is. Futures quotes are delayed; a snapshot is a stored real value shown while the live feed is unavailable." },
      { q: "Why did I get WAIT?", a: "The signals disagree, so the analysis doesn't force a direction. WAIT is graded publicly like every other call." },
    ],
  },
  {
    id: "devices",
    ref: "W5.5.3",
    title: "Devices & preview access",
    items: [
      { q: "Does AFVAR work on my phone?", a: "This website, the launch queue and support work on any device. The OS workspace needs a desktop or laptop screen at least 1000 px wide." },
      { q: "What can I see before launch?", a: "The public preview: platform pages, market coverage and these resources. Screens use sample, clearly labelled data." },
      { q: "Which languages are available?", a: "English and हिन्दी editions." },
    ],
  },
  {
    id: "offers",
    ref: "W5.5.4",
    title: "The two launch offer categories",
    items: [
      { q: "What are the two launch offer categories?", a: "Launch Queue and Verified Launch Queue. Both share one account and one queue record; identity verification is optional and changes only which offer you are eligible for." },
      { q: "Are offer amounts confirmed?", a: "Not yet. Offer amount, capacity and duration are confirmed under approved terms before launch. No payment is required now." },
    ],
  },
  {
    id: "verification",
    ref: "W5.5.5",
    title: "Mobile, email & identity verification",
    items: [
      { q: "What do I need to verify?", a: "A mobile number and an email address when you register. Identity verification is optional and comes after joining." },
      { q: "Is my broker account safe?", a: "AFVAR uses read-only investor access only, never holds credentials with trading rights, and encrypts what it stores." },
    ],
  },
  {
    id: "priority",
    ref: "W5.5.6",
    title: "Same account; no invitation priority",
    items: [
      { q: "Does verification move me up the queue?", a: "No. Verification changes offer eligibility, never your queue position, invitation order or access priority." },
      { q: "Do launch offers change my access date?", a: "No. Queue order and access never change because of an offer. Offer benefits activate under their approved terms after launch." },
    ],
  },
] as const;

/* ------------------------------------------- W5.6 · Help & Support (+W5.8) */

export interface TroubleTopic {
  slug: string;
  title: string;
  capability: string;
  symptom: string;
  checks: string[];
  recovery: string;
  guide?: string;
  icon: PlatformIcon;
}

export const TROUBLESHOOTING: readonly TroubleTopic[] = [
  {
    slug: "verification-code",
    title: "A verification code didn't arrive",
    capability: "Registration · mobile and email verification",
    symptom: "You requested a code for your mobile number or email and nothing came through.",
    checks: [
      "Check the number includes the right country code.",
      "Look in spam, promotions or junk folders for the email.",
      "Wait a moment before asking for a new code — a newer code replaces the older one.",
      "Make sure the phone has signal and can receive messages.",
    ],
    recovery: "A fresh code arrives and your mobile or email shows as verified.",
    icon: "user",
  },
  {
    slug: "queue-status",
    title: "I can't see my launch queue status",
    capability: "Launch queue",
    symptom: "You registered but aren't sure your queue record exists.",
    checks: [
      "Sign in with the same mobile and email you registered with — one account holds one queue record.",
      "Finish both mobile and email verification; an unverified registration is incomplete.",
      "Remember that offers and identity verification never change your position.",
    ],
    recovery: "Your account shows its queue record.",
    guide: "supported-devices",
    icon: "clock",
  },
  {
    slug: "price-looks-wrong",
    title: "A price looks delayed, missing or wrong",
    capability: "Market data",
    symptom: "A quote seems old, shows “unavailable”, or doesn't match another screen.",
    checks: [
      "Read the badge: source, venue, time, delay and cache age.",
      "Futures quotes are delayed and labelled — compare like with like.",
      "Check whether the market is closed; the last price stays with its time.",
      "“Unavailable” means AFVAR has no trustworthy value — it won't guess one.",
    ],
    recovery: "You can tell whether the number is fresh, delayed, closed or genuinely missing.",
    guide: "open-a-chart",
    icon: "trend",
  },
  {
    slug: "workspace-on-small-screen",
    title: "The workspace won't open on my phone or tablet",
    capability: "Devices & access",
    symptom: "The OS workspace asks for a larger screen.",
    checks: [
      "Use a desktop or laptop with a screen at least 1000 px wide.",
      "Try full screen, or close side panels in your browser.",
      "On phones and tablets use this website, the queue and support instead.",
    ],
    recovery: "The multi-window desktop opens on a supported screen.",
    guide: "supported-devices",
    icon: "desktop",
  },
  {
    slug: "alert-clarification",
    title: "AFVAR asked a question about my alert",
    capability: "Alerts",
    symptom: "Instead of saving your alert, AFVAR asked what you meant.",
    checks: [
      "Name the instrument and timeframe — “gold, daily close”.",
      "Use a level or a condition AFVAR can measure — “above the weekly high”.",
      "Read the read-back carefully before you confirm.",
    ],
    recovery: "The read-back matches what you meant and you confirm the alert.",
    guide: "create-an-alert",
    icon: "bell",
  },
  {
    slug: "positions-not-showing",
    title: "My MT5 positions aren't showing",
    capability: "Risk & read-only connections",
    symptom: "You connected a broker account but no positions appear.",
    checks: [
      "Use the read-only investor password — never the master or trading password.",
      "Confirm the account number and server match your broker's details.",
      "Positions refresh from the broker; give the connection a moment after linking.",
    ],
    recovery: "Positions appear, marked read-only.",
    guide: "connect-your-broker-read-only",
    icon: "plug",
  },
] as const;

export function getTopic(slug: string): TroubleTopic | undefined {
  return TROUBLESHOOTING.find((t) => t.slug === slug);
}

export const HELP = {
  title: ["Help & support.", "Fix it, or tell us about it."] as const,
  lede: "Start with a troubleshooting topic. Still blocked? Send one request to the shared support destination.",
  account: [
    { title: "Registration and verification", body: "Mobile and email verification, codes and sign-in.", href: "/resources/help/verification-code" },
    { title: "Launch queue status", body: "Your queue record, offers and invitation order.", href: "/resources/help/queue-status" },
    { title: "Identity verification", body: "Optional — it changes offer eligibility only.", href: "/resources/faqs#verification" },
  ],
  preview: [
    { title: "What the preview shows", body: "Sample, clearly labelled data before launch.", href: "/resources/getting-started" },
    { title: "Reading a number's badge", body: "Source, venue, time, delay and cache age.", href: "/resources/sources-evidence" },
    { title: "Supported devices", body: "The OS needs a screen at least 1000 px wide.", href: "/resources/guides/supported-devices" },
  ],
  never: [
    "Ask for your MT5 master or trading password — AFVAR only ever uses the read-only investor password.",
    "Tell you to buy or sell anything, or send trading tips or signals.",
    "Ask you to send money, crypto or API keys to anyone.",
    "Run groups outside the app — there are exactly 8 official communities, all inside AFVAR.",
  ],
  topics: ["Account and sign-in", "Verification and launch queue", "Market data", "Analysis and verdicts", "Alerts", "Risk and read-only connections", "Workspace and devices", "Community", "Privacy and data", "Something else"],
} as const;
