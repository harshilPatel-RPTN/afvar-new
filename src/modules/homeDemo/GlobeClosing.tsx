"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useAfvarReducedMotion } from "@/modules/afvarOs";
import { CURRENCY_ROUTES } from "./currencyRoutes";
import type { mountGlobe } from "./pointGlobe";
import "./globe-closing.css";

type Globe = Awaited<ReturnType<typeof mountGlobe>>;

export function GlobeClosing({ children }: { children: ReactNode }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{id: number; x: number} | null>(null);
  const [globe, setGlobe] = useState<Globe | null>(null);
  const [manualPlayback, setManualPlayback] = useState<boolean | null>(null);
  const [activeLeg, setActiveLeg] = useState(0);
  const requestedLeg = useRef(0);
  const route = CURRENCY_ROUTES[activeLeg];
  const reduced = useAfvarReducedMotion();
  const playing = manualPlayback ?? !reduced;
  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
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
    return () => { disposed = true; nearby.disconnect(); surface?.dispose(); };
  }, []);
  useEffect(() => { globe?.setPlaying(playing); }, [globe, playing]);
  function selectLeg(index: number) {
    requestedLeg.current = index;
    setActiveLeg(index);
    globe?.selectLeg(index);
  }
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
  return (
    <section id="afvar-globe" data-home-globe="" className="home-globe-closing" aria-labelledby="demo-closing-title">
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
          <div role="group" aria-label="Choose outgoing currency route" className="home-fx-picker afvar-glass-track">
            {CURRENCY_ROUTES.map((leg, i) => (
              <button key={leg.id} type="button" className="afvar-glass-tab" aria-pressed={i === activeLeg}
                aria-label={`Show ${leg.from.code} route from ${leg.from.city} to ${leg.to.city}`} onClick={() => selectLeg(i)}>
                {leg.from.code}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="home-globe-figure">
        <div className="home-globe-disc" role="img" aria-label={`Globe showing the ${route.from.code} route from ${route.from.city} to ${route.to.city}. The next leg carries ${route.to.code}.`}>
          <Image className="home-globe-still" src={`/home-globe/routes/${CURRENCY_ROUTES[globe ? 0 : activeLeg].from.code.toLowerCase()}.webp`}
            fill sizes="(max-width: 700px) 94vw, 58vw" unoptimized alt="" />
          <canvas ref={canvas} data-globe-canvas="" aria-hidden="true"
            onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} />
        </div>
        {globe && (
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
