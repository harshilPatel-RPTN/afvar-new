import { EarthClosing } from "@/modules/company";
import { ChevronLink, PageNote, PlatformShell, RegisterLink, Reveal, ScrollWords } from "@/modules/platform/kit";
import { ScrubText } from "./marketMotion";
import { PricingContent } from "./PricingContent";
import { SiteShell } from "./SiteShell";
import { Ambience } from "@/modules/resources";

/** W4 · Pricing & Launch Benefits — universal site chrome outside, the W2
 *  platform pages' macOS design system inside, closing on the shared
 *  interactive earth (the footer renders under its arc, as on /platform). */
export function PricingPage() {
  return (
    <SiteShell footer={false}>
      <PlatformShell>
        <div className="relative">
          <Ambience />
          <div className="relative">
        <PricingContent />
        <EarthClosing id="register" label="Register for launch">
          <div className="mx-auto max-w-3xl text-center">
            <ScrollWords text="Start free today. Move up when the desk earns it." className="pf-title" />
            <ScrubText text="Register once — your queue record, plan choice and offers all live on the same account." className="pf-lede mx-auto mt-5 max-w-lg" />
            <Reveal delay={0.1}>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
                <RegisterLink />
                <ChevronLink href="/platform">Explore the platform</ChevronLink>
              </div>
            </Reveal>
          </div>
          <div className="mt-16">
            <PageNote>Pre-launch · AFVAR is in development. Registration does not unlock the full OS, and no payment is taken before launch.</PageNote>
          </div>
        </EarthClosing>
                </div>
        </div>
      </PlatformShell>
    </SiteShell>
  );
}
