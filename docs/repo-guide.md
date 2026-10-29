# FinAI Web — Repo Setup Guide (Next.js + FastAPI)

How to create the `finai-web` frontend repository from scratch: module-wise structure,
one owner per module, typed API layer wired to the Python FastAPI backend.

---

## 1. Prerequisites

- Node.js ≥ 20 (`node -v`)
- Git
- The FastAPI backend running locally on `http://localhost:8000` (not required to start,
  every module must render gracefully with the backend offline)

---

## 2. Create the base app

```powershell
npx create-next-app@latest finai-web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd finai-web
```

Install the data/animation stack:

```powershell
npm i @tanstack/react-query zustand framer-motion
npm i -D openapi-typescript @playwright/test
```

| Package | Why |
|---|---|
| `@tanstack/react-query` | All server data: caching, retries, invalidation |
| `zustand` | Pure UI state only (selected symbol, layout) |
| `framer-motion` | Panel/flyout/menu animations |
| `openapi-typescript` | Generates TS types from FastAPI's OpenAPI schema |
| `@playwright/test` | Cross-module e2e smoke tests |

---

## 3. Create the folder structure

```powershell
mkdir src/platform/api, src/platform/ui, src/platform/layout-engine, src/platform/hooks
mkdir src/modules/market, src/modules/assistant, src/modules/trading, src/modules/verdict, src/modules/content, src/modules/workspace, src/modules/auth
mkdir src/app/popout, src/app/login, e2e, .github/workflows, docker
```

Inside **every** module create the same skeleton:

```
src/modules/<name>/
├── components/     # panels & pieces for this domain only
├── hooks/          # data hooks (React Query + WS)
├── api.ts          # the ONLY file calling this domain's /v1/* endpoints
├── store.ts        # zustand slice for this module's UI state
├── types.ts        # re-exports from types.gen.ts + view models
├── index.ts        # PUBLIC exports — the only import path other code may use
└── __tests__/
```

Target tree:

```
finai-web/
├── .env.example
├── .github/
│   ├── CODEOWNERS
│   └── workflows/ci.yml
├── next.config.ts
├── src/
│   ├── app/                      # routing shell ONLY — no business logic
│   │   ├── layout.tsx            # fonts, theme, <Providers>
│   │   ├── providers.tsx         # QueryClient, MotionConfig, auth context
│   │   ├── page.tsx              # dashboard: composes panels from modules
│   │   ├── popout/page.tsx       # merged pop-out window (?panels=a,b)
│   │   └── login/page.tsx
│   ├── platform/                 # shared kernel — changes need lead review
│   │   ├── api/client.ts         # fetch wrapper: baseURL, JWT, refresh, errors
│   │   ├── api/ws.ts             # /ws/stream + /ws/devices, auto-reconnect
│   │   ├── api/types.gen.ts      # GENERATED from FastAPI — never hand-edit
│   │   ├── ui/                   # Glass, Badge, Pill, Button, WindowChrome
│   │   ├── layout-engine/        # grid, drag/resize/pop-out (port from Vite app)
│   │   └── hooks/
│   └── modules/
│       ├── market/      ├── assistant/   ├── trading/
│       ├── verdict/     ├── content/     ├── workspace/   └── auth/
├── e2e/
└── docker/Dockerfile
```

---

## 4. Environment & FastAPI wiring

**`.env.example`** (commit this; real `.env.local` is gitignored by Next.js):

```env
# FastAPI backend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

**`next.config.ts`** — proxy API calls in dev so there is no CORS setup:

```ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};
export default config;
```

**`src/platform/api/client.ts`** — every module calls the backend through this:

```ts
const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('finai.jwt') : null;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}
```

**Generated types** — add to `package.json` scripts:

```json
{
  "scripts": {
    "types:api": "openapi-typescript http://localhost:8000/openapi.json -o src/platform/api/types.gen.ts"
  }
}
```

Run `npm run types:api` whenever the backend changes. CI runs it against the deployed
schema — if frontend code no longer compiles, the PR fails **before** merge.

---

## 5. Module rules (the team contract)

1. **One module = one owner.** Nobody edits another module without the owner's review.
2. **Import boundary:** other code imports only `@/modules/<name>` (its `index.ts`),
   never deep paths. Enforce in `eslint.config`:

   ```js
   rules: {
     'no-restricted-imports': ['error', {
       patterns: [{
         group: ['@/modules/*/*', '!@/modules/*/index'],
         message: 'Import a module only through its index.ts public API.',
       }],
     }],
   }
   ```

3. **Data convention:** React Query for every request; the shared WS client pushes live
   ticks into the query cache; zustand only for UI state. No module invents its own
   fetching style.
4. **Offline-first panels:** every panel must render a sensible state when FastAPI is
   down (skeleton / "backend offline" note). CI builds run without a backend.
5. **`platform/` is shared kernel:** changes require the lead's review (CODEOWNERS).
6. **Definition of done:** compiles, lint clean, hook unit tests, offline state handled.

**`.github/CODEOWNERS`:**

```
/src/platform/            @team-lead
/src/modules/market/      @dev-market
/src/modules/assistant/   @dev-ai
/src/modules/trading/     @dev-trading
/src/modules/content/     @dev-content
/src/modules/workspace/   @dev-workspace
/src/modules/auth/        @team-lead
```

---

## 6. Git workflow

```powershell
git init
git add .
git commit -m "chore: scaffold finai-web (next.js, module-wise)"
git branch -M main
git remote add origin https://github.com/<org>/finai-web.git
git push -u origin main
```

- Trunk-based: short-lived branches `feat/<module>-<thing>` → PR → CODEOWNERS
  auto-assigns reviewer → green CI → **squash-merge**. `main` is always deployable.
- No long-lived `develop` branch.

---

## 7. CI — `.github/workflows/ci.yml`

```yaml
name: ci
on: [pull_request, push]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test --if-present
      - run: npm run build
```

---

## 8. Module ownership map

| Module | Owns on screen | Backend endpoints |
|---|---|---|
| `market` | Chart, watchlist, search, timeframes | `/v1/market/*`, `WS /ws/stream` |
| `assistant` | AI chat (SSE), voice, TTS | `/v1/ai/*` |
| `trading` | Terminal, positions, risk guardian | `/v1/trading/*`, `/v1/risk/*` |
| `verdict` | Verdict card & pills | `/v1/verdict/*` |
| `content` | News & events, calendar, daily brief | `/v1/content/*` |
| `workspace` | Sidebar, settings, notifications, pop-out/device sync | `/v1/me/*`, `WS /ws/devices` |
| `auth` | Login, session, guards | `/v1/auth/*` |

---

## 9. Porting from the existing Vite app (`ai-trading-os`)

The current app maps almost 1:1 — re-home, don't rewrite:

| Existing (Vite) | New home (Next.js) |
|---|---|
| `src/layouts/panels.tsx` | `src/app/page.tsx` (dashboard composition) |
| `src/layouts/DesktopLayout.tsx` grid/resize/pop-out | `src/platform/layout-engine/` |
| `src/apps/ChartApp`, `WatchlistApp` | `src/modules/market/components/` |
| `src/apps/ChatApp`, `src/ai/*` | `src/modules/assistant/` (Gemini calls move to backend) |
| `src/apps/TerminalApp`, `RiskGuardianApp` | `src/modules/trading/components/` |
| `src/apps/NewsApp`, `CalendarApp`, `DailyBriefApp` | `src/modules/content/components/` |
| `src/components/Sidebar`, `Navbar`, FullscreenGate | `src/modules/workspace/` + `src/platform/ui/` |
| `src/sync/deviceSync.ts` | `src/platform/api/ws.ts` (backend relay replaces the Vite plugin) |
| `tailwind.config.js` tokens, `src/styles/*` | `tailwind.config.ts` + `src/app/globals.css` |
| `MockFeed` / `MarketFeed` interface | `src/modules/market/api.ts` + WS (mock kept as offline fallback) |

Two important changes during the port:

- **The Gemini API key does not move to this repo.** All AI calls go through FastAPI
  (`/v1/ai/chat` as an SSE stream); the key lives server-side only.
- **`'use client'`** goes at the top of every interactive component (panels, hooks with
  state/WS). Server components are fine for static shells.

---

## 10. First-week plan

1. Day 1 — lead scaffolds repo (sections 2–7), pushes, everyone clones.
2. Day 1–2 — lead ports `platform/ui` + `layout-engine` from the Vite app.
3. Day 2+ — owners work their modules in parallel; `market` starts with the
   mock-feed fallback so the UI is demoable before the backend streams real ticks.
4. End of week — `npm run types:api` against the real FastAPI schema; replace mocks
   endpoint by endpoint.
```
