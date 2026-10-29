"use client";

// W1.1.3 — five capabilities (README §9.4, §8.3). A balanced 3 + 2 grid on
// desktop (second row centred), two columns on tablet, a swipe carousel on mobile. Solid
// #111416 cards with hairline borders. Each card prints like a candle when it
// enters view, then plays its own once-only micro-story (CapabilityStories.tsx)
// with pointer interaction; hover adds a ≤4° 3D lift and redraws the icon glyph.
// Data honesty (README §10): card 01 uses only REAL quotes from useLiveMarket();
// every other visual is an illustration and says "Sample" on its face.
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { CAPABILITIES, CAPABILITIES_SUB } from "../content";
import { DUR, EASE, EngineTile, GUTTER, Icon, PANEL, SectionHead, TerrainRidge } from "./bits";
import { ContextStory, FollowStory, RiskStory, RoomStory, RuleStory } from "./CapabilityStories";
import { CandleCard, RollNumber } from "./marketMotion";
import { CandleSnake } from "./CandleSnake";
import { PriceSeam } from "./Sections";
import { useLiveMarket } from "./useLiveMarket";

/** lg: 6-col track → cards span 2; the 4th starts at col 2 so the second row is centred. */
const PLACEMENT = ["lg:col-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-2 lg:col-start-2", "md:col-span-2 lg:col-span-2"];

/** Real instruments shown on the "Follow markets" card. */
const FOLLOW_SYMBOLS = ["XAUUSD", "EURUSD"] as const;

/** When a card's story starts — after its candle-body entrance has printed. */
const STORY_AT = 0.62;

export function Capabilities() {
  const { quotes, live } = useLiveMarket();
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  // Mobile carousel: which card is snapped (event handler only — no effect).
  const onListScroll = () => {
    const list = listRef.current;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    const cards = [...list.children] as HTMLElement[];
    const x = list.scrollLeft + list.clientWidth * 0.35;
    let i = 0;
    cards.forEach((card, k) => {
      if (card.offsetLeft <= x) i = k;
    });
    setActive(i);
  };
  const goTo = (i: number) => {
    const list = listRef.current;
    const card = list?.children[i] as HTMLElement | undefined;
    if (!list || !card) return;
    list.scrollTo({ left: card.offsetLeft - 20, behavior: "smooth" });
  };

  return (
    <section id="capabilities" className="relative overflow-hidden">
      <CandleSnake from="right" />
      <TerrainRidge seed={11} />
      <div className={`${GUTTER} relative py-20 md:py-24`}>
        {/* Transition B: the price-line leads into the five jobs. */}
        <PriceSeam />
        <SectionHead kicker="Capabilities" title="Five jobs. One connected desk." sub={CAPABILITIES_SUB} currency />

        {/* Each card triggers on its own view: it prints like a candle, then plays its story once.
            Below md the list is a snap carousel, so each story plays as its card is swiped in. */}
        <ul
          ref={listRef}
          onScroll={onListScroll}
          aria-label="Capabilities"
          className="relative -mx-5 -my-3 mt-7 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 py-3 [scrollbar-width:none] md:mx-0 md:mt-10 md:my-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:py-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden"
        >
          {CAPABILITIES.map((cap, index) => (
            <CandleCard as="li" key={cap.n} index={index} delay={(index % 3) * 0.07} className={`w-[90%] min-w-0 shrink-0 snap-start md:w-auto ${PLACEMENT[index]}`} standalone amount={0.35} snakeTarget={index === 0}>
              <TiltArticle>
                <div className="flex items-center justify-between">
                  <EngineTile glyph={cap.glyph} className="h-11 w-11" />
                  <RollNumber value={cap.n} className="font-mono text-[11px] tracking-wide text-(--mk-faint)" />
                </div>
                <h3 className="mt-5 text-[18px] font-semibold tracking-[-.01em] text-(--mk-text)">{cap.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-(--mk-dim)">{cap.body}</p>
                {index === 0 && <FollowStory quotes={quotes} live={live} symbols={FOLLOW_SYMBOLS} t={STORY_AT} />}
                {index === 1 && <ContextStory t={STORY_AT} />}
                {index === 2 && <RuleStory t={STORY_AT} />}
                {index === 3 && <RiskStory t={STORY_AT} />}
                {index === 4 && <RoomStory t={STORY_AT} />}
                <Link
                  href={cap.href}
                  className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[13.5px] font-medium text-(--mk-text) underline-offset-4 hover:text-white hover:underline"
                >
                  {cap.linkLabel}
                  <Icon name="arrow" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
                </Link>
              </TiltArticle>
            </CandleCard>
          ))}
        </ul>
        <div className="mt-5 flex justify-center gap-2 md:hidden">
          {CAPABILITIES.map((cap, i) => (
            <button
              key={cap.n}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show ${cap.title}`}
              aria-current={i === active}
              className="grid h-6 w-6 place-items-center"
            >
              <span className={`block w-1.5 rounded-[1px] transition-all duration-300 ${i === active ? "h-4 bg-[#00E676]" : "h-2 bg-white/25"}`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Card surface with a subtle pointer-following 3D lift (≤4°, transform only). Mouse/pen
 *  only — touch and reduced motion keep it flat. */
function TiltArticle({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const ease = { duration: DUR.panel, ease: EASE };
  const onMove = (event: PointerEvent<HTMLElement>) => {
    if (reduce || event.pointerType === "touch") return;
    const box = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    animate(rotateY, px * 7, ease);
    animate(rotateX, -py * 7, ease);
  };
  const onLeave = () => {
    animate(rotateX, 0, ease);
    animate(rotateY, 0, ease);
  };
  return (
    <motion.article
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 1100 }}
      className={`group flex h-full flex-col p-6 transition-[translate,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-white/[.2] hover:bg-[#13171A] ${PANEL}`}
    >
      {children}
    </motion.article>
  );
}
