"use client";

// Copy blocks every capability film shares, in the home film's type system:
// numbered act eyebrows ("02 · Charts"), the 3D-act heading (left column on
// desktop, bottom panel on phones) and the OS-act caption (on top of the
// screen). The words come from each page; the shapes are the same everywhere.
import { createContext, useContext } from "react";
import { BODY, EYEBROW, H2, SOFT } from "@/modules/afvarOs";
import { H2_COMPACT, H_OS } from "../OverviewCopy";

/** Act order of the cut on screen, so eyebrows number themselves. */
export const CapOrder = createContext<readonly string[]>([]);

export function ActEyebrow({ id, label }: { id: string; label: string }) {
  const order = useContext(CapOrder);
  const n = order.indexOf(id);
  return <p className={EYEBROW}>{n > 0 ? `${String(n).padStart(2, "0")} · ${label}` : label}</p>;
}

export interface ActText {
  id: string;
  label: string;
  title: string;
  soft: string;
  body: string;
}

/** Heading of a 3D act: left column on desktop, bottom panel (no body) on phones. */
export function ActHead({ text, compact = false }: { text: ActText; compact?: boolean }) {
  return (
    <div>
      <ActEyebrow id={text.id} label={text.label} />
      <h2 className={compact ? `mt-3 ${H2_COMPACT}` : `mt-4 ${H2}`}>
        {text.title} <span className={SOFT}>{text.soft}</span>
      </h2>
      {compact ? null : <p className={`mt-5 ${BODY} [@media(max-height:820px)]:mt-3 [@media(max-height:760px)]:hidden`}>{text.body}</p>}
    </div>
  );
}

/**
 * Caption over the OS screen (desktop OS acts), in the home film's OS-beat
 * layout: ≥1280px title and body side by side (bottom-aligned, so a title that
 * wraps never pushes the body out of view); narrower, the body under the title.
 */
export function OsCaption({ text }: { text: ActText }) {
  return (
    <div>
      <ActEyebrow id={text.id} label={text.label} />
      <div className="mt-2 xl:flex xl:items-end xl:gap-6">
        <h2 className={`${H_OS} xl:max-w-[62%] xl:shrink-0`}>
          {text.title} <span className={SOFT}>{text.soft}</span>
        </h2>
        <p className="mt-1.5 line-clamp-2 max-w-[44rem] text-[13.5px] leading-snug text-[#A3AAAC] xl:mt-0 xl:line-clamp-3 xl:min-w-[15rem] xl:max-w-[34rem] xl:flex-1 xl:text-[14px]">{text.body}</p>
      </div>
    </div>
  );
}

/** Phones: an OS act becomes a card under this heading. */
export function CompactHead({ text }: { text: ActText }) {
  return <ActHead text={text} compact />;
}
