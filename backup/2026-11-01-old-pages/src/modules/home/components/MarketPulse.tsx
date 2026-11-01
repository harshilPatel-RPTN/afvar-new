"use client";

// Nav "market pulse": a 5px breadth dot next to Markets. Counts only REAL
// quotes (live or delayed) from useLiveMarket — green if most are up today,
// red if most are down, grey while every lane is still on the stored
// snapshot (or breadth is tied). Never inferred from snapshot values.
// Decorative for AT (aria-hidden) so the Markets button keeps its name; the
// breadth reading is in the hover tooltip.
import { useLiveMarket } from "./useLiveMarket";

export function MarketPulseDot() {
  const { quotes } = useLiveMarket();
  const real = Object.values(quotes).filter((quote) => quote.live);
  const up = real.filter((quote) => quote.changePct > 0).length;
  const down = real.filter((quote) => quote.changePct < 0).length;
  const tone = real.length === 0 || up === down ? "flat" : up > down ? "up" : "down";
  const label =
    real.length === 0
      ? "Today's breadth: waiting for real quotes (snapshot)"
      : `Today's breadth: ${up} up · ${down} down (${real.length} real quotes)`;
  return (
    <span
      data-market-pulse={tone}
      title={label}
      aria-hidden="true"
      className="relative ml-0.5 inline-flex h-3 w-3 items-center justify-center"
    >
      <span
        className={`h-[5px] w-[5px] rounded-full ${tone === "up" ? "bg-[#00E676]" : tone === "down" ? "bg-[#FF3B3B]" : "bg-[#6D7578]"}`}
      />
    </span>
  );
}
