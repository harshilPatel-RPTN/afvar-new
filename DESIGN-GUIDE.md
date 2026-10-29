# DESIGN.md — Trading AI OS
## Complete Frontend Engineering Contract for a Browser-Based Trading & AI Workspace

**Status:** Authoritative implementation specification  
**Frontend:** Next.js App Router + TypeScript + Tailwind CSS  
**Product type:** Large, modular browser application that behaves and feels like a desktop operating environment  
**Primary design direction:** Apple-inspired clarity and material quality, combined with a professional trading terminal's information density and the workflow clarity of a modern AI workspace  
**Audience:** Claude Code and engineering team implementing a new frontend  
**Default target:** Desktop-first, responsive down to 390px mobile width  
**Important:** This is a web application, not an actual operating system and not merely a marketing website.

> **Primary instruction to the coding agent:** Read this document completely before implementation. First inspect the repository and identify the installed framework versions and existing files. Then implement the real Trading AI OS application in phases. Do not stop after writing a plan. Do not create fake controls or decorative-only trading actions. Use typed mock data only where live API contracts are not yet available, isolate it behind service adapters, and label simulated data clearly. Never represent mock prices, orders, AI analysis, or backtest results as live or financially verified data.

---

# 0. Product Definition, Scope, and Non-Negotiable Rules

## 0.1 What we are building

Trading AI OS is a large web application presented as a unified workspace. It may feel like a desktop OS, but it runs inside the browser. Its main jobs are:

1. Let a user inspect markets, watchlists, charts, portfolios, orders, and risk.
2. Let a user ask an AI assistant for market research, explanations, strategy ideas, and reports.
3. Make AI activity legible: tool calls, data sources, progress, errors, citations, and approvals must be visible.
4. Allow users to switch between focused workspaces without losing useful context.
5. Support extensible modules over time without turning the frontend into an unmaintainable monolith.
6. Make important financial actions explicit, reviewable, and hard to trigger accidentally.

This is **not** a MacBook product landing page. Do not build marketing sections such as product hero storytelling, testimonials, or a product comparison page unless the product owner later requests them.

## 0.2 Primary user journeys

- Open the application and understand the current workspace, data freshness, and account state.
- Navigate to Markets, Watchlist, Charting, Portfolio, Orders, Strategies, Backtesting, Alerts, Reports, or AI Assistant.
- Search globally for a symbol, page, action, saved report, or prior AI conversation.
- Ask the AI to analyze a symbol or portfolio; see progress, tools, sources, and the final response.
- Inspect a chart and related quote/market data without losing context.
- Configure an alert or strategy using a validated form.
- Review a simulated or real order ticket, see estimated values and risks, and confirm explicitly if order placement is supported.
- Recover from stale data, API failure, disconnected providers, empty states, and permission errors.

## 0.3 Core implementation rules

1. **Audit before editing.** Inspect `package.json`, lockfile, Next.js/React/Tailwind versions, routing, fonts, assets, lint/test scripts, environment variable conventions, and existing API contracts.
2. **Preserve business logic.** Do not invent or silently change backend endpoints, authentication, role rules, order semantics, data models, or provider integrations.
3. **Do not invent financial truth.** If data is mocked, display “Demo data” or “Simulated”. Do not imply quotes are real-time unless the backend confirms that.
4. **No dead controls.** Every enabled control must work. If an integration is unavailable, provide a clearly labelled disabled state or a demo-only flow.
5. **No monolithic page component.** Separate shell, shared UI, feature modules, data adapters, hooks, schemas, and tests.
6. **Do not install every possible package blindly.** Follow the locked library decisions in §3, then verify package compatibility with the repository's versions.
7. **One animation engine per element/interaction.** Motion handles most UI transitions. GSAP is reserved for a specifically approved, scrubbed narrative timeline. Do not animate the same property with both.
8. **Performance beats decoration.** Avoid blur and backdrop-filter on huge scrolling surfaces, continuous animation on charts, and unnecessary re-renders during market updates.
9. **Accessibility is required.** Keyboard support, visible focus, semantic labels, contrast, reduced-motion behavior, and mobile touch targets are part of completion.
10. **Financial action safety.** Real order placement, strategy activation, or account changes require an explicit confirmation step and a clear summary of the action. Do not execute trades from an ambiguous AI suggestion.
11. **No fake success.** Show loading, success, failure, stale, and empty states accurately. Do not display a success toast before the service confirms success.
12. **Test the result.** Run the repository's actual scripts, validate the key flows, capture screenshots, and report what was actually tested.
13. **Use original branding.** Apple-inspired design language is a visual reference, not permission to use Apple's logo, copyrighted copy, or unlicensed product assets.
14. **Document assumptions.** If a backend contract or product behavior is unknown, isolate the assumption and record it in `docs/implementation-report.md`.

## 0.4 Scope boundaries

### In scope
- Browser-based OS shell and workspace navigation
- Responsive sidebar/Dock-inspired navigation and top command area
- Multi-panel workspace layouts
- Global search and command palette
- Trading and market-data screens
- AI assistant interface and activity visibility
- Shared design system, glass/material treatments, animation, themes
- Demo adapters for unavailable backend integrations
- Testing, accessibility, performance and documentation

### Out of scope unless explicitly requested
- Implementing a real brokerage or exchange integration from scratch
- Making financial recommendations or guaranteeing profitability
- Inventing backend APIs or changing server architecture
- A true operating system, native desktop process manager, or arbitrary desktop file system
- Unlicensed Apple assets or pixel-perfect copying of proprietary pages
- Production authentication/security implementation when the backend contract is not supplied

## 0.5 Required deliverables

- Working Next.js frontend with a clear module architecture
- Responsive OS shell and workspace navigation
- Shared tokens, themes, typography, component variants, and motion presets
- Trading workspaces with realistic, typed demo data where needed
- AI workspace with streaming-ready message architecture and explicit tool activity states
- Loading, error, empty, stale-data, offline/disconnected, and permission states
- Keyboard navigation and reduced-motion support
- Unit/component tests for critical interactions and Playwright smoke/visual tests
- `docs/implementation-report.md` containing implementation scope, assumptions, dependencies, test commands/results, screenshots, and known gaps

---

# 1. Product Information Architecture

## 1.1 Primary navigation

Use this initial navigation order. If product requirements or an existing route map specify a different order, record the difference before changing it.

1. **Home / Overview**
2. **Markets**
3. **Watchlists**
4. **Charts**
5. **Portfolio**
6. **Orders**
7. **AI Assistant**
8. **Strategies**
9. **Backtesting**
10. **Alerts**
11. **Reports**
12. **Settings**

The navigation should support icon + label on desktop expanded mode and icon-only compact mode with accessible tooltips. On mobile, use a dedicated navigation sheet or bottom navigation for the highest-frequency destinations; do not squeeze all twelve destinations into a narrow horizontal row.

## 1.2 Global shell regions

- **Top bar:** brand mark/name, current workspace title, global search/command palette trigger, connection/data status, notifications, theme control, user/account menu.
- **Primary navigation:** sidebar or Dock-inspired rail.
- **Workspace canvas:** the active route/module.
- **Optional contextual panel:** AI copilot, watchlist details, activity log, or inspector panel.
- **Toast region:** non-blocking confirmations and errors.
- **Modal/sheet layer:** command palette, confirmations, dialogs, mobile sheets.
- **Global keyboard layer:** shortcut handling that respects text fields and accessible behavior.

## 1.3 Shell modes

Implement these states explicitly:

- `expanded`: navigation icons and labels visible.
- `compact`: icon rail only, with tooltips and accessible names.
- `mobile`: navigation sheet/bottom nav and single-column content.
- `focus`: optional distraction-reduced workspace; do not hide critical risk or connection states.
- `loading`: shell remains stable while the current module loads.
- `offline`: show a clear connection state without replacing the entire application with a blank error page.

Persist only non-sensitive UI preferences (theme, nav mode, panel layout) using a safe preference mechanism. Never store access tokens or financial secrets in local storage.

## 1.4 Route map

Use Next.js App Router. A reasonable initial route structure is:

```text
app/
  (app)/
    layout.tsx
    page.tsx                    # Overview
    markets/page.tsx
    watchlists/page.tsx
    charts/page.tsx
    portfolio/page.tsx
    orders/page.tsx
    ai/page.tsx
    strategies/page.tsx
    backtesting/page.tsx
    alerts/page.tsx
    reports/page.tsx
    settings/page.tsx
  api/                          # Only if this frontend truly owns API routes
  globals.css
  layout.tsx
components/
  shell/
  navigation/
  command-palette/
  panels/
  charts/
  tables/
  trading/
  ai/
  feedback/
  forms/
  ui/
features/
  overview/
  markets/
  watchlists/
  charts/
  portfolio/
  orders/
  ai-assistant/
  strategies/
  backtesting/
  alerts/
  reports/
  settings/
lib/
  api/
  format/
  schemas/
  shortcuts/
  utils/
hooks/
  use-media-query.ts
  use-reduced-motion.ts
  use-market-stream.ts
  use-command-palette.ts
types/
  market.ts
  portfolio.ts
  order.ts
  assistant.ts
  workspace.ts
tests/
  unit/
  e2e/
docs/
  references/
  implementation-report.md
```

Do not create empty files for every item mechanically. Create modules when implementing them, but preserve the separation of concerns.

## 1.5 Responsive behavior

- **1440px and wider:** full shell, multi-column workspaces, persistent sidebar, contextual panels when useful.
- **1024–1439px:** compact sidebar by default where content requires it; reduce simultaneous panels rather than compressing chart labels.
- **768–1023px:** tablet layout; use collapsible navigation and stacked/overlaid contextual panels.
- **390–767px:** mobile-first single-column flow; key information first; secondary panels open as sheets.
- **Below 390px:** avoid horizontal page overflow. Dense financial tables may have an explicitly scrollable inner region, but the whole page must not overflow horizontally.

Charts and data grids may have their own horizontal scroll if unavoidable. Always provide accessible labels and avoid clipping critical price, risk, or order-status values.

---

# 2. Design Principles and Visual Language

The interface should feel premium and calm without sacrificing the clarity required by trading software.

- **Apple-inspired, not Apple-copied:** precise typography, intentional whitespace, restrained surfaces, smooth motion, and clear hierarchy.
- **Trading-first clarity:** market data, risk, price changes, and order status must remain legible at a glance.
- **Material hierarchy:** solid surfaces for dense data, lightly translucent surfaces for shell chrome, and stronger glass only for overlays.
- **Color is semantic:** positive/negative movement, warning, danger, and neutral states must have text/icons in addition to color.
- **Avoid glass everywhere:** never place every chart, table cell, and content panel on a blur-heavy translucent card.
- **Stable layout:** live values changing should not cause panel widths, text wrapping, or controls to jump.
- **Original brand:** define the product's own name and mark; do not use an Apple logo or imply official Apple affiliation.

## 2.1 Design tokens — exact initial baseline

Treat these as the initial implementation contract. Tune only after comparing the actual product screenshots and document any deliberate deviation.

```css
:root {
  color-scheme: light;

  --canvas: #F5F5F7;
  --surface-1: #FFFFFF;
  --surface-2: #F0F0F2;
  --surface-3: #E8E8ED;
  --surface-inset: #F7F7F9;

  --text-primary: #1D1D1F;
  --text-secondary: #626269;
  --text-tertiary: #86868B;
  --text-inverse: #FFFFFF;

  --border-subtle: rgba(29, 29, 31, 0.08);
  --border-default: rgba(29, 29, 31, 0.12);
  --border-strong: rgba(29, 29, 31, 0.18);

  --accent: #0071E3;
  --accent-hover: #0077ED;
  --accent-pressed: #0066CC;
  --accent-soft: rgba(0, 113, 227, 0.10);

  --positive: #16803C;
  --positive-soft: rgba(22, 128, 60, 0.10);
  --negative: #D92D20;
  --negative-soft: rgba(217, 45, 32, 0.10);
  --warning: #A15C00;
  --warning-soft: rgba(245, 158, 11, 0.14);
  --info: #1769AA;
  --focus-ring: rgba(0, 113, 227, 0.42);

  --glass-fill-panel: rgba(255, 255, 255, 0.72);
  --glass-fill-overlay: rgba(250, 250, 252, 0.82);
  --glass-border: rgba(255, 255, 255, 0.72);
  --glass-sheen-opacity: 0.35;
  --glass-shadow: 0 12px 36px rgba(20, 20, 30, 0.10);

  --radius-xs: 6px;
  --radius-sm: 9px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-pill: 999px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  --control-height-sm: 32px;
  --control-height-md: 40px;
  --control-height-lg: 44px;
  --topbar-height: 52px;
  --sidebar-width: 248px;
  --sidebar-width-compact: 68px;
  --content-max-width: 1600px;

  --shadow-card: 0 2px 8px rgba(20, 20, 30, 0.04),
                 0 12px 30px rgba(20, 20, 30, 0.035);
  --shadow-popover: 0 12px 36px rgba(0, 0, 0, 0.14);
  --shadow-dialog: 0 24px 80px rgba(0, 0, 0, 0.22);

  --z-base: 0;
  --z-sticky: 20;
  --z-sidebar: 30;
  --z-topbar: 40;
  --z-popover: 60;
  --z-overlay: 80;
  --z-dialog: 90;
  --z-toast: 100;
}
```

## 2.2 Dark theme

```css
.dark,
[data-theme="dark"] {
  color-scheme: dark;

  --canvas: #0B0B0D;
  --surface-1: #151518;
  --surface-2: #1C1C20;
  --surface-3: #25252A;
  --surface-inset: #101013;

  --text-primary: #F5F5F7;
  --text-secondary: #B4B4BC;
  --text-tertiary: #85858F;
  --text-inverse: #111114;

  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-default: rgba(255, 255, 255, 0.11);
  --border-strong: rgba(255, 255, 255, 0.18);

  --accent: #2997FF;
  --accent-hover: #49A5FF;
  --accent-pressed: #1687F0;
  --accent-soft: rgba(41, 151, 255, 0.14);

  --positive: #4DD181;
  --positive-soft: rgba(77, 209, 129, 0.12);
  --negative: #FF6B6B;
  --negative-soft: rgba(255, 107, 107, 0.12);
  --warning: #FFBE55;
  --warning-soft: rgba(255, 190, 85, 0.12);
  --info: #69B7FF;
  --focus-ring: rgba(41, 151, 255, 0.50);

  --glass-fill-panel: rgba(27, 27, 31, 0.78);
  --glass-fill-overlay: rgba(21, 21, 25, 0.88);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-sheen-opacity: 0.22;
  --glass-shadow: 0 12px 36px rgba(0, 0, 0, 0.30);

  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.14),
                 0 12px 30px rgba(0, 0, 0, 0.16);
  --shadow-popover: 0 12px 36px rgba(0, 0, 0, 0.36);
  --shadow-dialog: 0 24px 80px rgba(0, 0, 0, 0.48);
}
```

Do not hard-code white text or dark backgrounds into reusable components. All shared components must consume semantic tokens.

## 2.3 Typography — fixed choice

Use **Inter through `next/font/google`** as the default web font. Do not leave Segoe UI/Roboto as preferred fallbacks, because this creates noticeably different results across operating systems. The native system font can remain as a final fallback.

```tsx
// app/layout.tsx
import { Inter } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
```

```tsx
// app/layout.tsx body
<body className={`${inter.variable} font-sans antialiased`}>
  {children}
</body>
```

```css
:root {
  --font-ui: var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}
html, body { font-family: var(--font-ui); }
```

Use the `--font-mono` stack for prices, quantities, timestamps, IDs, and other tabular values. Prefer `font-variant-numeric: tabular-nums`.

| Role | Size | Weight | Line height | Tracking |
|---|---:|---:|---:|---:|
| App/page title | 28px | 650/700 | 1.15 | -0.035em |
| Workspace heading | 22px | 600 | 1.25 | -0.025em |
| Panel heading | 15px | 600 | 1.35 | -0.01em |
| Body | 14px | 400 | 1.5 | 0 |
| Compact data/table | 12px | 450/500 | 1.4 | 0 |
| Button | 13px | 550/600 | 1 | 0 |
| Metric value | 24–32px | 600 | 1.1 | -0.025em |
| Chart axis | 11px | 450 | 1.2 | 0 |
| Caption/metadata | 11–12px | 400 | 1.4 | 0 |

Use responsive page headings only where needed: `clamp(1.5rem, 2vw, 1.9rem)`. Do not use oversized marketing hero typography inside a trading terminal.

## 2.4 Spacing and shape rules

- Use the 4px spacing scale above.
- Panel padding: 16px standard, 20px for roomy analytical panels, 12px for compact data modules.
- Gaps between dashboard cards: 12px compact, 16px standard.
- Main content outer padding: 24px desktop, 16px tablet, 12px mobile.
- Inputs and primary buttons: 44px height; compact table toolbar buttons may be 32px.
- Standard card radius: 16px; dialogs: 20px; inputs/buttons: 9–12px.
- Use normal CSS border radius by default. Squircle geometry is an optional enhancement, not a core dependency.
- Avoid nested cards inside cards unless the nested region represents a real independent panel.

## 2.5 Semantic financial color rules

- Positive and negative values must include a sign or status label where appropriate, not color alone.
- Never color every clickable control blue. Blue is the main action/focus accent.
- Use positive/negative colors for market movement only; do not use them as decorative gradients.
- A warning, stale feed, failed request, or risk state must include text and/or an icon.
- Color tokens are not a substitute for contrast verification.

## 2.6 Original brand mark and logo specification

Create an original, abstract brand mark for Trading AI OS. Do not use the Apple logo, stock-exchange logos without permission, or a generic copied macOS icon.

**Visual concept:** a compact geometric “signal/orbit” mark suggesting market data + intelligence: three ascending rounded vertical bars or nodes joined by a single subtle arc/orbit. Keep the silhouette recognizable at 16px. It should read as a product mark, not a chart screenshot.

Rules:
- Primary mark: monochrome in the current foreground color on neutral surfaces.
- Accent version: use `--accent` only for one small node/line; never use a multicolor gradient as the default logo.
- No glass/refraction on the logo itself. It must remain crisp and recognizable at small sizes.
- App icon tile, if used: 36×36px desktop header; 28×28px compact/mobile; radius 10px desktop and 8px compact.
- Header wordmark: “Trading AI OS” in 14px semibold, tracking `-0.02em`; hide the wordmark only when the sidebar is compact, while preserving the accessible name.
- Favicon: simple single-color version with no tiny detail.
- Use a local SVG asset/component with `currentColor` wherever possible so light/dark themes work without duplicate assets.
- Keep the icon clear at 16, 20, 28, and 36px. Do not animate the logo continuously.
- If the final product brand name changes, update the wordmark and metadata consistently; do not change the mark's visual contract without a design decision.
- Place the initial implementation in `components/brand/brand-mark.tsx` or `public/brand/brand-mark.svg`, depending on the repository's asset convention.

Suggested SVG concept (starting point, not a third-party logo):

```tsx
export function BrandMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect x="4" y="16" width="5" height="11" rx="2.5" fill="currentColor" opacity=".58" />
      <rect x="13.5" y="10" width="5" height="17" rx="2.5" fill="currentColor" opacity=".78" />
      <rect x="23" y="4" width="5" height="23" rx="2.5" fill="currentColor" />
      <path d="M5.5 12.5 15.5 7.5 25.5 3.5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="25.5" cy="3.5" r="2" fill="var(--accent)" />
    </svg>
  );
}
```

This mark is an initial project-owned concept. Check small-size legibility in light/dark themes before finalizing. Do not replace it with an external logo without approval.

---

# 3. Locked Library and Dependency Decisions

## 3.1 Decision table

The following table is the implementation contract for a new Next.js + TypeScript + Tailwind frontend. Verify the current repository versions and the current package API before installing. Do not silently swap the required library for a different one.

| Capability | Decision | Library / approach | Notes |
|---|---|---|---|
| Framework | REQUIRED | Next.js App Router | Use the repository's installed supported version |
| Language | REQUIRED | TypeScript strict mode | No `any` unless narrowly justified |
| Styling | REQUIRED | Tailwind CSS + CSS variables | Tokens are authoritative; use CSS for material effects |
| UI primitives | REQUIRED | shadcn/ui + Radix UI primitives | Copy only components actually used |
| Icons | REQUIRED | `lucide-react` | Use consistent 16/18/20px sizing |
| Main UI motion | REQUIRED | `motion` (Motion for React) | Standard for hover, dialogs, layout, lists, presence |
| Theme | REQUIRED | `next-themes` | Avoid hydration flash; CSS variables define theme |
| Notifications | REQUIRED | `sonner` | Toasts are feedback, not the only error channel |
| Forms | REQUIRED when forms are built | `react-hook-form` + `zod` + `@hookform/resolvers` | Schema validation and accessible errors |
| Data fetching/cache | REQUIRED for remote data | TanStack Query (`@tanstack/react-query`) | Do not use ad-hoc fetch effects for all remote state |
| Data table | REQUIRED when dense grids are built | `@tanstack/react-table` | Virtualize only when row counts justify it |
| Charting | REQUIRED when chart screens are built | `lightweight-charts` for market charts; Recharts for simple analytics only if suitable | Choose based on required features; do not render a chart library in every card |
| Scroll smoothing | NOT REQUIRED | Native scrolling by default | Do not globally hijack scroll in a trading application |
| Scroll narrative animation | CONDITIONAL | `gsap` + `ScrollTrigger` | Only for a dedicated, bounded narrative/onboarding view, not normal trading workspaces |
| Refraction glass | OPTIONAL / NON-CORE | `liquid-glass-react` only after API and browser support verification | Never required for readable or functional UI; always provide CSS fallback |
| Squircle corners | OPTIONAL | `@squircle-js/react` only if supported by installed React/version | Use standard radii if package integration is unstable |
| Bottom sheet | REQUIRED for mobile overlays if needed | `vaul` | Use only for real sheet/dialog flows |
| Visual regression | REQUIRED for critical screens | Playwright screenshot tests; optional `pixelmatch` for custom diffs | Keep baselines controlled by browser/OS/viewport |
| Unit/component testing | REQUIRED | Vitest or existing project test stack + Testing Library | Do not introduce duplicate test frameworks |
| Lint/type checks | REQUIRED | Existing ESLint + `tsc --noEmit` | Fix new warnings/errors |

## 3.2 Exact install guidance

For a fresh repository, first create/verify the project and Tailwind setup. Do not run a blind one-liner against an existing app without checking versions.

Example project creation:

```bash
npx create-next-app@latest trading-ai-os --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd trading-ai-os
```

Install the required shared dependencies:

```bash
npm install motion next-themes lucide-react sonner @tanstack/react-query @tanstack/react-table zod react-hook-form @hookform/resolvers
```

Add charting when the chart module is being implemented:

```bash
npm install lightweight-charts
```

Add mobile sheets when required:

```bash
npm install vaul
```

Add the optional scroll timeline packages only if a bounded narrative view has been approved:

```bash
npm install gsap
```

Initialize shadcn/ui and add only used components:

```bash
npx shadcn@latest init
npx shadcn@latest add button dialog dropdown-menu tooltip tabs accordion input select separator sheet skeleton popover command table checkbox switch
```

Optional visual effects must not block the app build. Before installing `liquid-glass-react` or `@squircle-js/react`, verify the current package documentation, peer dependencies, React compatibility, API shape, and production build behavior. If compatibility is unclear, use the CSS fallback described in §5.

## 3.3 Dependency rules

- Keep one lockfile and use the package manager already chosen by the repository.
- Do not install multiple icon libraries.
- Do not use Motion and GSAP to animate the same element or property simultaneously.
- Do not add Lenis globally. Trading interfaces depend on precise native scroll, text selection, and nested panel scroll.
- Do not add WebGL refraction just to make cards look more premium.
- Use CSS variables for all shared colors, materials, dimensions, and motion timings.
- Record any deviation from this table in `docs/implementation-report.md` with the reason.

---

# 4. Application Architecture and State Boundaries

## 4.1 Server/client component rules

- Keep the App Router layout and static shell structure as Server Components wherever practical.
- Add `"use client"` only for components requiring state, event handlers, browser APIs, charting, or animation.
- Do not turn the whole application into one client component.
- Do not read `window`, `localStorage`, or media queries during server render. Use client hooks/effects or the theme library's documented pattern.
- Lazy-load heavy charting and visualization code when it is not needed immediately.

## 4.2 Suggested feature architecture

```text
features/markets/
  components/
  hooks/
  api/
  schemas/
  types.ts
  utils.ts
features/ai-assistant/
  components/
  hooks/
  api/
  schemas/
  types.ts
```

Shared primitives belong in `components/ui`. Product-level compositions belong in `components/shell`, `components/trading`, and feature modules. Avoid a universal `components.tsx` containing every component.

## 4.3 Data boundaries

Create typed service adapters. Example:

```ts
export type DataStatus = "live" | "delayed" | "simulated" | "stale" | "unavailable";

export interface DataEnvelope<T> {
  data: T;
  status: DataStatus;
  updatedAt: string | null;
  sourceLabel?: string;
}
```

The UI must not assume every successful HTTP response is live data. Status metadata should come from the service adapter and appear where it materially affects interpretation.

## 4.4 State ownership

- **URL state:** shareable filters, selected symbol, active tab when useful, report IDs.
- **Server/cache state:** market data, portfolios, orders, alert lists, reports, AI conversation history.
- **Local component state:** popover open state, temporary form edits, hover, active dialog.
- **User preferences:** theme, compact navigation, preferred workspace layout.
- **Sensitive state:** credentials and tokens belong in the approved authentication system, never in UI preferences.

Avoid duplicating server state into multiple unrelated global stores.

## 4.5 Real-time update behavior

- Throttle visual updates where required; do not re-render the entire workspace on every tick.
- Keep stable keys and memoized row/cell components for dense lists.
- Display last-updated time and connection status where relevant.
- On reconnect, reconcile the latest snapshot; do not assume no updates were missed.
- Pause or reduce off-screen updates where safe.
- Preserve user scroll position during market updates.
- Never animate every price tick with a long spring. If using a flash/highlight, keep it short and respect reduced motion.

---

# 5. Materials: Glass, Surfaces, Gradients, and Refraction

## 5.1 Material hierarchy

Use four explicit surface variants:

1. `solid`: charts, dense tables, forms, primary content.
2. `subtle`: secondary panels and cards.
3. `glass-panel`: topbar, sidebar overlays, compact floating controls.
4. `glass-overlay`: dialogs, command palette, sheets, menus.

Do not use glass on every market-data cell. The underlying content must remain readable in both themes.

## 5.2 Base glass CSS

```css
.glass-panel {
  position: relative;
  isolation: isolate;
  background: var(--glass-fill-panel);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--glass-shadow);
  -webkit-backdrop-filter: saturate(145%) blur(18px);
  backdrop-filter: saturate(145%) blur(18px);
}

.glass-overlay {
  position: relative;
  isolation: isolate;
  background: var(--glass-fill-overlay);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-popover);
  -webkit-backdrop-filter: saturate(160%) blur(24px);
  backdrop-filter: saturate(160%) blur(24px);
}

@supports not ((backdrop-filter: blur(1px))) {
  .glass-panel { background: var(--surface-1); }
  .glass-overlay { background: var(--surface-1); }
}
```

## 5.3 Exact glass sheen/specular

Only apply sheen to selected shell surfaces. Never apply it to dense chart canvases, tables, or text-heavy panels.

```css
.glass-sheen::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: var(--glass-sheen-opacity, 0.35);
  mix-blend-mode: soft-light;
  background:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.78) 0%,
      rgba(255, 255, 255, 0.26) 12%,
      rgba(255, 255, 255, 0.04) 34%,
      transparent 52%,
      rgba(255, 255, 255, 0.12) 78%,
      rgba(255, 255, 255, 0.28) 100%
    );
  mask-image: linear-gradient(to bottom, #000 0%, rgba(0,0,0,.65) 34%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, rgba(0,0,0,.65) 34%, transparent 100%);
}
.dark .glass-sheen::before,
[data-theme="dark"] .glass-sheen::before {
  mix-blend-mode: screen;
  opacity: 0.22;
  background:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.38) 0%,
      rgba(255, 255, 255, 0.12) 18%,
      transparent 50%,
      rgba(255, 255, 255, 0.08) 78%,
      rgba(255, 255, 255, 0.16) 100%
    );
}
```

Ensure the glass host has `overflow: hidden` only when clipping is intended, `border-radius` set, and `position: relative`. If pseudo-element stacking covers content, set content wrappers to `position: relative; z-index: 1`.

## 5.4 Refraction decision and fallback

Refraction is a **progressive enhancement**, not a requirement for the OS shell to function. The baseline must look finished without it. Browser capability, GPU load, accessibility preferences, and library API compatibility can differ.

If `liquid-glass-react` is approved after verifying the installed version's real API, isolate it in one wrapper such as `LiquidGlassSurface`. Do not spread library-specific props across every feature. Keep the wrapper API stable and fall back to `.glass-panel`.

Do not copy unverified props into production merely because an example elsewhere mentions them. Before implementation, check the installed package's README/types for the exact names and ranges of `displacementScale`, `elasticity`, `aberrationIntensity`, and any browser detection hook. If the package/version does not support a prop, document the incompatibility and use the CSS fallback rather than fabricating an API.

Required fallback behavior:
- Refraction off in reduced-motion mode if it creates motion.
- Refraction off on unsupported browsers/devices or when performance is poor.
- Solid/translucent fallback retains contrast and border separation.
- The fallback must be visually intentional, not a broken empty rectangle.
- Never make a trading decision or data value harder to read to show an effect.

## 5.5 Ambient background

Use subtle gradients only behind shell chrome or empty dashboard canvas. Do not put moving gradients behind dense numbers or charts.

```css
.app-canvas {
  background:
    radial-gradient(900px 560px at 4% -12%, rgba(0, 113, 227, 0.055), transparent 62%),
    radial-gradient(720px 480px at 100% 0%, rgba(104, 91, 214, 0.045), transparent 60%),
    var(--canvas);
}
.dark .app-canvas,
[data-theme="dark"] .app-canvas {
  background:
    radial-gradient(900px 560px at 4% -12%, rgba(41, 151, 255, 0.09), transparent 62%),
    radial-gradient(720px 480px at 100% 0%, rgba(120, 102, 255, 0.055), transparent 60%),
    var(--canvas);
}
```

Optional grain may be used at extremely low opacity only if supplied as a tiny, licensed local asset. Do not load a large animated noise video or remote background.

---

# 6. Shared Component Contracts

All shared components must support both themes, keyboard focus, disabled/loading states where applicable, and consistent semantic tokens.

## 6.1 Buttons

Variants:
- `primary`: main action, accent fill.
- `secondary`: neutral surface and border.
- `ghost`: no persistent background; hover surface.
- `danger`: destructive or high-risk action, with explicit confirmation where required.
- `icon`: square icon-only control with accessible label and tooltip.

Sizes:
- `sm`: 32px high, horizontal padding 10px.
- `md`: 40px high, horizontal padding 14px.
- `lg`: 44px high, horizontal padding 16px.
- Icon button: 36px default; 40px in topbar; 44px touch target on mobile.

States: default, hover, active/pressed, focus-visible, disabled, loading. Loading state must not shift button dimensions.

## 6.2 Inputs and selects

- Default height: 40px; primary forms can use 44px.
- Radius: 9px.
- Label sits above input, 12px medium.
- Help/error text: 12px with semantic color.
- Focus ring: 2px using `--focus-ring`, with enough offset to remain visible.
- Never rely on placeholder text as the only label.
- Numeric inputs must preserve decimal precision and handle empty/invalid states.
- Currency and quantity formatting must be explicit and locale-aware.

## 6.3 Cards and panels

- Standard panel radius: 16px.
- Standard padding: 16px.
- Header: title + optional description + actions, with a bottom separator only when it helps hierarchy.
- Panel content must have clear min-height behavior.
- Avoid decorative shadows on every nested section.
- Empty/loading/error states belong inside the panel's content area and must not cause major layout shifts.

## 6.4 Navigation item

- Desktop row height: 40px.
- Compact rail icon button: 44px square.
- Icon: 18px.
- Label: 13px, medium.
- Active state: subtle accent background plus clear icon/text emphasis; do not use only a tiny colored dot.
- Tooltip appears after a short delay in compact mode and never hides the accessible label.
- Mobile tap target: at least 44×44px.

## 6.5 Switches, segmented controls, tabs

- Switch track target: approximately 44×26px; thumb approximately 20px.
- Segmented control container: 36px high; each segment has at least 32px effective hit height.
- Tabs: visible selected indicator plus accessible `tablist`, `tab`, and `tabpanel` semantics when they are actual tabs.
- Use Motion `layoutId` only for the selected indicator, not for every child in a large panel.
- Keyboard arrows must follow the expected semantics for the selected primitive.

## 6.6 Dialogs, command palette, sheets, toasts

- Dialog width: 480px standard; 640–760px for complex forms; max width `calc(100vw - 24px)`.
- Dialog radius: 20px; overlay dimming should not erase context completely.
- Command palette: target 640px wide on desktop, viewport-safe on mobile.
- Mobile sheets: use Vaul when compatible, with clear drag handle, title, close button, and scrollable content.
- Toasts: concise and non-blocking; errors must also be represented in the relevant module.
- Never show an order-placement success toast before the backend confirms the order.

## 6.7 Tables and data grids

- Compact row height: 36px; standard row height: 44px.
- Header height: 36px.
- Numeric cells: right-aligned, tabular numbers, consistent decimals per column.
- Row hover must not obscure positive/negative semantics.
- Sticky headers only when scrolling behavior is tested.
- Sort controls require keyboard accessibility and visible sort direction.
- Empty/loading/error states must explain what is happening.
- Use virtualization only when data volume justifies it; test keyboard navigation and screen-reader behavior if virtualized.

---

# 7. OS Shell Layout and Interaction Specification

## 7.1 Desktop shell

Default at 1440px:
- Topbar: 52px high, sticky at top, z-index `--z-topbar`.
- Sidebar: 248px expanded, 68px compact.
- Workspace canvas fills remaining width and height.
- Main content max width: 1600px, but dense terminal workspaces may use the available width.
- Main content padding: 24px.
- Workspace header uses a title, concise context, and right-aligned primary actions.
- Sidebar and topbar may use `glass-panel`; workspace content remains mostly solid.

Suggested structure:

```tsx
<AppShell>
  <Topbar />
  <div className="app-shell__body">
    <Sidebar />
    <main className="app-shell__main">
      <WorkspaceRouter />
    </main>
    <ContextPanel />
  </div>
  <ToastViewport />
  <GlobalCommandPalette />
</AppShell>
```

This is a structural example. Adapt component names and file placement to the repository. Do not place the entire application inside a single client component just to make this layout work.

## 7.2 Topbar behavior

- Default height: 52px.
- Sticky at `top: 0`.
- Background: `var(--glass-fill-panel)`, with a subtle bottom border.
- On scrollable workspace content, switch to the scrolled state when `scrollY > 20` for document scrolling or when the primary workspace scroll container exceeds 20px.
- Scrolled state: border-bottom uses `var(--border-default)` and fill opacity is 0.85 (use a dedicated token such as `--glass-fill-panel-scrolled`).
- Transition: 200ms ease-out for background/border only.
- Do not make the topbar height change on scroll.
- Avoid `window` access during SSR; use a client hook with cleanup or observe the actual scroll container.
- Nested panel scrolling must not trigger the global topbar state unless that is explicitly intended.

```css
:root { --glass-fill-panel-scrolled: rgba(255, 255, 255, 0.85); }
.dark { --glass-fill-panel-scrolled: rgba(27, 27, 31, 0.90); }

.topbar {
  height: var(--topbar-height);
  position: sticky;
  top: 0;
  z-index: var(--z-topbar);
  background: var(--glass-fill-panel);
  border-bottom: 1px solid transparent;
  transition:
    background-color 200ms ease-out,
    border-color 200ms ease-out;
}
.topbar.is-scrolled {
  background: var(--glass-fill-panel-scrolled);
  border-bottom-color: var(--border-default);
}
```

## 7.3 Sidebar / Dock-inspired navigation

The primary navigation is a vertical sidebar/rail. A horizontal Dock-like quick launcher may be added as a secondary, optional desktop affordance, but it must not replace the primary navigation or imply that the app is a literal operating system.

- Expanded sidebar width: 248px.
- Compact rail width: 68px.
- Item height: 40px.
- Group spacing: 20px.
- App name/logo block sits at top.
- Main modules are grouped separately from secondary tools/settings.
- Compact state shows tooltips and screen-reader labels.
- Mobile uses a sheet or bottom navigation; the desktop rail should not simply shrink to 40px.

**Dock magnification decision:** do not add the Magic UI Dock dependency in the first implementation phase. If a Dock-style launcher is approved during visual polish, use Magic UI's supported Dock component only after checking its current API/peer dependencies, with target `magnification: 48` and `distance: 120`, desktop-only (viewport >= 1024px). These are target behavior values, not a promise that every current version exposes identical prop names. If the installed component does not expose these exact props, implement the equivalent with the current documented API or keep the normal rail; do not invent props.

Requirements for an optional Dock:
- No surrounding layout shift while icons magnify.
- Each icon has a label/tooltip and accessible name.
- Keyboard focus receives an equivalent highlight; magnification cannot be hover-only.
- Respect `prefers-reduced-motion`; disable scaling when reduced motion is requested.
- Do not render the Dock on mobile/tablet or on dense chart screens where it consumes useful space.

## 7.4 Workspace canvas

- Every route starts with a consistent workspace header.
- The header title is left aligned; actions are right aligned; responsive actions may collapse into a menu.
- Avoid a giant page title on every screen. Use 22px workspace heading and 14px contextual description.
- Content grids use CSS Grid with stable min-widths and `minmax(0, 1fr)`.
- Any resizable multi-panel layout must have minimum panel sizes, keyboard-accessible controls, and a reset-layout action.
- Do not store arbitrary layout state in a way that breaks after a module is removed; version saved layout preferences.

## 7.5 Global command palette

Required interactions:
- Open with `Cmd/Ctrl + K`.
- Escape closes it.
- Arrow keys navigate; Enter activates.
- Search results grouped by pages, symbols, actions, reports, and recent AI conversations where supported.
- Search is debounced where backed by a remote API.
- Empty results show a helpful empty state.
- Focus moves into the palette on open and returns to the trigger on close.
- Do not capture `Cmd/Ctrl + K` while the user is composing text in an input/contenteditable region if it conflicts with expected browser/app behavior.

---

# 8. Trading Workspace Specifications

## 8.1 Overview dashboard

Purpose: answer “what is happening?” at a glance.

Recommended layout:
- Header: “Overview”, date/context, data freshness status.
- Row 1: portfolio value, daily P&L, exposure, buying power/account status if supported.
- Row 2: market overview/index cards and watchlist summary.
- Row 3: chart/market trend and AI briefing.
- Row 4: recent orders/activity and alerts.
- Use a 12-column grid at desktop, but do not force every card into equal size.
- Metric cards must indicate currency/percentage/time range and data status.
- If values are simulated, show a persistent demo-data indicator.

## 8.2 Markets

Required states:
- Symbol/index overview.
- Search/filter controls.
- Quote details: price, absolute change, percentage change, session/time metadata, data source/status.
- Gainers/losers/most active lists only if the data provider supports them.
- Loading, no-results, unavailable, delayed, and stale states.
- Do not hardcode current prices or present sample data as real.

## 8.3 Watchlists

- Multiple lists if supported by product requirements.
- Add/remove symbol through a validated search flow.
- Row shows symbol, name, price, change, and a compact inline SVG sparkline when historical samples are available.
- **Sparkline decision: use a small, purpose-built inline SVG component; do not add a separate sparkline library.** `lightweight-charts` is reserved for full chart workspaces and is overkill for tiny row-level trends.
- Sparkline component accepts a typed numeric array and optional semantic direction (`positive`, `negative`, `neutral`). It renders a single SVG path, has no axes, labels, tooltip, animation, or interaction by default, and uses `currentColor`/semantic tokens for its stroke.
- Default sparkline box: 72×24px; stroke width 1.5px; no fill. Keep it decorative with `aria-hidden="true"` when the adjacent price/change text already conveys the same information. If the trend is meaningful and not represented elsewhere, provide an accessible label/summary.
- Handle fewer than two valid data points by rendering a neutral placeholder line or omitting the sparkline; never fabricate samples.
- Reorder interactions must have a keyboard alternative.
- Empty state includes a functional “Add symbol” action.
- Preserve selected watchlist when navigating into a symbol detail and returning.

## 8.4 Charts

- Use `lightweight-charts` for financial candlestick/line charting after confirming its current API and license fit the project.
- Load chart code client-side and dynamically where appropriate.
- Provide symbol, timeframe, chart type, and indicator controls only when implemented.
- **Chart theme is locked to the shared semantic tokens.** Define one typed theme mapper and use it for initial chart options, series options, and live theme updates. Do not scatter hex colors across chart components.
- Required mapping:
  - chart background: `--surface-1`
  - chart text/axis labels: `--text-secondary`
  - vertical and horizontal grid: `--border-subtle`
  - crosshair line: `--text-tertiary` with a dashed style where supported
  - crosshair label background: `--surface-3`
  - crosshair label text: `--text-primary`
  - up candle/body/wick/border: `--positive`
  - down candle/body/wick/border: `--negative`
  - volume up/down: positive/negative at approximately 45% opacity where supported
  - last-price line: `--accent`
  - scale border: `--border-default`
- Convert CSS custom properties to computed colors in a client-side chart-theme utility. Do not pass strings such as `var(--surface-1)` to chart APIs unless the installed API explicitly supports CSS variables; most canvas renderers require resolved color strings.
- On theme change, call the chart API's supported `applyOptions`/series update methods and request a resize only if required. Do not destroy and recreate the chart on every theme toggle.
- Provide symbol, timeframe, chart type, and indicator controls only when implemented.
- Chart data must include timestamps and source/freshness metadata.
- Handle market closed, missing history, delayed feed, and disconnected state.
- Avoid excessive animation during streaming updates.
- Provide a non-canvas accessible summary or table when feasible for important chart data.
- Test resizing, tab changes, theme changes, and unmount cleanup.

Example theme mapper (adapt option names to the installed `lightweight-charts` version; verify the installed type definitions):

```ts
type ChartTheme = {
  background: string;
  text: string;
  grid: string;
  border: string;
  crosshair: string;
  crosshairLabelBackground: string;
  crosshairLabelText: string;
  up: string;
  down: string;
  accent: string;
};

export function getChartTheme(isDark: boolean): ChartTheme {
  return isDark
    ? {
        background: "#151518",
        text: "#B4B4BC",
        grid: "rgba(255,255,255,0.07)",
        border: "rgba(255,255,255,0.11)",
        crosshair: "#85858F",
        crosshairLabelBackground: "#25252A",
        crosshairLabelText: "#F5F5F7",
        up: "#4DD181",
        down: "#FF6B6B",
        accent: "#2997FF",
      }
    : {
        background: "#FFFFFF",
        text: "#626269",
        grid: "rgba(29,29,31,0.08)",
        border: "rgba(29,29,31,0.12)",
        crosshair: "#86868B",
        crosshairLabelBackground: "#E8E8ED",
        crosshairLabelText: "#1D1D1F",
        up: "#16803C",
        down: "#D92D20",
        accent: "#0071E3",
      };
}
```

Use the mapper's values as the canonical canvas colors because CSS custom properties cannot always be resolved directly inside canvas renderers. Keep them synchronized with §2 tokens. For candlestick series, explicitly set up/down body, wick, and border colors; for line charts, use `--accent`. Test contrast at actual chart sizes.


## 8.5 Portfolio

- Separate summary metrics from positions table.
- Include currency, valuation timestamp, unrealized/realized P&L definitions where data is available.
- Use explicit units and date ranges.
- Never infer the account's holdings from sample data.
- Empty state should distinguish “no connected account” from “connected account with no positions”.
- Sensitive account identifiers should be masked where appropriate.

## 8.6 Orders and order ticket

- Orders table includes status, symbol, side, quantity, type, limit/stop price when relevant, submitted/updated time, and source.
- Status uses text and icon, not color alone.
- An order ticket must validate required fields, price/quantity precision, and supported order types.
- Before a real order is submitted, show a confirmation summary with side, symbol, quantity, order type, estimated value, applicable warnings, and destination/account when available.
- If the backend does not support real orders, the CTA must say “Simulate order” or be disabled. Never imply that a simulated order reached an exchange.
- Double-submit protection is required.
- Do not allow an AI message to trigger an order without explicit user review and confirmation.

## 8.7 Strategies and backtesting

- Clearly separate strategy configuration, run progress, and result review.
- Validate date ranges, symbol universe, parameters, and required data before running.
- Display assumptions and data coverage where known.
- Backtest results must identify fees/slippage assumptions and data timeframe if the backend supplies them.
- Do not promise future returns from historical performance.
- Show empty, queued, running, succeeded, failed, and cancelled states.
- Long-running jobs should preserve job IDs and allow the user to return to status/results.

## 8.8 Alerts

- Alert creation form must state what condition is being monitored and when it triggers.
- Support edit, pause/resume, and delete only if backed by a working API.
- Confirmation for delete; no destructive action on a row click.
- Display last-triggered and delivery status only if available.
- Empty state must explain how to create an alert.

## 8.9 Reports

- Reports list includes title, creation date, status, type, and source.
- Report detail supports headings, charts/tables, source citations, export only if implemented.
- Failed or partial report generation must be labelled.
- Do not show invented AI citations or fabricated sources.
- If export is a placeholder, label it clearly and do not render a fake download success.

---

# 9. AI Assistant Workspace Specifications

## 9.1 Main layout

Desktop:
- Conversation list/rail: approximately 260px when visible.
- Conversation canvas: flexible center column, max reading width around 880px unless a chart/report side panel is open.
- Optional inspector: 300–360px for sources, tool activity, or selected symbol context.
- Composer sits at the bottom of the conversation region; it must not cover the last message.
- On smaller widths, conversation history and inspector become sheets or separate views.

## 9.2 Message types

Use a typed discriminated union. Example:

```ts
export type AssistantMessage =
  | { id: string; role: "user"; content: string; createdAt: string }
  | { id: string; role: "assistant"; content: string; createdAt: string; status: "streaming" | "complete" | "failed" }
  | { id: string; role: "tool"; toolName: string; status: "queued" | "running" | "succeeded" | "failed"; summary?: string; createdAt: string }
  | { id: string; role: "system"; content: string; createdAt: string };
```

Adapt to the backend's actual schema. Do not force a fabricated schema onto an existing API. Tool results should be associated with the correct assistant turn and conversation.

## 9.3 AI activity visibility

The user should be able to understand:
- What the assistant is doing.
- Whether it is waiting for data, calling a tool, generating, or finished.
- Which sources or data ranges informed the response.
- Whether a tool failed or returned partial data.
- Whether the response is based on simulated data.
- Which actions require confirmation before execution.

Use concise activity rows such as “Fetching quote”, “Reading portfolio”, “Running backtest”, or “Preparing report”. Do not expose hidden chain-of-thought or internal private reasoning. Show user-facing summaries of actions, sources, and outcomes.

## 9.4 Streaming behavior

- **Markdown renderer decision: use `react-markdown` + `remark-gfm` for assistant message content.** Add `rehype-highlight` with `highlight.js` only if syntax highlighting is needed; do not add multiple competing highlighters. If a package/API is incompatible with the installed React/Next.js version, document the issue and choose one maintained compatible equivalent.
- Install when implementing rich assistant messages:

```bash
npm install react-markdown remark-gfm rehype-highlight highlight.js
```

- Render only trusted, sanitized Markdown output. Do not enable raw HTML (`rehype-raw`) by default. External links should open safely with `rel="noreferrer"` and clear affordances.
- Code blocks must wrap/scroll horizontally without widening the conversation layout; include a copy-code control with a real clipboard action and an accessible label.
- GFM tables should be responsive: wrap them in an overflow container rather than forcing page-wide horizontal scrolling.
- Streaming Markdown must not cause repeated expensive remounts. Keep stable message IDs and throttle updates or use a suitable incremental rendering strategy when required.
- Use a consistent design for headings, lists, tables, blockquotes, inline code, code blocks, links, and citations; citations must still come from actual backend metadata.
- Use the backend's actual streaming protocol (SSE, fetch stream, or WebSocket) if specified.
- Show a streaming state without repeatedly remounting the whole message list.
- Keep scroll anchored to the bottom only when the user is already near the bottom; do not yank the user down if they scroll up.
- Provide a Stop button if cancellation is supported.
- Handle partial output, timeout, disconnect, retry, and server error.
- Do not append duplicate tokens/messages after reconnect.
- Avoid expensive Markdown re-rendering on every token; throttle or incrementally update where necessary.
- When a message completes, preserve a stable message ID and allow copy/retry if supported.

## 9.5 Composer

- Text area auto-grows to a reasonable max height, then scrolls internally.
- Send button has a clear disabled/loading state.
- Enter sends only if that is the chosen product convention; Shift+Enter inserts a newline. Document and test the behavior.
- Support attachment/context chips only if the backend can consume them.
- Display active symbol/portfolio context as removable chips when applicable.
- Avoid implying the AI can see account data unless the connected backend actually supplies it.

## 9.6 Sources and citations

- Render source cards only from actual backend source metadata.
- A citation should link to its real source or show a useful source detail panel.
- Missing citations must not be replaced with fabricated domains.
- Distinguish live market data, delayed provider data, user-supplied context, and AI-generated commentary.
- If the response is based on simulated market data, display that fact.

## 9.7 AI action safety

- AI suggestions are informational until a user explicitly chooses an action.
- Trade/order, alert, strategy activation, account change, or deletion actions require a review/confirmation step.
- Confirmation shows the exact parameters and side effects.
- The user can cancel without the action being submitted.
- On backend failure, show failure and preserve the form for correction/retry.
- Do not make the confirmation modal itself a hidden one-click execution path.

---

# 10. Exact Motion System

## 10.1 Motion defaults

Motion for React is the default library. Use CSS transitions for simple hover/color/border changes and Motion for stateful entrances, presence, and layout transitions.

```ts
export const motionTokens = {
  duration: {
    instant: 0.08,
    fast: 0.14,
    normal: 0.20,
    panel: 0.24,
    modal: 0.28,
    section: 0.45,
  },
  ease: {
    standard: [0.2, 0, 0, 1] as const,
    enter: [0.16, 1, 0.3, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
    linear: [0, 0, 1, 1] as const,
  },
  spring: {
    ui: { type: "spring", stiffness: 420, damping: 34, mass: 0.8 },
    soft: { type: "spring", stiffness: 300, damping: 30, mass: 0.9 },
    layout: { type: "spring", stiffness: 360, damping: 36, mass: 0.85 },
  },
};
```

Do not use bouncy spring presets on financial controls. Use `ui`/`soft` for modest tactile response and use short ease-out transitions for critical states.

## 10.2 Required variants

```ts
import type { Variants } from "motion/react";

export const motionVariants: Record<string, Variants> = {
  page: {
    hidden: { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
    },
  },
  heroMetric: {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  },
  navItem: {
    rest: { scale: 1, x: 0 },
    hover: {
      scale: 1.015,
      x: 1,
      transition: { duration: 0.14, ease: [0.2, 0, 0, 1] },
    },
    tap: { scale: 0.985, transition: { duration: 0.08 } },
  },
  panel: {
    hidden: { opacity: 0, y: 8, scale: 0.995 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      y: 4,
      scale: 0.995,
      transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
    },
  },
  dialog: {
    hidden: { opacity: 0, y: 8, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      y: 4,
      scale: 0.99,
      transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
    },
  },
  toast: {
    hidden: { opacity: 0, y: 8, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
    },
    exit: { opacity: 0, y: 4, transition: { duration: 0.12 } },
  },
  listItem: {
    hidden: { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.20, ease: [0.16, 1, 0.3, 1] },
    },
  },
  segmentedIndicator: {
    transition: { type: "spring", stiffness: 420, damping: 36, mass: 0.75 },
  },
};
```

## 10.3 Section-specific motion recipes

- **Route transition:** fade + 6px vertical shift, 240ms. Do not delay access to key data for a theatrical entrance.
- **Panel mount:** fade + 8px vertical shift, 220ms.
- **Nav hover:** 140ms, scale no greater than 1.015, no large bounce.
- **Button press:** scale 0.985 for 80ms; no overshoot.
- **Dialog:** 220ms enter / 140ms exit.
- **Toast:** 180ms enter / 120ms exit.
- **List stagger:** 40ms between rows, maximum initial stagger for 8 rows; do not animate thousands of rows.
- **AI activity state:** small opacity/progress changes; avoid distracting pulsing.
- **Live market updates:** no spring animation per tick; optionally use a brief 160ms background tint.

Price-tick flash implementation (use sparingly; only for cells whose value changed):

```css
@keyframes price-tick-up {
  0% { background-color: var(--positive-soft); }
  100% { background-color: transparent; }
}
@keyframes price-tick-down {
  0% { background-color: var(--negative-soft); }
  100% { background-color: transparent; }
}

.tick-up {
  animation: price-tick-up 160ms ease-out both;
}
.tick-down {
  animation: price-tick-down 160ms ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .tick-up,
  .tick-down {
    animation: none;
  }
}
```

Apply the class only when the numeric value changes directionally, and remove/restart it via a controlled class/key change or a small hook; do not force a React render for every tick across the whole table. Do not use the flash as the only indication of direction: retain sign, text, and semantic color. If the cell's normal background is not transparent, define a token-based final background instead of letting the animation reveal an incorrect canvas color.
- **Theme switch:** 200ms for color/background/border, but disable transitions during initial hydration to avoid flash.

## 10.4 Stagger example

```tsx
const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};
```

Do not stagger all dashboard cards if that delays the user's ability to inspect market data. Animate only on first mount and only when the number of children is bounded.

## 10.5 Reduced motion

Respect `prefers-reduced-motion`. When enabled:
- Remove non-essential y/scale transforms.
- Do not autoplay or scrub cinematic timelines.
- Keep state changes immediate or use a short opacity transition.
- Never convey a status solely through motion.
- Disable optional refraction movement if it causes visual motion.
- Test this mode explicitly.

## 10.6 GSAP and scroll policy

GSAP + ScrollTrigger is **conditional**, not a global UI dependency. It is appropriate only for a bounded educational/onboarding narrative such as “how the AI analysis pipeline works,” not the main trading terminal.

If used:
- Define a fixed scroll container/section.
- Pin only the local storytelling region, not the whole application shell.
- Clean up with `gsap.context()` and revert on unmount.
- Disable pin/scrub behavior on small screens and reduced-motion preference.
- Avoid Lenis for global scrolling.
- Do not hijack wheel/touch scrolling or block native nested panel scroll.

Example state mapping for a 3-state educational showcase:

| Scroll progress | Visual state | Caption | Background |
|---:|---|---|---|
| 0–33% | Input data cards scale 1.00 → 0.97 and fade to 0.25 | “Collect context” | Base canvas |
| 34–66% | AI activity panel opacity 0.25 → 1; scale 0.97 → 1 | “Analyze and validate” | Slight accent radial glow |
| 67–100% | Report/result panel opacity 0.25 → 1; scale 0.97 → 1 | “Present evidence and risks” | Return to base canvas |

This timeline is illustrative and must remain confined to the educational view. Do not use this scroll-linked behavior for orders, charts, or essential trading controls.

---

## 10.7 First-run onboarding narrative

Onboarding is an optional, dismissible, first-run experience for explaining the workspace—not a mandatory scroll-jacking landing page.

**Entry point:** first successful app visit after the user has a valid session or enters demo mode, and only if `onboardingCompleted` is false. If authentication is not yet implemented, gate it behind an explicit demo-mode entry instead of assuming a user identity.

**Format:** a small 3-step modal/dialog or dedicated onboarding route. Prefer a dialog for a quick tour; use a dedicated route only if the content becomes longer than three steps.

Steps:
1. **Your workspace** — explain sidebar navigation, workspace switching, global search, and theme preferences.
2. **Markets and context** — explain watchlists, charts, data freshness, and the difference between live/delayed/simulated data.
3. **AI research** — explain that AI responses can show tool activity and sources, and that financial actions require explicit review/confirmation.

Controls:
- Visible `Skip tour` action on every step.
- `Back` on steps 2–3.
- `Continue` on steps 1–2.
- `Finish` on step 3.
- Progress indicator such as “1 of 3”; never rely on color alone.
- Escape closes only if the flow can safely be skipped; otherwise provide a clear close/skip action.
- Focus is trapped in the dialog while open and returns to the initiating element on close.
- Persist completion in the user's normal preference/profile system when available. Until then, a non-sensitive local UI preference is acceptable; do not store secrets.
- Provide a “Replay tour” option from Help/Settings if that menu exists.
- No autoplay, no forced scroll position, and no scroll pinning in the main trading app.
- Reduced-motion mode uses simple opacity changes or no transition.
- If a step's feature is not implemented, do not describe it as available; remove or label the step as upcoming.

The §10.6 GSAP educational showcase is separate and is not the default onboarding flow. Do not make users scroll through a pinned animation before accessing their trading workspace.

## 10.8 Apple-style public-site behaviour

Applies to the public website only (`/market`, `/platform`, `/pricing`, marketing pages). Never to the trading workspace, charts, orders or the AI assistant, where §10.1–10.5 govern.

### Principles

- **One idea per screen.** Each section makes a single statement: a short centred heading, one supporting line, then one visual. Sections breathe (`py-20` mobile, `py-28` desktop); no section competes with its neighbour.
- **Display type, not decoration.** Hero title `clamp(2.75rem, 6vw, 5.25rem)`, line-height 1.04, tracking −0.035em, weight 650; section title `clamp(2rem, 4vw, 3.25rem)`; lede `clamp(1.1rem, 1.6vw, 1.4rem)` in the secondary colour. The second line of a two-line heading is set in the secondary colour instead of a different size. Devanagari editions keep normal tracking and line-height ≥ 1.2.
- **Restraint.** Solid surfaces, hairline borders, one accent (gold) reserved for the primary button, links and selection. No gradient text, glows, beams, grid backdrops, tilt cards, tickers or shimmer sweeps — they read as generated.
- **Photography in frames.** Product shots and photos sit in a rounded frame (28px radius, hairline border, soft shadow), never full-bleed behind text. Copy and cards are placed beside a photo's subject, never over it. Photos are HD (≥1200px for cards, ≥2560px for frames), served at quality 85 with accurate `sizes`.
- **Native scroll.** No scroll hijacking, no smooth-scroll libraries, no GSAP pinning on the public site. Pinning uses CSS `position: sticky`; progress comes from `useScroll` on a local target.

### Behaviours

| Behaviour | Spec | Reference |
|---|---|---|
| Entrance | Fade-up 20px → 0, 0.5–0.55s, ease `[0.25, 0.1, 0.25, 1]`, 50–80ms stagger, once per element. Above-the-fold content reaches full opacity within 0.6s. | `HeroEnter`, `Reveal` |
| Scroll-settle | A product shot eases up, grows and brightens as it enters: scale 0.92 → 1, y 40 → 0, opacity 0.4 → 1, mapped to scroll from `start end` to `start 30%`. Transform origin top-centre. | `ScrollSettle` |
| Statement words | A single statement paragraph whose words brighten (0.18 → 1) one by one between `start 85%` and `end 50%`. Full text is also present for screen readers. | `ScrollWords` |
| Sticky tour | The visual is pinned at `top: 14–16vh` while steps scroll past; each step is `min-height: 72–76vh`, becomes active at 60% in view, and inactive steps rest at 0.35 opacity. The pinned visual swaps with a 250–300ms fade and scale 0.97 → 1. Below `lg` the visual sits under each step; pinned visuals are `aria-hidden` and every step carries the text. | `StickyTour`, `ExploreCapabilities` |
| Gallery | A horizontal `scroll-snap` row of framed tiles with native overflow scrolling; arrows optional, no autoplay, hover scale ≤ 1.04 on the image only. | `KeyTopics` |
| Nav | Transparent over the hero, becomes a material bar once the page scrolls; height is constant so content never jumps. | `SiteNav` |

### Rules

- Animate only `transform` and `opacity`; cross-fade shadows and glows with opacity layers instead of animating `box-shadow` or `filter`.
- Reduced motion: collapse the motion ranges (scale 1, y 0, opacity 1) rather than removing elements, so nothing is hidden and markup is unchanged. Gate on an SSR-safe media query (`useMediaQuery`, false on the server and first client render); never branch rendered output or `initial` props on `useReducedMotion()`, which causes hydration mismatches.
- `initial` must be identical on server and client; `MotionConfig reducedMotion="user"` drops transforms globally.
- No parallax or sticky behaviour below `lg`; mobile gets the stacked layout.
- Content is honest: no fake prices, charts, tickers, testimonials or accuracy claims in any animated visual.

Reference implementations: `src/modules/platform/components/mac/motion-kit.tsx`, `src/modules/platform/components/overview/ExploreCapabilities.tsx`, `src/modules/markets/components/motion-scroll.tsx`.

---

# 11. Interaction Contracts and Error States

## 11.1 Every module must define these states

- Initial loading
- Refreshing while stale content remains visible
- Empty/no data
- Error with retry if retry is safe
- Offline/disconnected
- Permission denied
- Partial data
- Simulated/demo data
- Success after backend confirmation
- Destructive confirmation where applicable

## 11.1.1 Empty-state visual contract

Empty states must be calm, specific, and action-oriented. Do not fill them with large stock illustrations or marketing-style artwork.

- Illustration style: simple line icon or small original geometric SVG; monochrome `--text-tertiary` with one small `--accent` detail. No external image dependency.
- Icon size: 40px inside a 64×64px soft surface tile for a full workspace empty state; 20px for a compact panel/table empty state.
- Container: centered in the available panel area; max text width 360px; vertical gap 12px; no excessive card-within-card nesting.
- Heading: 15px / 600 weight, `--text-primary`.
- Description: 13px / 1.5 line-height, `--text-secondary`, maximum two short sentences.
- Primary action: one relevant button, usually `md` size. Optional secondary action is a text/ghost button.
- No animated illustration by default. If an animation is used, it must be subtle, short, and disabled under reduced motion.
- Never imply that the system is broken when a normal first-use state is expected.

Copy patterns:
- **No watchlist:** “Your watchlist is empty.” / “Add symbols to keep the markets you follow in one place.” / action: “Add symbol”.
- **No portfolio connection:** “No portfolio connected.” / “Connect a supported account to view positions and performance.” / action only if a real connection flow exists.
- **No AI conversations:** “Start a conversation.” / “Ask about a symbol, market concept, or your available portfolio context.” / action: focus the composer.
- **No reports:** “No reports yet.” / “Generated reports will appear here when a run completes.” / action: “Create report” only if the report flow exists.
- **No search results:** “No matches found.” / “Try another symbol, page, or action.” / action: focus the search input.
- **Unavailable data:** do not call this an empty state. Show “Data unavailable” or “Connection lost”, explain whether the issue is temporary, and offer retry only when safe.

Do not use the same generic “Nothing here” copy for every module. The illustration and action must match the context.

## 11.2 Forms

- Validate on submit and optionally on blur for simple fields.
- Keep labels and error text associated with controls.
- Preserve user input when a network request fails.
- Disable duplicate submission while pending.
- Use schema validation shared between UI and service layer where practical.
- Show field-level error plus a concise form-level message when necessary.

## 11.3 Confirmations

Use confirmation for:
- Real order placement
- Cancelling an order if the backend says it is consequential
- Deleting a saved strategy, alert, or report
- Enabling automation or scheduled execution
- Changing important account or provider settings

Do not require confirmation for low-risk navigation or non-destructive filters.

## 11.4 Keyboard shortcuts

Required:
- `Cmd/Ctrl + K`: command palette
- `Escape`: close the topmost modal/popover when appropriate
- `?`: optional shortcut help, only if implemented
- `Cmd/Ctrl + Enter`: optional send in AI composer if supported
- All navigation and controls remain operable without a pointer

Avoid intercepting browser shortcuts that users reasonably expect to work.

---

# 12. Accessibility and Responsive QA

## 12.1 Accessibility requirements

- Semantic landmarks: header, nav, main, complementary, footer where appropriate.
- One clear page/workspace heading hierarchy.
- Accessible names for icon-only buttons.
- Visible focus ring with minimum contrast.
- Dialog focus management and focus return.
- Keyboard-operable tabs, menus, tables, and command palette.
- Status conveyed through text/icon in addition to color.
- Contrast target: WCAG 2.2 AA for text and controls wherever applicable.
- Avoid animation as the sole status indicator.
- Use `aria-live="polite"` sparingly for meaningful AI status changes, not for every streamed token.
- Charts need a text summary or accessible data representation where practical.
- Touch targets at least 44×44px for important mobile controls.

## 12.2 Mobile behavior

- At 390px, no full-page horizontal overflow.
- Sidebar becomes a sheet or mobile nav.
- Contextual inspector becomes a sheet or dedicated route.
- Multi-column dashboards collapse to one column.
- Chart toolbar wraps or becomes a menu without hiding the symbol/timeframe.
- Critical order controls remain visible and sufficiently large.
- Modal content is scrollable with safe viewport padding.
- Avoid hover-only information.

---

# 13. Theme Implementation

Use `next-themes` with `attribute="class"`, `defaultTheme="system"`, and `enableSystem` unless product requirements specify another default. Ensure the root layout avoids hydration mismatch according to the installed version's documented approach.

Example:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}
```

Root layout should use the provider with `attribute="class"` and avoid hard-coded theme colors in reusable components.

Theme switch requirements:
- Switches between light/dark/system if the product supports all three.
- All semantic surfaces change via tokens.
- No flash of the wrong theme on first load.
- Transition around 200ms for colors/borders after hydration; suppress initial transitions to avoid flash.
- Chart colors must update with theme changes.
- Test both manual theme and OS preference.
- Theme control needs an accessible label and state.

---

# 14. Reference Screenshots and Visual Verification

## 14.1 Build a project-owned baseline

Do not use Apple's website as the only reference. This is a Trading AI OS, so collect references for both visual language and product workflows.

Create:
```text
docs/references/
  shell-1440-light.png
  shell-1440-dark.png
  overview-1440-light.png
  overview-1440-dark.png
  markets-1440-dark.png
  charts-1440-dark.png
  ai-workspace-1440-dark.png
  portfolio-1440-dark.png
  mobile-shell-390-light.png
  mobile-ai-390-dark.png
```

These filenames are required targets, not claims that the images already exist. Capture actual app screenshots after the relevant screens are implemented. Add reference URLs/notes to `docs/references/README.md` if using external inspiration.

For reproducible screenshots, record:
- Browser and version
- Viewport dimensions
- Device scale factor
- Theme
- Font loading completion
- Data fixture/seed
- Route
- Scroll position
- Animation state
- Timestamp or data snapshot ID

Do not claim pixel-perfect Apple similarity without a comparable target and a defined metric.

## 14.2 Screenshot conditions

Use fixed deterministic fixtures for visual tests. Do not screenshot live market values as the baseline because values change. Disable or freeze non-essential animations during screenshot capture, wait for fonts and chart rendering, and use the same browser/OS environment for baseline and candidate.

Recommended baseline viewports:
- Desktop: 1440×900
- Laptop: 1280×800
- Tablet: 820×1180
- Mobile: 390×844

Capture at minimum:
- Shell + overview
- Markets/watchlist
- Chart workspace
- AI workspace including tool activity
- Portfolio/order review state
- Mobile navigation and AI composer
- Light and dark themes for core shell screens

## 14.3 Playwright visual regression

Use Playwright if the repository supports it. Add `@playwright/test` if not already present and add screenshot baselines for critical routes.

Example:

```ts
import { test, expect } from "@playwright/test";

test("overview shell matches desktop baseline", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");

  await page.getByRole("main").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot("overview-1440-dark.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  });
});
```

A `maxDiffPixelRatio` of `0.01` is a starting threshold, not a universal truth. Do not use an extremely strict threshold until the screenshot environment is deterministic. If `pixelmatch` or a custom image diff is used, document the threshold and exclusions. Review unexpected diffs; do not automatically update baselines just to make CI green.

## 14.4 Objective pass/fail checks

Score only checks that were actually run.

### Layout
- [ ] Topbar height is 52px ± 1px at desktop.
- [ ] Expanded sidebar width is 248px ± 2px.
- [ ] Compact sidebar width is 68px ± 2px.
- [ ] Desktop content uses available width without accidental overflow.
- [ ] At 390px viewport, the document has no horizontal overflow.
- [ ] Primary workspace heading is visible without being clipped.

### Typography
- [ ] Inter loads successfully from `next/font`.
- [ ] Numeric values use tabular numbers where required.
- [ ] Core body text is at least 12px; dense chart axis labels may be 11px if still legible.
- [ ] Font sizes/weights match the design tokens rather than ad hoc utility values.
- [ ] Text remains readable in light and dark themes.

### Color/materials
- [ ] Canvas, primary text, and accent use semantic tokens.
- [ ] No reusable component hard-codes a theme-specific text color.
- [ ] Positive/negative states include text/icon semantics.
- [ ] Glass fallback remains legible without `backdrop-filter`.
- [ ] Reduced-transparency or unsupported browser mode has a clean solid fallback.

### Motion/interaction
- [ ] Dialog enters in approximately 220ms and exits in approximately 140ms.
- [ ] Navigation hover is subtle and does not shift surrounding layout.
- [ ] Reduced-motion mode removes non-essential transforms and scrubbed timelines.
- [ ] Command palette works with keyboard only.
- [ ] No duplicate order/alert submissions during rapid repeated clicks.
- [ ] Every visible enabled button has a tested action.

### Data and AI
- [ ] Mock/demo data is visibly labelled.
- [ ] Stale/disconnected data is not presented as live.
- [ ] AI tool failures are visible and recoverable.
- [ ] Citations are sourced from actual metadata only.
- [ ] Simulated orders never claim exchange execution.
- [ ] Critical actions require explicit review/confirmation.

### Score calculation
`Pass rate = passed applicable checks / total applicable checks × 100`

Report each category separately. A single overall score must not hide a failed critical financial action or accessibility issue. Critical safety, data-truth, build, or keyboard failures block release regardless of the percentage.

## 14.5 Human visual review

Two reviewers should independently inspect the same deterministic build and record findings. Do not ask reviewers only whether it “looks Apple-like”; ask them to identify concrete issues.

Five-minute checklist:
- [ ] Navigate through Overview, Markets, Charts, and AI without visual jumps.
- [ ] Switch light/dark/system theme; no flash or unreadable surface.
- [ ] Open/close command palette, dialog, dropdown, and mobile sheet.
- [ ] Hover and press controls; no excessive bounce or layout shift.
- [ ] Scroll nested panels; global page scroll does not hijack them.
- [ ] Update/stream AI messages; scroll position behaves sensibly.
- [ ] Resize chart/panels; no clipping or leaked event listeners.
- [ ] Review at 390px; navigation and forms remain usable.
- [ ] Inspect a glass surface in Safari and in a no-backdrop-filter fallback.
- [ ] Confirm chart and table readability before judging decorative polish.
- [ ] Compare screenshots side-by-side and list the three most visible differences.
- [ ] Check for accidental fake data, fake citations, or misleading “success” messages.

Record each issue with screenshot, route, viewport, severity, and owner. Two reviewers' numeric scores may be averaged for non-critical visual quality, but critical functional/accessibility defects cannot be averaged away.

---

# 15. Performance Budgets and Browser Matrix

## 15.1 Performance targets

Treat these as release targets, not guarantees. Measure in a documented production build and representative device/browser.

- Lighthouse Performance: target ≥ 90 for the primary app route under a documented test environment.
- CLS: target < 0.05.
- LCP: target < 2.5s under the chosen Lighthouse test conditions.
- Interaction to Next Paint (INP): target < 200ms for representative interactions when measurable.
- No large layout shift when chart libraries load or market data updates.
- Keep the initial shell light; defer heavy charting, report renderers, and optional effects until needed.
- Avoid excessive simultaneous `backdrop-filter` regions.
- Profile long tables and frequent market ticks.
- Scroll-frame target: fewer than 5% of frames over 16.7ms in a documented representative desktop test, excluding unavoidable environment noise. Record hardware/browser and test steps.

Use Lighthouse CI if the project supports it. Do not lower a threshold just to hide a regression; explain any exception in the report.

## 15.2 Browser support matrix

Target and verify:
- Chrome 120+ desktop
- Safari 17+ macOS
- Firefox 120+ desktop
- iOS Safari 17+
- Android Chrome current/stable

The exact minimum versions may be updated to match actual product analytics and dependency support. Record the final supported versions.

Test the following on each browser class:
- Shell/navigation
- Main workspace/overview
- One dense data table
- Chart workspace
- AI workspace
- Light/dark theme
- Dialog/sheet and keyboard focus

Refraction is not a supported capability requirement. If it works only in Chromium, other browsers must render the CSS fallback with no lost functionality.

## 15.3 CI checks

At minimum, CI should run:
1. Install from lockfile (`npm ci` for npm).
2. Lint.
3. Type check.
4. Unit/component tests.
5. Production build.
6. Playwright smoke tests for critical routes.
7. Screenshot regression tests in a stable environment.
8. Lighthouse CI or equivalent performance checks when configured.

If a script does not exist, add it only after checking the existing project setup. Report skipped checks explicitly; never say “all tests passed” when some were not run.

---

# 16. Implementation Phases

## Phase 1 — Repository and product audit
- Inspect project files, package versions, scripts, environment conventions, route structure, existing API contracts, and available design assets.
- Confirm the intended modules and identify unknown backend contracts.
- Create a short implementation plan and record assumptions.
- Do not install packages or delete files before the audit.

## Phase 2 — Foundation
- Configure Inter through `next/font`.
- Add semantic tokens and light/dark themes.
- Configure shadcn/ui/Radix components only as needed.
- Add theme provider, shared layout primitives, and lint/type-check baseline.
- Create the app shell and route placeholders only where routes are part of the agreed initial scope.

## Phase 3 — Shell and navigation
- Build topbar, sidebar/compact rail, workspace canvas, global command palette, toast region, dialogs/sheets.
- Implement keyboard navigation and mobile shell behavior.
- Verify theme switching and focus management before feature screens.

## Phase 4 — Core workspaces
Recommended order:
1. Overview
2. Markets and Watchlists
3. Charts
4. AI Assistant
5. Portfolio and Orders
6. Strategies and Backtesting
7. Alerts and Reports
8. Settings

If backend/API contracts are missing, implement service interfaces and clearly labelled fixtures rather than fabricating a production API.

## Phase 5 — AI and data states
- Add streaming-ready message rendering.
- Show tool progress, sources, failure states, cancellation if supported, and explicit action confirmations.
- Validate demo/live data distinctions.
- Test stale/disconnected states.

## Phase 6 — Motion and material polish
- Add the exact Motion presets.
- Apply glass only to approved shell/overlay surfaces.
- Add optional refraction only if verified and performant.
- Do not add scroll-scrubbing to normal trading views.
- Verify reduced-motion mode.

## Phase 7 — Verification and refinement
- Run lint, typecheck, unit tests, production build, Playwright smoke tests, and screenshot tests.
- Capture baseline screenshots at required viewports and themes.
- Perform the human review checklist.
- Fix high-severity layout, data-truth, accessibility, and performance issues before minor decoration.

## Phase 8 — Implementation report
Create `docs/implementation-report.md` with:
- What was implemented and where.
- Routes/features completed and incomplete.
- Dependencies added/removed with rationale.
- API contracts used and any mocked adapters.
- Which states were tested.
- Commands run and actual outcomes.
- Screenshot paths and visual-diff results.
- Lighthouse/browser/performance measurements.
- Accessibility findings.
- Known gaps, risks, and next steps.

---

# 17. Definition of Done

The work is complete only when all applicable items below are satisfied.

## Functional
- [ ] The application runs using the documented development command.
- [ ] The production build succeeds.
- [ ] Core navigation and workspace routes work.
- [ ] Theme switch works without a hydration flash.
- [ ] Command palette works with keyboard and pointer.
- [ ] Critical forms validate and preserve input on recoverable errors.
- [ ] Every enabled control performs its stated action.
- [ ] Mock data is clearly labelled and isolated behind adapters.
- [ ] AI activity, failures, and source metadata are represented honestly.
- [ ] Financial actions have explicit confirmation and duplicate-submit protection where applicable.

## Design
- [ ] Tokens are centralized and reused.
- [ ] Inter loads using `next/font`.
- [ ] Light and dark themes both pass the core-screen review.
- [ ] Glass fallback works in unsupported browsers.
- [ ] Responsive layout works at 1440, 1280, 820, and 390px widths.
- [ ] Dense chart/table data remains legible.
- [ ] Motion is subtle and respects reduced motion.
- [ ] No accidental horizontal overflow or major layout shift.

## Verification
- [ ] Lint and typecheck pass.
- [ ] Unit/component tests pass.
- [ ] Production build passes.
- [ ] Playwright smoke tests pass for critical routes.
- [ ] Visual baselines exist for core screens.
- [ ] Human review is completed by two reviewers or explicitly reported as pending.
- [ ] Performance metrics are measured or explicitly reported as not yet measured.
- [ ] Implementation report is complete and honest.

Any failure involving data truth, a critical financial action, authentication/authorization boundary, keyboard access to a core flow, or a broken production build blocks completion even if the visual score is high.

---

# 18. Final Instructions to Claude Code

1. Read this file fully before coding.
2. Audit the repository and write a concise plan with the actual files you will touch.
3. Do not stop at the plan. Implement the app in phases.
4. Reuse the locked libraries unless the repository has a documented compatibility issue.
5. Do not invent APIs, live prices, sources, order success, or backtest results.
6. Make demo fixtures visually explicit and easy to replace with real service adapters.
7. Use the specified tokens, dimensions, motion presets, and browser fallbacks.
8. Keep the app modular; avoid a single giant page or global client component.
9. Test keyboard, mobile, light/dark, loading/error states, and reduced motion.
10. Run the actual project scripts and report the exact results.
11. Do not claim that screenshots, Lighthouse, or browser checks were run if they were not.
12. Finish by producing `docs/implementation-report.md` and a concise summary of completed work, known gaps, and next steps.

**The priority order is:** correctness and honest data → functional workflows → accessibility → responsive stability → performance → visual polish. Apple-inspired material quality is the visual direction, not an excuse to compromise the trading experience.
