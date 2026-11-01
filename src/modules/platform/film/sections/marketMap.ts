// English names and feed keys for the Markets pages (the feed carries 8 of the 10 instruments).

export type GroupId = "commodities" | "forex" | "crypto";

export interface InstInfo {
  slug: string;
  name: string;
  sym: string;
  /** Key in the live feed, when the preview feed carries this instrument. */
  key?: string;
  group: GroupId;
}

export const INST: Record<string, InstInfo> = {
  gold: { slug: "gold", name: "Gold", sym: "XAU/USD", key: "XAUUSD", group: "commodities" },
  silver: { slug: "silver", name: "Silver", sym: "XAG/USD", key: "XAGUSD", group: "commodities" },
  oil: { slug: "oil", name: "Crude oil", sym: "WTI", key: "WTI", group: "commodities" },
  eurusd: { slug: "eurusd", name: "Euro / Dollar", sym: "EUR/USD", key: "EURUSD", group: "forex" },
  usdjpy: { slug: "usdjpy", name: "Dollar / Yen", sym: "USD/JPY", key: "USDJPY", group: "forex" },
  gbpusd: { slug: "gbpusd", name: "Pound / Dollar", sym: "GBP/USD", key: "GBPUSD", group: "forex" },
  audusd: { slug: "audusd", name: "Aussie / Dollar", sym: "AUD/USD", group: "forex" },
  nzdusd: { slug: "nzdusd", name: "Kiwi / Dollar", sym: "NZD/USD", key: "NZDUSD", group: "forex" },
  btc: { slug: "btc", name: "Bitcoin", sym: "BTC", key: "BTC-USD", group: "crypto" },
  eth: { slug: "eth", name: "Ether", sym: "ETH", group: "crypto" },
};

export const GROUP: Record<GroupId, { name: string; short: string; items: string[] }> = {
  commodities: { name: "Commodities", short: "Metals and energy", items: ["gold", "silver", "oil"] },
  forex: { name: "Forex", short: "Major currency pairs", items: ["eurusd", "usdjpy", "gbpusd", "audusd", "nzdusd"] },
  crypto: { name: "Crypto", short: "Coins, around the clock", items: ["btc", "eth"] },
};

export const GROUP_IDS: GroupId[] = ["commodities", "forex", "crypto"];
