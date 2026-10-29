"use client";

// Chapter 02's eight lanes as a live board in the "/" markets design, right
// after the pinned 3D stage (normal page flow, so "/"'s scroll set pieces
// fire where they should): the bull & bear tug of war over the real breadth,
// rows that flash on real ticks with rolling digits and drawn sparklines, a
// gold and a silver ingot dropping onto their rows, the Bitcoin coin flip,
// and the live forex session clock.
import { motion, useReducedMotion } from "framer-motion";
import {
  BitcoinCoin,
  CandleCard,
  ChangePill,
  FlashPrice,
  FxSymbol,
  GoldBar,
  PANEL,
  RollNumber,
  SessionClock,
  Spark,
  SymbolDisc,
  TugOfWar,
  fade,
  fmtPrice,
  rise,
  useLiveMarket,
  useOnce,
} from "@/modules/home/kit";
import { GROUPS, LANES } from "./marketWorldConfig";

export function LaneBoard() {
  const { quotes } = useLiveMarket();
  const reduce = useReducedMotion();
  const [ref, inView] = useOnce<HTMLDivElement>();
  return (
    <div className="mx-auto max-w-[760px] px-5 pb-20 sm:px-10">
      <TugOfWar quotes={quotes} />
      <motion.div ref={ref} data-inview={inView || undefined} initial="hidden" animate={inView ? "visible" : "hidden"} className="mt-8">
        <CandleCard index={0}>
          <div className={`p-4 transition-colors duration-200 hover:border-white/[.2] ${PANEL}`}>
            {GROUPS.map((group, g) => (
              <div key={group.key} className={g > 0 ? "mt-4 border-t border-white/[.07] pt-4" : "relative"}>
                <motion.p variants={fade(reduce, 0.1 + g * 0.12)} className="px-2 text-[11px] font-semibold uppercase tracking-[.14em] text-(--mk-faint)">
                  {group.label}
                </motion.p>
                <ul className="mt-1.5 space-y-0.5">
                  {LANES.map((lane, order) => {
                    const q = quotes[lane.symbol];
                    if (lane.group !== g || !q) return null;
                    return (
                      <motion.li key={lane.symbol} variants={rise(reduce, 0.14 + order * 0.05, 8)} className="relative">
                        <button
                          type="button"
                          data-symbol={lane.symbol}
                          className="flex w-full items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 text-left transition-colors hover:bg-white/[.05]"
                        >
                          <SymbolDisc symbol={lane.symbol} />
                          <span className="min-w-0 shrink">
                            <FxSymbol symbol={lane.symbol} className="block text-[13.5px] font-semibold text-(--mk-text)" />
                            <span className="block text-[11px] text-(--mk-faint)">{lane.name}</span>
                          </span>
                          <FlashPrice value={q.last} live={q.live} className="ml-auto shrink-0 whitespace-nowrap font-mono text-[13px] tabular-nums text-(--mk-text)">
                            <RollNumber value={fmtPrice(q.last, q.decimals)} />
                          </FlashPrice>
                          <span className="hidden shrink-0 min-[400px]:inline-flex">
                            <Spark closes={q.closes.slice(-18)} up={q.changePct >= 0} w={52} h={20} draw delay={0.3 + order * 0.05} />
                          </span>
                          <ChangePill pct={q.changePct} />
                        </button>
                        {lane.symbol === "XAUUSD" && <GoldBar />}
                        {lane.symbol === "XAGUSD" && <GoldBar metal="silver" at={0.16} />}
                        {lane.symbol === "BTC-USD" && <BitcoinCoin />}
                      </motion.li>
                    );
                  })}
                </ul>
                <motion.p variants={fade(reduce, 0.3 + g * 0.12)} className="mt-2 px-2 text-[11px] leading-snug text-(--mk-faint)">
                  {group.note}
                </motion.p>
                {group.key === "forex" && <SessionClock />}
              </div>
            ))}
          </div>
        </CandleCard>
      </motion.div>
    </div>
  );
}
