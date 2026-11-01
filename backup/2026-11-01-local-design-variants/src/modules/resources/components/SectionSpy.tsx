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
      <ul className="afvar-glass-track flex max-w-full gap-1 overflow-x-auto rounded-full p-1 [scrollbar-width:none]">
        {sections.map((s) => (
          <li key={s.id} className="relative shrink-0">
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? "location" : undefined}
              className="afvar-glass-tab relative flex h-8 items-center rounded-full px-3.5 text-[12.5px] font-medium transition-colors"
            >
              {active === s.id && <motion.span aria-hidden="true" layoutId={`spy-${label}`} className="afvar-glass-indicator absolute inset-0 rounded-full" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative">{s.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
