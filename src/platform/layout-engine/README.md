# platform/layout-engine

The dashboard layout system: panel grid, drag/resize, and pop-out windows.

**Status: placeholder.** `PanelGrid`/`PanelSlot` currently render a static responsive
CSS grid so modules can build panels today. The real engine — free drag/resize and the
multi-panel pop-out logic — gets ported here from the existing Vite app's
`DesktopLayout.tsx` without changing the public API below.

Public API (keep stable while porting):

- `PanelGrid` — the dashboard container
- `PanelSlot` — wraps one panel; `id` must match the app's panel registry so the
  pop-out window (`/popout?panels=<id>`) can re-render it
