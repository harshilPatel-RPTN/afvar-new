# modules/ — one folder = one owner

Each module is a vertical slice of the product owned by one teammate
(see the ownership table in the root README and `.github/CODEOWNERS`).

Every module follows the same skeleton:

```
<name>/
├── components/     # panels & pieces for this domain only
├── hooks/          # data hooks (React Query + WS)
├── api.ts          # the ONLY file calling this domain's /v1/* endpoints
├── store.ts        # zustand slice for this module's UI state
├── types.ts        # re-exports from types.gen.ts + view models
├── index.ts        # PUBLIC exports — the only import path other code may use
└── __tests__/
```

Rules:

- Other code imports only `@/modules/<name>` — ESLint blocks deep imports.
- Cross-module needs go through the other module's `index.ts` too.
- React Query for all server data, zustand for UI state, WS pushes into the query cache.
- Every panel must render a sensible state with the backend offline.
