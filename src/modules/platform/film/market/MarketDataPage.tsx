import { getCapability } from "../../content";
import { CapabilityTemplate } from "../capability/CapabilityTemplate";
import { MarketHero } from "./MarketHero";
import { MarketSections } from "./MarketSections";
import { MARKET_FILM_ID, MARKET_NOTES, MARKET_SECTION } from "./marketFilm";

/** W2.2 Market Data & Charts: the price-wall hero, then seven OS sections on real candles. */
export function MarketDataPage() {
  return (
    <CapabilityTemplate
      capability={getCapability("charts")!}
      film={
        <>
          <MarketHero />
          <MarketSections />
        </>
      }
      filmId={MARKET_FILM_ID}
      actOf={MARKET_SECTION}
      notes={MARKET_NOTES}
      closing="Start with the markets you follow."
    />
  );
}
