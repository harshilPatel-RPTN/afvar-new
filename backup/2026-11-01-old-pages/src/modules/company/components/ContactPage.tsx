import { MotionTitle, ScrubText } from "@/modules/home/kit";
import { SiteShell } from "@/modules/markets";
import { ChevronLink, MacWindow, PageNote, PageScene3D, PIcon, PlatformShell, RegisterLink, Reveal, SectionHeading } from "@/modules/platform";
import { COMPANY_FACTS, CONTACT } from "../content";
import { EnquiryForm } from "./EnquiryForm";
import { EarthClosing } from "./EarthClosing";
import { Ambience } from "@/modules/resources";
import { CompanyHero } from "./Hero";

/** W7 · Contact Us, in the W2 platform design language (WF17 / W7.1–W7.3). */
export function ContactPage() {
  return (
    <SiteShell footer={false}>
      <PlatformShell>
        <div className="relative">
          <Ambience />
          <div className="relative">
        <CompanyHero image="/company/contact-rg.jpg" effect="aurora" tint="market" natural position="center top" eyebrow={CONTACT.hero.eyebrow} title={CONTACT.hero.title} lede={CONTACT.hero.lede} />

        {/* One desk receives everything — the beacon, as a live 3D model */}
        <section aria-label="Contact beacon illustration" className="px-4 pt-40 sm:px-6 sm:pt-56">
          <Reveal y={28} className="mx-auto max-w-5xl">
            <PageScene3D
              kind="beacon"
              label="3D illustration: a beacon tower pulsing bright contact rings while paper planes circle toward it. Not live data."
              caption="Every enquiry lands on one desk · illustration"
            />
          </Reveal>
        </section>

        {/* W7.1.1 — general enquiries + W7.1.2/W7.1.3 side rail */}
        <section aria-labelledby="enquiry-heading" className="px-4 pt-24 sm:px-6">
          <SectionHeading id="enquiry-heading" title="Send a general enquiry." summary="Topic, email and message — that's all we need. Product problems have a faster lane on the right." />
          <div className="mx-auto mt-10 grid max-w-5xl items-start gap-6 lg:grid-cols-[1.25fr_1fr]">
            <Reveal y={24}>
              <MacWindow title="New Enquiry — AFVAR" bodyClassName="p-4 sm:p-5">
                <EnquiryForm />
              </MacWindow>
            </Reveal>

            <div className="space-y-4">
              {/* W7.2 — product problems route to the one support system (W5.6). */}
              <Reveal y={24} delay={0.06}>
                <div className="pf-tile p-6">
                  <span className="grid size-10 place-items-center rounded-[10px] bg-(--accent-soft) text-(--accent)">
                    <PIcon name="wifi" size={18} />
                  </span>
                  <h3 className="mt-3.5 text-[16px] font-semibold text-(--text-primary)">{CONTACT.help.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-(--text-secondary)">{CONTACT.help.body}</p>
                  <div className="mt-4">
                    <ChevronLink href={CONTACT.help.href} className="text-[15px]">
                      {CONTACT.help.cta}
                    </ChevronLink>
                  </div>
                </div>
              </Reveal>

              {/* W7.1.3 — verified contact options only. */}
              <Reveal y={24} delay={0.12}>
                <MacWindow size="sm" title={CONTACT.verified.title} bodyClassName="p-4">
                  <dl className="pf-group">
                    {COMPANY_FACTS.map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
                        <dt className="text-[13px] text-(--text-secondary)">{label}</dt>
                        <dd className="text-right text-[13px] font-medium text-(--text-primary)">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="px-1 pb-1 pt-3 text-[12px] leading-relaxed text-(--text-muted)">{CONTACT.verified.note}</p>
                </MacWindow>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Closing over the shared earth (ClosingCta pattern). */}
        <EarthClosing label="Registration">
          <Reveal className="mx-auto max-w-3xl pt-8 text-center">
            <MotionTitle id="contact-closing" text="Rather just get in line?" className="pf-title" />
            <ScrubText text="Most questions answer themselves at launch — registration keeps your place while they do." className="pf-lede mx-auto mt-5 max-w-lg" />
            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
              <RegisterLink />
              <ChevronLink href="/about">About AFVAR</ChevronLink>
            </div>
          </Reveal>
          <div className="mx-auto mt-16 max-w-3xl space-y-3 text-center">
            <PageNote>One support system: product and account issues are handled in Help &amp; Support, so nothing gets lost between inboxes (W7.2).</PageNote>
            <PageNote>Pre-launch · no response-time promises are made until confirmed. AFVAR never asks for funds or credentials over chat apps.</PageNote>
          </div>
        </EarthClosing>
                </div>
        </div>
      </PlatformShell>
    </SiteShell>
  );
}
