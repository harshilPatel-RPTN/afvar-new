"use client";

// /about 05 · Principles (split out of CompanySections.tsx so each section has one owner).
// Motion (Agent C): the five principles arrive line by line and tick (desk: with the
// scroll; phones: 300 ms apart once the card enters); each principle card follows its
// step; the card bodies light up word by word with the scroll.
import { useState } from "react";
import { OsSection, Win, useSection } from "@/modules/afvarOs";
import { ABOUT } from "@/modules/company/kit";
import { WordLight } from "../../motion";
import { ScrollSteps } from "../shared";
import { AfterStep, ArrivingRows, DeskWordLight } from "./motionBits";

const AT = [0.14, 0.26, 0.38, 0.5, 0.62] as const;
const CARD_AT = (i: number) => 0.2 + i * 0.16;
const BODY_CLS = "m-0 text-[13.5px] leading-relaxed text-[#F2F5F2]";

export function Principles() {
  // Phones: when the principles list started ticking (the cards wait for their step).
  const [started, setStarted] = useState(false);
  return (
    <OsSection
      n={5}
      label="Principles"
      title="Five rules the product enforces."
      soft="Checked in code, not on a poster."
      body="Each principle maps to something the software refuses to do or always shows."
      app="Workspace"
    >
      <Win at={0.06} x={40} y={20} w={560} h={490} title="Product principles" glyph="settings">
        <ArrivingRows at={AT} onStart={() => setStarted(true)}>
          <ScrollSteps
            items={ABOUT.principles.map((p) => ({
              label: p.short,
              detail: p.title,
            }))}
            at={AT}
          />
        </ArrivingRows>
      </Win>
      {ABOUT.principles.slice(0, 3).map((p, i) => (
        <AfterStep key={p.title} i={i} started={started}>
          <Win at={CARD_AT(i)} x={630} y={20 + i * 168} w={530} h={150} title={p.title} glyph={i === 1 ? "risk" : "research"}>
            <PrincipleBody text={p.body} at={CARD_AT(i)} />
          </Win>
        </AfterStep>
      ))}
    </OsSection>
  );
}

function PrincipleBody({ text, at }: { text: string; at: number }) {
  const { mode, on } = useSection();
  if (on && mode === "desk") return <DeskWordLight text={text} from={at + 0.04} to={at + 0.16} className={BODY_CLS} />;
  return <WordLight text={text} className={BODY_CLS} />;
}
