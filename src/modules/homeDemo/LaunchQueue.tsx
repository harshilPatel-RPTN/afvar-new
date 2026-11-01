"use client";

// The launch queue — the page's destination after Chapter 10. The demo's own
// copy (two offers, every commercial value explicitly unconfirmed; nothing
// here promises access, amounts or priority) in the "/" offers design and
// motion: +/− rain behind, a candle snake that lands as the glowing top border
// of Offer 01, cards that print in like candles, accent lines that draw on
// view, slot-reel tags and the currency-swapping heading.
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  AnimatedHeading,
  BTN_OUTLINE,
  BTN_PRIMARY,
  CandleCard,
  CandleSnake,
  Icon,
  PANEL,
  PercentRain,
  RollNumber,
  VIEW_ONCE,
  drawX,
  fade,
  useOnce,
} from "@/modules/home/kit";
import { REGISTER_HREF } from "./ui";

const OFFERS = [
  {
    n: "Offer 01",
    title: "Launch Queue",
    primary: true,
    points: [
      "Verify your mobile and email — one account, one queue record",
      "Launch benefit under approved terms, to be confirmed",
      "Your queue position never changes because of an offer",
    ],
    cta: "Join the Launch Queue",
  },
  {
    n: "Offer 02",
    title: "Verified Launch Queue",
    tag: "Optional",
    primary: false,
    points: [
      "Optional identity approval after joining — never required",
      "Separate verified benefit, to be confirmed",
      "Same account and queue order; no invitation priority",
    ],
    cta: "Learn about verification",
  },
] as const;

export function LaunchQueue({ showRain = true }: { showRain?: boolean }) {
  const reduce = useReducedMotion();
  const [ref, inView] = useOnce<HTMLDivElement>();
  return (
    <section id="launch-queue" aria-label="Launch queue" className="relative isolate scroll-mt-28 overflow-x-clip border-t border-white/[.08] px-5 pb-24 pt-16 sm:px-10 md:pb-28">
      {showRain && <PercentRain />}
      <CandleSnake from="left" />
      <motion.div className="mx-auto max-w-[680px] text-center" initial="hidden" whileInView="visible" viewport={VIEW_ONCE}>
        <AnimatedHeading
          center
          kicker="Launch queue"
          title="Two ways into the launch queue."
          currency
          titleClassName="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-.02em] text-(--mk-text) sm:text-[38px]"
          sub="One account, one queue record. Verification changes which offer you're eligible for — never your place in line."
          subClassName="mt-4 text-[15px] leading-relaxed text-(--mk-dim)"
        />
      </motion.div>

      {/* Cards rise with a small stagger; each top accent line draws on view; the disclaimer lands last. */}
      <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"}>
        <div className="demo-queue-offers mx-auto mt-10 grid max-w-[920px] gap-4 md:grid-cols-2">
          {OFFERS.map((offer, index) => (
            <CandleCard key={offer.title} index={index} delay={index * 0.1} snakeTarget={index === 0}>
              <div
                className={`demo-queue-card relative flex h-full flex-col overflow-hidden p-7 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-white/[.2] ${PANEL} ${
                  offer.primary ? "ring-1 ring-[#76A58C]/30 hover:ring-[#76A58C]/55" : "ring-1 ring-[#A31C1B]/25 hover:ring-[#A31C1B]/50"
                }`}
              >
                <motion.span
                  aria-hidden="true"
                  variants={drawX(reduce, 0.25 + index * 0.08, 0.7)}
                  className={`absolute inset-x-0 top-0 h-[2px] origin-left ${offer.primary ? "bg-[#A8DEC2]" : "bg-[#A31C1B]"}`}
                />
                <div className="flex items-baseline justify-between">
                  <p className={`text-[12px] font-semibold uppercase tracking-[.16em] ${offer.primary ? "text-[#A8DEC2]" : "text-[#FF918B]"}`}>
                    <RollNumber value={offer.n} />
                  </p>
                  {"tag" in offer ? <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-(--mk-faint)">{offer.tag}</p> : null}
                </div>
                <h3 className="mt-1.5 text-[24px] font-semibold tracking-[-.015em] text-(--mk-text)">{offer.title}</h3>
                <ul className="mt-5 space-y-3">
                  {offer.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-[13.5px] leading-relaxed text-(--mk-dim)">
                      <Icon name="check" className={`mt-1 h-3.5 w-3.5 shrink-0 ${offer.primary ? "text-[#A8DEC2]" : "text-[#FF918B]"}`} strokeWidth={2} />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link href={REGISTER_HREF} prefetch={false} className={`mt-7 w-full ${offer.primary ? BTN_PRIMARY : BTN_OUTLINE}`}>
                  {offer.cta}
                  <Icon name="arrow" className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
              </div>
            </CandleCard>
          ))}
        </div>

        <motion.p variants={fade(reduce, 0.6)} className="mx-auto mt-6 max-w-[720px] text-center text-[12.5px] leading-relaxed text-(--mk-faint)">
          Same account and queue order. No invitation priority. Offer amount, capacity and duration are not yet confirmed.
        </motion.p>
      </motion.div>

      {/* Register */}
      <CandleCard standalone index={0} delay={0.1} className="demo-queue-signup mx-auto mt-10 max-w-[920px]">
        <div className={`demo-queue-registration flex h-full flex-col gap-6 p-7 transition-colors duration-200 hover:border-white/[.2] sm:flex-row sm:items-center sm:justify-between sm:p-9 ${PANEL}`}>
          <p className="max-w-md text-[13.5px] leading-relaxed text-(--mk-dim)">
            Registration is free and reserves your place. It doesn&apos;t grant access to the OS yet — access comes later by invitation.
          </p>
          <div className="demo-queue-actions flex flex-wrap items-center gap-3">
            <Link href={REGISTER_HREF} prefetch={false} className={BTN_PRIMARY}>
              Register Now
              <Icon name="arrow" className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link href={REGISTER_HREF} prefetch={false} className={BTN_OUTLINE}>
              Explore Launch Offers
            </Link>
          </div>
        </div>
      </CandleCard>
    </section>
  );
}
