# platform/ui — design system

Shared presentational components. Keep them dumb: props in, markup out — no data
fetching, no module imports.

## Guide-accurate primitives (DESIGN-GUIDE §2, §6, §10)

Styled with the tokens in `tokens.css` (guide §2.1 light + §2.2 dark). Opt a route
tree in with the `ds-theme` class and `import "@/platform/ui/tokens.css"`; the theme
follows the OS, and `data-theme="light|dark"` forces one.

| Export | Use |
|---|---|
| `Icon`, `BrandMark` | The one inline-SVG icon set (lucide is not installed) and the brand mark |
| `Dialog` | Modal / side sheet / bottom sheet with focus trap, Escape, focus return; `role="alertdialog"` for destructive confirms |
| `Segmented` | Keyboard radiogroup with an animated indicator; disabled options can carry a `title` explaining why |
| `EmptyState` | Calm, specific empty state (not for unavailable data) |
| `buttonClass()` | Button/link class recipe: primary, secondary, ghost, danger × sm, md, lg |
| `motionTokens`, `variants`, `indicatorSpring` | Guide §10 motion presets (framer-motion) |
| `Toaster`, `toast` | Non-blocking feedback announced via `aria-live`; errors must also appear in context |

Promoted from `modules/landing` (which now re-exports them) so every module shares
one implementation. **Needs team-lead review.**

## Legacy placeholders

Use the older tokens in `src/app/globals.css`; still used by dashboard panels.

| Component | Use |
|---|---|
| `Glass` | Translucent panel surface |
| `WindowChrome` | Panel title bar: title, status dot, pop-out button |
| `Button` | Primary/ghost/danger actions |
| `Badge` | Small status label |
| `Pill` | Rounded tag |
