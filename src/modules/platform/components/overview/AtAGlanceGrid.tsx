import { CARD, EYEBROW, H2, SOFT } from "@/modules/afvarOs";
import { AT_A_GLANCE } from "../../content";
import { RevealItem, RevealList, RevealRing, RuleDraw } from "../../film/motion";
import { PIcon } from "../mac/icons";

/** W2.1.1–W2.1.10: the ten overview topics, as cards in the AI OS theme (D1 cards rise in order with their icon ring drawing, D4 the rule draws). */
export function AtAGlanceGrid() {
  return (
    <section aria-labelledby="glance-title" className="relative bg-transparent px-5 py-24 sm:px-8 lg:px-16">
      <RuleDraw />
      <div className="mx-auto max-w-[1240px]">
        <p className={EYEBROW}>At a glance</p>
        <h2 id="glance-title" className={`mt-4 ${H2}`}>
          Ten things to know. <span className={SOFT}>Before you register.</span>
        </h2>
        <RevealList className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {AT_A_GLANCE.map((topic, i) => (
            <RevealItem key={topic.id} i={i} className={`${CARD} flex flex-col p-5 ${i === 0 ? "border-[rgba(168,222,194,0.35)]" : ""}`}>
              <span className="flex items-center justify-between">
                <span className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#A8DEC2]">
                  <RevealRing className="rounded-xl border border-[rgba(168,222,194,0.35)]" />
                  <PIcon name={topic.icon} size={18} />
                </span>
                <span className="font-mono text-[10px] text-[#7E8F85]">{String(i + 1).padStart(2, "0")}</span>
              </span>
              <h3 className="mt-4 text-[15px] font-semibold leading-snug text-[#F2F5F2]">{topic.title}</h3>
              {topic.body.map((line) => (
                <p key={line} className="mt-2 text-[13px] leading-relaxed text-[#8A9295]">
                  {line}
                </p>
              ))}
            </RevealItem>
          ))}
        </RevealList>
      </div>
    </section>
  );
}
