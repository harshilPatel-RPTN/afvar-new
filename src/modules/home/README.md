# modules/home — W1 · public website Home (`/`)

The pre-launch marketing home, built 1:1 to the Figma board's WF01 wireframe and
W1.1 content order (hero → overview video → five capabilities → markets covered
→ why AFVAR → sources & evidence → launch offers → register → W8 footer), with
the W10.N navbar (Platform/Markets/Resources dropdowns) and the W9.1.4 floating
Register CTA.

**3D homepage composition** (per `docs/utils/AFVAR-3D-Homepage-Implementation.md`):
the hero is the "Market Core" scroll story — a pinned scroll stage driven by
`MarketTerrainScene` + `marketTerrainConfig` — with the market ticker directly under
the nav. `FloatingCta` (spec §16) is a compact glass card (bottom-right on
desktop, bottom banner on mobile) shown after the user scrolls past the hero,
hidden while `#launch` is in view, dismissible for the session, linking to
`/register`. Visual-honesty rules apply throughout: only real or clearly
labelled market data, no invented stats or fake values.

- **Palette** (single source: `PALETTE` in `content.ts`): blacks #05070D /
  #0A0E18 / #101624, blues #1F6BFF / #4D8DFF / #0B2A6B, reds #E5484D / #FF5A61.
  Up-moves render blue, down-moves red — the brand's black/blue/red system.
- **Live data:** `server.ts` + `/api/home/market` proxy Yahoo Finance for the
  8 lanes (25s cache). `useLiveMarket` renders instantly from `SNAPSHOT`,
  upgrades to real quotes on first poll, and adds 1s mean-reverting micro-ticks
  so the tape, hero chart and market cards move every second. Badges say
  "LIVE" vs "SNAPSHOT" honestly.
- **Animations:** marquee ticker (pauses on hover), self-drawing canvas hero
  chart with a pulsing last-price dot, framer-motion reveals, card lifts,
  gradient hairlines. All respect `prefers-reduced-motion`.
- **Route map:** nav/card hrefs follow the Figma W-map (`NAV` in content.ts).
  ⚠ Commit 68d268d (26 Oct) removed /desk, /markets, /help, /support, /login,
  /register and the old /api/desk/* — those links 404 until the routes return.
- **Public API (`index.ts`):** `HomePage`. Server entry: `server.ts`.
