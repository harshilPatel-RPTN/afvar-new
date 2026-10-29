import type { Availability, Capability, CapabilitySlug, RouteLink } from "./types";
import type { PlatformIcon as IconName } from "./components/mac/icons";
import { ROUTES } from "./routes";

/*
 * Platform copy, from the Figma board (W2.1–W2.6, WF03, WF04) and the
 * Development Handoff (WA 2). Feature names and order are the board's.
 * Descriptions the board does not spell out are short draft lines that
 * restate the feature name — final copy and availability are owner gate
 * DEC 13, so every feature defaults to "in-development" until confirmed.
 */

const DEV: Availability = "in-development";

export const OVERVIEW = {
  ref: "W2.1",
  eyebrow: "Platform",
  title: ["One AI Operating System.", "One connected workspace."],
  summary: "See what AFVAR brings together for a trader.",
  previewLabel: "Connected workspace preview",
  previewNote: "Illustrative preview · final asset pending",
  workWith: {
    title: "Work with AFVAR",
    summary: "One AI operates the whole workspace. Text and voice are two ways to use it; manual controls are always there when you want them.",
    ai: {
      title: "AI is the operating system",
      description: "Text and voice are ways to work with the same system.",
      examples: ["Open my Gold chart", "Show this week's economic events", "Compare my journal with last month"],
    },
    manual: {
      title: "Optional manual controls",
      description: "Interact with tools and interrupt current work.",
      controls: ["Move", "Resize", "Snap", "Minimize", "Close"],
    },
  },
  workspace: {
    title: "Your workspace",
    summary: "Related tools stay together, and your working context is there when you return.",
    items: [
      { title: "Layouts", description: "Arrange and return to your workspace.", icon: "grid" },
      { title: "Notes & files", description: "Keep the context behind your work.", icon: "file" },
      { title: "Connections", description: "Supported connections, clearly listed.", icon: "plug" },
      { title: "Languages", description: "Language editions as confirmed.", icon: "globe" },
    ] satisfies { title: string; description: string; icon: IconName }[],
  },
  explore: {
    title: "Explore the platform",
    summary: "Five capability areas, one AI operating layer across all of them.",
  },
  closing: {
    title: "Join before launch",
    summary: "Registration continues in the AFVAR app. It does not unlock the full OS.",
  },
  note: "Desktop / laptop workspace. Each feature will show its confirmed availability: preview available or in development.",
} as const;

/** W2.1.1–W2.1.10 in board order; shown as a System Settings–style list. */
export const AT_A_GLANCE: { id: string; title: string; icon: IconName; body: string[] }[] = [
  {
    id: "one-os",
    title: "One AI Operating System",
    icon: "sparkle",
    body: [
      "AFVAR is one AI operating layer across every supported tool — not a separate assistant inside each app.",
      "Ask in text or voice, or use the controls directly. Both reach the same actions and the same result.",
    ],
  },
  {
    id: "connected",
    title: "Connected Workspace",
    icon: "layers",
    body: ["Related tools sit together in one workspace, so market data, research and review stay in context."],
  },
  {
    id: "layouts",
    title: "Saved Layouts",
    icon: "grid",
    body: ["Your window arrangement is saved as you work, so you can return to your working context."],
  },
  {
    id: "notes",
    title: "Notes & Files",
    icon: "file",
    body: ["Organize your research and keep the reasoning behind your work next to it."],
  },
  {
    id: "strengths",
    title: "Responsive, quick analysis",
    icon: "zap",
    body: ["Designed for responsiveness: supported commands act directly, and analysis arrives quickly where the work allows."],
  },
  {
    id: "connections",
    title: "Connections & Integrations",
    icon: "plug",
    body: [
      "Supported connections are listed clearly. Account connections are read-only.",
      "AFVAR does not place, modify or close trading orders.",
    ],
  },
  {
    id: "languages",
    title: "Languages & Regional Context",
    icon: "globe",
    body: ["Language editions and regional context follow the confirmed launch editions."],
  },
  {
    id: "desktop",
    title: "Desktop & Laptop Workspace",
    icon: "desktop",
    body: [
      "The AFVAR workspace runs on desktop and laptop browsers.",
      "This website, registration and your account status also work on a phone.",
    ],
  },
  {
    id: "controls",
    title: "User Controls & Analysis Limits",
    icon: "sliders",
    body: [
      "You stay in control: review important actions, stop speech or cancel a task at any time.",
      "Analysis explains its sources and limits. It is information, not financial advice.",
    ],
  },
  {
    id: "availability",
    title: "Available Preview / In Development",
    icon: "info",
    body: [
      "AFVAR is in pre-launch. Each capability is labelled as an available preview or in development.",
      "Registration does not unlock the full OS.",
    ],
  },
];

const link = (route: RouteLink["route"], title: string, description: string, icon: IconName): RouteLink => ({
  route,
  title,
  description,
  icon,
});

export const CAPABILITIES: Capability[] = [
  {
    slug: "charts",
    ref: "W2.2",
    title: "Market Data & Charts",
    tagline: "Quotes, charts and watchlists",
    summary: "Follow markets with the information and tools in your AFVAR workspace.",
    icon: "bars",
    tone: "gold",
    features: [
      { title: "Quotes & Charts", description: "Inspect market movement.", icon: "bars", availability: DEV },
      { title: "Watchlists", description: "Follow selected instruments.", icon: "star", availability: DEV },
      { title: "Technical Analysis", description: "Trends and patterns.", icon: "trend", availability: DEV },
      { title: "Market Overview & Heatmaps", description: "See the wider market at a glance.", icon: "grid", availability: DEV },
      { title: "Instrument Insights", description: "Relevant context for an instrument.", icon: "lightbulb", availability: DEV },
      { title: "Sources, Freshness & Availability", description: "Every view shows its source and how current it is.", icon: "clock", availability: DEV },
    ],
    outcome: { title: "From information to a clearer view", description: "See price movement with its source and freshness, then move straight into context and research." },
    preview: { title: "Supporting preview", description: "A focused illustration of charts and watchlists." },
    related: [
      link("markets", "Markets", "Check instrument coverage.", "globe"),
      link("instrument", "Instruments", "Open an instrument view.", "target"),
      link("evidence", "Sources & Evidence", "Freshness, limitations and attribution.", "shield"),
      link("guides", "Product Guides", "Learn tasks related to this capability.", "book"),
    ],
  },
  {
    slug: "research",
    ref: "W2.3",
    title: "Research & Analysis",
    tagline: "Context, events and research",
    summary: "Understand what is moving markets, with the sources behind each explanation.",
    icon: "news",
    tone: "cyan",
    features: [
      { title: "Economic Calendar", description: "Events and context.", icon: "calendar", availability: DEV },
      { title: "News & Sentiment", description: "Understand developments.", icon: "news", availability: DEV },
      { title: "Market Briefs", description: "Published editions.", icon: "book", availability: DEV },
      { title: "Explain Market Moves", description: "Context behind a move.", icon: "lightbulb", availability: DEV },
      { title: "Event Analysis", description: "What an event may mean for an instrument.", icon: "target", availability: DEV },
      { title: "Deep Research", description: "Longer, source-backed research.", icon: "search", availability: DEV },
      { title: "Supporting Sources", description: "See where each explanation comes from.", icon: "link", availability: DEV },
    ],
    outcome: { title: "From information to a clearer view", description: "Connect headlines and events to the instruments you follow, with sources you can check." },
    preview: { title: "Supporting preview", description: "A focused illustration of events, news and briefs." },
    related: [
      link("briefs", "Market Briefs", "Browse published editions.", "book"),
      link("instrument", "Instruments", "Open a related instrument view.", "target"),
      link("evidence", "Sources & Evidence", "How analysis and sources work.", "shield"),
      link("guides", "Product Guides", "Learn research tasks.", "book"),
    ],
  },
  {
    slug: "alerts",
    ref: "W2.4",
    title: "Alerts & Strategy Tools",
    tagline: "Evaluate ideas and conditions",
    summary: "Define the conditions you care about, then test and review ideas with their assumptions visible.",
    icon: "bell",
    tone: "purple",
    features: [
      { title: "Rules & Confirmation", description: "Rules state what they monitor; you confirm before anything runs.", icon: "check", availability: DEV },
      { title: "Price & Condition Alerts", description: "Know when a condition you set is met.", icon: "bell", availability: DEV },
      { title: "Screeners", description: "Find matching conditions.", icon: "filter", availability: DEV },
      { title: "Scheduled Scans", description: "Run a scan on a schedule.", icon: "clock", availability: DEV },
      { title: "Strategy Testing", description: "Test an idea on historical data.", icon: "flask", availability: DEV },
      { title: "Costs & Assumptions", description: "Fees, slippage and data coverage stay visible.", icon: "info", availability: DEV },
      { title: "Results & Review", description: "Review results without promises about future returns.", icon: "chart", availability: DEV },
    ],
    outcome: { title: "From information to a clearer view", description: "Turn an idea into a clear rule, then see how it behaved and under which assumptions." },
    preview: { title: "Supporting preview", description: "A focused illustration of alerts and strategy testing." },
    note: "Historical results do not predict future returns.",
    related: [
      link("evidence", "Testing evidence", "Backtest assumptions and limitations.", "shield"),
      link("guides", "Product Guides", "Learn alert and strategy tasks.", "book"),
      link("pricing", "Pricing", "See what each plan includes.", "layers"),
    ],
  },
  {
    slug: "trade-review",
    ref: "W2.5",
    title: "Risk & Trade Review",
    tagline: "Review exposure and performance",
    summary: "Understand your exposure and review your trading, using read-only account connections.",
    icon: "shield",
    tone: "red",
    features: [
      { title: "Read-Only Account Connections", description: "Supported accounts connect read-only. AFVAR never places or changes orders.", icon: "lock", availability: DEV },
      { title: "Portfolio & Exposure", description: "See what you hold and where you are exposed.", icon: "wallet", availability: DEV },
      { title: "Risk Guardian", description: "Supported risk context.", icon: "shield", availability: DEV },
      { title: "Personal Limits", description: "Set limits that matter to you.", icon: "sliders", availability: DEV },
      { title: "Trading Journal", description: "Record trades and the reasoning behind them.", icon: "journal", availability: DEV },
      { title: "Performance & Discipline", description: "Review how you trade over time.", icon: "gauge", availability: DEV },
    ],
    outcome: { title: "From information to a clearer view", description: "See exposure, limits and your own record in one place before your next decision." },
    preview: { title: "Supporting preview", description: "A focused illustration of exposure and journal review." },
    related: [
      link("platform", "Connections", "How supported connections work.", "plug"),
      link("guides", "Product Guides", "Learn journal, portfolio and risk tasks.", "book"),
      link("help", "Help & Support", "Get help with connections.", "message"),
    ],
  },
  {
    slug: "community",
    ref: "W2.6",
    title: "Community",
    tagline: "Connect and share ideas",
    summary: "Discuss markets and share analysis with other traders, with clear rules for what is verified.",
    icon: "users",
    tone: "green",
    features: [
      { title: "Channels & Discussions", description: "Talk about the markets you follow.", icon: "message", availability: DEV },
      { title: "Shared Charts & Analysis", description: "Share your view with its chart.", icon: "chart", availability: DEV },
      { title: "Verified Records", description: "What is checked, and what is not.", icon: "check", availability: DEV },
      { title: "Member Profiles", description: "See who you are learning from.", icon: "user", availability: DEV },
      { title: "Trade Explorer", description: "Explore shared trading records.", icon: "search", availability: DEV },
      { title: "Broker Comparison", description: "Compare brokers on stated criteria.", icon: "scale", availability: DEV },
      { title: "AI Discussion Summaries", description: "Catch up on long discussions.", icon: "sparkle", availability: DEV },
      { title: "Participation Rules", description: "How the community stays useful.", icon: "flag", availability: DEV },
    ],
    outcome: { title: "From information to a clearer view", description: "Learn from other traders while seeing exactly what has and has not been verified." },
    preview: { title: "Supporting preview", description: "A focused illustration of channels and shared analysis." },
    note: "Identity verification and verified trading records are different things. Posts are members' opinions, not financial advice.",
    related: [
      link("evidence", "Record evidence", "What a verified record means.", "shield"),
      link("guides", "Product Guides", "Learn community and sharing tasks.", "book"),
    ],
  },
];

export const CAPABILITY_SLUGS = CAPABILITIES.map((c) => c.slug);

export function getCapability(slug: string): Capability | undefined {
  return CAPABILITIES.find((c) => c.slug === slug);
}

/** The capability whose page lives at /platform/<segment> (its URL can differ from its slug). */
export function getCapabilityBySegment(segment: string): Capability | undefined {
  return CAPABILITIES.find((c) => ROUTES[c.slug].path === `/platform/${segment}`);
}

export function isCapabilitySlug(slug: string): slug is CapabilitySlug {
  return CAPABILITIES.some((c) => c.slug === slug);
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  preview: "Preview available",
  "in-development": "In development",
};
