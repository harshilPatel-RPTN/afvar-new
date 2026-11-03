"use client";

// /about 03 · One desk (split out of CompanySections.tsx so each section has one owner).
// Motion (PLATFORM_MOTION, reduced motion = finished state): the question types itself (kit),
// then the answer's Hindi line and its English line light word by word (desk: after the answer
// window opens; cards: as they scroll up the screen), then the avatar speaks.
import { Ask, AvatarLine, Chip, OsSection, Row, Win } from "@/modules/afvarOs";
import { ABOUT } from "@/modules/company/kit";
import { ChartWin, Para } from "../shared";
import { ProseLight } from "./WhoItServes";

export function OneDesk() {
  return (
    <OsSection n={3} label="One desk" title="Five apps that know about each other." soft="One analyst across them." body={ABOUT.vision.body} app="Workspace">
      <ChartWin k="XAUUSD" at={0.06} x={40} y={20} w={600} h={340} />
      <Ask at={0.3} x={670} y={20} w={490} text="सोने में आज क्या बदला?" />
      <Win at={0.42} x={670} y={84} w={490} h={142} title="उत्तर · Answer" glyph="research" ai>
        <ProseLight at={0.46} span={0.08} className="m-0 text-[13.5px] leading-relaxed text-[#F2F5F2]" text="डॉलर मज़बूत हुआ, इसलिए सोना दबाव में रहा। स्रोत नीचे दिए गए हैं।" />
        <ProseLight at={0.53} span={0.06} className="mt-2 text-[12.5px] text-[#B7C5BC]" text="The dollar firmed, so Gold stayed under pressure. Sources below." />
        <div className="mt-3 flex gap-2">
          <Chip tone="sample">Sample answer</Chip>
          <Chip>English · हिन्दी</Chip>
        </div>
      </Win>
      <AvatarLine at={0.6} x={832} y={250} text="I explain what the code worked out — in English or Hindi, your choice." />
      <Win at={0.72} x={40} y={380} w={600} h={130} title="Apps on this desk" glyph="layouts">
        <div className="flex flex-wrap gap-2">
          <Chip tone="gold">Market data</Chip>
          <Chip>Research</Chip>
          <Chip>Alerts</Chip>
          <Chip>Risk review</Chip>
          <Chip>Community</Chip>
        </div>
        <div className="mt-3">
          <Para>Charts, research, alerts, risk review and community run as connected apps in one workspace.</Para>
        </div>
      </Win>
      <Win at={0.8} x={670} y={350} w={490} h={160} title="What it never does" glyph="risk">
        <Row k="Places trades" v="never" />
        <Row k="Modifies trades" v="never" />
        <Row k="Closes trades" v="never" />
      </Win>
    </OsSection>
  );
}
