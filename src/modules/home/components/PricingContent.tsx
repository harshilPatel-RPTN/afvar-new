"use client";

// W4 · Pricing, built as a sibling of the W2 /platform pages: same PlatformShell
// (`pf` tokens on the AFVAR palette), macOS window/dock/app-icon kit, Apple-scale
// type, Backdrop artwork and the Scene3D look-around pattern for the 3D tiers.
import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AnimatedBackdrop,
  AppIcon,
  ChevronLink,
  Dock,
  PageScene3D,
  MacWindow,
  PageNote,
  PIcon,
  RegisterLink,
  Reveal,
  SectionHeading,
  type DockItem,
  type IconTone,
  type PlatformIcon,
} from "@/modules/platform/kit";
import {
  OFFERS,
  OFFER_DISCLAIMER,
  PRICING_CAPABILITIES,
  PRICING_DATA_POINTS,
  PRICING_FAQS,
  PRICING_TIERS,
  PRICING_TIERS_NOTE,
  PRICING_USAGE,
} from "../content";
import { FlashPrice, Spark, useOnce } from "./bits";
import { CandleSnake } from "./CandleSnake";
import { RollNumber } from "./marketMotion";
import { MotionTitle } from "./MotionTitle";
import { fmtPrice, useLiveMarket } from "./useLiveMarket";

const EASE = [0.25, 0.1, 0.25, 1] as const;
const fade = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay },
});

const fmtUSD = (value: number) => (value === 0 ? "Free" : `$${value.toLocaleString("en-US")}`);
const monthlyShown = (monthly: number, yearly: boolean) => (yearly ? Math.round((monthly * 10) / 12) : monthly);

/* ------------------------------------------------------------------ */
/* Hero (pattern: overview/OverviewHero)                               */
/* ------------------------------------------------------------------ */

function PricingHero() {
  return (
    <section aria-labelledby="pricing-title" className="relative isolate px-4 pt-24 sm:px-6 sm:pt-32">
      <AnimatedBackdrop
        src="/company/pricing-rg-hd.jpg"
        effect="aurora"
        tint="market"
        natural
        priority
        opacity={0.9}
        position="center"
        className="absolute inset-x-0 top-0 h-[820px]"
        fade="linear-gradient(to bottom, black 45%, transparent)"
      />
      <div className="mx-auto max-w-6xl text-center">
        <motion.p {...fade(0)} className="text-[17px] font-semibold text-(--accent)">
          AFVAR Pricing
        </motion.p>
        <motion.h1 {...fade(0.08)} id="pricing-title" className="pf-hero-title mt-3">
          <MotionTitle as="span" text="Simple plans." />
          <MotionTitle as="span" text="Confirmed at launch." delay={0.3} className="block text-(--text-tertiary)" />
        </motion.h1>
        <motion.p {...fade(0.2)} className="pf-lede mx-auto mt-6 max-w-xl">
          Three tiers on one connected desk — start free, go further from $200 a month. Pricing is indicative until launch.
        </motion.p>
        <motion.div {...fade(0.3)} className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
          <RegisterLink />
          <ChevronLink href="#plans">Compare plans</ChevronLink>
        </motion.div>
        <motion.p {...fade(0.4)} className="mt-6 text-[13px] text-(--text-muted)">
          Verification changes offer eligibility, not access priority. No payment is required now.
        </motion.p>
      </div>
      <motion.div {...fade(0.45)} className="mx-auto mt-14 max-w-5xl sm:mt-16">
        <PageScene3D
          kind="podium"
          label="3D illustration: three plan tiers as podium steps with spinning gold coins — Free, $200 and $500 a month, all indicative. Not live data."
          caption="Illustration · indicative tiers, not live data"
          fallback={<PodiumFallback />}
        />
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3D tiers (pattern: capability/Scene3D CSS scene — look-around)      */
/* ------------------------------------------------------------------ */

const PODIUM: Array<{ tag: string; price: string; height: number; x: number; icon: PlatformIcon; tone: IconTone; accent: boolean }> = [
  { tag: "Tier 01", price: "Free", height: 88, x: -150, icon: "chart", tone: "slate", accent: false },
  { tag: "Tier 02", price: "$200", height: 150, x: 0, icon: "sparkle", tone: "gold", accent: true },
  { tag: "Tier 03", price: "$500", height: 118, x: 150, icon: "gauge", tone: "purple", accent: false },
];

function Slab({ tier, run }: { tier: (typeof PODIUM)[number]; run: boolean }) {
  const width = 128;
  const depth = 64;
  const face: React.CSSProperties = {
    position: "absolute",
    bottom: 0,
    width,
    height: tier.height,
    borderRadius: 10,
    background: tier.accent ? "rgba(168,222,194,0.14)" : "rgba(255,255,255,0.05)",
    border: `1px solid ${tier.accent ? "var(--accent-subtle)" : "var(--mac-hairline)"}`,
    boxShadow: tier.accent ? "0 0 44px rgba(168,222,194,0.22), inset 0 0.5px 0 rgba(255,255,255,0.2)" : "inset 0 0.5px 0 rgba(255,255,255,0.1)",
  };
  return (
    <motion.div
      className="absolute bottom-[14%] left-1/2 [transform-style:preserve-3d]"
      style={{ x: tier.x - width / 2 }}
      animate={run ? { y: [0, tier.accent ? -10 : -6, 0] } : undefined}
      transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: tier.x / 300 + 0.5 }}
    >
      {/* front, back and top faces of the glass block */}
      <div style={{ ...face, transform: `translateZ(${depth / 2}px)` }}>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-0.5 pb-3">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-(--text-muted)">{tier.tag.toUpperCase()}</span>
          <span className={`text-[20px] font-semibold tabular-nums ${tier.accent ? "text-(--accent)" : "text-(--text-secondary)"}`}>{tier.price}</span>
        </div>
      </div>
      <div style={{ ...face, transform: `translateZ(${-depth / 2}px)` }} />
      <div
        style={{
          ...face,
          height: depth,
          borderRadius: 10,
          transform: `translateY(${-tier.height + depth / 2}px) translateZ(0px) rotateX(90deg)`,
          background: tier.accent ? "rgba(168,222,194,0.22)" : "rgba(255,255,255,0.08)",
        }}
      />
      <span className="absolute" style={{ bottom: tier.height + 26, left: width / 2, transform: `translateX(-50%) translateZ(${depth / 2}px)` }}>
        <AppIcon icon={tier.icon} tone={tier.tone} size={44} />
      </span>
    </motion.div>
  );
}

/** CSS stand-in while the WebGL podium loads (and where WebGL is unavailable). */
function PodiumFallback() {
  const still = useReducedMotion() ?? false;
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[55%] [transform:rotateX(72deg)] [transform-origin:bottom]"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 60%, rgba(168,222,194,0.14), transparent 70%), repeating-linear-gradient(90deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 56px), repeating-linear-gradient(0deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 56px)",
        }}
      />
      {PODIUM.map((tier) => (
        <Slab key={tier.tag} tier={tier} run={!still} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Plans window (MacWindow + segmented billing + selectable cards)     */
/* ------------------------------------------------------------------ */

function BillingSwitch({ yearly, onChange }: { yearly: boolean; onChange: (next: boolean) => void }) {
  return (
    <div role="group" aria-label="Billing period" className="afvar-glass-track flex h-8 items-center rounded-[9px] p-0.5">
      {([false, true] as const).map((isYearly) => {
        const active = yearly === isYearly;
        return (
          <button
            key={String(isYearly)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(isYearly)}
            className="afvar-glass-tab relative h-7 rounded-[7px] px-3 text-[12px] font-medium"
          >
            {active && (
              <motion.span
                layoutId="pricing-billing-segment"
                transition={{ type: "spring", stiffness: 420, damping: 36, mass: 0.75 }}
                className="afvar-glass-indicator pointer-events-none absolute inset-0 rounded-[7px]"
                aria-hidden="true"
              />
            )}
            <span className="relative">
              {isYearly ? "Yearly" : "Monthly"}
              {isYearly && <span className="ml-1.5 text-[10px] font-semibold text-(--positive)">2 mo free</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const TIER_ICONS: Array<{ icon: PlatformIcon; tone: IconTone }> = [
  { icon: "chart", tone: "slate" },
  { icon: "sparkle", tone: "gold" },
  { icon: "gauge", tone: "purple" },
];

interface ReviewState {
  tierIndex: number;
  yearly: boolean;
}

function PlansWindow({ onReview }: { onReview: (state: ReviewState) => void }) {
  const [yearly, setYearly] = useState(false);
  const [selected, setSelected] = useState(() => Math.max(0, PRICING_TIERS.findIndex((tier) => tier.highlighted)));

  return (
    <section id="plans" aria-labelledby="plans-heading" className="relative isolate scroll-mt-24 px-4 pt-28 sm:px-6">
      {/* "/" candle snake: slithers in and lands as the glowing border of the highlighted plan. */}
      <CandleSnake from="right" />
      <SectionHeading id="plans-heading" title="Three tiers. One connected desk." summary="Pick the shape of your desk — names, prices and allowances are confirmed before launch." />
      <Reveal y={28} delay={0.08} className="mx-auto mt-10 max-w-6xl">
        <MacWindow title="Plans & Comparison — AFVAR" toolbar={<BillingSwitch yearly={yearly} onChange={setYearly} />} bodyClassName="p-4 sm:p-6">
          <div role="radiogroup" aria-label="Choose a plan tier" className="grid gap-4 lg:grid-cols-3">
            {PRICING_TIERS.map((tier, index) => {
              const isSelected = selected === index;
              return (
                <div
                  key={tier.tag}
                  data-snake-target={tier.highlighted ? "" : undefined}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => setSelected(index)}
                  onKeyDown={(event: ReactKeyboardEvent) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(index);
                    }
                  }}
                  className={`relative flex h-full cursor-pointer flex-col rounded-2xl p-5 outline-none transition-[background-color,box-shadow] duration-200 ${
                    isSelected
                      ? "bg-(--accent-soft) shadow-[inset_0_0_0_1px_var(--accent-border),0_12px_40px_-18px_rgba(168,222,194,0.45)]"
                      : "bg-(--surface-2) shadow-[inset_0_0_0_0.5px_var(--mac-hairline)] hover:bg-(--surface-hover) focus-visible:shadow-[inset_0_0_0_1px_var(--accent-border)]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <AppIcon icon={TIER_ICONS[index].icon} tone={TIER_ICONS[index].tone} size={44} />
                    {isSelected && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-(--accent) px-2.5 py-1 text-[11px] font-semibold text-(--text-inverse)">
                        <PIcon name="check" size={11} weight="bold" />
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-[12px] font-semibold tracking-[0.08em] text-(--text-muted)">{tier.tag.toUpperCase()}</p>
                  <h3 className="mt-1 text-[19px] font-semibold text-(--text-primary)">{tier.name}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-(--text-secondary)">{tier.blurb}</p>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="text-[34px] font-semibold tabular-nums tracking-[-0.03em] text-(--text-primary)">
                      <RollNumber key={yearly ? "y" : "m"} value={fmtUSD(monthlyShown(tier.monthly, yearly))} />
                    </span>
                    {tier.monthly > 0 && <span className="text-[13px] text-(--text-muted)">/ month · indicative</span>}
                  </div>
                  <p className="mt-0.5 text-[12px] text-(--text-muted)">
                    {tier.monthly === 0
                      ? "Free during pre-launch · no card required"
                      : yearly
                        ? `$${(tier.monthly * 10).toLocaleString("en-US")} billed yearly — 2 months free`
                        : "Billed monthly · cancel any time"}
                  </p>

                  <ul className="mt-5 space-y-2.5 border-t border-(--mac-hairline) pt-5">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-2.5 text-[13.5px] leading-snug text-(--text-secondary)">
                        <PIcon name="check" size={13} weight="bold" className={`mt-0.5 shrink-0 ${isSelected ? "text-(--accent)" : "text-(--text-muted)"}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelected(index);
                      onReview({ tierIndex: index, yearly });
                    }}
                    className={`afvar-glass-button mt-6 inline-flex h-11 w-full items-center justify-center rounded-full text-[14px] font-medium ${isSelected ? "afvar-glass-primary" : ""}`}
                  >
                    Review & join queue
                  </button>
                </div>
              );
            })}
          </div>
          <p aria-live="polite" className="mt-5 text-center text-[13px] text-(--text-secondary)">
            Selected: <span className="font-semibold text-(--accent)">{PRICING_TIERS[selected].tag}</span>
            {" · "}
            <span className="tabular-nums text-(--text-primary)">
              {PRICING_TIERS[selected].monthly === 0 ? "Free" : `${fmtUSD(monthlyShown(PRICING_TIERS[selected].monthly, yearly))} / month`}
            </span>
            {yearly && PRICING_TIERS[selected].monthly > 0 && <span className="text-(--text-muted)"> · billed yearly</span>}
          </p>
        </MacWindow>
      </Reveal>
      <div className="mx-auto mt-6 max-w-3xl">
        <PageNote>{PRICING_TIERS_NOTE}</PageNote>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Review dialog (guide §8.6/§11.3: explicit confirmation)             */
/* ------------------------------------------------------------------ */

function ReviewDialog({ review, onClose }: { review: ReviewState; onClose: () => void }) {
  const tier = PRICING_TIERS[review.tierIndex];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const rows: Array<[string, string]> = [
    ["Plan", `${tier.tag} · ${tier.name}`],
    ["Billing", review.yearly ? "Yearly — 2 months free" : "Monthly"],
    [
      "Indicative price",
      tier.monthly === 0 ? "Free" : `${fmtUSD(monthlyShown(tier.monthly, review.yearly))} / month${review.yearly ? ` ($${(tier.monthly * 10).toLocaleString("en-US")} / year)` : ""}`,
    ],
    ["Due today", "$0 — registration only"],
  ];

  return (
    <div role="dialog" aria-modal="true" aria-label="Review registration" className="fixed inset-0 z-[90] grid place-items-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/55" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
        exit={{ opacity: 0, y: 4, scale: 0.99, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } }}
        onClick={(event) => event.stopPropagation()}
        className="pf-vibrant relative w-full max-w-[460px] rounded-[18px] p-6"
      >
        <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-(--text-primary)">Review registration</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-(--text-secondary)">Nothing is charged. Joining the launch queue registers one account and one queue record.</p>
        <dl className="pf-group mt-5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-[13px] text-(--text-secondary)">{label}</dt>
              <dd className="text-right text-[13px] font-medium tabular-nums text-(--text-primary)">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3.5 flex gap-2 text-[12px] leading-relaxed text-(--text-muted)">
          <PIcon name="shield" size={13} className="mt-0.5 shrink-0 text-(--accent)" />
          Indicative pricing — final values are confirmed at launch under approved terms. Queue position never changes because of a plan choice.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} autoFocus className="afvar-glass-button inline-flex h-10 items-center rounded-full px-4 text-[14px] font-medium">
            Cancel
          </button>
          <RegisterLink size="md" />
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Included capabilities                                               */
/* ------------------------------------------------------------------ */

const CAPABILITY_ICONS: Array<{ icon: PlatformIcon; tone: IconTone }> = [
  { icon: "chart", tone: "cyan" },
  { icon: "news", tone: "purple" },
  { icon: "bell", tone: "red" },
  { icon: "shield", tone: "slate" },
  { icon: "users", tone: "green" },
  { icon: "sparkle", tone: "gold" },
];

function Included() {
  return (
    <section id="included" aria-labelledby="included-heading" className="scroll-mt-24 px-4 pt-28 sm:px-6">
      <SectionHeading id="included-heading" title="Every tier runs the whole desk." summary="The confirmed product scope — tiers change allowances, never the connected workspace." />
      <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRICING_CAPABILITIES.map((capability, index) => (
          <Reveal key={capability.title} delay={(index % 3) * 0.06} className="h-full">
            <div className="pf-tile h-full p-6">
              <AppIcon icon={CAPABILITY_ICONS[index].icon} tone={CAPABILITY_ICONS[index].tone} size={48} />
              <h3 className="mt-4 text-[17px] font-semibold text-(--text-primary)">{capability.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-(--text-secondary)">{capability.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Usage & limits (Settings-style list) + live market data window      */
/* ------------------------------------------------------------------ */

const LANES = ["XAUUSD", "XAGUSD", "WTI", "EURUSD", "USDJPY", "GBPUSD", "NZDUSD", "BTC-USD"] as const;

function UsageAndData() {
  const { quotes, live } = useLiveMarket();
  const [lanesRef, lanesIn] = useOnce<HTMLDivElement>();
  return (
    <section id="usage" aria-labelledby="usage-heading" className="scroll-mt-24 px-4 pt-28 sm:px-6">
      <SectionHeading id="usage-heading" title="Allowances, decided openly." summary="Usage limits are published with the final plans; market data always carries its source and freshness." />
      <div className="mx-auto mt-10 grid max-w-6xl items-start gap-6 lg:grid-cols-2">
        <Reveal y={24}>
          <MacWindow size="sm" title="System Settings — Usage & Limits" bodyClassName="p-4">
            <div className="pf-group">
              {PRICING_USAGE.map(([item, status]) => (
                <div key={item} className="flex min-h-11 items-center justify-between gap-4 px-4 py-2.5">
                  <span className="flex items-center gap-3 text-[13.5px] text-(--text-primary)">
                    <span className="grid size-7 place-items-center rounded-[7px] bg-(--surface-3) text-(--text-secondary)">
                      <PIcon name="lock" size={14} />
                    </span>
                    {item}
                  </span>
                  <span className="shrink-0 text-right text-[12px] text-(--text-muted)">{status}</span>
                </div>
              ))}
            </div>
            <p className="px-1 pb-1 pt-3 text-[12px] leading-relaxed text-(--text-muted)">Nothing here is promised until it appears under approved terms with the final plans.</p>
          </MacWindow>
        </Reveal>

        <Reveal y={24} delay={0.08}>
          <MacWindow
            size="sm"
            title="Markets — 8 lanes on every plan"
            toolbar={
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${live ? "text-(--positive)" : "text-(--text-muted)"}`}>
                <span aria-hidden="true" className={`size-1.5 rounded-full ${live ? "bg-(--positive) motion-safe:animate-pulse" : "bg-(--text-muted)"}`} />
                {live ? "Live · futures delayed" : "Snapshot · simulated"}
              </span>
            }
            bodyClassName="p-4"
          >
            <div ref={lanesRef} data-inview={lanesIn || undefined} className="pf-group">
              {LANES.map((symbol, order) => {
                const quote = quotes[symbol];
                const up = quote.changePct >= 0;
                return (
                  <div key={symbol} className="flex items-center gap-3 px-4 py-2">
                    <span className="w-[76px] text-[13px] font-semibold text-(--text-primary)">{symbol}</span>
                    <span className="hidden text-[11.5px] text-(--text-muted) sm:block sm:w-[88px]">{quote.name}</span>
                    <Spark closes={quote.closes.slice(-14)} up={up} w={48} h={16} draw delay={0.2 + order * 0.05} />
                    <FlashPrice value={quote.last} live={quote.live} className="ml-auto text-[13px] tabular-nums text-(--text-primary)">
                      <RollNumber value={fmtPrice(quote.last, quote.decimals)} />
                    </FlashPrice>
                    <span className={`w-[62px] text-right text-[12px] font-medium tabular-nums ${up ? "text-(--positive)" : "text-(--negative)"}`}>
                      {up ? "▲" : "▼"} {Math.abs(quote.changePct).toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <ul className="space-y-1.5 px-1 pb-1 pt-3">
              {PRICING_DATA_POINTS.map((point) => (
                <li key={point} className="flex gap-2 text-[12px] leading-relaxed text-(--text-muted)">
                  <PIcon name="check" size={12} weight="bold" className="mt-0.5 shrink-0 text-(--accent)" />
                  {point}
                </li>
              ))}
            </ul>
          </MacWindow>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Launch offers (W4.1.6) + FAQs                                       */
/* ------------------------------------------------------------------ */

function Offers() {
  return (
    <section id="offers" aria-labelledby="offers-heading" className="relative isolate scroll-mt-24 px-4 pt-28 sm:px-6">
      <CandleSnake from="left" radius={28} />
      <SectionHeading id="offers-heading" title="Two ways into the launch queue." summary="One account, one queue record. Verification changes which offer you're eligible for — never your place in line." />
      <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
        {OFFERS.map((offer, index) => {
          const primary = offer.tone === "cyan";
          return (
            <Reveal key={offer.title} delay={index * 0.08} className="h-full">
              <div data-snake-target={primary ? "" : undefined} className={`pf-tile h-full p-6 ${primary ? "shadow-[inset_0_0_0_1px_var(--accent-border)]" : "shadow-[inset_0_0_0_0.5px_var(--mac-hairline)]"}`}>
                <p className={`text-[12px] font-semibold tracking-[0.08em] ${primary ? "text-(--accent)" : "text-(--negative)"}`}><RollNumber value={offer.tag.toUpperCase()} /></p>
                <h3 className="mt-1.5 text-[21px] font-semibold tracking-[-0.02em] text-(--text-primary)">{offer.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {offer.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-[13.5px] leading-relaxed text-(--text-secondary)">
                      <PIcon name="check" size={13} weight="bold" className={`mt-0.5 shrink-0 ${primary ? "text-(--accent)" : "text-(--negative)"}`} />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <ChevronLink href="/register" className="text-[15px]">
                    {offer.cta.label}
                  </ChevronLink>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
      <div className="mx-auto mt-6 max-w-3xl">
        <PageNote>{OFFER_DISCLAIMER}</PageNote>
      </div>
    </section>
  );
}

function Faqs() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faqs" aria-labelledby="faqs-heading" className="scroll-mt-24 px-4 pt-28 sm:px-6">
      <SectionHeading id="faqs-heading" title="Offer & billing, answered." />
      <Reveal y={24} className="mx-auto mt-10 max-w-3xl">
        <div className="pf-group">
          {PRICING_FAQS.map((faq, index) => {
            const isOpen = open === index;
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex min-h-12 w-full items-center justify-between gap-4 px-5 py-3.5 text-left"
                >
                  <span className="text-[15px] font-medium text-(--text-primary)">{faq.q}</span>
                  <PIcon name="chevron" size={14} weight="bold" className={`shrink-0 text-(--text-muted) transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-90" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
                      exit={{ height: 0, opacity: 0, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-[14px] leading-relaxed text-(--text-secondary)">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        <div className="mt-5 text-center">
          <ChevronLink href="/resources/faqs">All FAQs</ChevronLink>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section dock                                                        */
/* ------------------------------------------------------------------ */

const DOCK_ITEMS: DockItem[] = [
  { href: "#plans", label: "Plans", icon: "grid", tone: "gold" },
  { href: "#included", label: "Included", icon: "layers", tone: "cyan" },
  { href: "#usage", label: "Usage & data", icon: "gauge", tone: "purple" },
  { href: "#offers", label: "Launch offers", icon: "star", tone: "red" },
  { href: "#faqs", label: "FAQs", icon: "info", tone: "slate" },
  { href: "#register", label: "Register", icon: "sparkle", tone: "green" },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function PricingContent() {
  const [review, setReview] = useState<ReviewState | null>(null);

  // The pf theme shell and the earth closing (with the footer) are composed by
  // PricingPage around this client body.
  return (
    <>
      <PricingHero />
      <PlansWindow onReview={setReview} />
      <Included />
      <UsageAndData />
      <Offers />
      <Faqs />
      <div className="pointer-events-none sticky bottom-5 z-40 hidden pb-2 lg:block">
        <div className="pointer-events-auto">
          <Dock items={DOCK_ITEMS} label="Pricing sections" size={46} />
        </div>
      </div>
      <AnimatePresence>{review && <ReviewDialog review={review} onClose={() => setReview(null)} />}</AnimatePresence>
    </>
  );
}
