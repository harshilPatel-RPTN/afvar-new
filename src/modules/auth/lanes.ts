import type { MessageKey } from "@/platform/i18n";

/**
 * The 8 fixed coverage lanes, offered as interests during onboarding.
 */
export interface CoverageLane {
  symbol: string;
  slug: string;
  nameKey: MessageKey;
  classKey: MessageKey;
}

export const COVERAGE_LANES: CoverageLane[] = [
  { symbol: "XAUUSD", slug: "gold", nameKey: "lane.gold", classKey: "laneClass.metal" },
  { symbol: "XAGUSD", slug: "silver", nameKey: "lane.silver", classKey: "laneClass.metal" },
  { symbol: "WTI", slug: "oil", nameKey: "lane.oil", classKey: "laneClass.energy" },
  { symbol: "EURUSD", slug: "eurusd", nameKey: "lane.eurusd", classKey: "laneClass.forex" },
  { symbol: "USDJPY", slug: "usdjpy", nameKey: "lane.usdjpy", classKey: "laneClass.forex" },
  { symbol: "GBPUSD", slug: "gbpusd", nameKey: "lane.gbpusd", classKey: "laneClass.forex" },
  { symbol: "NZDUSD", slug: "nzdusd", nameKey: "lane.nzdusd", classKey: "laneClass.forex" },
  { symbol: "BTCUSD", slug: "crypto", nameKey: "lane.crypto", classKey: "laneClass.crypto" },
];

