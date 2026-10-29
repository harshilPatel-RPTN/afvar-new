"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useT, type MessageKey } from "@/platform/i18n";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const MARKETS: MessageKey[] = ["lane.gold", "lane.silver", "lane.oil", "lane.eurusd", "lane.usdjpy", "lane.gbpusd", "lane.nzdusd", "lane.crypto"];

const PROMISES = [
  { label: "launch.promise.sourced" as MessageKey, icon: "M4 10.5l3.5 3.5L16 5.5" },
  { label: "launch.promise.graded" as MessageKey, icon: "M4 15V9M10 15V5M16 15v-4" },
  { label: "launch.promise.neverTrades" as MessageKey, icon: "M10 2.5l6 2.5v4.5c0 3.8-2.6 6.6-6 8-3.4-1.4-6-4.2-6-8V5z" },
];

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="mx-1 inline-grid h-5 min-w-5 place-items-center rounded-md border border-white/15 bg-white/[.07] px-1.5 font-sans text-[10px] font-medium text-white/80 shadow-[inset_0_-1px_0_rgba(255,255,255,.08)]">
      {children}
    </kbd>
  );
}

/** Drifts toward the cursor while hovered, then springs back. */
function MagneticButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  const reduceMotion = useReducedMotion();
  const x = useSpring(0, { stiffness: 220, damping: 18 });
  const y = useSpring(0, { stiffness: 220, damping: 18 });

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - bounds.left - bounds.width / 2) * 0.12);
    y.set((event.clientY - bounds.top - bounds.height / 2) * 0.25);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      style={{ x, y }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex h-[52px] w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#9BC0FF,#7FA9F5)] text-[14px] font-semibold text-[#0B1220] shadow-[0_12px_32px_-12px_rgba(138,180,248,.8),inset_0_1px_0_rgba(255,255,255,.5)] transition-shadow duration-300 hover:shadow-[0_18px_40px_-12px_rgba(138,180,248,.9),inset_0_1px_0_rgba(255,255,255,.5)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#8AB4F8]"
    >
      {children}
    </motion.button>
  );
}

interface LaunchCardProps {
  isSupported: boolean;
  requestFailed: boolean;
  onOpen: () => void;
}

export function LaunchCard({ isSupported, requestFailed, onOpen }: LaunchCardProps) {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateY = useSpring(useTransform(pointerX, [-1, 1], [-4, 4]), { stiffness: 60, damping: 18 });
  const rotateX = useSpring(useTransform(pointerY, [-1, 1], [3.5, -3.5]), { stiffness: 60, damping: 18 });

  // Cursor position inside the card, in px, for the spotlight and border glow.
  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);
  const spotOpacity = useSpring(0, { stiffness: 120, damping: 20 });
  const spotlight = useMotionTemplate`radial-gradient(320px circle at ${spotX}px ${spotY}px, rgba(138,180,248,.2), transparent 70%)`;
  const borderGlow = useMotionTemplate`radial-gradient(220px circle at ${spotX}px ${spotY}px, rgba(169,200,255,.9), transparent 70%)`;
  const hoveringCard = useRef(false);

  // Away from the card the tilt follows the whole window, gently.
  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (event: PointerEvent) => {
      if (hoveringCard.current) return;
      pointerX.set(((event.clientX / window.innerWidth) * 2 - 1) * 0.35);
      pointerY.set(((event.clientY / window.innerHeight) * 2 - 1) * 0.35);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduceMotion, pointerX, pointerY]);

  const onCardMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - bounds.left;
    const localY = event.clientY - bounds.top;
    spotX.set(localX);
    spotY.set(localY);
    spotOpacity.set(1);
    hoveringCard.current = true;
    if (reduceMotion) return;
    pointerX.set((localX / bounds.width) * 2 - 1);
    pointerY.set((localY / bounds.height) * 2 - 1);
  };
  const onCardLeave = () => {
    hoveringCard.current = false;
    spotOpacity.set(0);
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <motion.div
      className="w-full max-w-[460px] [perspective:1200px]"
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        onPointerMove={onCardMove}
        onPointerLeave={onCardLeave}
        className="relative rounded-[30px] p-px"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[30px]">
          <div className="absolute inset-[-60%] animate-[spin_9s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(138,180,248,.75)_40deg,transparent_95deg,transparent_180deg,rgba(255,170,130,.55)_220deg,transparent_275deg)] motion-reduce:animate-none" />
          <motion.div className="absolute inset-0" style={{ background: borderGlow, opacity: spotOpacity }} />
        </div>

        <section
          aria-labelledby="gate-title"
          className="relative overflow-hidden rounded-[29px] bg-[rgba(10,14,22,.58)] px-7 pb-6 pt-6 text-center text-[#E6EDF3] shadow-[0_40px_100px_-30px_rgba(0,0,0,.85),inset_0_1px_0_rgba(255,255,255,.12)] backdrop-blur-2xl backdrop-saturate-150 sm:px-10"
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: spotlight, opacity: spotOpacity }}
          />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[120%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(138,180,248,.18),transparent)]" />

          <div className="relative mb-7 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-[10px] border border-white/15 bg-[linear-gradient(137deg,rgba(255,255,255,.2),rgba(138,180,248,.08)_55%,rgba(255,170,130,.1))] shadow-[0_8px_20px_-10px_rgba(138,180,248,.8),inset_0_1px_0_rgba(255,255,255,.25)]">
                <svg viewBox="0 0 40 40" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M10 29 20 10l10 19M14.5 22h11"
                    fill="none"
                    stroke="#A9C8FF"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-[11px] font-semibold tracking-[.22em] text-white/80">{t("brand.name")}</span>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.05] px-2.5 py-1 text-[10px] tracking-[.12em] text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8AB4F8] shadow-[0_0_8px_#8AB4F8]" aria-hidden="true" />
              {t("launch.preview")}
            </span>
          </div>

          <h1
            id="gate-title"
            className="relative mb-3 bg-[linear-gradient(180deg,#fff,rgba(214,226,245,.78))] bg-clip-text text-[34px] font-semibold leading-[1.08] tracking-[-.035em] text-transparent"
          >
            {t("launch.titleLine1")}
            <br />
            {t("launch.titleLine2")}
          </h1>
          <p className="relative mx-auto mb-6 max-w-[320px] text-[13.5px] leading-relaxed text-[#B8C2CF]">
            {t("launch.subtitle")}
          </p>

          <div className="relative mb-6 rounded-2xl border border-white/[.08] bg-black/20 p-3.5">
            <p className="mb-2.5 text-[10px] font-medium tracking-[.24em] text-[#8AB4F8]">{t("launch.markets")}</p>
            <ul className="flex flex-wrap justify-center gap-1.5">
              {MARKETS.map((market) => (
                <li
                  key={market}
                  className="cursor-default rounded-md border border-white/[.08] bg-white/[.04] px-2 py-1 font-mono text-[10.5px] text-white/75 transition duration-200 hover:-translate-y-0.5 hover:border-[#8AB4F8]/50 hover:bg-[#8AB4F8]/10 hover:text-white hover:shadow-[0_6px_16px_-8px_rgba(138,180,248,.8)] motion-reduce:hover:translate-y-0"
                >
                  {t(market)}
                </li>
              ))}
            </ul>
          </div>

          <ul className="relative mb-7 grid grid-cols-3 gap-2">
            {PROMISES.map(({ label, icon }) => (
              <li key={label} className="group/promise flex cursor-default flex-col items-center gap-1.5 text-[11px] leading-tight text-white/70 transition-colors duration-200 hover:text-white">
                <span className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[.05] transition duration-300 group-hover/promise:scale-110 group-hover/promise:border-[#8AB4F8]/50 group-hover/promise:bg-[#8AB4F8]/15 group-hover/promise:shadow-[0_0_18px_-4px_rgba(138,180,248,.9)] motion-reduce:group-hover/promise:scale-100">
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-[#8AB4F8]" aria-hidden="true">
                    <path d={icon} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {t(label)}
              </li>
            ))}
          </ul>

          <MagneticButton onClick={onOpen}>
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)]"
              animate={{ x: ["0%", "450%"] }}
              transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
            />
            <svg viewBox="0 0 20 20" className="relative h-4 w-4" aria-hidden="true">
              <path
                d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="relative">{isSupported ? t("launch.enterFullscreen") : t("launch.open")}</span>
            <svg viewBox="0 0 20 20" className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
              <path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </MagneticButton>

          <p role="status" className="relative mt-5 min-h-5 text-[11px] text-[#A7B3C5]">
            {requestFailed ? (
              t("launch.blocked")
            ) : isSupported ? (
              <>
                {/* One translatable sentence; the key badges drop into its {enter} and {esc} slots. */}
                {t("launch.keysHint")
                  .split(/(\{enter\}|\{esc\})/)
                  .map((part, index) =>
                    part === "{enter}" ? <Key key={index}>Enter ↵</Key> : part === "{esc}" ? <Key key={index}>Esc</Key> : part,
                  )}
              </>
            ) : null}
          </p>
        </section>
      </motion.div>
    </motion.div>
  );
}
