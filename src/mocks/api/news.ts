/** Mock headlines for the 8 coverage lanes. `minutesAgo` keeps them fresh on every load. */
export interface MockHeadline {
  id: string;
  title: string;
  source: string;
  venue: string;
  minutesAgo: number;
  symbols: string[];
}

export const MOCK_HEADLINES: MockHeadline[] = [
  { id: "nw_01", title: "Gold edges higher as US yields ease ahead of Fed speakers", source: "Benzinga", venue: "Alpaca News", minutesAgo: 4, symbols: ["XAUUSD"] },
  { id: "nw_02", title: "Bitcoin steadies near session highs as spot ETF flows stay positive", source: "Benzinga", venue: "Alpaca News", minutesAgo: 11, symbols: ["BTCUSD"] },
  { id: "nw_03", title: "Yen firms after BoJ official flags data-dependent path", source: "Bank of Japan", venue: "Official RSS", minutesAgo: 19, symbols: ["USDJPY"] },
  { id: "nw_04", title: "EIA weekly report shows a larger-than-expected crude inventory build", source: "EIA", venue: "Official RSS", minutesAgo: 27, symbols: ["WTI"] },
  { id: "nw_05", title: "ECB minutes point to patience on further rate cuts", source: "European Central Bank", venue: "Official RSS", minutesAgo: 38, symbols: ["EURUSD"] },
  { id: "nw_06", title: "Silver tracks gold; industrial demand headlines remain supportive", source: "Benzinga", venue: "Alpaca News", minutesAgo: 46, symbols: ["XAGUSD"] },
  { id: "nw_07", title: "Sterling slips as UK services PMI misses consensus", source: "Benzinga", venue: "Alpaca News", minutesAgo: 63, symbols: ["GBPUSD"] },
  { id: "nw_08", title: "RBNZ governor: inflation pressures easing, policy stays restrictive", source: "Reserve Bank of NZ", venue: "Official RSS", minutesAgo: 88, symbols: ["NZDUSD"] },
  { id: "nw_09", title: "OPEC+ delegates signal output policy unchanged into next quarter", source: "OPEC", venue: "Official RSS", minutesAgo: 124, symbols: ["WTI"] },
  { id: "nw_10", title: "Dollar index retreats from weekly high; majors broadly firmer", source: "Benzinga", venue: "Alpaca News", minutesAgo: 171, symbols: ["EURUSD", "GBPUSD", "XAUUSD"] },
];

export const MOCK_DAILY_BRIEF = {
  title: "Daily Brief · demo edition",
  body: [
    "Gold is holding firm as US yields ease, with the overnight range intact.",
    "WTI is softer after a larger-than-expected inventory build in the EIA report.",
    "The yen firmed on BoJ commentary; the dollar index is off its weekly high.",
    "Bitcoin is steady near session highs.",
    "Today: US Retail Sales and two Fed speakers. Figures in this demo brief are illustrative, not live.",
  ],
};
