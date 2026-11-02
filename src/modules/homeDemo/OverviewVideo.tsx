"use client";

// Overview video section, right after Chapter 10 (The Desk). The video is an
// 80 s reel recorded from this page's own 3D chapters, captured with the
// market feed blocked so it shows SNAPSHOT — a recording must never carry a
// frozen "LIVE" badge. Narration exists in English and Hindi (one MP4
// per language, each with matching WebVTT subtitles); switching language keeps
// the playhead. The current narration is a temporary synthetic voice until the
// recorded voice-over is delivered — the caption says so. Nothing downloads
// until the visitor presses play.
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatedHeading, OVERVIEW, VIEW_ONCE, VideoSpotlight, useOnce } from "@/modules/home/kit";
import { setDucked } from "./audio";
import "./mobile-mid.css";

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
] as const;

type Lang = (typeof LANGS)[number]["code"];

export function OverviewVideo() {
  const [lang, setLang] = useState<Lang>("en");
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mmRef, mmIn] = useOnce<HTMLElement>();
  /** Where to resume after a language swap (applied once the new file's metadata loads). */
  const pending = useRef<{ at: number; play: boolean } | null>(null);

  const choose = (next: Lang) => {
    const v = videoRef.current;
    if (!v || next === lang) return;
    pending.current = { at: v.currentTime, play: !v.paused };
    setLang(next);
  };

  // Same element, new source: reload, keep playing if it was, and show the
  // subtitles for the chosen language.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    for (const track of Array.from(v.textTracks)) track.mode = track.language === lang ? "showing" : "disabled";
    const p = pending.current;
    if (!p) return;
    v.load();
    if (p.play) void v.play();
  }, [lang]);

  const resume = () => {
    const v = videoRef.current;
    const p = pending.current;
    if (!v || !p) return;
    if (p.at > 0) v.currentTime = p.at;
    pending.current = null;
  };

  return (
    <section
      ref={mmRef}
      data-mm-in={mmIn ? "" : undefined}
      className="demo-home-overview mm-sec mm-ov border-t border-white/[.08] text-(--mk-text)" aria-label={OVERVIEW.title}
    >
      <span aria-hidden="true" className="mm-edge mm-only" />
      <div className="demo-overview-body mx-auto max-w-[1100px] px-5 py-24 sm:px-10">
        <motion.div className="demo-overview-heading" initial="hidden" whileInView="visible" viewport={VIEW_ONCE}>
          <AnimatedHeading
            kicker={OVERVIEW.kicker}
            title={OVERVIEW.title}
            currency
            sub={OVERVIEW.body}
            titleClassName="mt-3 max-w-[640px] max-sm:mt-4 text-[30px] font-semibold leading-[1.1] tracking-[-.02em] text-(--mk-text) sm:text-[40px]"
            subClassName="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-(--mk-dim)"
          />
        </motion.div>

        {/* narration language */}
        <div style={{ "--i": 1 } as CSSProperties} className="demo-overview-languages mm-up mt-10 flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[.16em] text-(--mk-faint)">Narration</span>
          <div role="radiogroup" aria-label="Narration language" className="afvar-glass-track inline-flex rounded-full p-0.5">
            {LANGS.map((l) => {
              const on = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  lang={l.code}
                  onClick={() => choose(l.code)}
                  className={`afvar-glass-tab rounded-full px-4 py-1.5 text-[13px] ${on ? "font-semibold" : ""}`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* "/"'s spotlight stage around the narrated reel. */}
        <figure className="mm-term mt-8">
          <div aria-hidden="true" data-playing={playing ? "" : undefined} className="mm-term-bar mm-only hidden max-sm:flex">
            <i />
            <i />
            <i />
            <b />
          </div>
          <VideoSpotlight playing={playing} badge="PLAYING">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              src={`/home-demo/overview.${lang}.mp4`}
              onLoadedMetadata={resume}
              onPlay={() => {
                setPlaying(true);
                setDucked(true);
              }}
              onPause={() => {
                setPlaying(false);
                setDucked(false);
              }}
              onEnded={() => {
                setPlaying(false);
                setDucked(false);
              }}
              controls
              playsInline
              preload="none"
              poster="/home-demo/overview-poster.jpg"
              aria-describedby="overview-video-note"
            >
              {LANGS.map((l) => (
                <track key={l.code} kind="subtitles" srcLang={l.code} label={l.label} src={`/home-demo/overview.${l.code}.vtt`} default={l.code === lang} />
              ))}
              Your browser can&apos;t play this video. <a href={`/home-demo/overview.${lang}.mp4`}>Download it (MP4)</a>.
            </video>
          </VideoSpotlight>
          <figcaption id="overview-video-note" className="mt-6 text-[12.5px] leading-relaxed text-(--mk-faint)">
            Experience reel · 1:20 · recorded from this page&apos;s 3D chapters — illustrative scenes, snapshot data, not the product UI ·
            temporary voice, final narration in production
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
