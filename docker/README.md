# docker/

Production image using Next.js standalone output (`output: "standalone"` in
`next.config.ts`).

```powershell
docker build -f docker/Dockerfile -t ai-trading-web .
docker run -p 3000:3000 ai-trading-web
```

`NEXT_PUBLIC_*` values are baked in at build time — pass them as `--build-arg`/env
in the real deploy pipeline. In production the `/api/*` rewrite still needs
`NEXT_PUBLIC_API_URL` to point at the FastAPI service reachable from this container.
