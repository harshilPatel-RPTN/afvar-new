import Link from "next/link";
import { BullBearFaceoff } from "./BullBearFaceoff";
import { RiseIn } from "./marketMotion";
import { COMPANY_LINE, DISCLAIMER, FOOTER_COLS, LANG_CHIPS, PRELAUNCH_NOTE } from "../content";

/**
 * REVISED contract §16 — site-wide disclaimer first, five link groups from the
 * configured routes, then company line, static language chips and the
 * pre-launch note. Solid #080A0B surface, top hairline, no motion, no 3D.
 */
export function HomeFooter() {
  return (
    <footer className="border-t border-white/[.11] bg-[#030405]">
      <div className="mx-auto w-full max-w-[1280px] px-5 py-14 sm:px-8 lg:px-10">
        {/* 0 — bull vs bear face-off strip (decorative, scroll-linked). */}
        <BullBearFaceoff />

        {/* 1 — disclaimer first, readable but slightly muted. */}
        <p className="max-w-[920px] text-[13px] leading-relaxed text-[#A3AAAC]">{DISCLAIMER}</p>

        {/* 2 — five columns of configured routes. */}
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {FOOTER_COLS.map((column, columnIndex) => (
            // Columns rise in sequence on first view (client island; the footer stays a server component).
            <RiseIn key={column.title} delay={columnIndex * 0.07}>
            <nav aria-label={column.title}>
              <p className="text-[12.5px] font-semibold text-[#F5F7F7]">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="mkc-flink rounded-sm text-[12.5px] text-[#6D7578] outline-none transition-colors duration-200 hover:text-[#F5F7F7] focus-visible:ring-2 focus-visible:ring-[rgba(245,247,247,.6)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080A0B] motion-reduce:transition-none"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            </RiseIn>
          ))}
        </div>

        {/* 3 — company line, static language chips, pre-launch note. */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/[.11] pt-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[11.5px] leading-relaxed text-[#6D7578]">{COMPANY_LINE}</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <ul aria-label="Language editions" className="flex items-center gap-2">
              {LANG_CHIPS.map((lang) => (
                <li
                  key={lang}
                  className="rounded-full border border-white/[.11] px-3 py-1 text-[11.5px] text-[#A3AAAC]"
                >
                  {lang}
                </li>
              ))}
            </ul>
            <p className="text-[11.5px] text-[#6D7578]">{PRELAUNCH_NOTE}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
