"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { OFFERS, OFFER_DISCLAIMER, WAITLIST } from "../content";
import { AnimatedHeading, BTN_OUTLINE, BTN_PRIMARY, GUTTER, Icon, PANEL, VIEW_ONCE, drawX, fade, useOnce } from "./bits";
import { CandleCard, RollNumber } from "./marketMotion";
import { CandleSnake } from "./CandleSnake";
import { PriceSeam } from "./Sections";
import { BullCharge } from "./BullCharge";
import { PercentRain } from "./PercentRain";

const WAITLIST_KEY = "afvar-waitlist-email";

/** W1.1.7 + W1.1.8 — the two launch offers, the mandatory disclaimer, and the
 *  register / waitlist card (all over the mountain backdrop). */
export function JoinQueue() {
  const reduce = useReducedMotion();
  const [ref, inView] = useOnce<HTMLDivElement>();
  return (
    <section id="launch" className={`${GUTTER} relative isolate overflow-x-clip pb-24 pt-16 md:pb-28`}>
      <PercentRain />
      <CandleSnake from="left" />
      {/* Transition E: green→red seam from the evidence banner into the two offer-card top borders. */}
      <PriceSeam toRed />
      <motion.div className="mx-auto max-w-[680px] text-center" initial="hidden" whileInView="visible" viewport={VIEW_ONCE}>
        <AnimatedHeading
          center
          kicker="Join before launch"
          title="Two ways into the launch queue."
          currency
          wrapTitle={(node) => <BullCharge side="left">{node}</BullCharge>}
          titleClassName="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-.02em] text-(--mk-text) sm:text-[38px]"
          sub="One account, one queue record. Verification changes which offer you're eligible for — never your place in line."
          subClassName="mt-4 text-[15px] leading-relaxed text-(--mk-dim)"
        />
      </motion.div>

      {/* Cards rise with a small stagger; each top accent line draws on view; the disclaimer lands last. */}
      <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"}>
        <div className="mx-auto mt-10 grid max-w-[920px] gap-4 md:grid-cols-2">
          {OFFERS.map((offer, index) => {
            // Offer 01 = green accent, Offer 02 = red accent (README §9.8) — accents only; CTAs stay neutral.
            const primary = offer.tone === "cyan";
            return (
              <CandleCard key={offer.title} index={index} delay={index * 0.1} snakeTarget={index === 0}>
                <div
                  className={`relative flex h-full flex-col overflow-hidden p-7 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-white/[.2] ${PANEL} ${
                    primary ? "ring-1 ring-[#00A85A]/30 hover:ring-[#00A85A]/55" : "ring-1 ring-[#FF3B3B]/25 hover:ring-[#FF3B3B]/50"
                  }`}
                >
                  <motion.span
                    aria-hidden="true"
                    variants={drawX(reduce, 0.25 + index * 0.08, 0.7)}
                    className={`absolute inset-x-0 top-0 h-[2px] origin-left ${primary ? "bg-[#00E676]" : "bg-[#FF3B3B]"}`}
                  />
                  <p className={`text-[12px] font-semibold uppercase tracking-[.16em] ${primary ? "text-[#00E676]" : "text-[#FF6464]"}`}><RollNumber value={offer.tag} /></p>
                  <h3 className="mt-1.5 text-[24px] font-semibold tracking-[-.015em] text-(--mk-text)">{offer.title}</h3>
                  <ul className="mt-5 space-y-3">
                    {offer.points.map((point) => (
                      <li key={point} className="flex gap-2.5 text-[13.5px] leading-relaxed text-(--mk-dim)">
                        <Icon name="check" className={`mt-1 h-3.5 w-3.5 shrink-0 ${primary ? "text-[#00E676]" : "text-[#FF6464]"}`} strokeWidth={2} />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link href={offer.cta.href} className={`mt-7 w-full ${primary ? BTN_PRIMARY : BTN_OUTLINE}`}>
                    {offer.cta.label}
                    <Icon name="arrow" className="h-3.5 w-3.5" strokeWidth={2} />
                  </Link>
                </div>
              </CandleCard>
            );
          })}
        </div>

        <motion.p variants={fade(reduce, 0.6)} className="mx-auto mt-6 max-w-[720px] text-center text-[12.5px] leading-relaxed text-(--mk-faint)">
          {OFFER_DISCLAIMER}
        </motion.p>
      </motion.div>

      {/* W1.1.8 — register */}
      <CandleCard standalone index={0} delay={0.1} className="mx-auto mt-10 max-w-[920px]">
        <WaitlistCard />
      </CandleCard>
    </section>
  );
}

/** Frontend waitlist: validates, confirms in place and remembers the signup locally. */
function WaitlistCard() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Deferred so the stored signup doesn't set state synchronously inside the effect body.
    const id = setTimeout(() => {
      try {
        setJoined(localStorage.getItem(WAITLIST_KEY));
      } catch {
        /* private mode — stay in form state */
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError(true);
      return;
    }
    setError(false);
    try {
      localStorage.setItem(WAITLIST_KEY, value);
    } catch {
      /* best effort */
    }
    setJoined(value);
  };

  const reset = () => {
    try {
      localStorage.removeItem(WAITLIST_KEY);
    } catch {
      /* best effort */
    }
    setJoined(null);
    setEmail("");
  };

  return (
    <div className={`h-full p-7 transition-colors duration-200 hover:border-white/[.2] sm:p-9 ${PANEL}`}>
      {joined ? (
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/[.16] bg-[#171B1D] text-(--mk-text)">
            <Icon name="check" className="h-6 w-6" strokeWidth={2} />
          </span>
          <div className="flex-1">
            <h3 className="text-[22px] font-semibold tracking-[-.02em] text-(--mk-text)">You&apos;re on the list.</h3>
            <p className="mt-1 text-[13.5px] text-(--mk-dim)">
              We&apos;ll write to <span className="font-medium text-(--mk-text)">{joined}</span> when plans and launch offers are confirmed. Complete registration to secure your queue record.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-2">
            <Link href="/register" className={BTN_PRIMARY}>
              Complete registration
              <Icon name="arrow" className="h-4 w-4" strokeWidth={2} />
            </Link>
            <button type="button" onClick={reset} className="text-[12px] text-(--mk-faint) underline-offset-2 hover:text-(--mk-text) hover:underline">
              Use a different email
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center">
          <div className="lg:max-w-[340px]">
            <h3 className="text-[24px] font-semibold tracking-[-.02em] text-(--mk-text) sm:text-[27px]">{WAITLIST.title}</h3>
            <p className="mt-2 text-[13.5px] text-(--mk-dim)">{WAITLIST.body}</p>
          </div>
          <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Email address</span>
              <Icon name="mail" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--mk-faint)" />
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(false);
                }}
                placeholder={WAITLIST.placeholder}
                aria-invalid={error}
                className={`h-12 w-full rounded-full border bg-(--afvar-charcoal) pl-11 pr-4 text-[14px] text-(--mk-text) outline-none transition-colors placeholder:text-(--mk-faint) ${
                  error ? "border-(--mk-accent)/70" : "border-white/[.11] focus:border-white/[.3]"
                } focus-visible:border-white/[.4] focus-visible:ring-2 focus-visible:ring-[rgba(245,247,247,.6)]`}
              />
              {error && <span className="absolute -bottom-5 left-4 text-[11px] text-(--mk-accent)">Enter a valid email address.</span>}
            </label>
            <button type="submit" className={BTN_PRIMARY}>
              {WAITLIST.cta}
              <Icon name="arrow" className="h-4 w-4" strokeWidth={2} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
