import { getCapability } from "../../content";
import { CapHero, type CapHeroText } from "../hero/CapHero";
import { AlertsSections } from "../sections/AlertsSections";
import { CommunitySections } from "../sections/CommunitySections";
import { ResearchSections } from "../sections/ResearchSections";
import { RiskSections } from "../sections/RiskSections";
import { CapabilityTemplate } from "./CapabilityTemplate";

/* W2.3–W2.6: each page's own 3D hero, then its OS sections. */

const RESEARCH: CapHeroText = {
  eyebrow: "Research & Analysis",
  title: "Research & Analysis.",
  gold: "The why behind every move.",
  body: "Calendar, news, briefs and deep research in one place — every explanation numbered to the source it came from.",
  short: "Calendar, news and briefs, every explanation numbered to its source.",
  facts: ["Sources on every line", "Calendar · news · briefs", "IST times"],
};
const ALERTS: CapHeroText = {
  eyebrow: "Alerts & Strategy Tools",
  title: "Alerts & Strategy Tools.",
  gold: "Your rules, watched while you are away.",
  body: "Write a condition in plain words, confirm it, and AFVAR watches the candles for you. Test ideas on history with every cost in view.",
  short: "Write a rule in plain words; AFVAR watches it once you confirm.",
  facts: ["You confirm every rule", "Alerts · screeners · tests", "Never trades"],
};
const RISK: CapHeroText = {
  eyebrow: "Risk & Trade Review",
  title: "Risk & Trade Review.",
  gold: "See your risk before your next trade.",
  body: "Connect an account read-only, see where you are exposed, set your own limits and learn from your journal.",
  short: "Read-only accounts, your exposure, your limits and your journal.",
  facts: ["Read-only connections", "Exposure · limits · journal", "Private by default"],
};
const COMMUNITY: CapHeroText = {
  eyebrow: "Community",
  title: "Community.",
  gold: "Learn from traders. See what is verified.",
  body: "Rooms for every market, charts that open live, and clear labels for what has and has not been checked.",
  short: "Rooms for every market, live shared charts and clear verification labels.",
  facts: ["Verified means checked", "Rooms · charts · events", "No profit rankings"],
};

export function ResearchPage() {
  return (
    <CapabilityTemplate
      capability={getCapability("research")!}
      film={
        <>
          <CapHero kind="research" id="research-hero" label="Research & Analysis" text={RESEARCH} />
          <ResearchSections />
        </>
      }
      filmId="afvar-research"
      actOf={{
        "Economic Calendar": "s02-calendar",
        "Event Analysis": "s03-event-analysis",
        "News & Sentiment": "s04-news-and-sentiment",
        "Explain Market Moves": "s05-explain-a-move",
        "Market Briefs": "s06-market-briefs",
        "Deep Research": "s07-deep-research",
        "Supporting Sources": "s08-supporting-sources",
      }}
      notes={["Headlines, calendar entries and briefs shown on this page are samples and marked as such. Charts use real hourly candles from public feeds.", "Explanations describe what happened and why, with sources. They are information, not financial advice."]}
      closing="Start with the questions you already ask."
    />
  );
}

export function AlertsPage() {
  return (
    <CapabilityTemplate
      capability={getCapability("alerts")!}
      film={
        <>
          <CapHero kind="alerts" id="alerts-hero" label="Alerts & Strategy Tools" text={ALERTS} />
          <AlertsSections />
        </>
      }
      filmId="afvar-alerts"
      actOf={{
        "Rules & Confirmation": "s02-rule-in-plain-words",
        "Price & Condition Alerts": "s03-alert-types",
        Screeners: "s05-screeners",
        "Scheduled Scans": "s06-scheduled-scans",
        "Strategy Testing": "s07-strategy-test",
        "Costs & Assumptions": "s07-strategy-test",
        "Results & Review": "s08-results-and-review",
      }}
      notes={["Alert levels and screener matches are worked out from real hourly candles. Schedules, test entries and results are samples and marked.", "Historical results do not predict future returns. AFVAR never places, changes or closes orders."]}
      closing="Start with one rule you already follow."
    />
  );
}

export function RiskPage() {
  return (
    <CapabilityTemplate
      capability={getCapability("trade-review")!}
      film={
        <>
          <CapHero kind="risk" id="risk-hero" label="Risk & Trade Review" text={RISK} />
          <RiskSections />
        </>
      }
      filmId="afvar-risk"
      actOf={{
        "Read-Only Account Connections": "s02-read-only-connection",
        "Portfolio & Exposure": "s03-portfolio",
        "Personal Limits": "s04-personal-limits",
        "Risk Guardian": "s05-risk-guardian",
        "Trading Journal": "s07-journal",
        "Performance & Discipline": "s08-performance",
      }}
      notes={["Accounts, positions, limits and journal entries on this page are samples and marked. Charts use real hourly candles.", "Supported accounts connect read-only. AFVAR never places, changes or closes orders, and never moves money."]}
      closing="Start by seeing where you stand."
    />
  );
}

export function CommunityPage() {
  return (
    <CapabilityTemplate
      capability={getCapability("community")!}
      film={
        <>
          <CapHero kind="community" id="community-hero" label="Community" text={COMMUNITY} />
          <CommunitySections />
        </>
      }
      filmId="afvar-community"
      actOf={{
        "Channels & Discussions": "s03-discussions",
        "Shared Charts & Analysis": "s04-shared-charts",
        "Member Profiles": "s06-profiles",
        "Verified Records": "s07-verified-records",
        "Trade Explorer": "s08-trade-explorer",
        "Broker Comparison": "s09-broker-comparison",
        "AI Discussion Summaries": "s10-ai-summaries",
        "Participation Rules": "s11-rules-safety-and-privacy",
      }}
      notes={["Members, posts, records and brokers shown on this page are samples and marked. Shared charts use real hourly candles.", "Identity verification and verified trading records are different things. Posts are members’ opinions, not financial advice."]}
      closing="Start in the room for your market."
    />
  );
}
