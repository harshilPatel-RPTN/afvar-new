"use client";

import { useEffect, useState } from "react";
import "./font-preview.css";

/*
 * TEMPORARY review tool for /platform only: lets the team try the fonts from
 * public/fonts/preview on this page (headings, and for the digital faces also
 * numbers). The choice is kept in the URL (?font=…) so a link shows the same
 * font, and in localStorage. Remove once a font is chosen.
 * NOTE: these fonts are personal-use licences; buy a commercial licence before shipping.
 */

const FONTS = [
  { id: "default", label: "Current (default)" },
  { id: "digital", label: "Digital-7" },
  { id: "digital-mono", label: "Digital-7 Mono" },
  { id: "orange", label: "Orange Avenue" },
  { id: "orange-outline", label: "Orange Avenue Outline" },
  { id: "grunge", label: "Dusty Grunge" },
] as const;
type FontId = (typeof FONTS)[number]["id"];
const KEY = "afvar-font-preview";
const isFont = (v: string | null): v is FontId => FONTS.some((f) => f.id === v);

export function FontPreview() {
  const [font, setFont] = useState<FontId>("default");
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);

  // Initial choice: ?font= wins, then the last pick on this browser.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("font");
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    const next = isFont(fromUrl) ? fromUrl : isFont(saved) ? saved : "default";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only state once on mount
    setFont(next);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const html = document.documentElement;
    if (font === "default") delete html.dataset.fontPreview;
    else html.dataset.fontPreview = font;
    try {
      localStorage.setItem(KEY, font);
    } catch {}
    const url = new URL(window.location.href);
    if (font === "default") url.searchParams.delete("font");
    else url.searchParams.set("font", font);
    window.history.replaceState(null, "", url);
    return () => {
      delete html.dataset.fontPreview;
    };
  }, [font, ready]);

  return (
    <div className="fp-panel" data-open={open || undefined}>
      <button type="button" className="fp-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Aa Font preview
      </button>
      {open && (
        <div className="fp-list" role="radiogroup" aria-label="Font preview">
          {FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={font === f.id}
              className="fp-option"
              data-font={f.id}
              onClick={() => setFont(f.id)}
            >
              <span className="fp-sample">AFVAR 1,234.56</span>
              <span className="fp-name">{f.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
