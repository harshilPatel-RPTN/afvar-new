import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// next/font is a build-time transform; under jsdom it isn't callable. Route
// components (e.g. the landing page, reachable through module indexes) call it
// at import time, so give every test a harmless stand-in.
// jsdom has no matchMedia; the "/" motion layer (cursor, screensaver, sound)
// asks it for prefers-reduced-motion. Report "no match" for every query.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

vi.mock("next/font/google", () => {
  const font = () => ({ className: "font-mock", variable: "--font-mock", style: { fontFamily: "mock" } });
  // Manrope / Noto Sans Devanagari: the markets + "/" theme fonts (pulled in via
  // the "/" motion layer that every PlatformShell page now renders).
  return { Inter: font, Geist: font, Geist_Mono: font, Manrope: font, Noto_Sans_Devanagari: font };
});
