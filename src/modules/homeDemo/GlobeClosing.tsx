"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { useAfvarReducedMotion, useMedia } from "@/modules/afvarOs";
import { useLiveMarket } from "@/modules/home/kit";
import { CURRENCY_ROUTES, routePairLabel, routeRate, type RouteRate } from "./currencyRoutes";
import type { mountGlobe } from "./pointGlobe";
import "./globe-closing.css";

type Globe = Awaited<ReturnType<typeof mountGlobe>>;

// The live globe runs on every screen 640 px wide and up (touch and short
// landscape included; the canvas clamps its pixel ratio on tablets/touch), the
// same rule as the AI story's film. Below 640 px the per-currency stills
// crossfade under a CSS atmosphere instead and the globe code is never fetched.
const LITE_DEVICE = "(max-width:639px)";
const LEG_SECONDS = 5;
const legCount = CURRENCY_ROUTES.length;
// Equirectangular placement of each hub on the phone route map (viewBox 360×200).
const MAP_W = 360, MAP_H = 200;
const mapPoint = (lat: number, lon: number) => ({ x: 22 + (lon + 80) / 240 * (MAP_W - 44), y: 26 + (62 - lat) / 104 * (MAP_H - 52) });
const HUB_POINTS = CURRENCY_ROUTES.map(leg => mapPoint(leg.from.lat, leg.from.lon));
/** A gentle arc between two hubs, lifted in proportion to its span. */
const arcPath = (a: {x: number; y: number}, b: {x: number; y: number}) => {
  const span = Math.hypot(b.x - a.x, b.y - a.y);
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${((a.x + b.x) / 2).toFixed(1)} ${(Math.min(a.y, b.y) - span * .38).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
};
const ARCS = CURRENCY_ROUTES.map((_, i) => arcPath(HUB_POINTS[i], HUB_POINTS[(i + 1) % legCount]));
// [start lag s, radius, opacity] — the coin's fading trail of sparks.
const TRAIL = [[.06, 2.6, .45], [.12, 2, .26], [.18, 1.5, .13]] as const;
const COIN_R = 9;
/** The travelling coin face (sign text is drawn by the caller). */
function CoinFace() {
  return (
    <>
      <circle r={COIN_R} fill="url(#home-coin-face)" />
      <circle r={COIN_R - .65} fill="none" stroke="#8a6726" strokeWidth="1.3" />
      <circle r={COIN_R * .7} fill="none" stroke="rgb(255 240 196 / .7)" strokeWidth=".45" />
    </>
  );
}
const coinText = (sign: string) => ({ fontSize: sign.length > 1 ? 7 : 9.4 });
const STATUS_WORD: Record<RouteRate["status"], string> = { live: "Live", delayed: "Delayed", snapshot: "Stored" };
const two = (n: number) => String(n).padStart(2, "0");
/** "Delayed · Yahoo · 14:05 UTC" — the feed's own freshness, never a guess. */
const rateNote = (rate: RouteRate) => [STATUS_WORD[rate.status], rate.source?.replace(/\s*\((?:live|delayed)\)$/i, ""),
  rate.asOf === null ? null : `${two(new Date(rate.asOf).getUTCHours())}:${two(new Date(rate.asOf).getUTCMinutes())} UTC`].filter(Boolean).join(" · ");
const GRID_DOTS = Array.from({ length: 9 * 17 }, (_, i) => ({ x: 12 + (i % 17) * 21, y: 12 + Math.floor(i / 17) * 22 }));

/** Phones only (shown by CSS below 640 px): a flat FX route map — every hub a
 *  node on a dotted field, the active leg's arc drawing in with a dot riding it. */
function RouteMap({ active, lite, reduced }: { active: number; lite: boolean; reduced: boolean }) {
  const route = CURRENCY_ROUTES[active];
  const landing = HUB_POINTS[(active + 1) % legCount];
  return (
    <div className="home-route-map" role={lite ? "img" : undefined} aria-hidden={lite ? undefined : true}
      aria-label={lite ? `Route map showing ${route.from.code} to ${route.to.code}, from ${route.from.city} to ${route.to.city}.` : undefined}>
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} aria-hidden="true">
        <defs>
          <radialGradient id="home-coin-face" cx=".32" cy=".3" r=".8">
            <stop offset="0" stopColor="#fbecb8" /><stop offset=".55" stopColor="#dcb75e" /><stop offset="1" stopColor="#a07a2c" />
          </radialGradient>
        </defs>
        <g className="home-route-grid">
          {GRID_DOTS.map((dot, i) => <circle key={i} cx={dot.x} cy={dot.y} r=".9" />)}
        </g>
        <g className="home-route-faint">
          {ARCS.map((d, i) => <path key={i} d={d} pathLength={1} style={{ "--r": i } as CSSProperties} />)}
        </g>
        <g key={active} className="home-route-live">
          <path id={`home-route-arc-${active}`} d={ARCS[active]} pathLength={1} />
        </g>
        {HUB_POINTS.map((point, i) => {
          const state = i === active ? "from" : i === (active + 1) % legCount ? "to" : undefined;
          return (
            <g key={`${CURRENCY_ROUTES[i].id}-${state ?? ""}`} className="home-route-node" data-state={state} transform={`translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`}>
              {state === "from" && <circle className="home-route-pulse" r="5" />}
              <circle className="home-route-dot" r={state ? 3.4 : 2.4} />
              <text y={i % 2 ? 15 : -8} textAnchor="middle">{CURRENCY_ROUTES[i].from.code}</text>
            </g>
          );
        })}
        {/* The coin rides above the hub dots. */}
        <g key={`coin-${active}`}>
          {reduced ? (
            // Reduced motion: the coin rests at the destination, no spin.
            <g className="home-route-coin" transform={`translate(${landing.x.toFixed(1)} ${landing.y.toFixed(1)})`}>
              <CoinFace /><text style={coinText(route.to.symbol)}>{route.to.symbol}</text>
            </g>
          ) : (
            <>
              {TRAIL.map(([lag, r, opacity]) => (
                <circle key={lag} className="home-route-runner" r={r} opacity={opacity}>
                  <animateMotion dur="2.4s" begin={`${lag}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".45 0 .35 1">
                    <mpath href={`#home-route-arc-${active}`} />
                  </animateMotion>
                </circle>
              ))}
              {/* The coin: spins on its edge (scaleX), swaps FROM → TO sign edge-on at
                  the midpoint, then bumps as it lands. */}
              <g className="home-route-coin">
                <animateMotion dur="2.4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines=".45 0 .35 1">
                  <mpath href={`#home-route-arc-${active}`} />
                </animateMotion>
                <g>
                  <animateTransform attributeName="transform" type="scale" dur="2.4s" repeatCount="indefinite"
                    values="1 1;1 1;1.3 1.3;1 1" keyTimes="0;.86;.93;1" />
                  <g>
                    <animateTransform attributeName="transform" type="scale" dur="2.4s" repeatCount="indefinite"
                      values="1 1;.08 1;1 1;.08 1;1 1;.08 1;1 1;1 1" keyTimes="0;.1;.25;.5;.7;.8;.86;1" />
                    <CoinFace />
                    <text style={coinText(route.from.symbol)}>
                      {route.from.symbol}
                      <animate attributeName="opacity" dur="2.4s" repeatCount="indefinite" calcMode="discrete" values="1;0" keyTimes="0;.5" />
                    </text>
                    <text style={coinText(route.to.symbol)} opacity="0">
                      {route.to.symbol}
                      <animate attributeName="opacity" dur="2.4s" repeatCount="indefinite" calcMode="discrete" values="0;1" keyTimes="0;.5" />
                    </text>
                  </g>
                </g>
              </g>
            </>
          )}
        </g>
      </svg>
    </div>
  );
}

const stillSrc = (index: number) => `/home-globe/routes/${CURRENCY_ROUTES[index].from.code.toLowerCase()}.webp`;

export function GlobeClosing({ children }: { children: ReactNode }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{id: number; x: number} | null>(null);
  const [globe, setGlobe] = useState<Globe | null>(null);
  const [manualPlayback, setManualPlayback] = useState<boolean | null>(null);
  const [activeLeg, setActiveLeg] = useState(0);
  const requestedLeg = useRef(0);
  const route = CURRENCY_ROUTES[activeLeg];
  const { quotes } = useLiveMarket();
  const rates = CURRENCY_ROUTES.map(leg => routeRate(leg, quotes));
  const rate = rates[activeLeg];
  const pairs = CURRENCY_ROUTES.map((leg, i) => routePairLabel(leg, rates[i]));
  const pairsKey = pairs.join("|");
  const reduced = useAfvarReducedMotion();
  const playing = manualPlayback ?? !reduced;
  // null until the client answers; the SSR poster covers both outcomes.
  const lite = useMedia(LITE_DEVICE);
  const section = useRef<HTMLElement>(null);
  const [onscreen, setOnscreen] = useState(false);
  // Latches true the first time the lite section scrolls in (phone reveal).
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const node = canvas.current;
    if (!node || lite !== false || matchMedia(LITE_DEVICE).matches) return;
    let disposed = false, surface: Globe | undefined;
    const nearby = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      nearby.disconnect();
      if ((navigator as Navigator & { connection?: {saveData?: boolean} }).connection?.saveData) return;
      const initialLeg = requestedLeg.current;
      import("./pointGlobe").then(({ mountGlobe }) => mountGlobe(node, {
        initialLeg,
        onLegChange(index) {
          if (!disposed && surface) {
            requestedLeg.current = index;
            setActiveLeg(index);
          }
        },
      })).then(instance => {
        if (disposed) instance.dispose();
        else {
          surface = instance;
          if (initialLeg !== requestedLeg.current) instance.selectLeg(requestedLeg.current);
          setGlobe(instance);
        }
      }).catch(() => { /* The geographic poster is already visible. */ });
    }, { rootMargin: "250px" });
    nearby.observe(node);
    return () => { disposed = true; nearby.disconnect(); surface?.dispose(); setGlobe(null); };
  }, [lite]);
  useEffect(() => { globe?.setPlaying(playing); }, [globe, playing]);
  useEffect(() => { globe?.setPairs(pairsKey.split("|")); }, [globe, pairsKey]);
  useEffect(() => { globe?.setStill(reduced); }, [globe, reduced]);
  // Lite: CSS motion and the leg tour run only while the section is in view.
  useEffect(() => {
    const node = section.current;
    if (!lite || !node) return;
    const view = new IntersectionObserver(([entry]) => {
      setOnscreen(entry.isIntersecting);
      if (entry.isIntersecting) setEntered(true);
    }, { rootMargin: "0px 0px -12% 0px" });
    view.observe(node);
    return () => view.disconnect();
  }, [lite]);
  useEffect(() => {
    if (!lite || !playing || !onscreen) return;
    const tick = window.setTimeout(() => {
      if (document.hidden) return;
      const next = (requestedLeg.current + 1) % legCount;
      requestedLeg.current = next;
      setActiveLeg(next);
    }, LEG_SECONDS * 1000);
    return () => window.clearTimeout(tick);
  }, [lite, playing, onscreen, activeLeg]);
  function selectLeg(index: number) {
    requestedLeg.current = index;
    setActiveLeg(index);
    globe?.selectLeg(index);
  }
  // Phones (lite) draw the 2D route map instead, so no globe still is fetched;
  // the WebGL path keeps its single poster.
  const stills = lite ? [] : [globe ? 0 : activeLeg];
  function start(event: PointerEvent<HTMLCanvasElement>) {
    if (!globe || !event.isPrimary || event.button !== 0) return;
    drag.current = { id: event.pointerId, x: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
    globe.hold(true);
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    const previous = drag.current;
    if (!previous || previous.id !== event.pointerId) return;
    globe?.rotate((previous.x - event.clientX) * 3.4 / Math.max(1, event.currentTarget.clientWidth));
    previous.x = event.clientX;
  }
  function end(event: PointerEvent<HTMLCanvasElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    globe?.hold(false);
  }
  // Phones: a tap ripple on the closing CTA, started where the finger lands.
  function ripple(event: PointerEvent<HTMLElement>) {
    const cta = (event.target as Element).closest<HTMLElement>(".home-close-cta");
    if (!lite || !cta) return;
    const box = cta.getBoundingClientRect();
    cta.style.setProperty("--rx", `${event.clientX - box.left}px`);
    cta.style.setProperty("--ry", `${event.clientY - box.top}px`);
    cta.removeAttribute("data-ripple");
    void cta.offsetWidth;
    cta.setAttribute("data-ripple", "");
  }
  return (
    <section ref={section} onPointerDown={ripple} id="afvar-globe" data-home-globe="" data-globe-lite={lite || undefined}
      data-offscreen={(lite && !onscreen) || undefined} data-entered={(lite && entered) || undefined} className="home-globe-closing" aria-labelledby="demo-closing-title">
      <span className="home-route-chapter" aria-hidden="true">Close</span>
      <div className="home-globe-copy">
        {children}
        <div className="home-fx-route" data-fx-route={activeLeg}>
          <div className="home-fx-kicker"><span>Illustrative FX route</span><span>{String(activeLeg+1).padStart(2,"0")} / {String(CURRENCY_ROUTES.length).padStart(2,"0")}</span></div>
          <div className="home-fx-handoff">
            <div>
              <small>Departs in</small>
              <strong data-fx-source="">{route.from.code}</strong>
              <span>{route.from.city}{route.from.city !== route.from.country && <> · {route.from.country}</>}</span>
            </div>
            <span className="home-fx-arrow" aria-hidden="true">→</span>
            <div>
              <small>Next departure</small>
              <strong data-fx-destination="">{route.to.code}</strong>
              <span>{route.to.city}{route.to.city !== route.to.country && <> · {route.to.country}</>}</span>
            </div>
          </div>
          <p className="home-fx-rate" data-fx-pair="">
            <span>{route.from.code} → {route.to.code}</span>
            {rate && <><b>{rate.value.toFixed(rate.decimals)}</b><small>{rateNote(rate)}</small></>}
          </p>
          <div role="group" aria-label="Choose outgoing currency route" className="home-fx-picker afvar-glass-track">
            {CURRENCY_ROUTES.map((leg, i) => (
              <button key={leg.id} type="button" className="afvar-glass-tab" aria-pressed={i === activeLeg}
                aria-label={`Show ${leg.from.code} to ${leg.to.code} route from ${leg.from.city} to ${leg.to.city}`} onClick={() => selectLeg(i)}>
                {leg.from.code}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="home-globe-figure">
        <RouteMap active={activeLeg} lite={!!lite} reduced={reduced} />
        <div className="home-globe-disc" role="img" aria-label={`Globe showing ${route.from.code} to ${route.to.code}, from ${route.from.city} to ${route.to.city}.`}>
          {stills.map(i => (
            <Image key={i} className="home-globe-still" src={stillSrc(i)} data-active={!lite || i === activeLeg || undefined}
              fill sizes="(max-width: 700px) 94vw, 58vw" unoptimized alt="" />
          ))}
          <canvas ref={canvas} data-globe-canvas="" aria-hidden="true"
            onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} />
        </div>
        {lite && (
          <div className="home-globe-controls" role="group" aria-label="Route tour controls">
            <button type="button" aria-label="Previous currency route" onClick={() => selectLeg((activeLeg + legCount - 1) % legCount)}>←</button>
            <button type="button" aria-label={playing ? "Pause route tour" : "Resume route tour"} onClick={() => setManualPlayback(!playing)}>
              <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
                {playing ? <path d="M4 3h2.5v10H4zM9.5 3H12v10H9.5z" /> : <path d="M4 2.5 13 8l-9 5.5z" />}
              </svg>
            </button>
            <button type="button" aria-label="Next currency route" onClick={() => selectLeg((activeLeg + 1) % legCount)}>→</button>
          </div>
        )}
        {globe && !lite && (
          <div className="home-globe-controls" role="group" aria-label="Globe controls">
            <button type="button" aria-label="Rotate globe left" onClick={() => globe.rotate(-Math.PI / 8)}>←</button>
            <button type="button" aria-label={playing ? "Pause globe rotation" : "Resume globe rotation"} onClick={() => setManualPlayback(!playing)}>
              <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
                {playing ? <path d="M4 3h2.5v10H4zM9.5 3H12v10H9.5z" /> : <path d="M4 2.5 13 8l-9 5.5z" />}
              </svg>
            </button>
            <button type="button" aria-label="Rotate globe right" onClick={() => globe.rotate(Math.PI / 8)}>→</button>
            <button type="button" aria-label="Center active currency route" onClick={() => globe.focusLeg()}>
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <circle cx="10" cy="10" r="6"/><circle cx="10" cy="10" r="2"/><path d="M10 1v4m0 10v4M1 10h4m10 0h4"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
