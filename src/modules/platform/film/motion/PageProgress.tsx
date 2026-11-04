"use client";

// E1 — orientation on long Platform pages.
//   < 1440 px (or short screens): a 2 px sage line under the navbar, scaleX = page progress
//   ≥ 1440 px and ≥ 700 px tall: a slim right-edge index (dots + the current section's name,
//     set vertically) that stays inside the 4vw gutter the pinned OS screen leaves free.
// The sections are read from the page: every OS section (`s02-…`) plus the
// template sections under the film. Off when PLATFORM_MOTION is false.
import { motion, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MONO, PLATFORM_MOTION, prefersReducedMotion, useMedia } from "@/modules/afvarOs";

const NAV = "[data-site-frame] header";
// /platform adds its hands-on playground (#try-afvar) and "At a glance" (glance-title) after the film.
const SECTIONS =
  'main section[id^="s0"], main section[id^="s1"], main section#features, main section[aria-labelledby="areas-title"], main section#try-afvar, main section[aria-labelledby="glance-title"]';

export function PageProgress() {
  const wide = useMedia("(min-width: 1440px) and (min-height: 700px)");
  if (!PLATFORM_MOTION || wide === null) return null;
  return wide ? <SectionIndex /> : <ProgressLine />;
}

function ProgressLine() {
  const { scrollYProgress } = useScroll();
  const ref = useRef<HTMLDivElement>(null);
  // Sit under the navbar, wherever it is (measured, never covering it). It fades out
  // with the navbar once the footer comes on screen (the footer landing sends the bar
  // away), so it never strikes through the closing CTAs or the footer's links.
  useEffect(() => {
    let raf = 0;
    const html = document.documentElement;
    const place = () => {
      raf = 0;
      const line = ref.current;
      if (!line) return;
      const nav = document.querySelector(NAV);
      line.style.top = `${nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0}px`;
      const footers = document.querySelectorAll("footer");
      const footer = footers[footers.length - 1];
      const footerOnScreen = footer ? footer.getBoundingClientRect().top < window.innerHeight : false;
      const away = html.hasAttribute("data-fl-nav-away") || footerOnScreen;
      line.style.opacity = away ? "0" : "1";
      line.style.visibility = away ? "hidden" : "";
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(place);
    };
    queue();
    const watch = new MutationObserver(queue);
    watch.observe(html, { attributes: true, attributeFilter: ["data-fl-nav-away"] });
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(raf);
      watch.disconnect();
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-page-progress=""
      className="pointer-events-none fixed inset-x-0 z-40 h-[2px] transition-[opacity,visibility] duration-300 motion-reduce:transition-none"
      style={{ top: 72 }}
    >
      <motion.div className="h-full w-full origin-left bg-[#A8DEC2]" style={{ scaleX: scrollYProgress }} />
    </div>
  );
}

interface Entry {
  id: string;
  label: string;
}

function readSections(): Entry[] {
  return [...document.querySelectorAll<HTMLElement>(SECTIONS)].map((s) => ({
    id: s.id || s.getAttribute("aria-labelledby") || "",
    label: (s.querySelector("p")?.textContent ?? "").trim(),
  }));
}

function sectionEl(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`section[aria-labelledby="${id}"]`) ?? document.getElementById(id);
}

function SectionIndex() {
  const [items, setItems] = useState<Entry[]>([]);
  const [active, setActive] = useState(-1);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      const all = readSections();
      setItems((prev) => (prev.length === all.length && prev.every((e, i) => e.id === all[i].id && e.label === all[i].label) ? prev : all));
      let a = -1;
      all.forEach((e, i) => {
        const r = sectionEl(e.id)?.getBoundingClientRect();
        if (r && r.top <= mid) a = i;
      });
      // Past the last section's end (closing, footer): nothing is current.
      const last = all.length ? sectionEl(all[all.length - 1].id)?.getBoundingClientRect() : null;
      if (last && last.bottom < mid) a = -1;
      setActive(a);
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    queue();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, []);

  const jump = (id: string) => {
    const s = sectionEl(id);
    if (!s) return;
    const pinned = s.querySelector(".afvar-os-desktop-frame") !== null;
    // Pinned OS sections: land where their windows are on screen.
    const span = pinned ? Math.max(0, s.offsetHeight - window.innerHeight) * 0.55 : -88;
    window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY + span, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  if (!items.length) return null;
  const current = active >= 0 ? items[active] : null;
  return (
    <nav aria-label="Sections on this page" data-page-index="" className="fixed right-[14px] top-1/2 z-40 flex -translate-y-1/2 flex-col items-center">
      <ul className="flex flex-col items-center">
        {items.map((e, i) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => jump(e.id)}
              aria-label={`Go to ${e.label}`}
              aria-current={i === active ? "true" : undefined}
              className="group grid h-6 w-6 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#A8DEC2]"
            >
              <span className={`block h-1.5 w-1.5 rounded-full transition-[transform,background-color] duration-300 ${i === active ? "scale-[1.35] bg-[#A8DEC2]" : "bg-[rgba(255,255,255,0.28)] group-hover:bg-[rgba(255,255,255,0.6)]"}`} />
            </button>
          </li>
        ))}
      </ul>
      <p className={`${MONO} mt-3 whitespace-nowrap text-[9.5px] text-[#A8DEC2] [writing-mode:vertical-rl]`}>
        {current?.label ?? ""}
      </p>
    </nav>
  );
}
