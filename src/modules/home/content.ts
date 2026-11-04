// W1 · Home content (Figma board: WF01 / W1.1 content order, W1.2 link map).
// Nav, footer and theme come from `@/modules/markets` (SiteShell); the page is
// themed by `.mk` tokens in markets.css. Analysis only — never orders.

/** W1.1.1 — hero (copy per the REVISED cinematic homepage contract, §2/§6). */
export const HERO = {
  badge: "Pre-launch · OS in development",
  titleA: "The AI operating system",
  titleB: "for trading.",
  sub: "One connected desk to understand international markets, explore ideas and review your trading — commodities, forex and crypto, in English and हिन्दी.",
  primary: { label: "Register Now", href: "/register" },
  secondary: { label: "Explore the platform", href: "/platform" },
  /** Only accurate while quotes come from the AFVAR data layer (Yahoo proxy; futures delayed). */
  caption: "Quotes via the AFVAR data layer · futures delayed · not investment advice",
  sceneNote: "The market terrain is an illustrative render — the callout and ticker quotes are real",
} as const;

export const STATS = [
  { value: "8", label: "coverage lanes" },
  { value: "2", label: "language editions" },
  { value: "24/7", label: "crypto coverage" },
  { value: "0", label: "order buttons" },
] as const;

/** Hero dock — the eight desk apps (supporting UI, revealed late in the scroll story). */
export const DOCK = [
  { label: "Charts", glyph: "chart" },
  { label: "News", glyph: "news" },
  { label: "Calendar", glyph: "calendar" },
  { label: "Alerts", glyph: "bell" },
  { label: "Risk", glyph: "shield" },
  { label: "Journal", glyph: "book" },
  { label: "Community", glyph: "users" },
  { label: "AI Analyst", glyph: "spark" },
] as const;

/** Footer (REVISED contract §16): disclaimer first, five groups, company line, language chips. */
export const DISCLAIMER =
  "AFVAR provides market information, analysis and explanation only. It never places, modifies or closes trades, and nothing on AFVAR is investment advice. Trading decisions and their responsibility remain with the user.";

export const FOOTER_COLS: { title: string; links: { label: string; href: string }[] }[] = [
  { title: "Platform", links: [
    { label: "Platform Overview", href: "/platform" },
    { label: "Market Data & Charts", href: "/platform/charts" },
    { label: "Research & Analysis", href: "/platform/research" },
    { label: "Alerts & Strategy Tools", href: "/platform/alerts" },
    { label: "Risk & Trade Review", href: "/platform/trade-review" },
    { label: "Community", href: "/platform/community" },
  ]},
  { title: "Markets", links: [
    { label: "Markets Overview", href: "/market" },
    { label: "Commodities", href: "/market/commodities" },
    { label: "Forex", href: "/market/forex" },
    { label: "Crypto", href: "/market/crypto" },
    { label: "Market Briefs", href: "/market/briefs" },
  ]},
  { title: "Resources", links: [
    { label: "Getting Started", href: "/resources/getting-started" },
    { label: "Product Guides", href: "/resources/guides" },
    { label: "Sources & Evidence", href: "/resources/sources-evidence" },
    { label: "FAQs", href: "/resources/faqs" },
    { label: "Help & Support", href: "/resources/help" },
  ]},
  { title: "Company", links: [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
  ]},
  { title: "Policies", links: [
    { label: "Security", href: "/security" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Launch Offer Terms", href: "/launch-offer-terms" },
  ]},
];

export const COMPANY_LINE = "Copyright © 2026 RedPhantom Tech Novelty Private Limited · CIN U72900PN2021PTC204792 · Pandharpur, Maharashtra, India";
export const LANG_CHIPS = ["English", "हिन्दी"] as const;
export const PRELAUNCH_NOTE = "Pre-launch · the OS workspace runs on desktop and laptop.";

/** Navbar (REVISED contract §5.2). Dropdown routes reuse the configured site routes. */
export const NAV = [
  { label: "Home", href: "/" },
  { label: "Platform", href: "/platform", children: [
    { label: "Platform Overview", href: "/platform" },
    { label: "Market Data & Charts", href: "/platform/charts" },
    { label: "Research & Analysis", href: "/platform/research" },
    { label: "Alerts & Strategy Tools", href: "/platform/alerts" },
    { label: "Risk & Trade Review", href: "/platform/trade-review" },
    { label: "Community", href: "/platform/community" },
  ]},
  { label: "Markets", href: "/market", children: [
    { label: "Markets Overview", href: "/market" },
    { label: "Commodities", href: "/market/commodities" },
    { label: "Forex", href: "/market/forex" },
    { label: "Crypto", href: "/market/crypto" },
  ]},
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources", children: [
    { label: "Getting Started", href: "/resources/getting-started" },
    { label: "Product Guides", href: "/resources/guides" },
    { label: "Sources & Evidence", href: "/resources/sources-evidence" },
    { label: "FAQs", href: "/resources/faqs" },
    { label: "Help & Support", href: "/resources/help" },
  ]},
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
] as const;

/** Hero data callout — ONE real quote, late in the story (README §6 Chapter E; LIVE/SNAPSHOT from useLiveMarket). */
export const HERO_CALLOUTS = ["XAUUSD"] as const;

/** W1.1.2 — overview video. */
export const OVERVIEW = {
  kicker: "Overview",
  title: "See the whole desk. In ninety seconds.",
  body: "A fast tour of how charts, news, research, alerts, risk and community work together inside AFVAR.",
  playLabel: "Play overview video",
  playNote: "Interactive preview capture · sample data · final film pending",
} as const;

/** W1.1.3 — five capability previews (links per W1.2). */
export const CAPABILITIES = [
  { n: "01", title: "Follow markets", linkLabel: "Charts & watchlists", body: "Live charts, watchlists and heatmaps across commodities, forex and crypto — one connected workspace instead of twelve tabs.", href: "/platform/market-data", glyph: "chart" },
  { n: "02", title: "Understand context", linkLabel: "News & research", body: "News, economic calendar and market briefs tied to the instruments they move, with the source and freshness on every number.", href: "/platform/research", glyph: "doc" },
  { n: "03", title: "Evaluate ideas", linkLabel: "Alerts & strategy tools", body: "Plain-words alerts, screeners and strategy tests — repeated back and confirmed before anything is armed.", href: "/platform/alerts", glyph: "bulb" },
  { n: "04", title: "Review your trading", linkLabel: "Risk & trade review", body: "Read-only broker connections, exposure, personal limits and a journal. Risk Guardian warns — it never acts on your account.", href: "/platform/risk-review", glyph: "shield" },
  { n: "05", title: "Connect with traders", linkLabel: "Community", body: "Eight official rooms, one per coverage lane, with shared charts and verified records. No scam channels, by design.", href: "/platform/community", glyph: "users" },
] as const;

export const CAPABILITIES_SUB = "Everything you need to understand markets, explore ideas and review your trading, in one place.";

/** W1.1.4 — markets covered (live quotes fill these cards). */
export const MARKET_GROUPS = [
  { title: "Commodities", symbols: ["XAUUSD", "XAGUSD", "WTI"], href: "/market/commodities", note: "Gold, silver and crude — the lanes that move first on macro." },
  { title: "Forex", symbols: ["EURUSD", "USDJPY", "GBPUSD", "NZDUSD"], href: "/market/forex", note: "Major pairs across London, New York and Asia sessions." },
] as const;

export const CRYPTO_NOTE = "Bitcoin first, every listed coin through search. 24/7.";

export const MARKETS_SUB = "Eight confirmed coverage lanes across three categories — every number with its source and freshness.";

/** Per-symbol row icon: flag emoji, or a tinted monogram disc. */
export const SYMBOL_META: Record<string, { flag?: string; mono?: string; from?: string; to?: string }> = {
  XAUUSD: { mono: "Au" },
  XAGUSD: { mono: "Ag" },
  WTI: { mono: "Oil" },
  EURUSD: { flag: "🇪🇺" },
  USDJPY: { flag: "🇺🇸" },
  GBPUSD: { flag: "🇬🇧" },
  NZDUSD: { flag: "🇳🇿" },
  "BTC-USD": { mono: "₿" },
};

/** W1.1.5 — how it works. */
export const HOW_IT_WORKS = {
  kicker: "How it works",
  title: "From data to insight.",
  body: "AFVAR brings together trusted sources, market context and AI analysis to help you understand what's happening in global markets.",
  steps: [
    { n: "01", title: "Collect from trusted sources", body: "Every data point shows its source and status." },
    { n: "02", title: "Analyse with AI", body: "Identify key themes, trends and risks." },
    { n: "03", title: "Present clear insights", body: "Simple, structured and easy to understand." },
  ],
  cta: { label: "See How It Works", href: "/resources/getting-started" },
} as const;

/** W1.1.6 — key topics / market themes. */
export const KEY_TOPICS = [
  { title: "Global economy", body: "How macro trends can impact markets.", glyph: "globe" },
  { title: "Supply and demand", body: "Market structure and fundamental drivers.", glyph: "layers" },
  { title: "Geopolitics", body: "Key events and their potential impact.", glyph: "news" },
  { title: "Central banks", body: "Understand monetary policy and its effects.", glyph: "bank" },
  { title: "On-chain trends", body: "For major cryptocurrencies.", glyph: "chart" },
  { title: "Risk management", body: "Key risks to be aware of.", glyph: "shield" },
] as const;

/** W1.1.5 — why AFVAR. */
export const WHY_INTRO = "A connected system, clear context and transparent AI — designed for serious traders who want evidence, not opinions.";

export const WHY = [
  { glyph: "layers", title: "One AI operating system", body: "Charts, research, alerts, risk and community run as connected apps in a single desk — your layout follows your account to any screen." },
  { glyph: "doc", title: "Clear market context", body: "Every price, verdict and headline carries its source, venue, delay and cache age. The AI never invents a number — code computes, it explains." },
  { glyph: "spark", title: "From question to insight", body: "Ask in English or हिन्दी. Spoken questions get spoken answers; every analysis is graded publicly in the Track Record." },
] as const;

/** W1.1.6 — sources & evidence. */
export const EVIDENCE = {
  kicker: "Sources & evidence",
  statement: "Every quote shows its source, venue, delay and cache age. Every analysis is graded publicly — including every WAIT.",
  cta: { label: "Explore our evidence", href: "/resources/sources-evidence" },
} as const;

/** W1.1.7 — the two pre-launch offers. Values deliberately unconfirmed (W9.7). */
export const OFFERS = [
  {
    title: "Launch Queue",
    tone: "cyan" as const,
    tag: "Offer 01",
    points: ["Verify your mobile and email — one account, one queue record", "Launch benefit under approved terms, to be confirmed", "Your queue position never changes because of an offer"],
    cta: { label: "Join the Launch Queue", href: "/register" },
  },
  {
    title: "Verified Launch Queue",
    tone: "red" as const,
    tag: "Offer 02 · optional",
    points: ["Optional identity approval after joining — never required", "Separate verified benefit, to be confirmed", "Same account and queue order; no invitation priority"],
    cta: { label: "Learn about verification", href: "/register" },
  },
] as const;

export const OFFER_DISCLAIMER =
  "Same account and queue order. No invitation priority. Offer amount, capacity and duration are not yet confirmed. No payment is required now.";

/** W1.1.8 — register / join the launch queue. */
export const WAITLIST = {
  title: "Join the launch queue.",
  body: "Early access, feature updates and launch announcements.",
  placeholder: "Enter your email address",
  cta: "Join Waitlist",
} as const;

/* ─────────────────────────── W4 · Pricing page ───────────────────────────
   W4.1 section order. Per W4.2 (internal), prices, plan names, allowances,
   entitlements and top-ups are NOT decided — everything commercial renders
   as "to be confirmed". Offers reuse the same catalogue as the home page. */

export const PRICING_HERO = {
  kicker: "Pricing",
  title: "Simple plans. Confirmed at launch.",
  sub: "Three plan tiers on the same connected desk — start free, go further from ₹200 a month. Pricing is indicative until launch — join the queue to hear the final plans first.",
  note: "Verification changes offer eligibility, not access priority.",
} as const;

/** An indicative tier price in rupees, grouped the Indian way: 200 → "₹200", 1500 → "₹1,500". */
export const formatInr = (amount: number) => `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/** W4.1.1 — planned tier structure (names open per W4.2.1; prices indicative).
 *  `monthly` is the indicative monthly price in ₹; yearly billing gives 2 months free. */
export const PRICING_TIERS = [
  {
    tag: "Tier 01",
    name: "Plan name — TBC",
    monthly: 0,
    blurb: "The essentials of the desk for following markets day to day.",
    features: ["Live charts & watchlists", "News & economic calendar", "Price & condition alerts", "Community — read access"],
    highlighted: false,
  },
  {
    tag: "Tier 02",
    name: "Plan name — TBC",
    monthly: 200,
    blurb: "The full connected desk for active traders.",
    features: ["Everything in Tier 01", "AI Analyst in English & हिन्दी", "Screeners & strategy testing", "Risk Guardian, limits & journal", "Community — full participation"],
    highlighted: true,
  },
  {
    tag: "Tier 03",
    name: "Plan name — TBC",
    monthly: 500,
    blurb: "Higher allowances for heavy research workloads.",
    features: ["Everything in Tier 02", "Higher usage allowances", "Deep research & event analysis", "Priority support"],
    highlighted: false,
  },
] as const;

export const PRICING_TIERS_NOTE =
  "Indicative pricing shown for orientation. Final plan names, prices and the exact placement of capabilities across tiers are confirmed before launch under approved terms.";

/** W4.1.2 — included capabilities (confirmed product scope). */
export const PRICING_CAPABILITIES = [
  { glyph: "chart", title: "Market data & charts", body: "Quotes, watchlists, technicals and heatmaps across every coverage lane." },
  { glyph: "news", title: "Research & analysis", body: "Economic calendar, news with sentiment and published market briefs." },
  { glyph: "bell", title: "Alerts & strategy tools", body: "Plain-words alerts, screeners, scheduled scans and strategy testing." },
  { glyph: "shield", title: "Risk & trade review", body: "Read-only broker connections, exposure, personal limits and a journal." },
  { glyph: "users", title: "Community", body: "Eight official rooms with shared charts and verified records." },
  { glyph: "spark", title: "AI Analyst", body: "Spoken and written analysis in English and हिन्दी — graded publicly." },
] as const;

/** W4.1.3 — usage & limits (all open per W4.2.2 / W4.2.4). */
export const PRICING_USAGE: Array<[string, string]> = [
  ["Included usage allowances", "To be confirmed before launch"],
  ["AI analysis quota", "To be confirmed before launch"],
  ["Alert & screener limits", "To be confirmed before launch"],
  ["Top-ups and expiry", "To be confirmed before launch"],
  ["Offer counts, duration & rates", "Set under approved launch offer terms"],
];

/** W4.1.4 — market data access (confirmed coverage facts). */
export const PRICING_DATA_POINTS = [
  "Eight confirmed coverage lanes: gold, silver, crude, four major forex pairs and Bitcoin — every listed coin through search.",
  "Crypto streams 24/7; futures quotes are delayed and labelled as such.",
  "Every number carries its source, venue, delay and cache age.",
] as const;

/** W4.1.5 — offer & billing FAQs (full FAQs live under Resources → W5.5). */
export const PRICING_FAQS = [
  { q: "Are the prices on this page final?", a: "No — they are indicative. Final plan names, prices and included allowances are confirmed closer to launch under approved terms." },
  { q: "Does joining the launch queue cost anything?", a: "No. Registration is free and no payment is required now. You verify a mobile number and email — one account, one queue record." },
  { q: "What are the two launch offer categories?", a: "Launch Queue and Verified Launch Queue. Both share one account and one queue record; identity verification is optional and changes only which offer you are eligible for." },
  { q: "Does verification move me up the queue?", a: "No. Verification changes offer eligibility, never your queue position, invitation order or access priority." },
  { q: "Do launch offers change my access date?", a: "No. Queue order and access never change because of an offer. Offer benefits activate under their approved terms after launch." },
] as const;

/** Static quote snapshot so the page renders instantly and offline (replaced by the live feed). */
export const SNAPSHOT: Record<string, { name: string; last: number; changePct: number; decimals: number; closes: number[] }> = {
  XAUUSD: { name: "Gold", last: 4037.2, changePct: -2.9, decimals: 2, closes: [4160, 4151, 4139, 4142, 4138, 4131, 4136, 4120, 4098, 4075, 4049, 4061, 4044, 4052, 4039, 4037] },
  XAGUSD: { name: "Silver", last: 54.05, changePct: -5.1, decimals: 2, closes: [57.1, 56.8, 56.2, 56.5, 55.9, 55.2, 54.8, 54.3, 54.6, 54.1, 53.9, 54.2, 54.0, 54.1, 54.0, 54.05] },
  WTI: { name: "Crude Oil", last: 100.4, changePct: -3.2, decimals: 2, closes: [104.1, 103.6, 103.9, 103.2, 102.8, 102.1, 101.6, 101.9, 101.2, 100.8, 100.3, 100.9, 100.6, 100.2, 100.5, 100.4] },
  EURUSD: { name: "Euro / Dollar", last: 1.1195, changePct: -0.25, decimals: 4, closes: [1.124, 1.1232, 1.1225, 1.1218, 1.1228, 1.1216, 1.121, 1.1204, 1.1212, 1.1201, 1.1197, 1.1203, 1.1194, 1.1199, 1.1193, 1.1195] },
  USDJPY: { name: "Dollar / Yen", last: 156.7, changePct: -0.66, decimals: 2, closes: [157.9, 157.6, 157.8, 157.4, 157.1, 157.3, 156.9, 157.0, 156.6, 156.8, 156.5, 156.7, 156.4, 156.6, 156.8, 156.7] },
  GBPUSD: { name: "Pound / Dollar", last: 1.3377, changePct: 0.31, decimals: 4, closes: [1.333, 1.3338, 1.3332, 1.3341, 1.3336, 1.3348, 1.3352, 1.3344, 1.3356, 1.3361, 1.3355, 1.3366, 1.3371, 1.3368, 1.3374, 1.3377] },
  NZDUSD: { name: "Kiwi / Dollar", last: 0.5687, changePct: -0.1, decimals: 4, closes: [0.5702, 0.5698, 0.5704, 0.5695, 0.5699, 0.5691, 0.5696, 0.5688, 0.5693, 0.5685, 0.569, 0.5682, 0.5687, 0.5684, 0.5689, 0.5687] },
  "BTC-USD": { name: "Bitcoin", last: 64180, changePct: 1.2, decimals: 0, closes: [62800, 63050, 62900, 63200, 63480, 63300, 63650, 63520, 63800, 64050, 63900, 64150, 64000, 64220, 64100, 64180] },
};
