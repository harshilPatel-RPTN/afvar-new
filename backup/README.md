# backup/

Retired code, kept on purpose. The owner's rule: files are **moved here, never deleted**.

Nothing in this folder is built, linted, type-checked or tested (see `tsconfig.json` → `exclude`,
`eslint.config.mjs` → `globalIgnores`). Paths inside each dated folder mirror where the file lived.

| Folder | What | Why retired |
|---|---|---|
| `2026-11-01-core-scenes/` | The /platform and Market Data 3D scenes built around the home's gold AI core | Plan rev. 2: the core belongs to the home; each Platform page gets its own centrepiece |
| `2026-11-01-old-pages/` | The pre-OS About, Pricing, Markets (overview, group, instrument, briefs index) and Resources pages (hub, getting started, guides, help, FAQs, evidence) with the components only they used; the retired /platform and Market Data film OS layers (with their two tests); and long-unused home/homeDemo pieces | Replaced by the AI OS site pages (own 3D hero + OS sections) on `feat/page-identity` |
