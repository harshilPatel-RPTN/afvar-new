import type { CSSProperties } from "react";
import Link from "next/link";
import { BeastStyles } from "@/modules/home/kit";
import { FooterBear, FooterBull } from "./FooterBeasts";
import { FooterSkew } from "./FooterSkew";
import { translate, type MessageKey, type MessageVars } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";
import "./site-footer-phone.css";

type FooterLink = { href: string; label: MessageKey };
type FooterColumn = { heading: MessageKey; links: FooterLink[] };

const COLUMNS: FooterColumn[] = [
  {
    heading: "mk.footer.markets",
    links: [
      { href: "/market", label: "mk.nav.markets.overview" },
      { href: "/market/commodities", label: "mk.nav.markets.commodities" },
      { href: "/market/forex", label: "mk.nav.markets.forex" },
      { href: "/market/crypto", label: "mk.nav.markets.crypto" },
      { href: "/market/briefs", label: "mk.nav.markets.briefs" },
    ],
  },
  {
    heading: "mk.footer.platform",
    links: [
      { href: "/platform", label: "mk.nav.platform.overview" },
      { href: "/platform/market-data", label: "mk.nav.platform.data" },
      { href: "/platform/research", label: "mk.nav.platform.research" },
      { href: "/platform/alerts", label: "mk.nav.platform.alerts" },
      { href: "/platform/risk-review", label: "mk.nav.platform.risk" },
      { href: "/platform/community", label: "mk.nav.platform.community" },
    ],
  },
  {
    heading: "mk.footer.resources",
    links: [
      { href: "/resources/getting-started", label: "mk.nav.resources.start" },
      { href: "/resources/guides", label: "mk.nav.resources.guides" },
      {
        href: "/resources/sources-evidence",
        label: "mk.nav.resources.sources",
      },
      { href: "/resources/faqs", label: "mk.nav.resources.faqs" },
      { href: "/resources/help", label: "mk.nav.resources.help" },
    ],
  },
];

/** The Company column's links (rendered under one heading like the other columns). */
const COMPANY: FooterLink[] = [
  { href: "/about", label: "mk.nav.about" },
  { href: "/contact", label: "mk.nav.contact" },
];

const LEGAL: FooterLink[] = [
  { href: "/privacy", label: "mk.footer.privacyShort" },
  { href: "/terms", label: "mk.footer.termsShort" },
  { href: "/cookies", label: "mk.footer.cookies" },
];

const focusRing =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-(--mk-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--mk-footer)";
/** Phones only: each link becomes a hairline pill in a wrapping row. */
const PILL = "max-sm:rounded-full max-sm:border max-sm:border-white/10 max-sm:px-3.5 max-sm:text-[13px] max-sm:active:scale-95 max-sm:transition-[transform,color,border-color] max-sm:hover:border-(--mk-primary)/50";
/** Phones only: a column becomes a full-width band under a hairline, its heading a mono label. */
const GROUP = "mk-ft-group max-sm:border-t max-sm:border-white/10 max-sm:pt-4 max-sm:pb-1";
const HEAD_PHONE = "max-sm:font-mono max-sm:text-[11px] max-sm:font-medium max-sm:uppercase max-sm:tracking-[0.18em] max-sm:text-[#A8DEC2]";
const LIST_PHONE = "max-sm:mt-2.5 max-sm:flex-row max-sm:flex-wrap max-sm:gap-2";
/** 44px tall targets on touch layouts, compact rows from md up. */
const linkBase = `group ${focusRing} inline-flex min-h-11 items-center transition-colors duration-300 ease-out motion-reduce:transition-none md:min-h-0 md:py-0.5`;
const subLink = `${linkBase} text-[14px] text-(--mk-dim) hover:text-(--mk-primary) md:text-[13px] ${PILL}`;
/** Gold hairline that slides in from the left on hover/focus (transform only). */
const underline =
  "relative after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-(--mk-primary) after:content-[''] motion-safe:after:transition-transform motion-safe:after:duration-300 motion-safe:after:ease-out group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100";

function Label({ children }: { children: string }) {
  return <span className={underline}>{children}</span>;
}

/** Footer shell per variant: solid is the classic opaque band; glass is a translucent, blurred pane for layouts where the 3D earth runs on behind it (near-solid where backdrop-filter is unsupported). */
const SHELL = {
  solid: "relative border-t border-(--mk-line) bg-(--mk-footer) text-(--mk-text)",
  glass:
    "relative border-t border-white/15 bg-(--mk-footer)/90 text-(--mk-text) shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] supports-[backdrop-filter]:bg-(--mk-footer)/5 supports-[backdrop-filter]:backdrop-blur-[2px] supports-[backdrop-filter]:backdrop-saturate-200 supports-[backdrop-filter]:backdrop-brightness-110",
} as const;

/** Static server component: no scroll-reveal motion, so it ships no client JS of its own. */
export async function SiteFooter({ variant = "solid" }: { variant?: keyof typeof SHELL } = {}) {
  const edition = await getServerEdition();
  const t = (key: MessageKey, vars?: MessageVars) =>
    translate(edition, key, vars);
  const year = new Date().getFullYear();

  return (
    <footer
      aria-label={t("mk.footer.label")}
      className={`mk-ft-root ${SHELL[variant]}`}
    >
      <BeastStyles />
      {/* Phones: a green hairline draws across the footer's top edge. */}
      <span aria-hidden="true" className="mk-ft-hairline" />
      <div className="relative mx-auto w-full max-w-[1280px] px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:pb-4 md:pt-6 lg:px-10">
        {/* The bear idles at the footer's right edge, facing the content: beside
            the brand row on phones/tablets, near the bottom on wide screens. */}
        {/* Click it: it swipes with its claws (sound + red claw streaks). */}
        <FooterBear className="absolute right-4 top-5 z-10 w-16 sm:right-6 md:top-6 lg:top-auto lg:right-10 lg:bottom-20 lg:w-24" />
        <FooterSkew className="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1 max-sm:gap-y-3 sm:grid-cols-3 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))] lg:gap-x-10">
          {/* Brand */}
          <div className="mk-ft-group col-span-2 max-sm:col-span-1 max-sm:pb-2 sm:col-span-3 lg:col-span-1">
            {/* The bull stands guard beside the wordmark; click it and it charges the wordmark (sound). */}
            <FooterBull>
              <Link
                href="/market"
                aria-label={t("mk.nav.logoLabel")}
                className={`${focusRing} inline-flex min-h-11 items-center text-[20px] font-semibold text-(--mk-text) md:min-h-0`}
                // Brand wordmark is always Latin, so it keeps its spacing in every edition.
                style={{ letterSpacing: "0.42em" }}
                lang="en"
              >
                AFVAR
              </Link>
            </FooterBull>
            <p className="mt-3 max-w-[30ch] text-[14px] leading-relaxed text-(--mk-dim)">
              {t("mk.footer.taglineLine1")}
              <br />
              {t("mk.footer.taglineLine2")}
            </p>
          </div>

          {COLUMNS.map((col, i) => {
            const id = `mk-footer-${col.heading.split(".").pop()}`;
            return (
              <div key={col.heading} className={GROUP} style={{ "--i": i + 1 } as CSSProperties}>
                <nav aria-labelledby={id}>
                  <h2
                    id={id}
                    className={`text-[14px] font-semibold text-(--mk-text) ${HEAD_PHONE}`}
                  >
                    {t(col.heading)}
                  </h2>
                  <ul className={`mt-1.5 flex flex-col md:mt-2 ${LIST_PHONE}`}>
                    {col.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className={subLink}>
                          <Label>{t(link.label)}</Label>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            );
          })}

          <div className={GROUP} style={{ "--i": 4 } as CSSProperties}>
            <nav aria-labelledby="mk-footer-company">
              <h2
                id="mk-footer-company"
                className={`text-[14px] font-semibold text-(--mk-text) ${HEAD_PHONE}`}
              >
                {t("mk.footer.company")}
              </h2>
              <ul className={`mt-1.5 flex flex-col md:mt-2 ${LIST_PHONE}`}>
                {COMPANY.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={subLink}>
                      <Label>{t(link.label)}</Label>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </FooterSkew>

        <div className="mk-ft-group" style={{ "--i": 5 } as CSSProperties}>
          <div className="mt-5 flex flex-col gap-2 border-t border-(--mk-line) pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-(--mk-dim)">
              {t("mk.footer.copyright", { year })}
            </p>
            <nav aria-label={t("mk.footer.legalLabel")}>
              <ul className="flex flex-wrap items-center gap-x-6">
                {LEGAL.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`${linkBase} text-[13px] text-(--mk-dim) hover:text-(--mk-primary)`}
                    >
                      <Label>{t(link.label)}</Label>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <p className="mt-2 max-w-[80ch] text-[12px] leading-relaxed text-(--mk-dim)">
            {t("mk.footer.disclaimer")}
          </p>
        </div>
      </div>
    </footer>
  );
}
