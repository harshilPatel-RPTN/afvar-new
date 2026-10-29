import { SiteShell } from "@/modules/markets";

/**
 * Platform pages share the public-site chrome (nav, pre-launch strip, footer)
 * and the `.mk` theme/font from the Markets module, so /platform and /market
 * stay in sync. Typography deviation from DESIGN-GUIDE §2.3 (Inter): the
 * shared shell uses the markets font instead.
 */
export default function PlatformLayout({ children }: LayoutProps<"/platform">) {
  // The footer is rendered by ClosingCta, together with the closing "earth" block.
  return <SiteShell footer={false}>{children}</SiteShell>;
}
