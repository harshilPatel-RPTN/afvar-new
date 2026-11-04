"use client";

// Phones (< 640 px) on the root homepage: "a live trading terminal in your
// pocket". No canvas, no poster, no avatar — the same copy and cards as the
// film, laid out as stacking chapter cards that animate as they scroll in.
// Animations are transform/opacity/clip only; reduced motion shows the final state.
import {
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { MONO, useAfvarReducedMotion } from "@/modules/afvarOs";
import {
  AlwaysCopy,
  AvatarCopy,
  CoresCopy,
  Dialogue,
  FinaleCopy,
  LANE_KEYS,
  PermissionsCard,
  ReadingLog,
  SessionCard,
  StreamCopy,
  ThinkCard,
  ThinkCopy,
  TrustCopy,
  type Quotes,
} from "./cards";
import { OS_BEATS } from "./OsFilm";
import type { ActId, Film } from "./aiConfig";
import { MobileHero } from "./MobileHero";
import "./mobile-story.css";

const EASE = [0.2, 0.8, 0.2, 1] as const;
/** Where pinned chapter cards stick: just under the 72 px navbar. */
const STICK = 80;

export function useCalm(): boolean {
  return useAfvarReducedMotion();
}

/* ------------------------------------------------------- heading mask reveal */

/**
 * Splits the headings inside `root` into masked words, keeping the exact text:
 * the heading gets aria-label = its full text, the word spans are aria-hidden.
 * Each word rises from its own overflow-hidden mask when an ancestor has
 * [data-on="true"] (CSS: .ms-w / .ms-wi). Text nodes are split in place so the
 * colour spans of the original markup are kept.
 */
export function useMaskedHeadings(root: RefObject<HTMLElement | null>, selector = "h1, h2, h3, [role=heading]") {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>(selector).forEach((h) => {
      if (h.dataset.msSplit) return;
      h.dataset.msSplit = "1";
      h.setAttribute("aria-label", (h.textContent ?? "").replace(/\s+/g, " ").trim());
      const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      let i = 0;
      for (const t of nodes) {
        const frag = document.createDocumentFragment();
        for (const part of (t.nodeValue ?? "").split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.append(part);
            continue;
          }
          const mask = document.createElement("span");
          mask.className = "ms-w";
          mask.setAttribute("aria-hidden", "true");
          const word = document.createElement("span");
          word.className = "ms-wi";
          word.style.setProperty("--w", String(i++));
          word.textContent = part;
          mask.append(word);
          frag.append(mask);
        }
        t.replaceWith(frag);
      }
    });
  }, [root, selector]);
}

/* ----------------------------------------------------- velocity marquee band */

/** Big outlined words that drift sideways; speed, direction and skew follow scroll velocity. */
function Marquee({ words, dir = 1 }: { words: readonly string[]; dir?: 1 | -1 }) {
  const ref = useRef<HTMLDivElement>(null);
  const live = useInView(ref);
  const calm = useCalm();
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const skewX = useTransform(velocity, [-2500, 0, 2500], calm ? [0, 0, 0] : [8, 0, -8]);
  const base = useMotionValue(0);
  const x = useTransform(base, (v) => `${v}%`);
  const sign = useRef(1);
  useAnimationFrame((_, dt) => {
    if (calm || !live) return;
    const v = velocity.get();
    if (v < -40) sign.current = -1;
    else if (v > 40) sign.current = 1;
    const boost = 1 + Math.min(5, Math.abs(v) / 500);
    let n = base.get() + dir * sign.current * boost * Math.min(dt, 64) * -0.0035;
    n = (((n % 50) + 50) % 50) - 50;
    base.set(n);
  });
  return (
    <div ref={ref} className="ms-marquee" data-stack aria-hidden="true">
      <motion.div className="ms-mq-move" style={{ x, skewX }}>
        {[0, 1].map((k) => (
          <span key={k} className="ms-mq-row">
            {words.map((w, i) => (
              <span key={w + i} className={i % 2 ? "ms-mq-fill" : undefined}>
                {w}
              </span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

const MARKETS = LANE_KEYS.map(([, sym]) => sym);

/* --------------------------------------------------------------- chapters */

/** Counts 00 → n once the chapter enters. */
function CountUp({ to, run }: { to: number; run: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const calm = useCalm();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pad = (n: number) => String(Math.round(n)).padStart(2, "0");
    if (calm || !run) {
      el.textContent = pad(calm ? to : 0);
      return;
    }
    const c = animate(0, to, { duration: 0.8, ease: EASE, onUpdate: (v) => (el.textContent = pad(v)) });
    return () => c.stop();
  }, [to, run, calm]);
  return <span ref={ref}>{String(to).padStart(2, "0")}</span>;
}

type Tone = "green" | "gold";

function Chapter({ film, id, children, ai = false, live = false, onTone }: { film: Film; id: ActId; children: ReactNode; ai?: boolean; live?: boolean; onTone: (t: Tone) => void }) {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.12 });
  const centre = useInView(ref, { margin: "-45% 0px -45% 0px" });
  const calm = useCalm();
  const n = film.story.order.indexOf(id);
  const total = film.story.order.length - 1;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], calm ? [0, 0] : [26, -26]);
  const on = seen || calm;
  useMaskedHeadings(ref);
  useEffect(() => {
    if (centre) onTone(ai ? "gold" : "green");
  }, [centre, ai, onTone]);
  return (
    <section ref={ref} data-chapter={id} data-stack data-ai={ai || undefined} data-live={live || undefined} className="ms-chapter">
      <motion.div
        className="ms-lift"
        initial={false}
        animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <div className="ms-scale">
          <span className="ms-edge" data-on={on} aria-hidden="true" />
          <motion.div className={`ms-num ${MONO}`} style={{ y: drift }} aria-hidden="true">
            {ai ? <span className="ms-ai-dot" /> : null}
            <CountUp to={n} run={on} /> <span className="ms-num-total">/ {String(total).padStart(2, "0")}</span>
          </motion.div>
          <div className="ms-stagger" data-on={on}>
            {children}
          </div>
          <span className="ms-dim" aria-hidden="true" />
        </div>
      </motion.div>
    </section>
  );
}

/**
 * Stacking chapter cards. A chapter that fits the screen pins under the navbar
 * and the next card slides over it; the covered card shrinks to 0.93 and dims.
 * Cards taller than the screen stay in normal flow. Written straight to the DOM
 * on scroll (transform/opacity only), no React renders.
 */
function useStackedCards(root: RefObject<HTMLElement | null>, calm: boolean) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(":scope > [data-stack]"));
    const chapters = items.filter((c) => c.dataset.chapter);
    let raf = 0;
    const measure = () => {
      const vh = window.innerHeight;
      let k = 0;
      for (const c of chapters) {
        const top = STICK + (k % 3) * 9;
        // Chapters with live cards (log, dialogue) never pin: nothing may slide over them while they play.
        const pin = !calm && !c.dataset.live && c.offsetHeight <= vh - top - 16;
        c.dataset.pin = String(pin);
        c.style.top = pin ? `${top}px` : "";
        // Hold: the pinned card stays whole on screen for this much scroll
        // before the next card starts to slide over it. The last chapter has no
        // next card, so a hold there would only leave an empty black gap
        // before the next section: it releases straight away.
        const last = c === chapters[chapters.length - 1];
        c.style.marginBottom = pin && !last ? `${20 + Math.round(Math.min(vh * 0.6, 480))}px` : "";
        if (pin) k++;
      }
      frame();
    };
    const frame = () => {
      raf = 0;
      const vh = window.innerHeight;
      const rects = items.map((c) => c.getBoundingClientRect());
      const tops = rects.map((r) => r.top);
      items.forEach((c, i) => {
        const scaler = c.querySelector<HTMLElement>(":scope > .ms-lift > .ms-scale");
        const dim = scaler?.querySelector<HTMLElement>(":scope > .ms-dim");
        if (!scaler || !dim) return;
        if (c.dataset.pin !== "true") {
          scaler.style.transform = "";
          scaler.style.opacity = "";
          dim.style.opacity = "0";
          return;
        }
        const st = parseFloat(c.style.top) || STICK;
        const next = tops[i + 1] ?? vh;
        // Shrink/dim only once the next card actually overlaps this one.
        const bottom = st + rects[i].height;
        const cover = Math.min(1, Math.max(0, (bottom - next) / Math.max(1, bottom - st)));
        // A taller (unpinned) chapter that has passed the sticky line has fully
        // covered this card: hide it so it never peeks out again below that card.
        let gone = false;
        for (let j = i + 1; j < items.length; j++) {
          if (items[j].dataset.chapter && items[j].dataset.pin !== "true" && tops[j] < st) gone = true;
        }
        scaler.style.transform = `scale(${1 - 0.07 * cover})`;
        scaler.style.opacity = gone ? "0" : "";
        dim.style.opacity = String(0.6 * cover);
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const ro = new ResizeObserver(measure);
    for (const c of chapters) ro.observe(c);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
      for (const c of chapters) {
        c.style.top = "";
        c.style.marginBottom = "";
        delete c.dataset.pin;
      }
    };
  }, [root, calm]);
}

/** Plays a card's scene (reasoning, dialogue) once it scrolls into view. */
function useActPlay(film: Film, id: ActId, target: RefObject<HTMLElement | null>, from: number, done: number, seconds: number): MotionValue<number> {
  const calm = useCalm();
  const seen = useInView(target, { once: true, amount: 0.35 });
  const mv = useMotionValue(film.at(id, calm ? done : from));
  useEffect(() => {
    if (calm) {
      mv.set(film.at(id, done));
      return;
    }
    if (!seen) return;
    const c = animate(from, done, { duration: seconds, ease: "linear", onUpdate: (u) => mv.set(film.at(id, u)) });
    return () => c.stop();
  }, [calm, seen, film, id, from, done, seconds, mv]);
  return mv;
}

/** Border beam: a light that travels around the card's edge (gold for the AI). */
function Beam({ children, innerRef }: { children: ReactNode; innerRef?: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={innerRef} className="ms-beam">
      <span className="ms-beam-light" aria-hidden="true" />
      <div className="ms-beam-body">{children}</div>
    </div>
  );
}

function ThinkScene({ film }: { film: Film }) {
  const ref = useRef<HTMLDivElement>(null);
  const mv = useActPlay(film, "think", ref, 0.05, 0.95, 5.5);
  return (
    <Beam innerRef={ref}>
      <ThinkCard mv={mv} compact />
      {/* The compact card drops this line; the phone keeps the desktop copy. */}
      <p className="ms-think-note">Graded in public after 4 hours · not investment advice</p>
    </Beam>
  );
}

function TalkScene({ film }: { film: Film }) {
  const ref = useRef<HTMLDivElement>(null);
  const mv = useActPlay(film, "avatar", ref, 0.44, 0.99, 9);
  return (
    <Beam innerRef={ref}>
      <Dialogue mv={mv} compact />
    </Beam>
  );
}

function OsTimeline() {
  return (
    <ol className="ms-os">
      {OS_BEATS.map((beat, i) => (
        <li key={beat.id} className="ms-os-item" style={{ ["--i" as string]: i }}>
          <span className={`ms-os-step ${MONO}`}>
            {String(i + 1).padStart(2, "0")} · {beat.id}
          </span>
          <h3>{beat.title}</h3>
          <p>{beat.body}</p>
        </li>
      ))}
    </ol>
  );
}

/* ----------------------------------------------------------- rail + tint */

function RailAndTint({ target, tone }: { target: RefObject<HTMLElement | null>; tone: Tone }) {
  const { scrollYProgress } = useScroll({ target, offset: ["start start", "end end"] });
  const scale = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  const opacity = useTransform(scrollYProgress, [0, 0.01, 0.985, 1], [0, 1, 1, 0]);
  return (
    <>
      <motion.div className="ms-tint" style={{ opacity }} aria-hidden="true">
        <span className="ms-tint-green" data-on={tone === "green"} />
        <span className="ms-tint-gold" data-on={tone === "gold"} />
      </motion.div>
      <motion.div className="ms-rail" style={{ opacity }} aria-hidden="true">
        <motion.span className="ms-rail-fill" style={{ scaleY: scale }} />
      </motion.div>
    </>
  );
}

/* ================================================================= story */

export function MobileStory({ film, quotes, revealRef }: { film: Film; quotes: Quotes; revealRef: RefObject<HTMLDivElement | null> }) {
  const root = useRef<HTMLDivElement>(null);
  const calm = useCalm();
  const [hydrated, setHydrated] = useState(false);
  const [tone, setTone] = useState<Tone>("green");
  useEffect(() => {
    const id = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(id);
  }, []);
  useStackedCards(root, calm);
  return (
    <div ref={root} className="ms-root" data-ready={hydrated}>
      <RailAndTint target={root} tone={tone} />
      <MobileHero quotes={quotes} revealRef={revealRef} />

      <Chapter film={film} id="cores" ai onTone={setTone}>
        <CoresCopy compact />
      </Chapter>
      <Chapter film={film} id="stream" live onTone={setTone}>
        <StreamCopy compact />
        <div className="ms-card mt-5">
          <ReadingLog quotes={quotes} rows={6} />
        </div>
      </Chapter>
      <Marquee words={MARKETS} />
      <Chapter film={film} id="think" ai live onTone={setTone}>
        <ThinkCopy />
        <div className="mt-5">
          <ThinkScene film={film} />
        </div>
      </Chapter>
      <Chapter film={film} id="always" onTone={setTone}>
        <AlwaysCopy compact />
        <div className="mt-5">
          <SessionCard compact />
        </div>
      </Chapter>
      <Chapter film={film} id="avatar" ai live onTone={setTone}>
        <AvatarCopy compact />
        <div className="mt-5">
          <TalkScene film={film} />
        </div>
      </Chapter>
      {film.has("os") ? (
        <Chapter film={film} id="os" onTone={setTone}>
          <p className={`${MONO} text-[#A8DEC2]`}>The OS</p>
          <OsTimeline />
        </Chapter>
      ) : null}
      <Marquee words={[...MARKETS].reverse()} dir={-1} />
      <Chapter film={film} id="trust" onTone={setTone}>
        <TrustCopy compact />
        <div className="mt-5">
          <PermissionsCard compact />
        </div>
      </Chapter>
      <Chapter film={film} id="finale" onTone={setTone}>
        <FinaleCopy compact />
      </Chapter>
    </div>
  );
}
