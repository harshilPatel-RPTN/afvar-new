/**
 * /platform routes. The overview renders its own AI OS frame (the home page's
 * navbar, live ticker, closing and footer); the capability pages still use the
 * markets SiteShell until they move to the AI OS theme (see each route).
 */
export default function PlatformLayout({ children }: LayoutProps<"/platform">) {
  return children;
}
