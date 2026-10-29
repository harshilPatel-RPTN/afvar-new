# ai-trading-web

Next.js frontend for the AI trading platform. The backend is a Python **FastAPI** service
(REST under `/v1/*`, WebSockets under `/ws/*`). The repo is organized **module-wise** so
each teammate owns one folder and works in parallel with minimal merge conflicts.

## Quickstart

```powershell
npm install
copy .env.example .env.local   # point it at your FastAPI backend
npm run dev                    # http://localhost:3000
```

The app must render with the backend **offline** — every panel shows a skeleton or a
"backend offline" note instead of crashing. You can develop UI without FastAPI running.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with the `/api/*` → FastAPI proxy (no CORS setup needed) |
| `npm run build` | Production build (standalone output for Docker) |
| `npm run lint` | ESLint, including the module import-boundary rule |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests (`src/**/__tests__/`) |
| `npm run e2e` | Playwright smoke flows in `e2e/` |
| `npm run types:api` | Regenerate `src/platform/api/types.gen.ts` from FastAPI's OpenAPI schema |

## Repo layout

```
src/
├── app/        # routing shell ONLY — no business logic
├── platform/   # shared kernel: API client, WS, design system, layout engine
└── modules/    # one folder = one owner (see table below)
e2e/            # Playwright cross-module smoke tests
docker/         # standalone production image
docs/           # setup guide and team docs
```

## Module ownership

| Module | Owns on screen | Backend endpoints | Owner |
|---|---|---|---|
| `market` | Chart, watchlist, search, timeframes | `/v1/market/*`, `WS /ws/stream` | @dev-market |
| `assistant` | AI chat (SSE), voice, TTS | `/v1/ai/*` | @dev-ai |
| `trading` | Read-only positions, risk guardian, MT5 investor login (no order path) | `/v1/broker`, `/v1/risk/*` | @dev-trading |
| `verdict` | Verdict card & pills | `/v1/verdict/*` | @dev-verdict |
| `content` | News & events, calendar, daily brief | `/v1/content/*` | @dev-content |
| `workspace` | Desktop, lock screen, layouts, alerts, settings | `/v1/me/*`, `WS /ws/devices` | @dev-workspace |
| `auth` | Login, register, recovery, onboarding, session, app PIN | `/v1/auth/*`, `/v1/me` | @team-lead |
| `billing` | Plans, entitlements, pricing, Stripe checkout, upgrade gates | `/v1/billing/*` | @dev-billing |
| `community` | The 8 fixed instrument rooms | `/v1/community/*` | @dev-community |

> Replace the `@dev-*` placeholders in this table and in `.github/CODEOWNERS` with real
> GitHub usernames when the team is assigned.

## Auth, plans & payments (static phase)

There is no backend yet. Every module calls `apiFetch()` (`src/platform/api/client.ts`),
which answers from the in-browser mock server in `src/mocks/api/` — same paths and shapes
as the future FastAPI contracts. Set `NEXT_PUBLIC_API_BASE_URL` to switch to the real API;
nothing else changes. Mock data lives in `localStorage` (`afwar.mockdb.v1`).

**Demo accounts** (dev only): `free@afwar.app` and `pro@afwar.app`, password `demo1234`,
app PIN `1234`. A floating **DEV · Plan Free ⇄ Pro** switch (hidden in production) flips
the plan live and can reset today's prompt count.

**Stripe demo:** the billing module's `UpgradeModal` / `openCheckout()` opens a
Stripe-Checkout-style sheet in **test mode**; it currently has no page of its own. Use
Stripe's test cards: `4242 4242 4242 4242` succeeds, `4000 0025 0000 3155` asks for 3-D
Secure, `4000 0000 0000 0002` is declined, `4000 0000 0000 9995` has insufficient funds
(any future expiry, any CVC). Card details never leave the page; success posts the
`checkout.session.completed` webhook the real Stripe would send to FastAPI. Payments sit
behind `PaymentProvider` (`src/modules/billing/payment.ts`) so Razorpay/Cashfree can be
added for INR. Live Stripe in India needs an invite — request it early.

**Entitlements:** `src/modules/billing/entitlements.ts` is the single source of truth
(`PLANS`, `can()`, `quota()`); the pricing table is generated from it. There is no
premium boolean anywhere — a test fails the build if one appears.

**App lock (PIN):** `/` is the in-browser OS: a full-screen launch card → lock screen.
Like a PC, it is locked on every arrival (reload, new tab, leaving full screen, "Lock AFVAR",
Ctrl+Shift+L, 5 minutes hidden) and always asks for the 4-digit PIN, typed on the keyboard.
A correct PIN goes to the public `/markets` page (`AFTER_UNLOCK` in `LockScreen.tsx`). The
only exception is right after a password sign-in (which lands on `/`): the tab is unlocked
once, so entering full screen shows the windowed desktop (dock + app windows) on `/` without
the PIN. Five wrong PINs end the session (`/login?reason=pin_locked`). Sign-in itself lands
on `/`, not `/markets`. The Back/Forward keyboard shortcuts (Alt/⌘ + ←/→) are switched off on
the launch card and lock screen so they can't step past the PIN (the browser's toolbar Back
button can't be blocked, but returning to `/` always shows the lock screen again); see
`src/platform/README.md`.

### Defaults assumed — owner to confirm

| Decision | Assumed |
|---|---|
| "1 prompt per day" | Per calendar day in the user's time zone, resetting at local midnight |
| What counts as a prompt | Only questions that reach the analyst model. Navigation ("open gold chart") and refused trading requests are free |
| Hindi / Marathi editions | Available on Free |
| Free trial of Pro | None at launch (add later via `entitlementsOverride`) |
| Pro price | **Placeholder** $19/month, $190/year (`src/modules/billing/prices.ts`) |
| App PIN | 4 digits; asked on every arrival at `/` and after 5 min hidden; 5 wrong attempts → password sign-in |
| Edition locale | Dates and numbers follow `<edition>-<country>`, e.g. `mr-IN` |
| Legal copy | Placeholder text on `/legal/*` — **TODO: legal review** |
| Hindi / Marathi copy | Machine-assisted; needs a native-speaker review before launch |

### Future backend (document only — not built)

Postgres tables: `users`, `sessions`, `devices`, `subscriptions`, `entitlements_override`,
`ai_usage`, `layouts`, `watchlists`, `alerts`, `risk_rules`, `broker_connections`
(encrypted, read-only investor scope), `community_memberships`, `notification_prefs`,
`consent_records`, plus `app_pins` (argon2id hash, failed-attempt counter).

Redis prompt counter: `ai_prompts:{userId}:{YYYY-MM-DD}` with expiry at the user's local
midnight. The mock's endpoints (`src/mocks/api/index.ts`) are the contract to implement.

## Team contract

1. **One module = one owner.** Nobody edits another module without the owner's review.
2. **Import boundary:** other code imports only `@/modules/<name>` (its `index.ts`),
   never deep paths. ESLint enforces this.
3. **Data convention:** React Query for every request; the shared WS client pushes live
   ticks into the query cache; zustand only for UI state.
4. **Offline-first panels:** every panel renders a sensible state when FastAPI is down.
   CI builds run without a backend.
5. **`platform/` is shared kernel:** changes require the lead's review (CODEOWNERS).
6. **Definition of done:** compiles, lint clean, hook unit tests, offline state handled.

## Git workflow

Trunk-based: short-lived branches `feat/<module>-<thing>` → PR → CODEOWNERS auto-assigns
the reviewer → green CI → **squash-merge**. `main` is always deployable. No `develop` branch.

See [docs/repo-guide.md](docs/repo-guide.md) for the full setup guide this repo was built from.
