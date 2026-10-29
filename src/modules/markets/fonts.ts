import { Manrope, Noto_Sans_Devanagari } from "next/font/google";

/** Latin headings and body: a clean geometric sans close to the reference. */
const latin = Manrope({ subsets: ["latin"], variable: "--mk-font-latin", display: "swap" });

/** Hindi and Marathi. Not preloaded, so English pages never fetch it.
 *  Loaded as the variable font (covers 400–700): fixed weights make Google
 *  serve `/l/font?kit=` URLs, which Turbopack dev can't resolve. */
const deva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--mk-font-deva",
  display: "swap",
  preload: false,
});

/** Add to the root `.mk` element: defines the font variables markets.css uses. */
export const mkFontClassName = `${latin.variable} ${deva.variable}`;
