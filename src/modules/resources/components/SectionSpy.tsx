"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/** In-page section bar that follows the reader (scroll-spy) and jumps on click. */
export function SectionSpy({ sections, label }: { sections: readonly { id: string; title: string }[]; label: string }) {
  const [active, setActive] = useState(sections[0].id);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label={label} className="sticky top-[76px] z-20 mt-6 flex justify-center px-4">
      <ul className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-[#111416]/95 p-1 shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_0_0_0.5px_rgba(255,255,255,0.1)] backdrop-blur-xl [scrollbar-width:none]">
        {sections.map((s) => (
          <li key={s.id} className="relative shrink-0">
            {active === s.id && <motion.span layoutId={`spy-${label}`} className="absolute inset-0 rounded-full bg-(--accent)/15" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <a
              href={`#${s.id}`}
              className={`relative flex h-8 items-center rounded-full px-3.5 text-[12.5px] font-medium transition-colors ${active === s.id ? "text-(--accent)" : "text-(--text-secondary) hover:text-(--text-primary)"}`}
            >
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
