# e2e — cross-module smoke flows

Playwright tests that cross module boundaries (dashboard composition, pop-out,
login flow). Single-module behavior belongs in that module's `__tests__/` instead.

```powershell
npx playwright install   # once, downloads browsers
npm run e2e
```

Tests must pass **without** a backend — they assert the offline-first contract.
The config starts `npm run dev` automatically if nothing is on port 3000.
