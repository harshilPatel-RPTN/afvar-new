# modules/platform — W2 Platform pages

Public website pages for the **Platform** navbar item (Figma board W2, handoff WA 2).

| Route | Board ref | Wireframe | Component |
|---|---|---|---|
| `/platform` | W2.1 Platform Overview | WF03 | `PlatformOverview` |
| `/platform/market-data` (old `/platform/charts` redirects) | W2.2 Market Data & Charts | WF04 | `CapabilityPage` |
| `/platform/research` | W2.3 Research & Analysis | WF04 | `CapabilityPage` |
| `/platform/alerts` | W2.4 Alerts & Strategy Tools | WF04 | `CapabilityPage` |
| `/platform/risk-review` (old `/platform/trade-review` redirects) | W2.5 Risk & Trade Review | WF04 | `CapabilityPage` |
| `/platform/community` | W2.6 Community | WF04 | `CapabilityPage` |

Any other `/platform/*` slug is a 404 (`dynamicParams = false`).

## Layout

```
content.ts   all copy: overview topics, five capabilities, board section lists
routes.ts    route registry for every link + REGISTER_URL (single source)
types.ts
platform.css theme (AFVAR gold palette on DESIGN-GUIDE token names) + macOS materials
components/
  PlatformShell        theme root, <main>
  PlatformOverview     WF03: hero + try-it desktop, Two ways (manual vs AI), Stop vs Cancel,
                       Verify flow, Your workspace, topics (System Settings window), Trust,
                       Explore (sticky tour + Dock), closing CTA
  CapabilityPage       WF04: breadcrumb hero + app window, feature grid, clearer view
                       (3D scene), continue exploring, capability family, closing CTA
  CommandPalette       ⌘K / Ctrl+K page and action search on every /platform page
  mac/                 MacWindow, AppIcon, Dock, icons (Phosphor), Reveal, motion-kit
  os/                  try-it desktop: windows, Dock, Spotlight, command resolver, EN/HI/AR strings
  capability/Models3D  per-capability WebGL 3D models (replaces the supporting image)
  capability/Scene3D   lazy loader + CSS 3D fallback for Models3D
```

## Design decisions

- **Direction: Apple restraint, macOS materials.** Solid surfaces, one accent (gold) used only for
  the primary button, links and selection; large tight type; glass/vibrancy only on chrome
  (menu bar, Dock, Spotlight, sidebars) per DESIGN-GUIDE §5.1. The earlier version's gradient
  text, glows, beams, grid backgrounds, tilt cards and ticker were removed after review
  ("looks AI-generated").
- **Colours: synced with the Markets site.** The pf tokens now resolve to the `.mk` palette
  from `modules/markets/markets.css` (`var(--mk-*)` with fallbacks): mk gold `#ecc574` as the
  accent, warm deep-space blacks, and the markets up/down convention (cyan `--mk-up` for
  positive, hydrogen red `--mk-accent` for negative — the earlier green/rose pair is gone).
  Hard-coded hexes in the demos were retinted to match. Originally: AFVAR gold palette
  supplied by the product owner, mapped onto the guide's §2
  token names in `platform.css`. Dark-only.
- **macOS components** (no Apple assets — original wallpaper, own app tiles):
  menu bar, windows with traffic lights, Spotlight with Top Hit, System Settings source list and
  inset-grouped rows, context menu, Dock. Patterns studied from
  [Renovamen/playground-macos](https://github.com/Renovamen/playground-macos) (MIT) and
  [PuruVJ/macos-web](https://github.com/PuruVJ/macos-web) (MIT): the Dock reuses their
  7-point magnification curve and 1700/90 spring, changing real width so neighbours slide.
- **Icons: Phosphor** (`@phosphor-icons/react`, MIT), wrapped in `components/mac/icons.tsx`.
  **Deviation:** DESIGN-GUIDE §3.1 locks `lucide-react`; Phosphor was chosen for its SF
  Symbols–like weights (regular/fill/duotone). SF Symbols themselves are not licensed for web use.
  Shared `platform/ui/Icon` is untouched.
- **Motion** (framer-motion): fade-up reveals, scroll-settle on product shots, scroll-filled
  outcome statements, a scripted cursor demo (Spotlight → chart opens from the Dock → focus →
  drag), Spotlight/voice and context-menu demos, layout re-tiling, sticky capability tour, Dock
  magnification. Demos run only while visible; every loop and transform is off under reduced
  motion.
- **Capability pages are interactive:** the preview window's feature list is real buttons
  (`aria-pressed`), it autoplays through features while visible until the visitor picks one,
  and replays its scene on entering view. Sample controls work: chart timeframes and hover
  crosshair, alert switch (`role="switch"`), exposure-ring hover, research card hover, a live
  community thread. The feature grid shares focus with the preview (`FeatureFocus`): the
  feature on screen is highlighted, and "See it in the preview" opens any feature there.
- **Shared chrome:** `app/platform/layout.tsx` wraps every platform page in the markets
  `SiteShell` — fixed navbar (72px; `PlatformShell` adds `pt-[72px]` clearance), pre-launch
  banner, `<main id="main">` and footer — so /platform matches /market exactly. The font is
  therefore the markets one (Manrope via `.mk`), a deviation from DESIGN-GUIDE §2.3 Inter;
  the earlier Inter scoping was removed.

## Honesty rules applied (WA-T06, DESIGN-GUIDE §0.3)

- Every feature is labelled **In development** until availability is confirmed (DEC 13).
- Previews are schematic: no prices, instruments as live data, results or names; each carries
  "Sample" and "Illustrative preview · final asset pending".
- Register Now always goes to `https://app.afvar.com/` (existing Step 2 Welcome).
- Trade Review states connections are read-only and AFVAR never places or changes orders;
  Community states identity verification ≠ verified trading records.

## Interactive features and where they come from

| Feature | Where | Based on (licence) |
|---|---|---|
| Try-it desktop: drag windows, traffic lights, genie minimize to Dock, zoom, focus order | `os/DesktopWindow`, `os/desktop-state` | [PuruVJ/macos-web](https://github.com/PuruVJ/macos-web) (MIT) |
| Wallpaper follows the visitor's time of day | `os/time`, `.pf-wall-*` | macos-web dynamic wallpaper (MIT) |
| Spotlight with typed commands, clarification, refusal of orders, EN/HI/AR | `os/SpotlightPanel`, `os/commands` | [Renovamen/playground-macos](https://github.com/Renovamen/playground-macos) (MIT) |
| Dock magnification and launch bounce | `mac/Dock`, `os/DesktopDock` | macos-web curve + spring (MIT) |
| ⌘K command palette | `CommandPalette` | playground-macos Spotlight pattern (MIT) |
| Verify flow beams | `os/AnimatedBeam`, `overview/VerifyFlow` | [magicuidesign/magicui](https://github.com/magicuidesign/magicui) AnimatedBeam (MIT) |
| Two ways, Stop vs Cancel, Trust + freshness labels | `overview/*` | own; board D.0, U07, D.1.3 |
| Supporting preview as 3D models | `capability/Models3D`, `capability/Scene3D` | own; [three.js](https://github.com/mrdoob/three.js) + [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) + drei (MIT) |

[ryokun6/ryos](https://github.com/ryokun6/ryos) is AGPL and was used as visual reference only; no code was copied.

## Supporting preview (3D models)

The "Supporting preview" on each capability page is a real-time WebGL scene
(`capability/Models3D.tsx`, three.js via `@react-three/fiber` + `drei` + `postprocessing`).
All models are procedural — no model files: glossy 3D candles with a glowing trend tube, gold
coins and a watchlist slab (charts); fanned brief tablets under a glass magnifier (research); a
lathed metal bell with ripples, a threshold line and a 3D switch (alerts); an extruded exposure
donut, journal tablet and R-bars (trade review); 3D chat bubbles, avatars and typing dots
(community). Lighting is local Lightformers (no HDR download), with contact shadows, bloom and
vignette. The scene turns toward the pointer and sways while idle; pieces build on a 7 s loop.

- `capability/Scene3D.tsx` lazy-loads the models only when the section is within 400 px of the
  viewport and WebGL exists; three.js (~290 KB gzip) is a separate chunk, not in the page's
  first load. Until then, or without WebGL, a CSS 3D fallback shows.
- Rendering pauses (`frameloop="demand"`) when the scene is off screen. Under reduced motion it
  renders one finished, still frame.
- Shapes only: no prices, names or results; captioned "Illustration · not live data".
- **New dependencies:** `three@0.186.1`, `@react-three/fiber@9.8.2`, `@react-three/drei@10.7.9`,
  `@react-three/postprocessing@3.2.2`, `postprocessing`, `@types/three` (dev). All MIT.
- The earlier Canva PNGs were removed from `public/`.

## Section backgrounds (Figma AI images)

`public/platform/bg/*.jpg` were generated with Figma AI (model `gpt-image-2.5-sunburst`) in the
Figma file [AFVAR Platform — page images](https://www.figma.com/design/GXmaaD1SDXNrel39WXhLYF),
then compressed to JPEG (q82; source 1536×864). Capability pages use no other images. Shown through `mac/Backdrop` (next/image, edge-fade mask, slow drift
that stops under reduced motion):

| File | Where |
|---|---|
| `hero.jpg` | Overview hero, behind the headline |
| `wallpaper.jpg` | Try-it desktop wallpaper; the time-of-day colour sits on top as a tint |
| `verify.jpg` | Verify flow sticky stage |
| `horizon.jpg` | Unused (the closing CTA earth no longer has a photo fallback) |

Abstract artwork only — no text, numbers or UI. Licensing of AI-generated images should be
confirmed with the content owner before launch.

## Open items — need a decision before release

1. **URLs** `/platform/<slug>` are proposed; WP-WA01 must approve the route registry.
2. **Links to pages not built yet:** Markets `/markets`, Pricing `/pricing`, Resources
   `/resources/*`, Briefs `/markets/briefs` resolve through `routes.ts` and 404 until those pages
   ship. Update `ROUTES` if their owners pick different paths.
3. **Copy:** where the board gives only a feature name, the description is a short draft line
   (see `content.ts` header). Final copy is owner gate DEC 13.
4. **WF04 shows 3 feature cards**; the board lists 6–8 sections per page. All sections are shown.
5. **Language chips** show English / हिन्दी as planned editions (Arabic was removed on request);
   confirm before publishing.
6. Copy is English-only; it is not wired into `platform/i18n` yet. The try-it desktop's Hindi strings
   (`os/strings.ts`) are **draft translations**; Spotlight row labels stay English.
7. Trust section's stale-data line ("Source time shown · not updating") is draft copy, not from
   the board.

## Verification (run on 26 Oct 2026)

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npx eslint src/modules/platform src/app/platform` | pass |
| `npx vitest run` | 110/110 pass |
| `npm run build` | pass; `/platform` and `/platform/[capability]` built |
| Dev server | `/platform` and all five slugs 200; unknown slug 404 |
| Screenshots | 1440×900 and 390×844 reviewed manually; all five 3D scenes checked; no console errors |

Not run yet: Playwright e2e/visual baselines, Lighthouse, Safari/Firefox, screen-reader pass.
