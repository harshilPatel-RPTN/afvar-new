import type { Edition } from "@/platform/i18n";

/**
 * W3 Markets page copy and reference data, per edition. Everything here is
 * general, publicly known reference information (units, session hours,
 * release cadences, network facts). No prices, dates or venue claims: those
 * wait for a confirmed feed and render as explicit empty states.
 */

type Pair = readonly [string, string];

export interface InstrumentFacts {
  unit: string;
  kind: string;
  hours: string;
  drivers: readonly string[];
}

export interface MarketCopy {
  hint: string;
  status: { notConnected: string; none: string; planned: string; noReport: string };
  overview: {
    eyebrow: string;
    title: Pair;
    lede: string;
    choose: string;
    charts: string;
    scene: Pair;
    purpose: string;
    markets: { title: string; sub: string; lede: string; instruments: string };
    coverage: { title: string; lede: string; window: string; cols: readonly [string, string, string, string] };
    sources: { title: string; lede: string; envelope: string; fields: readonly Pair[]; labelsTitle: string; labels: readonly Pair[] };
    briefs: { title: string; lede: string; window: string; empty: string; link: string };
    split: { title: string; lede: string; available: Pair; planned: Pair; count: string };
    chartCaps: Pair;
    chartLink: string;
    closing: { title: string; lede: string; note: string };
  };
  category: {
    tagline: Record<"commodities" | "forex" | "crypto", string>;
    scene: Record<"commodities" | "forex" | "crypto", Pair>;
    instruments: Record<"commodities" | "forex" | "crypto", Pair>;
    analysis: { title: string; lede: string; empty: string; link: string };
    freshness: { title: string; lede: string; window: string; rows: readonly Pair[] };
    back: string;
    briefs: string;
    closingTitle: string;
    closingLede: string;
  };
  commodities: { title: string; lede: string; window: string; cols: readonly [string, string, string] };
  forex: {
    sessions: { title: string; lede: string; note: string; list: readonly { name: string; utc: string; start: number; end: number }[]; overlap: string };
    events: { title: string; lede: string; window: string; list: readonly { name: string; cadence: string; moves: string }[] };
  };
  crypto: {
    context: { title: string; lede: string; facts: readonly { asset: string; rows: readonly Pair[] }[] };
    trust: { title: string; lede: string; list: readonly Pair[] };
    reserves: { title: string; lede: string; points: readonly string[]; empty: string };
    withdrawals: { title: string; lede: string; window: string; fields: readonly string[] };
  };
  instrument: {
    facts: Record<string, InstrumentFacts>;
    labels: { unit: string; kind: string; hours: string; source: string; venue: string };
    context: { title: string; lede: string; drivers: string; live: string };
    evidence: { title: string; lede: string; link: string };
    related: { title: string; lede: string; link: string };
    scene: string;
    siblings: string;
    others: string;
  };
  briefs: { scene: Pair; latest: string };
  brief: { back: string; edition: string; overview: string; events: string; instruments: string; sources: string; updated: string };
}

const en: MarketCopy = {
  hint: "Move your pointer to look around",
  status: { notConnected: "Not connected", none: "None yet", planned: "Planned", noReport: "No report yet" },
  overview: {
    eyebrow: "AFVAR · Markets",
    title: ["Three global markets.", "One honest desk."],
    lede: "Commodities, Forex and Crypto, explained with context. Every number will carry its source, its time and its freshness.",
    choose: "Choose a market",
    charts: "Chart capabilities",
    scene: ["3D illustration: a gold ingot, a pair of currency coins and a crypto block turning on one table. Not live data.", "Commodities · Forex · Crypto, on one desk"],
    purpose: "A price without a source is a rumour. AFVAR shows a market only with where it came from, when it was taken and how fresh it still is.",
    markets: { title: "Commodities, Forex, Crypto.", sub: "Pick where to start.", lede: "Each market has its own page: instruments, context and the sections that matter for it.", instruments: "Instruments" },
    coverage: { title: "Instruments and coverage.", lede: "Every instrument AFVAR plans to cover, with its real status. Nothing is marked available until a feed is confirmed.", window: "Coverage register", cols: ["Instrument", "Symbol", "Market", "Status"] },
    sources: {
      title: "Sources, freshness and availability.",
      lede: "A number only appears with its envelope. If any part is missing, the number is not shown.",
      envelope: "Provenance envelope",
      fields: [
        ["Source", "The data provider the value came from"],
        ["Venue", "The exchange or market it was traded on"],
        ["Currency", "The currency the price is quoted in"],
        ["Time (UTC)", "When the value was taken"],
        ["Delay label", "How fresh it is, stated plainly"],
        ["Cache age", "Seconds since AFVAR last refreshed it"],
      ],
      labelsTitle: "Freshness labels",
      labels: [
        ["Live", "Streamed from the venue as it trades"],
        ["Delayed", "Published with a stated delay, for example 15 minutes"],
        ["Snapshot", "A single value taken at the time shown"],
        ["Indicative", "A guide price, not a tradable quote"],
        ["Derived", "Calculated from other confirmed values"],
      ],
    },
    briefs: { title: "Market Briefs.", lede: "Dated editions that explain what moved a market and why, with sources attached.", window: "Latest editions", empty: "No edition has been published yet. The first one appears here with its date.", link: "Browse Market Briefs" },
    split: {
      title: "Available and planned.",
      lede: "Two statuses, used the same way on every page.",
      available: ["Available", "A confirmed feed is connected. Prices show with source, time and freshness."],
      planned: ["Planned", "In scope but not connected yet. The page shows the instrument and an explicit empty price."],
      count: "instruments",
    },
    chartCaps: ["Charts in the AFVAR app", "Multi-timeframe charts, drawing tools and indicators, each with the same source and freshness labels."],
    chartLink: "See chart capabilities",
    closing: { title: "Be first when markets go live.", lede: "Register to join the launch queue. Coverage updates are published only after they are verified.", note: "Pre-launch · AFVAR provides market information and analysis only; nothing here is investment advice." },
  },
  category: {
    tagline: { commodities: "Metals and energy.", forex: "Major currency pairs.", crypto: "Coins, with trust context." },
    scene: {
      commodities: ["3D illustration: stacked gold and silver bars beside an oil barrel. Not live data.", "Gold · Silver · Oil"],
      forex: ["3D illustration: a globe circled by four trading-session arcs. Not live data.", "Sydney · Tokyo · London · New York"],
      crypto: ["3D illustration: a chain of blocks forming around a hexagonal coin. Not live data.", "Blocks, linked one by one"],
    },
    instruments: {
      commodities: ["Gold, silver and oil.", "Planned coverage. Prices appear only with a confirmed feed."],
      forex: ["Currency pairs.", "Majors planned for coverage. Pairs are confirmed before any price is shown."],
      crypto: ["Coins and pairs.", "Planned coverage. Pairs and venues are confirmed before any price is shown."],
    },
    analysis: { title: "Available analysis.", lede: "Published analysis for this market, each piece with its evidence.", empty: "No analysis has been published for this market yet.", link: "Briefs for this market" },
    freshness: {
      title: "Freshness and availability.",
      lede: "The current state of this market, stated plainly.",
      window: "Market status",
      rows: [
        ["Feed", "Not connected"],
        ["Freshness label", "None until a feed connects"],
        ["Coverage", "Planned"],
        ["Last updated", "None yet"],
      ],
    },
    back: "All markets",
    briefs: "Market Briefs",
    closingTitle: "Get started with AFVAR.",
    closingLede: "Register to join the launch queue and hear when this market goes live.",
  },
  commodities: { title: "Confirmed instrument coverage.", lede: "What each commodity is quoted in, and where its coverage stands.", window: "Commodity coverage", cols: ["Instrument", "Quoted in", "Status"] },
  forex: {
    sessions: {
      title: "Trading sessions.",
      lede: "Forex trades 24 hours on weekdays, passing between four main centres.",
      note: "Approximate hours in UTC. They move by an hour when daylight saving changes.",
      list: [
        { name: "Sydney", utc: "22:00 – 07:00", start: 22, end: 7 },
        { name: "Tokyo", utc: "00:00 – 09:00", start: 0, end: 9 },
        { name: "London", utc: "08:00 – 17:00", start: 8, end: 17 },
        { name: "New York", utc: "13:00 – 22:00", start: 13, end: 22 },
      ],
      overlap: "The busiest window is the London and New York overlap, 13:00 – 17:00 UTC.",
    },
    events: {
      title: "Economic events.",
      lede: "Scheduled releases that often move currency pairs. Dates appear once a calendar source is connected.",
      window: "Event types",
      list: [
        { name: "Central-bank rate decisions", cadence: "About 8 a year per bank", moves: "Fed, ECB, BoE, BoJ, RBA, RBNZ" },
        { name: "US jobs report (NFP)", cadence: "Monthly, usually first Friday", moves: "All USD pairs" },
        { name: "Inflation (CPI)", cadence: "Monthly", moves: "The releasing country's currency" },
        { name: "GDP", cadence: "Quarterly", moves: "The releasing country's currency" },
        { name: "PMI surveys", cadence: "Monthly", moves: "EUR, GBP, USD, AUD, NZD" },
      ],
    },
  },
  crypto: {
    context: {
      title: "Market context.",
      lede: "The basic facts behind each network.",
      facts: [
        { asset: "Bitcoin (BTC)", rows: [["Launched", "2009"], ["Supply", "Capped at 21 million"], ["Consensus", "Proof of work"], ["Block time", "About 10 minutes"]] },
        { asset: "Ether (ETH)", rows: [["Launched", "2015"], ["Supply", "No fixed cap"], ["Consensus", "Proof of stake, since 2022"], ["Block time", "About 12 seconds"]] },
      ],
    },
    trust: {
      title: "Crypto trust: indicators and sources.",
      lede: "Signals that help judge a venue or asset. Each one is shown with its source and date.",
      list: [
        ["Proof of reserves", "A dated attestation that holdings cover customer balances, and who checked it."],
        ["Wallet transparency", "Published on-chain addresses anyone can verify."],
        ["Licensing", "Where the venue is registered and which regulator oversees it."],
        ["Incident history", "Reported outages, hacks and their resolution."],
      ],
    },
    reserves: {
      title: "Exchange and reserves context.",
      lede: "Reported reserves only mean something with their scope.",
      points: ["Which assets and wallets are counted", "Whether liabilities are included", "The date and the party that checked it"],
      empty: "No reserve figures are shown until a source is connected.",
    },
    withdrawals: { title: "Reported withdrawal status.", lede: "Always shown with its scope and its time, never as a bare open or closed.", window: "Withdrawal report", fields: ["Exchange", "Asset", "Network", "Status", "Reported at (UTC)", "Source"] },
  },
  instrument: {
    facts: {
      gold: { unit: "US dollars per troy ounce (31.1 g)", kind: "Precious metal", hours: "Nearly 24 hours on weekdays", drivers: ["Real interest rates", "US dollar strength", "Central-bank buying", "Safe-haven demand"] },
      silver: { unit: "US dollars per troy ounce (31.1 g)", kind: "Precious and industrial metal", hours: "Nearly 24 hours on weekdays", drivers: ["Industrial demand: solar, electronics", "The gold price", "US dollar strength", "Mine supply"] },
      oil: { unit: "US dollars per barrel (159 litres)", kind: "Energy", hours: "Nearly 24 hours on weekdays", drivers: ["OPEC+ output decisions", "Weekly inventory reports", "Global growth and demand", "Supply risk from conflict"] },
      eurusd: { unit: "US dollars per 1 euro", kind: "Major currency pair", hours: "24 hours, Monday to Friday", drivers: ["ECB and Fed policy", "Eurozone and US inflation", "Growth data"] },
      usdjpy: { unit: "Japanese yen per 1 US dollar", kind: "Major currency pair", hours: "24 hours, Monday to Friday", drivers: ["Bank of Japan policy", "US–Japan yield gap", "Risk sentiment"] },
      gbpusd: { unit: "US dollars per 1 pound", kind: "Major currency pair", hours: "24 hours, Monday to Friday", drivers: ["Bank of England policy", "UK inflation and jobs", "US data"] },
      audusd: { unit: "US dollars per 1 Australian dollar", kind: "Major currency pair", hours: "24 hours, Monday to Friday", drivers: ["RBA policy", "Commodity prices", "Demand from China"] },
      nzdusd: { unit: "US dollars per 1 New Zealand dollar", kind: "Major currency pair", hours: "24 hours, Monday to Friday", drivers: ["Reserve Bank of New Zealand policy", "Dairy and commodity prices", "Global risk sentiment"] },
      btc: { unit: "US dollars per 1 BTC; venue to be confirmed", kind: "Cryptocurrency · proof of work", hours: "24 hours, every day", drivers: ["Fixed supply and halving cycle", "Fund and institutional flows", "Interest rates and liquidity", "Regulation"] },
      eth: { unit: "US dollars per 1 ETH; venue to be confirmed", kind: "Cryptocurrency · proof of stake", hours: "24 hours, every day", drivers: ["Network activity and fees", "Staking", "Protocol upgrades", "Regulation"] },
    },
    labels: { unit: "Quoted in", kind: "Type", hours: "Trading hours", source: "Source", venue: "Venue" },
    context: { title: "Market context.", lede: "What usually moves this instrument. Live context appears once a source is connected.", drivers: "Common drivers", live: "No live context is published yet." },
    evidence: { title: "Analysis and evidence.", lede: "Each view will show its evidence and its uncertainty.", link: "Sources & Evidence" },
    related: { title: "Related brief.", lede: "The latest brief that covers this instrument.", link: "All briefs for this market" },
    scene: "Schematic model of this market. Not live data.",
    siblings: "More in this market",
    others: "Other markets",
  },
  briefs: { scene: ["3D illustration: a fanned stack of brief pages with a gold bookmark. Not live data.", "Dated editions, sources attached"], latest: "Latest published edition" },
  brief: { back: "Back to editions", edition: "Edition", overview: "Market overview", events: "Key events", instruments: "Related instruments", sources: "Sources", updated: "Updated" },
};

const hi: MarketCopy = {
  hint: "चारों ओर देखने के लिए पॉइंटर घुमाएँ",
  status: { notConnected: "कनेक्ट नहीं", none: "अभी कोई नहीं", planned: "योजना में", noReport: "अभी कोई रिपोर्ट नहीं" },
  overview: {
    eyebrow: "AFVAR · बाज़ार",
    title: ["तीन वैश्विक बाज़ार।", "एक ईमानदार डेस्क।"],
    lede: "कमोडिटी, फ़ॉरेक्स और क्रिप्टो, संदर्भ के साथ समझाए गए। हर संख्या के साथ उसका स्रोत, समय और ताज़गी होगी।",
    choose: "बाज़ार चुनें",
    charts: "चार्ट क्षमताएँ",
    scene: ["3D चित्र: सोने की ईंट, मुद्रा सिक्कों की जोड़ी और एक क्रिप्टो ब्लॉक एक ही मेज़ पर घूमते हुए। लाइव डेटा नहीं।", "कमोडिटी · फ़ॉरेक्स · क्रिप्टो, एक डेस्क पर"],
    purpose: "बिना स्रोत की कीमत एक अफ़वाह है। AFVAR बाज़ार तभी दिखाता है जब पता हो कि वह कहाँ से आया, कब लिया गया और कितना ताज़ा है।",
    markets: { title: "कमोडिटी, फ़ॉरेक्स, क्रिप्टो।", sub: "कहाँ से शुरू करें, चुनें।", lede: "हर बाज़ार का अपना पेज है: इंस्ट्रूमेंट, संदर्भ और उसके लिए ज़रूरी सेक्शन।", instruments: "इंस्ट्रूमेंट" },
    coverage: { title: "इंस्ट्रूमेंट और कवरेज।", lede: "AFVAR जिन इंस्ट्रूमेंट को कवर करने की योजना बना रहा है, उनकी असली स्थिति के साथ। फ़ीड पक्की होने तक कुछ भी उपलब्ध नहीं दिखाया जाता।", window: "कवरेज रजिस्टर", cols: ["इंस्ट्रूमेंट", "सिंबल", "बाज़ार", "स्थिति"] },
    sources: {
      title: "स्रोत, ताज़गी और उपलब्धता।",
      lede: "कोई संख्या केवल अपने विवरण के साथ दिखती है। कोई हिस्सा न हो तो संख्या नहीं दिखाई जाती।",
      envelope: "स्रोत विवरण",
      fields: [
        ["स्रोत", "वह डेटा प्रदाता जिससे मान आया"],
        ["वेन्यू", "वह एक्सचेंज या बाज़ार जहाँ यह ट्रेड हुआ"],
        ["मुद्रा", "जिस मुद्रा में कीमत बताई गई है"],
        ["समय (UTC)", "मान कब लिया गया"],
        ["देरी लेबल", "यह कितना ताज़ा है, साफ़ शब्दों में"],
        ["कैश आयु", "AFVAR ने इसे पिछली बार कितने सेकंड पहले ताज़ा किया"],
      ],
      labelsTitle: "ताज़गी लेबल",
      labels: [
        ["लाइव", "वेन्यू से ट्रेड होते ही स्ट्रीम"],
        ["विलंबित", "बताई गई देरी के साथ, जैसे 15 मिनट"],
        ["स्नैपशॉट", "दिखाए गए समय पर लिया गया एक मान"],
        ["संकेतात्मक", "एक मार्गदर्शक कीमत, ट्रेड योग्य कोट नहीं"],
        ["व्युत्पन्न", "अन्य पक्के मानों से गणना किया गया"],
      ],
    },
    briefs: { title: "मार्केट ब्रीफ़।", lede: "तारीख़ वाले संस्करण जो बताते हैं कि बाज़ार क्यों और कैसे हिला, स्रोतों के साथ।", window: "नवीनतम संस्करण", empty: "अभी तक कोई संस्करण प्रकाशित नहीं हुआ है। पहला संस्करण अपनी तारीख़ के साथ यहाँ दिखेगा।", link: "मार्केट ब्रीफ़ देखें" },
    split: {
      title: "उपलब्ध और योजना में।",
      lede: "दो स्थितियाँ, हर पेज पर एक ही तरह इस्तेमाल।",
      available: ["उपलब्ध", "पक्की फ़ीड जुड़ी है। कीमतें स्रोत, समय और ताज़गी के साथ दिखती हैं।"],
      planned: ["योजना में", "दायरे में है पर अभी जुड़ा नहीं। पेज इंस्ट्रूमेंट और साफ़ खाली कीमत दिखाता है।"],
      count: "इंस्ट्रूमेंट",
    },
    chartCaps: ["AFVAR ऐप में चार्ट", "मल्टी-टाइमफ़्रेम चार्ट, ड्रॉइंग टूल और इंडिकेटर, सब पर वही स्रोत और ताज़गी लेबल।"],
    chartLink: "चार्ट क्षमताएँ देखें",
    closing: { title: "बाज़ार लाइव होते ही सबसे पहले जानें।", lede: "लॉन्च कतार में शामिल होने के लिए रजिस्टर करें। कवरेज अपडेट जाँच के बाद ही प्रकाशित होते हैं।", note: "प्री-लॉन्च · AFVAR केवल बाज़ार जानकारी और विश्लेषण देता है; यहाँ कुछ भी निवेश सलाह नहीं है।" },
  },
  category: {
    tagline: { commodities: "धातु और ऊर्जा।", forex: "प्रमुख मुद्रा जोड़ियाँ।", crypto: "सिक्के, भरोसे के संदर्भ के साथ।" },
    scene: {
      commodities: ["3D चित्र: तेल के बैरल के पास रखी सोने और चाँदी की ईंटें। लाइव डेटा नहीं।", "सोना · चाँदी · तेल"],
      forex: ["3D चित्र: चार ट्रेडिंग सत्र चापों से घिरा ग्लोब। लाइव डेटा नहीं।", "सिडनी · टोक्यो · लंदन · न्यूयॉर्क"],
      crypto: ["3D चित्र: षट्कोणीय सिक्के के चारों ओर बनती ब्लॉकों की श्रृंखला। लाइव डेटा नहीं।", "ब्लॉक, एक-एक करके जुड़ते हुए"],
    },
    instruments: {
      commodities: ["सोना, चाँदी और तेल।", "योजना में कवरेज। कीमतें केवल पक्की फ़ीड के साथ दिखेंगी।"],
      forex: ["मुद्रा जोड़ियाँ।", "प्रमुख जोड़ियाँ कवरेज की योजना में। कोई कीमत दिखाने से पहले जोड़ियाँ पक्की की जाती हैं।"],
      crypto: ["सिक्के और जोड़ियाँ।", "योजना में कवरेज। कोई कीमत दिखाने से पहले जोड़ियाँ और वेन्यू पक्के किए जाते हैं।"],
    },
    analysis: { title: "उपलब्ध विश्लेषण।", lede: "इस बाज़ार का प्रकाशित विश्लेषण, हर हिस्सा अपने प्रमाण के साथ।", empty: "इस बाज़ार के लिए अभी कोई विश्लेषण प्रकाशित नहीं हुआ है।", link: "इस बाज़ार के ब्रीफ़" },
    freshness: {
      title: "ताज़गी और उपलब्धता।",
      lede: "इस बाज़ार की मौजूदा स्थिति, साफ़ शब्दों में।",
      window: "बाज़ार स्थिति",
      rows: [
        ["फ़ीड", "कनेक्ट नहीं"],
        ["ताज़गी लेबल", "फ़ीड जुड़ने तक कोई नहीं"],
        ["कवरेज", "योजना में"],
        ["अंतिम अपडेट", "अभी कोई नहीं"],
      ],
    },
    back: "सभी बाज़ार",
    briefs: "मार्केट ब्रीफ़",
    closingTitle: "AFVAR के साथ शुरू करें।",
    closingLede: "लॉन्च कतार में शामिल होने और यह बाज़ार लाइव होने की सूचना पाने के लिए रजिस्टर करें।",
  },
  commodities: { title: "पक्का इंस्ट्रूमेंट कवरेज।", lede: "हर कमोडिटी किसमें कोट होती है, और उसका कवरेज कहाँ है।", window: "कमोडिटी कवरेज", cols: ["इंस्ट्रूमेंट", "कोट होता है", "स्थिति"] },
  forex: {
    sessions: {
      title: "ट्रेडिंग सत्र।",
      lede: "फ़ॉरेक्स सप्ताह के दिनों में 24 घंटे चलता है, चार मुख्य केंद्रों से होकर।",
      note: "UTC में अनुमानित समय। डेलाइट सेविंग बदलने पर एक घंटा खिसकता है।",
      list: [
        { name: "सिडनी", utc: "22:00 – 07:00", start: 22, end: 7 },
        { name: "टोक्यो", utc: "00:00 – 09:00", start: 0, end: 9 },
        { name: "लंदन", utc: "08:00 – 17:00", start: 8, end: 17 },
        { name: "न्यूयॉर्क", utc: "13:00 – 22:00", start: 13, end: 22 },
      ],
      overlap: "सबसे व्यस्त समय लंदन और न्यूयॉर्क का ओवरलैप है, 13:00 – 17:00 UTC।",
    },
    events: {
      title: "आर्थिक घटनाएँ।",
      lede: "तय रिलीज़ जो अक्सर मुद्रा जोड़ियों को हिलाती हैं। कैलेंडर स्रोत जुड़ने पर तारीख़ें दिखेंगी।",
      window: "घटना प्रकार",
      list: [
        { name: "केंद्रीय बैंक ब्याज दर फ़ैसले", cadence: "हर बैंक साल में लगभग 8 बार", moves: "Fed, ECB, BoE, BoJ, RBA, RBNZ" },
        { name: "अमेरिकी रोज़गार रिपोर्ट (NFP)", cadence: "मासिक, आमतौर पर पहला शुक्रवार", moves: "सभी USD जोड़ियाँ" },
        { name: "महँगाई (CPI)", cadence: "मासिक", moves: "जारी करने वाले देश की मुद्रा" },
        { name: "GDP", cadence: "तिमाही", moves: "जारी करने वाले देश की मुद्रा" },
        { name: "PMI सर्वे", cadence: "मासिक", moves: "EUR, GBP, USD, AUD, NZD" },
      ],
    },
  },
  crypto: {
    context: {
      title: "बाज़ार संदर्भ।",
      lede: "हर नेटवर्क के पीछे के बुनियादी तथ्य।",
      facts: [
        { asset: "बिटकॉइन (BTC)", rows: [["शुरुआत", "2009"], ["आपूर्ति", "2.1 करोड़ पर सीमित"], ["सहमति", "प्रूफ़ ऑफ़ वर्क"], ["ब्लॉक समय", "लगभग 10 मिनट"]] },
        { asset: "ईथर (ETH)", rows: [["शुरुआत", "2015"], ["आपूर्ति", "कोई तय सीमा नहीं"], ["सहमति", "प्रूफ़ ऑफ़ स्टेक, 2022 से"], ["ब्लॉक समय", "लगभग 12 सेकंड"]] },
      ],
    },
    trust: {
      title: "क्रिप्टो भरोसा: संकेतक और स्रोत।",
      lede: "संकेत जो किसी वेन्यू या एसेट को परखने में मदद करते हैं। हर एक अपने स्रोत और तारीख़ के साथ।",
      list: [
        ["प्रूफ़ ऑफ़ रिज़र्व", "तारीख़ वाला प्रमाण कि होल्डिंग ग्राहकों की राशि को कवर करती है, और किसने जाँचा।"],
        ["वॉलेट पारदर्शिता", "प्रकाशित ऑन-चेन पते जिन्हें कोई भी जाँच सकता है।"],
        ["लाइसेंस", "वेन्यू कहाँ पंजीकृत है और कौन नियामक निगरानी करता है।"],
        ["घटना इतिहास", "रिपोर्ट किए गए आउटेज, हैक और उनका समाधान।"],
      ],
    },
    reserves: {
      title: "एक्सचेंज और रिज़र्व संदर्भ।",
      lede: "रिपोर्ट किए गए रिज़र्व का अर्थ तभी है जब उनका दायरा पता हो।",
      points: ["कौन से एसेट और वॉलेट गिने गए", "क्या देनदारियाँ शामिल हैं", "तारीख़ और जाँचने वाला पक्ष"],
      empty: "स्रोत जुड़ने तक कोई रिज़र्व आँकड़ा नहीं दिखाया जाता।",
    },
    withdrawals: { title: "रिपोर्ट की गई निकासी स्थिति।", lede: "हमेशा दायरे और समय के साथ, कभी केवल खुला या बंद नहीं।", window: "निकासी रिपोर्ट", fields: ["एक्सचेंज", "एसेट", "नेटवर्क", "स्थिति", "रिपोर्ट समय (UTC)", "स्रोत"] },
  },
  instrument: {
    facts: {
      gold: { unit: "अमेरिकी डॉलर प्रति ट्रॉय औंस (31.1 ग्राम)", kind: "कीमती धातु", hours: "सप्ताह के दिनों में लगभग 24 घंटे", drivers: ["वास्तविक ब्याज दरें", "अमेरिकी डॉलर की मज़बूती", "केंद्रीय बैंकों की ख़रीद", "सुरक्षित निवेश की माँग"] },
      silver: { unit: "अमेरिकी डॉलर प्रति ट्रॉय औंस (31.1 ग्राम)", kind: "कीमती और औद्योगिक धातु", hours: "सप्ताह के दिनों में लगभग 24 घंटे", drivers: ["औद्योगिक माँग: सोलर, इलेक्ट्रॉनिक्स", "सोने की कीमत", "अमेरिकी डॉलर की मज़बूती", "खनन आपूर्ति"] },
      oil: { unit: "अमेरिकी डॉलर प्रति बैरल (159 लीटर)", kind: "ऊर्जा", hours: "सप्ताह के दिनों में लगभग 24 घंटे", drivers: ["OPEC+ उत्पादन फ़ैसले", "साप्ताहिक भंडार रिपोर्ट", "वैश्विक वृद्धि और माँग", "संघर्ष से आपूर्ति जोखिम"] },
      eurusd: { unit: "अमेरिकी डॉलर प्रति 1 यूरो", kind: "प्रमुख मुद्रा जोड़ी", hours: "सोमवार से शुक्रवार, 24 घंटे", drivers: ["ECB और Fed नीति", "यूरोज़ोन और अमेरिकी महँगाई", "वृद्धि आँकड़े"] },
      usdjpy: { unit: "जापानी येन प्रति 1 अमेरिकी डॉलर", kind: "प्रमुख मुद्रा जोड़ी", hours: "सोमवार से शुक्रवार, 24 घंटे", drivers: ["बैंक ऑफ़ जापान नीति", "अमेरिका–जापान यील्ड अंतर", "जोखिम धारणा"] },
      gbpusd: { unit: "अमेरिकी डॉलर प्रति 1 पाउंड", kind: "प्रमुख मुद्रा जोड़ी", hours: "सोमवार से शुक्रवार, 24 घंटे", drivers: ["बैंक ऑफ़ इंग्लैंड नीति", "ब्रिटेन की महँगाई और रोज़गार", "अमेरिकी आँकड़े"] },
      audusd: { unit: "अमेरिकी डॉलर प्रति 1 ऑस्ट्रेलियाई डॉलर", kind: "प्रमुख मुद्रा जोड़ी", hours: "सोमवार से शुक्रवार, 24 घंटे", drivers: ["RBA नीति", "कमोडिटी कीमतें", "चीन की माँग"] },
      nzdusd: { unit: "अमेरिकी डॉलर प्रति 1 न्यूज़ीलैंड डॉलर", kind: "प्रमुख मुद्रा जोड़ी", hours: "सोमवार से शुक्रवार, 24 घंटे", drivers: ["रिज़र्व बैंक ऑफ़ न्यूज़ीलैंड नीति", "डेयरी और कमोडिटी कीमतें", "वैश्विक जोखिम धारणा"] },
      btc: { unit: "अमेरिकी डॉलर प्रति 1 BTC; वेन्यू पक्का होना बाकी", kind: "क्रिप्टोकरेंसी · प्रूफ़ ऑफ़ वर्क", hours: "हर दिन 24 घंटे", drivers: ["तय आपूर्ति और हॉल्विंग चक्र", "फ़ंड और संस्थागत प्रवाह", "ब्याज दरें और तरलता", "नियमन"] },
      eth: { unit: "अमेरिकी डॉलर प्रति 1 ETH; वेन्यू पक्का होना बाकी", kind: "क्रिप्टोकरेंसी · प्रूफ़ ऑफ़ स्टेक", hours: "हर दिन 24 घंटे", drivers: ["नेटवर्क गतिविधि और शुल्क", "स्टेकिंग", "प्रोटोकॉल अपग्रेड", "नियमन"] },
    },
    labels: { unit: "कोट होता है", kind: "प्रकार", hours: "ट्रेडिंग समय", source: "स्रोत", venue: "वेन्यू" },
    context: { title: "बाज़ार संदर्भ।", lede: "आमतौर पर इस इंस्ट्रूमेंट को क्या हिलाता है। स्रोत जुड़ने पर लाइव संदर्भ दिखेगा।", drivers: "सामान्य कारक", live: "अभी कोई लाइव संदर्भ प्रकाशित नहीं है।" },
    evidence: { title: "विश्लेषण और प्रमाण।", lede: "हर राय अपने प्रमाण और अनिश्चितता के साथ दिखेगी।", link: "स्रोत और प्रमाण" },
    related: { title: "संबंधित ब्रीफ़।", lede: "इस इंस्ट्रूमेंट को कवर करने वाला नवीनतम ब्रीफ़।", link: "इस बाज़ार के सभी ब्रीफ़" },
    scene: "इस बाज़ार का योजनाबद्ध मॉडल। लाइव डेटा नहीं।",
    siblings: "इस बाज़ार में और",
    others: "अन्य बाज़ार",
  },
  briefs: { scene: ["3D चित्र: सुनहरे बुकमार्क के साथ फैले हुए ब्रीफ़ पन्ने। लाइव डेटा नहीं।", "तारीख़ वाले संस्करण, स्रोतों के साथ"], latest: "नवीनतम प्रकाशित संस्करण" },
  brief: { back: "संस्करणों पर वापस", edition: "संस्करण", overview: "बाज़ार अवलोकन", events: "मुख्य घटनाएँ", instruments: "संबंधित इंस्ट्रूमेंट", sources: "स्रोत", updated: "अपडेट" },
};

const mr: MarketCopy = {
  hint: "सगळीकडे पाहण्यासाठी पॉइंटर फिरवा",
  status: { notConnected: "जोडलेले नाही", none: "अजून काही नाही", planned: "नियोजित", noReport: "अजून अहवाल नाही" },
  overview: {
    eyebrow: "AFVAR · बाजार",
    title: ["तीन जागतिक बाजार.", "एक प्रामाणिक डेस्क."],
    lede: "कमोडिटी, फॉरेक्स आणि क्रिप्टो, संदर्भासह समजावलेले. प्रत्येक आकड्यासोबत त्याचा स्रोत, वेळ आणि ताजेपणा असेल.",
    choose: "बाजार निवडा",
    charts: "चार्ट क्षमता",
    scene: ["3D चित्र: सोन्याची वीट, चलन नाण्यांची जोडी आणि एक क्रिप्टो ब्लॉक एकाच टेबलावर फिरताना. लाइव्ह डेटा नाही.", "कमोडिटी · फॉरेक्स · क्रिप्टो, एका डेस्कवर"],
    purpose: "स्रोत नसलेली किंमत म्हणजे अफवा. AFVAR बाजार तेव्हाच दाखवते जेव्हा तो कुठून आला, कधी घेतला आणि किती ताजा आहे हे माहीत असते.",
    markets: { title: "कमोडिटी, फॉरेक्स, क्रिप्टो.", sub: "कुठून सुरुवात करायची ते निवडा.", lede: "प्रत्येक बाजाराचे स्वतःचे पान आहे: इन्स्ट्रुमेंट, संदर्भ आणि त्यासाठी महत्त्वाचे विभाग.", instruments: "इन्स्ट्रुमेंट" },
    coverage: { title: "इन्स्ट्रुमेंट आणि कव्हरेज.", lede: "AFVAR कव्हर करण्याचे नियोजन करत असलेले सर्व इन्स्ट्रुमेंट, त्यांच्या खऱ्या स्थितीसह. फीड निश्चित होईपर्यंत काहीही उपलब्ध दाखवले जात नाही.", window: "कव्हरेज नोंदवही", cols: ["इन्स्ट्रुमेंट", "सिम्बॉल", "बाजार", "स्थिती"] },
    sources: {
      title: "स्रोत, ताजेपणा आणि उपलब्धता.",
      lede: "आकडा फक्त त्याच्या तपशिलासह दिसतो. कोणताही भाग नसेल तर आकडा दाखवला जात नाही.",
      envelope: "स्रोत तपशील",
      fields: [
        ["स्रोत", "ज्या डेटा पुरवठादाराकडून मूल्य आले"],
        ["व्हेन्यू", "ज्या एक्सचेंज किंवा बाजारात त्याचा व्यवहार झाला"],
        ["चलन", "किंमत ज्या चलनात सांगितली आहे"],
        ["वेळ (UTC)", "मूल्य कधी घेतले"],
        ["विलंब लेबल", "ते किती ताजे आहे, स्पष्ट शब्दांत"],
        ["कॅशे वय", "AFVAR ने ते शेवटचे किती सेकंदांपूर्वी ताजे केले"],
      ],
      labelsTitle: "ताजेपणा लेबल",
      labels: [
        ["लाइव्ह", "व्हेन्यूवर व्यवहार होताच स्ट्रीम"],
        ["विलंबित", "सांगितलेल्या विलंबासह, उदा. 15 मिनिटे"],
        ["स्नॅपशॉट", "दाखवलेल्या वेळी घेतलेले एक मूल्य"],
        ["सूचक", "मार्गदर्शक किंमत, व्यवहारयोग्य कोट नाही"],
        ["व्युत्पन्न", "इतर निश्चित मूल्यांवरून मोजलेले"],
      ],
    },
    briefs: { title: "मार्केट ब्रीफ.", lede: "तारखेसह आवृत्त्या ज्या बाजार का आणि कसा हलला ते सांगतात, स्रोतांसह.", window: "नवीनतम आवृत्त्या", empty: "अजून कोणतीही आवृत्ती प्रकाशित झालेली नाही. पहिली आवृत्ती तिच्या तारखेसह इथे दिसेल.", link: "मार्केट ब्रीफ पाहा" },
    split: {
      title: "उपलब्ध आणि नियोजित.",
      lede: "दोन स्थिती, प्रत्येक पानावर एकाच प्रकारे वापरल्या जातात.",
      available: ["उपलब्ध", "निश्चित फीड जोडलेले आहे. किमती स्रोत, वेळ आणि ताजेपणासह दिसतात."],
      planned: ["नियोजित", "व्याप्तीत आहे पण अजून जोडलेले नाही. पान इन्स्ट्रुमेंट आणि स्पष्ट रिकामी किंमत दाखवते."],
      count: "इन्स्ट्रुमेंट",
    },
    chartCaps: ["AFVAR ॲपमधील चार्ट", "मल्टी-टाइमफ्रेम चार्ट, ड्रॉइंग टूल आणि इंडिकेटर, सर्वांवर तेच स्रोत आणि ताजेपणा लेबल."],
    chartLink: "चार्ट क्षमता पाहा",
    closing: { title: "बाजार लाइव्ह होताच सर्वात आधी जाणून घ्या.", lede: "लॉन्च रांगेत सामील होण्यासाठी नोंदणी करा. कव्हरेज अपडेट पडताळणीनंतरच प्रकाशित होतात.", note: "प्री-लॉन्च · AFVAR फक्त बाजार माहिती आणि विश्लेषण देते; इथे काहीही गुंतवणूक सल्ला नाही." },
  },
  category: {
    tagline: { commodities: "धातू आणि ऊर्जा.", forex: "प्रमुख चलन जोड्या.", crypto: "नाणी, विश्वासाच्या संदर्भासह." },
    scene: {
      commodities: ["3D चित्र: तेलाच्या बॅरलशेजारी रचलेल्या सोन्या-चांदीच्या विटा. लाइव्ह डेटा नाही.", "सोने · चांदी · तेल"],
      forex: ["3D चित्र: चार ट्रेडिंग सत्र कमानींनी वेढलेला ग्लोब. लाइव्ह डेटा नाही.", "सिडनी · टोकियो · लंडन · न्यूयॉर्क"],
      crypto: ["3D चित्र: षटकोनी नाण्याभोवती तयार होणारी ब्लॉकची साखळी. लाइव्ह डेटा नाही.", "ब्लॉक, एकेक करून जोडले जाणारे"],
    },
    instruments: {
      commodities: ["सोने, चांदी आणि तेल.", "नियोजित कव्हरेज. किमती फक्त निश्चित फीडसह दिसतील."],
      forex: ["चलन जोड्या.", "प्रमुख जोड्या कव्हरेजसाठी नियोजित. कोणतीही किंमत दाखवण्यापूर्वी जोड्या निश्चित केल्या जातात."],
      crypto: ["नाणी आणि जोड्या.", "नियोजित कव्हरेज. कोणतीही किंमत दाखवण्यापूर्वी जोड्या आणि व्हेन्यू निश्चित केले जातात."],
    },
    analysis: { title: "उपलब्ध विश्लेषण.", lede: "या बाजाराचे प्रकाशित विश्लेषण, प्रत्येक भाग त्याच्या पुराव्यासह.", empty: "या बाजारासाठी अजून कोणतेही विश्लेषण प्रकाशित झालेले नाही.", link: "या बाजाराचे ब्रीफ" },
    freshness: {
      title: "ताजेपणा आणि उपलब्धता.",
      lede: "या बाजाराची सध्याची स्थिती, स्पष्ट शब्दांत.",
      window: "बाजार स्थिती",
      rows: [
        ["फीड", "जोडलेले नाही"],
        ["ताजेपणा लेबल", "फीड जोडेपर्यंत काही नाही"],
        ["कव्हरेज", "नियोजित"],
        ["शेवटचा अपडेट", "अजून काही नाही"],
      ],
    },
    back: "सर्व बाजार",
    briefs: "मार्केट ब्रीफ",
    closingTitle: "AFVAR सोबत सुरुवात करा.",
    closingLede: "लॉन्च रांगेत सामील होण्यासाठी आणि हा बाजार लाइव्ह झाल्याची सूचना मिळवण्यासाठी नोंदणी करा.",
  },
  commodities: { title: "निश्चित इन्स्ट्रुमेंट कव्हरेज.", lede: "प्रत्येक कमोडिटी कशात कोट होते, आणि तिचे कव्हरेज कुठे आहे.", window: "कमोडिटी कव्हरेज", cols: ["इन्स्ट्रुमेंट", "कोट होते", "स्थिती"] },
  forex: {
    sessions: {
      title: "ट्रेडिंग सत्रे.",
      lede: "फॉरेक्स आठवड्याच्या दिवशी 24 तास चालतो, चार मुख्य केंद्रांमधून.",
      note: "UTC मधील अंदाजे वेळा. डेलाइट सेव्हिंग बदलल्यावर एक तास सरकतात.",
      list: [
        { name: "सिडनी", utc: "22:00 – 07:00", start: 22, end: 7 },
        { name: "टोकियो", utc: "00:00 – 09:00", start: 0, end: 9 },
        { name: "लंडन", utc: "08:00 – 17:00", start: 8, end: 17 },
        { name: "न्यूयॉर्क", utc: "13:00 – 22:00", start: 13, end: 22 },
      ],
      overlap: "सर्वात व्यस्त वेळ लंडन आणि न्यूयॉर्कचा ओव्हरलॅप, 13:00 – 17:00 UTC.",
    },
    events: {
      title: "आर्थिक घटना.",
      lede: "ठरलेले प्रकाशन जे अनेकदा चलन जोड्यांना हलवतात. कॅलेंडर स्रोत जोडल्यावर तारखा दिसतील.",
      window: "घटना प्रकार",
      list: [
        { name: "मध्यवर्ती बँक व्याजदर निर्णय", cadence: "प्रत्येक बँक वर्षातून सुमारे 8 वेळा", moves: "Fed, ECB, BoE, BoJ, RBA, RBNZ" },
        { name: "अमेरिकी रोजगार अहवाल (NFP)", cadence: "मासिक, सहसा पहिला शुक्रवार", moves: "सर्व USD जोड्या" },
        { name: "महागाई (CPI)", cadence: "मासिक", moves: "प्रकाशित करणाऱ्या देशाचे चलन" },
        { name: "GDP", cadence: "तिमाही", moves: "प्रकाशित करणाऱ्या देशाचे चलन" },
        { name: "PMI सर्वेक्षण", cadence: "मासिक", moves: "EUR, GBP, USD, AUD, NZD" },
      ],
    },
  },
  crypto: {
    context: {
      title: "बाजार संदर्भ.",
      lede: "प्रत्येक नेटवर्कमागील मूलभूत तथ्ये.",
      facts: [
        { asset: "बिटकॉइन (BTC)", rows: [["सुरुवात", "2009"], ["पुरवठा", "2.1 कोटींवर मर्यादित"], ["सहमती", "प्रूफ ऑफ वर्क"], ["ब्लॉक वेळ", "सुमारे 10 मिनिटे"]] },
        { asset: "ईथर (ETH)", rows: [["सुरुवात", "2015"], ["पुरवठा", "ठरलेली मर्यादा नाही"], ["सहमती", "प्रूफ ऑफ स्टेक, 2022 पासून"], ["ब्लॉक वेळ", "सुमारे 12 सेकंद"]] },
      ],
    },
    trust: {
      title: "क्रिप्टो विश्वास: निर्देशक आणि स्रोत.",
      lede: "व्हेन्यू किंवा ॲसेट पारखण्यास मदत करणारे संकेत. प्रत्येक त्याच्या स्रोत आणि तारखेसह.",
      list: [
        ["प्रूफ ऑफ रिझर्व्ह", "तारखेसह पुरावा की होल्डिंग ग्राहकांच्या रकमा कव्हर करतात, आणि कोणी तपासले."],
        ["वॉलेट पारदर्शकता", "प्रकाशित ऑन-चेन पत्ते जे कोणीही तपासू शकतो."],
        ["परवाना", "व्हेन्यू कुठे नोंदणीकृत आहे आणि कोणता नियामक देखरेख करतो."],
        ["घटना इतिहास", "नोंदवलेले आउटेज, हॅक आणि त्यांचे निराकरण."],
      ],
    },
    reserves: {
      title: "एक्सचेंज आणि रिझर्व्ह संदर्भ.",
      lede: "नोंदवलेल्या रिझर्व्हला अर्थ तेव्हाच आहे जेव्हा त्यांची व्याप्ती माहीत असते.",
      points: ["कोणते ॲसेट आणि वॉलेट मोजले", "देणी समाविष्ट आहेत का", "तारीख आणि तपासणारा पक्ष"],
      empty: "स्रोत जोडेपर्यंत कोणताही रिझर्व्ह आकडा दाखवला जात नाही.",
    },
    withdrawals: { title: "नोंदवलेली पैसे काढण्याची स्थिती.", lede: "नेहमी व्याप्ती आणि वेळेसह, कधीही फक्त सुरू किंवा बंद नाही.", window: "पैसे काढण्याचा अहवाल", fields: ["एक्सचेंज", "ॲसेट", "नेटवर्क", "स्थिती", "अहवाल वेळ (UTC)", "स्रोत"] },
  },
  instrument: {
    facts: {
      gold: { unit: "अमेरिकी डॉलर प्रति ट्रॉय औंस (31.1 ग्रॅम)", kind: "मौल्यवान धातू", hours: "आठवड्याच्या दिवशी जवळपास 24 तास", drivers: ["वास्तविक व्याजदर", "अमेरिकी डॉलरची ताकद", "मध्यवर्ती बँकांची खरेदी", "सुरक्षित गुंतवणुकीची मागणी"] },
      silver: { unit: "अमेरिकी डॉलर प्रति ट्रॉय औंस (31.1 ग्रॅम)", kind: "मौल्यवान आणि औद्योगिक धातू", hours: "आठवड्याच्या दिवशी जवळपास 24 तास", drivers: ["औद्योगिक मागणी: सोलर, इलेक्ट्रॉनिक्स", "सोन्याची किंमत", "अमेरिकी डॉलरची ताकद", "खाण पुरवठा"] },
      oil: { unit: "अमेरिकी डॉलर प्रति बॅरल (159 लिटर)", kind: "ऊर्जा", hours: "आठवड्याच्या दिवशी जवळपास 24 तास", drivers: ["OPEC+ उत्पादन निर्णय", "साप्ताहिक साठा अहवाल", "जागतिक वाढ आणि मागणी", "संघर्षामुळे पुरवठा जोखीम"] },
      eurusd: { unit: "अमेरिकी डॉलर प्रति 1 युरो", kind: "प्रमुख चलन जोडी", hours: "सोमवार ते शुक्रवार, 24 तास", drivers: ["ECB आणि Fed धोरण", "युरोझोन आणि अमेरिकी महागाई", "वाढीचे आकडे"] },
      usdjpy: { unit: "जपानी येन प्रति 1 अमेरिकी डॉलर", kind: "प्रमुख चलन जोडी", hours: "सोमवार ते शुक्रवार, 24 तास", drivers: ["बँक ऑफ जपान धोरण", "अमेरिका–जपान यील्ड फरक", "जोखीम भावना"] },
      gbpusd: { unit: "अमेरिकी डॉलर प्रति 1 पाउंड", kind: "प्रमुख चलन जोडी", hours: "सोमवार ते शुक्रवार, 24 तास", drivers: ["बँक ऑफ इंग्लंड धोरण", "ब्रिटनमधील महागाई आणि रोजगार", "अमेरिकी आकडे"] },
      audusd: { unit: "अमेरिकी डॉलर प्रति 1 ऑस्ट्रेलियन डॉलर", kind: "प्रमुख चलन जोडी", hours: "सोमवार ते शुक्रवार, 24 तास", drivers: ["RBA धोरण", "कमोडिटी किमती", "चीनची मागणी"] },
      nzdusd: { unit: "अमेरिकी डॉलर प्रति 1 न्यूझीलंड डॉलर", kind: "प्रमुख चलन जोडी", hours: "सोमवार ते शुक्रवार, 24 तास", drivers: ["रिझर्व्ह बँक ऑफ न्यूझीलंड धोरण", "दुग्ध आणि कमोडिटी किमती", "जागतिक जोखीम भावना"] },
      btc: { unit: "अमेरिकी डॉलर प्रति 1 BTC; व्हेन्यू निश्चित व्हायचा आहे", kind: "क्रिप्टोकरन्सी · प्रूफ ऑफ वर्क", hours: "दररोज 24 तास", drivers: ["ठरलेला पुरवठा आणि हॉल्व्हिंग चक्र", "फंड आणि संस्थात्मक प्रवाह", "व्याजदर आणि तरलता", "नियमन"] },
      eth: { unit: "अमेरिकी डॉलर प्रति 1 ETH; व्हेन्यू निश्चित व्हायचा आहे", kind: "क्रिप्टोकरन्सी · प्रूफ ऑफ स्टेक", hours: "दररोज 24 तास", drivers: ["नेटवर्क हालचाल आणि शुल्क", "स्टेकिंग", "प्रोटोकॉल अपग्रेड", "नियमन"] },
    },
    labels: { unit: "कोट होते", kind: "प्रकार", hours: "ट्रेडिंग वेळ", source: "स्रोत", venue: "व्हेन्यू" },
    context: { title: "बाजार संदर्भ.", lede: "सहसा हे इन्स्ट्रुमेंट कशामुळे हलते. स्रोत जोडल्यावर लाइव्ह संदर्भ दिसेल.", drivers: "सामान्य घटक", live: "अजून कोणताही लाइव्ह संदर्भ प्रकाशित नाही." },
    evidence: { title: "विश्लेषण आणि पुरावा.", lede: "प्रत्येक मत त्याच्या पुराव्या आणि अनिश्चिततेसह दिसेल.", link: "स्रोत आणि पुरावा" },
    related: { title: "संबंधित ब्रीफ.", lede: "हे इन्स्ट्रुमेंट कव्हर करणारा नवीनतम ब्रीफ.", link: "या बाजाराचे सर्व ब्रीफ" },
    scene: "या बाजाराचे योजनाबद्ध मॉडेल. लाइव्ह डेटा नाही.",
    siblings: "या बाजारात आणखी",
    others: "इतर बाजार",
  },
  briefs: { scene: ["3D चित्र: सोनेरी बुकमार्कसह पसरलेली ब्रीफ पाने. लाइव्ह डेटा नाही.", "तारखेसह आवृत्त्या, स्रोतांसह"], latest: "नवीनतम प्रकाशित आवृत्ती" },
  brief: { back: "आवृत्त्यांकडे परत", edition: "आवृत्ती", overview: "बाजार आढावा", events: "मुख्य घटना", instruments: "संबंधित इन्स्ट्रुमेंट", sources: "स्रोत", updated: "अपडेट" },
};

const COPY: Record<Edition, MarketCopy> = { en, hi, mr };

export function marketCopy(edition: Edition): MarketCopy {
  return COPY[edition];
}
