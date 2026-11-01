import { getCapability } from "../../content";
import { CapabilityTemplate } from "../capability/CapabilityTemplate";
import { MarketFilm } from "./MarketFilm";
import { FEATURE_ACT, MARKET_FILM_ID, MARKET_NOTES } from "./marketFilm";

/** W2.2 Market Data & Charts, the first page on the AI OS capability template. */
export function MarketDataPage() {
  return <CapabilityTemplate capability={getCapability("charts")!} film={<MarketFilm />} filmId={MARKET_FILM_ID} actOf={FEATURE_ACT} notes={MARKET_NOTES} closing="Start with the markets you follow." />;
}
