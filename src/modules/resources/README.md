# modules/resources — W5 · Resources (`/resources`)

W5.1 overview plus the five destinations and two templates from the board:

| Ref | Route | Component |
|---|---|---|
| W5.1 | `/resources` | `ResourcesOverview` — hero, library 3D model, working Resources app (search, ↑↓/↵, preview), sticky category tour, FAQ teaser |
| W5.2 | `/resources/getting-started` | `GettingStartedPage` — checklist (device-local ticks), live screen-width check |
| W5.3 | `/resources/guides` | `GuidesPage` — guides grouped by task, filter + search |
| W5.7 | `/resources/guides/[slug]` | `GuideDetail` — prerequisites, step-through, interactive SAMPLE illustration, result, next task |
| W5.4 | `/resources/sources-evidence` | `EvidencePage` — provenance badge, labels, analysis anatomy, records, backtest assumptions |
| W5.5 | `/resources/faqs` | `FaqsPage` — System Settings–style FAQ window, deep links `#offers` etc. |
| W5.6 | `/resources/help` | `HelpPage` — troubleshooting topics, account/preview help, support request (`#support`) |
| W5.8 | `/resources/help/[slug]` | `TroubleshootDetail` — checks, outcome, pre-filled support hand-off |

Look: home shell (`.afvar-home` green/red/black) outside, platform macOS kit inside
with pf tokens re-pointed by `.rs-theme` (`resources.css`). Hero art:
`public/resources/resources-aurora.jpg`, animated by `AnimatedBackdrop` (aurora, `market` tint).

Content (`content.ts`) comes from the W5 board, `docs/AFWAR_Contact_Support_Help_Pages.md`
and facts the site already states. Pre-launch honesty: guides describe the planned OS,
illustrations are labelled SAMPLE, no provider/model names, and the support form keeps
requests on the device — it never claims to have sent them.
