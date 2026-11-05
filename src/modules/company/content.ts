// W6 · About Us and W7 · Contact Us copy. Per W6.2: verified company facts
// only — no invented people, milestones, roadmaps or customer claims. Per
// W7.3: the enquiry form promises no response time and fakes no delivery.

/** Verified company registration facts (from the AFVAR handoff). */
export const COMPANY_FACTS: Array<[string, string]> = [
  ["Legal entity", "RedPhantom Tech Novelty Private Limited"],
  ["CIN", "U72900PN2021PTC204792"],
  ["Registered office", "Pandharpur, Maharashtra, India"],
  ["Stage", "Pre-launch · OS in development"],
];

export const ABOUT = {
  hero: {
    eyebrow: "AFVAR · About Us",
    title: ["Built so every number", "can defend itself."],
    lede: "AFVAR is one connected desk for understanding international markets — made by a small team that believes analysis should carry its own evidence.",
  },
  // W6.1.1 — purpose, as one scroll-brightening statement.
  purpose:
    "Traders drown in tabs, tips and unverifiable claims. Our purpose is a desk where every price names its source, every analysis is graded in public, and every decision stays with the trader.",
  // W6.1.2 — product vision.
  vision: {
    title: "One AI operating system for trading.",
    body: "Charts, research, alerts, risk review and community run as connected apps in a single workspace, with an AI analyst that explains what code computes — in English and हिन्दी. AFVAR never places, modifies or closes trades; it exists to make markets legible.",
  },
  // W6.1.3 — who AFVAR serves.
  serves: [
    { title: "Active traders", body: "Commodities, forex and crypto on one desk — eight confirmed coverage lanes, with source, venue, delay and cache age on every number." },
    { title: "Serious beginners", body: "Plain-words analysis and alerts that are repeated back and confirmed before anything is armed. No jargon walls, no buy/sell pushes." },
    { title: "Research-heavy desks", body: "Deep research, event analysis and strategy testing with explicit assumptions — built for people who ask “why” before “how much”." },
  ],
  // W6.1.4 — product principles.
  principles: [
    { title: "Evidence over opinion", short: "Evidence", body: "Every quote, verdict and headline carries its provenance. The AI never invents a number — code computes, it explains." },
    { title: "Analysis, never orders", short: "No orders", body: "Nothing on AFVAR is investment advice and nothing places trades. Decisions and their responsibility remain with the user." },
    { title: "Honest by default", short: "Honest", body: "Previews are labelled previews, simulated data is labelled simulated, and unconfirmed values are shown as unconfirmed." },
    { title: "Your control, explicitly", short: "Control", body: "Consequential actions require review and confirmation. Verification changes offer eligibility, never queue position or access." },
    { title: "Public track record", short: "Graded", body: "Every analysis is graded openly — including every WAIT. Claims we cannot verify do not ship." },
  ],
  // W6.1.5 — people, verified facts only.
  people: {
    title: "The people behind AFVAR",
    body: "AFVAR is designed and engineered in-house at RedPhantom Tech Novelty Private Limited, a registered Indian technology company. Individual profiles appear here once verified — no invented bios, stock-photo teams or borrowed titles, ever.",
  },
  // W6.1.6 — development stage with verified updates.
  stage: {
    title: "Where the build stands",
    body: "AFVAR is pre-launch. Everything on this site is either a labelled preview or confirmed scope, and progress updates are published only after they are verified. Registration joins the launch queue — it does not unlock the full OS.",
  },
} as const;

export const CONTACT = {
  hero: {
    eyebrow: "AFVAR · Contact Us",
    title: ["Talk to the team.", "We read everything."],
    lede: "General enquiries, partnerships and press belong here. Product or account problems have their own, faster lane.",
  },
  topics: ["General enquiry", "Partnerships", "Press & media", "Careers", "Something else"],
  // W7.2 — routing: product problems go to W5.6, one support system.
  help: {
    title: "Product or account help?",
    body: "Support has a dedicated destination with troubleshooting topics and status help — enquiries sent there are picked up first.",
    cta: "Go to Help & Support",
    href: "/resources/help",
  },
  // W7.1.3 — verified contact options only.
  verified: {
    title: "Verified contact options",
    note: "Direct channels — email addresses and phone lines — are published here once verified. AFVAR will never request funds, credentials or codes over chat apps or social media.",
  },
  formNote: "Your enquiry goes straight to the AFVAR team. We reply by email — no reply-time promises before launch.",
} as const;
