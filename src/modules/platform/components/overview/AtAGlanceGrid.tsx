import { CARD, EYEBROW, H2, SOFT } from "@/modules/afvarOs";
import { AT_A_GLANCE } from "../../content";
import { PIcon } from "../mac/icons";

/** W2.1.1–W2.1.10: the ten overview topics, as cards in the AI OS theme. */
export function AtAGlanceGrid() {
  return (
    <section aria-labelledby="glance-title" className="border-t border-[rgba(255,255,255,0.06)] bg-[#050607] px-5 py-24 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-[1240px]">
        <p className={EYEBROW}>At a glance</p>
        <h2 id="glance-title" className={`mt-4 ${H2}`}>
          Ten things to know. <span className={SOFT}>Before you register.</span>
        </h2>
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {AT_A_GLANCE.map((topic, i) => (
            <li key={topic.id} className={`${CARD} flex flex-col p-5 ${i === 0 ? "border-[rgba(233,180,76,0.35)]" : ""}`}>
              <span className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(233,180,76,0.35)] text-[#E9B44C]">
                  <PIcon name={topic.icon} size={18} />
                </span>
                <span className="font-mono text-[10px] text-[#5E6669]">{String(i + 1).padStart(2, "0")}</span>
              </span>
              <h3 className="mt-4 text-[15px] font-semibold leading-snug text-[#F5F7F7]">{topic.title}</h3>
              {topic.body.map((line) => (
                <p key={line} className="mt-2 text-[13px] leading-relaxed text-[#8A9295]">
                  {line}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
