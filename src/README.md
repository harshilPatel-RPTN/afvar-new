# src/

| Folder | Role | Review |
|---|---|---|
| `app/` | Routing shell only — composes module panels, no business logic | any owner |
| `platform/` | Shared kernel: API client, WS, design system, layout engine | team lead |
| `modules/` | One folder = one owner; vertical product slices | module owner |

Dependency direction: `app → modules → platform`. Never the reverse.
