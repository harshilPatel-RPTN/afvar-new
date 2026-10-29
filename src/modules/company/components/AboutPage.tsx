import { SiteShell } from "@/modules/markets";
import {
  AppIcon,
  PageScene3D,
  ChevronLink,
  MacWindow,
  PageNote,
  PIcon,
  PlatformShell,
  RegisterLink,
  Reveal,
  ScrollWords,
  SectionHeading,
  type IconTone,
  type PlatformIcon,
} from "@/modules/platform";
import { ABOUT, COMPANY_FACTS } from "../content";
import { EarthClosing } from "./EarthClosing";
import { Ambience } from "@/modules/resources";
import { CompanyHero } from "./Hero";

const SERVE_ICONS: Array<{ icon: PlatformIcon; tone: IconTone }> = [
  { icon: "chart", tone: "gold" },
  { icon: "lightbulb", tone: "cyan" },
  { icon: "flask", tone: "purple" },
];

const PRINCIPLE_ICONS: PlatformIcon[] = ["scale", "shield", "check", "sliders", "flag"];

/** W6 · About Us, in the W2 platform design language (WF16 section order). */
export function AboutPage() {
  return (
    <SiteShell footer={false}>
      <PlatformShell>
        <div className="relative">
          <Ambience />
          <div className="relative">
        <CompanyHero image="/company/about-rg.jpg" effect="aurora" tint="market" natural position="center" eyebrow={ABOUT.hero.eyebrow} title={ABOUT.hero.title} lede={ABOUT.hero.lede} />

        {/* W6.1.1 — purpose */}
        <section aria-label="Our purpose" className="px-4 pt-28 sm:px-6">
          <ScrollWords text={ABOUT.purpose} className="pf-title mx-auto max-w-4xl text-center" />
        </section>

        {/* W6.1.2 — product vision, with the signal mark as a live 3D model */}
        <section aria-labelledby="vision-heading" className="px-4 pt-28 sm:px-6">
          <SectionHeading id="vision-heading" title={ABOUT.vision.title} summary={ABOUT.vision.body} />
          <Reveal y={28} delay={0.08} className="mx-auto mt-12 max-w-5xl">
            <PageScene3D
              kind="signal"
              label="3D illustration: the AFVAR signal mark — three rising bars with a bright node tracing an orbit around them. Not live data."
              caption="The AFVAR signal mark · three lanes, one trajectory"
            />
          </Reveal>
        </section>

        {/* W6.1.3 — who AFVAR serves */}
        <section aria-labelledby="serves-heading" className="px-4 pt-28 sm:px-6">
          <SectionHeading id="serves-heading" title="Who AFVAR serves." />
          <div className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3">
            {ABOUT.serves.map((audience, index) => (
              <Reveal key={audience.title} delay={index * 0.07} className="h-full">
                <div className="pf-tile h-full p-6">
                  <AppIcon icon={SERVE_ICONS[index].icon} tone={SERVE_ICONS[index].tone} size={48} />
                  <h3 className="mt-4 text-[17px] font-semibold text-(--text-primary)">{audience.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-(--text-secondary)">{audience.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* W6.1.4 — product principles */}
        <section aria-labelledby="principles-heading" className="px-4 pt-28 sm:px-6">
          <SectionHeading id="principles-heading" title="Principles we ship by." summary="Each one is enforced in the product, not framed on a wall." />
          <Reveal y={24} className="mx-auto mt-10 max-w-3xl">
            <MacWindow size="sm" title="AFVAR — Product Principles" bodyClassName="p-4">
              <div className="pf-group">
                {ABOUT.principles.map((principle, index) => (
                  <div key={principle.title} className="flex gap-3.5 px-4 py-3.5">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[7px] bg-(--accent-soft) text-(--accent)">
                      <PIcon name={PRINCIPLE_ICONS[index]} size={14} />
                    </span>
                    <span>
                      <span className="block text-[14.5px] font-semibold text-(--text-primary)">{principle.title}</span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-(--text-secondary)">{principle.body}</span>
                    </span>
                  </div>
                ))}
              </div>
            </MacWindow>
          </Reveal>
        </section>

        {/* W6.1.5 — people (verified facts only) + company record */}
        <section aria-labelledby="people-heading" className="px-4 pt-28 sm:px-6">
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
            <SectionHeading id="people-heading" align="start" title={ABOUT.people.title} summary={ABOUT.people.body} />
            <Reveal y={24} delay={0.08}>
              <MacWindow size="sm" title="Company record" bodyClassName="p-4">
                <dl className="pf-group">
                  {COMPANY_FACTS.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="text-[13px] text-(--text-secondary)">{label}</dt>
                      <dd className="text-right text-[13px] font-medium text-(--text-primary)">{value}</dd>
                    </div>
                  ))}
                </dl>
              </MacWindow>
            </Reveal>
          </div>
        </section>

        {/* W6.1.6 — development stage over the shared closing earth (ClosingCta pattern) */}
        <EarthClosing label="Development stage and registration">
          <SectionHeading id="stage-heading" title={ABOUT.stage.title} summary={ABOUT.stage.body} charge />
          <Reveal delay={0.1} className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            <RegisterLink />
            <ChevronLink href="/contact">Contact the team</ChevronLink>
          </Reveal>
          <div className="mt-16">
            <PageNote>Pre-launch · AFVAR provides market information and analysis only; nothing here is investment advice. Updates are published after verification.</PageNote>
          </div>
        </EarthClosing>
                </div>
        </div>
      </PlatformShell>
    </SiteShell>
  );
}
