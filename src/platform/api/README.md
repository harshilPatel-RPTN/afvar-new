# platform/api — backend access layer

Every request to FastAPI goes through this folder. Modules never call `fetch` directly.

| File | Purpose |
|---|---|
| `client.ts` | Typed fetch wrapper: base URL, JWT attach, error normalization |
| `ws.ts` | WebSocket client for `/ws/stream` and `/ws/devices`, auto-reconnect |
| `types.gen.ts` | **Generated** from FastAPI's OpenAPI schema — never hand-edit |

Regenerate types whenever the backend changes:

```powershell
npm run types:api   # requires FastAPI running on localhost:8000
```

In dev, HTTP calls go to `/api/*` and Next.js rewrites them to the FastAPI server
(see `next.config.ts`), so there is no CORS setup. WebSockets connect directly to
`NEXT_PUBLIC_WS_URL`.
