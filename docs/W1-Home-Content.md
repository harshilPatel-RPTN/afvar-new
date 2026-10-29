# W1 · Home — Content Specification

**Route:** `/` (afvar.com) · **Module:** `src/modules/home` · **Design:** macOS dark (black / blue / red)
**Source of truth:** Figma board *AFVAR — Project Flow*, nodes **W0 → W1 → W1.1 / W1.2**, wireframe **WF01** (node `79-3088`), navbar **W10.N**, footer **W8**, floating CTA **W9.1.4**.
**Status:** built & live · pre-launch copy · commercial values deliberately unconfirmed (W9.7).

---

## 0. Page identity

| Field | Value |
|---|---|
| Title tag | AFVAR — Your AI Operating System for Trading |
| Meta description | One connected place to understand international markets, explore ideas and review your trading — commodities, forex and crypto in English, Hindi and Arabic. Pre-launch. |
| Audience | International traders (India + Gulf first), desktop-class users |
| Tone | Apple-style: short declarative statements, no hype, analysis-not-advice everywhere |

---

## 1. Navbar (W10.N) — macOS menu bar

`Home · Platform ▾ · Markets ▾ · Pricing · Resources ▾ · About Us · Contact Us` + **Sign in** + **Register Now** (blue pill).

| Dropdown | Items (label → route · note) |
|---|---|
| Platform (6) | Platform Overview → /desk · Market Data & Charts → /desk · Research & Analysis → /desk · Alerts & Strategy Tools → /desk · Risk & Trade Review → /desk · Community → /communities |
| Markets (4) | Markets Overview → /markets · Commodities → /desk · Forex → /desk · Crypto → /desk |
| Resources (5) | Getting Started → /help · Product Guides → /help · Sources & Evidence → /help · FAQs → /help · Help & Support → /support |

Direct links: Pricing → /register · About Us → /contact · Contact Us → /contact.
Behaviour: Escape closes menus; mobile gets an expandable sheet with the same destinations; logo always returns to `/` (W10.R).

> ⚠ **Open item:** the W2–W7 destination pages don't exist yet (removed in commit `68d268d`). All hrefs live in one place — `NAV` in `src/modules/home/content.ts` — retarget there when real routes land.

---

## 2. Live ticker (supporting element)

Slim tape under the menu bar: all 8 lanes, symbol · last · ▲/▼ change%. Blue = up, red = down. Badge shows **LIVE** (feed connected) or **SNAPSHOT** (fallback). Pauses on hover.

---

## 3. W1.1.1 — Hero

- Badge (red): `Pre-launch · OS in development`
- **H1:** `The AI operating system for trading.`
- Sub: `One connected desk to understand international markets, explore ideas and review your trading — commodities, forex and crypto, in English, हिन्दी and العربية.`
- CTAs: **Register Now** (blue pill → /register) · `Explore the platform ›` (blue text link → /desk)
- **macOS desktop mockup:** mini menu bar (`AFVAR OS · Markets · Analyse · Window · Help` + live-feed dot + clock) → window with traffic lights titled `Markets — Gold · XAUUSD · 1H` containing the **live self-drawing chart** (real price, pulsing last-price dot, three movers: XAGUSD / EURUSD / BTC-USD) → **Dock** with 8 magnifying app icons: Charts, News, Calendar, Alerts, Risk, Journal, Community, AI Analyst.
- Caption: `Real prices via the AFVAR data layer · futures delayed · not investment advice`
- Stats row: **8** coverage lanes · **3** language editions · **24/7** crypto coverage · **0** order buttons — analysis only

## 4. W1.1.2 — Overview video

- H2: `See the whole desk. In ninety seconds.`
- 16:9 frosted frame, centered play button, pill label: `Preview placeholder · final asset pending`
- > ⚠ **Open item:** final video asset pending (per WF01).

## 5. W1.1.3 — What you can do (5 capability widgets)

H2: `Five jobs. One connected desk.` — bento grid, each tile: app-icon squircle · title · body · `Explore ›`.

| # | Title | Body | Tag · Link |
|---|---|---|---|
| 01 | Follow markets | Live charts, watchlists and heatmaps across commodities, forex and crypto — one connected workspace instead of twelve tabs. | Charts & watchlists → /desk |
| 02 | Understand context | News, economic calendar and market briefs tied to the instruments they move, with the source and freshness on every number. | News & research → /desk |
| 03 | Evaluate ideas | Plain-words alerts, screeners and strategy tests — repeated back and confirmed before anything is armed. | Alerts & strategy tools → /desk |
| 04 | Review your trading | Read-only broker connections, exposure, personal limits and a journal. Risk Guardian warns — it never acts on your account. | Risk & trade review → /desk |
| 05 | Connect with traders | Eight official rooms, one per coverage lane, with shared charts and verified records. No scam channels, by design. | Community → /communities |

## 6. W1.1.4 — Markets we cover (live widgets)

H2: `International markets. Covered deeply.` · intro: `Eight confirmed coverage lanes across three categories — every number with its source and freshness.`
Three Stocks-app-style widgets with **live rows** (symbol, name, sparkline, price, filled blue/red change pill):

| Widget | Lanes | Note |
|---|---|---|
| Commodities | XAUUSD · XAGUSD · WTI | Gold, silver and crude — the lanes that move first on macro. |
| Forex | EURUSD · USDJPY · GBPUSD · NZDUSD | Major pairs across London, New York and Asia sessions. |
| Crypto | BTC-USD | Bitcoin first, every listed coin through search. 24/7. |

## 7. W1.1.5 — Why AFVAR

H2: `Built so every number can defend itself.` — three centered columns:
1. **One AI operating system** — Charts, research, alerts, risk and community run as connected apps in a single desk — your layout follows your account to any screen.
2. **Clear market context** — Every price, verdict and headline carries its source, venue, delay and cache age. The AI never invents a number — code computes, it explains.
3. **From question to insight** — Ask in English, हिन्दी or العربية. Spoken questions get spoken answers; every analysis is graded publicly in the Track Record.

## 8. W1.1.6 — Sources & evidence banner

Single statement card (blue→red hairline on top):
`Every quote shows its source, venue, delay and cache age. Every analysis is graded publicly — including every WAIT.` → `Explore our evidence ›` (→ /help, future W5.4).

## 9. W1.1.7 / W1.1.8 — Join before launch + Register

H2: `Two ways into the launch queue.` · intro: `One account, one queue record. Verification changes which offer you're eligible for — never your place in line.`

| Offer 01 (blue) — Launch Queue | Offer 02 (red, optional) — Verified Launch Queue |
|---|---|
| Verify your mobile and email — one account, one queue record | Optional identity approval after joining — never required |
| Launch benefit under approved terms, to be confirmed | Separate verified benefit, to be confirmed |
| Your queue position never changes because of an offer | Same account and queue order; no invitation priority |
| CTA: Join the Launch Queue → /register | CTA: Learn about verification → /register |

Mandatory disclaimer line: `Same account and queue order. No invitation priority. Offer amount, capacity and duration are not yet confirmed.`
Closing CTAs: **Register Now** · **Explore Launch Offers** (both → /register).
**Floating CTA (W9.1.4):** macOS-notification card `Join the Launch Queue — Register now`, appears on scroll past the hero, hides near the footer.

> ⚠ **Open item (W9.7):** offer amounts, capacity, duration — never state numbers until approved.

## 10. W8 — Footer

Disclaimer first, then five columns (Platform · Markets · Resources · Company · Policies — links mirror the navbar + Security/Privacy/Terms/Launch Offer Terms), then:
`Copyright © 2026 RedPhantom Tech Novelty Private Limited · CIN U72900PN2021PTC204792 · Pandharpur, Maharashtra, India` · language chips `English · हिन्दी · العربية` · `Pre-launch · the OS workspace runs on desktop and laptop.`

**Disclaimer (verbatim, used site-wide):**
`AFVAR provides market information, analysis and explanation only. It never places, modifies or closes trades, and nothing on AFVAR is investment advice. Trading decisions and their responsibility remain with the user.`

---

## 11. Live data behaviour

- `/api/home/market` (self-contained Yahoo Finance proxy, 25s cache) → real quotes + hourly closes for all 8 lanes.
- Page renders instantly from a static `SNAPSHOT`, upgrades on first poll, then 1-second mean-reverting micro-ticks animate the tape, hero chart and market rows.
- Honesty rule: every live element carries a LIVE/SNAPSHOT badge; futures labelled delayed; never present sample data as real.

## 12. Palette (hex)

| Role | Hex |
|---|---|
| Blacks (page / section / raised) | `#000000` · `#0B0B0F` · `#1C1C1E` |
| Vibrancy glass | `rgba(28,28,30,.68)` · hairline `rgba(255,255,255,.12)` |
| Blue (systemBlue / hover / deep) | `#0A84FF` · `#3395FF` · `#0040DD` |
| Red (systemRed / soft / deep) | `#FF453A` · `#FF6961` · `#8E1C16` |
| Text (primary / dim / faint) | `#F5F5F7` · `#A1A1A6` · `#6E6E73` |
| Traffic lights | `#FF5F57` · `#FEBC2E` · `#28C840` |

Semantics: **blue = up / primary action · red = down / pre-launch urgency.** Type: SF system stack (`-apple-system, SF Pro, …`).

## 13. Hard content rules (from the handoff)

1. Never say "buy" or "sell"; never promise returns, priority access, or unconfirmed offer values.
2. Registration never grants OS access; identity verification never changes queue order.
3. Label everything preview vs. available; the video is a placeholder until the real asset ships.
4. Apple-inspired, never Apple-copied — no Apple logos, product shots, or trademarked assets.
5. Public site is responsive (mobile included); only the OS itself is desktop-gated.
