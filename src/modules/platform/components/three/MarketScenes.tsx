"use client";

import { BriefsScene } from "./market/briefs";
import { CommoditiesScene } from "./market/commodities";
import { CryptoScene } from "./market/crypto";
import { ForexScene } from "./market/forex";
import { MarketsScene } from "./market/markets";

/**
 * W3 Markets models, in the /about scene language: dark glass, polished
 * metal, hairline neon and bloom. Schematic only, never data. One file per
 * scene in ./market, shared parts in ./market/parts.tsx.
 */
export const MARKET_SCENES = {
  markets: MarketsScene,
  commodities: CommoditiesScene,
  forex: ForexScene,
  crypto: CryptoScene,
  briefs: BriefsScene,
} as const;
