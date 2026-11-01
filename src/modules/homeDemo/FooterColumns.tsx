"use client";

// Footer link columns: fade up one after another (40 ms apart) the first time
// they scroll into view; links draw their underline on hover. The disclaimer
// and company line around them stay static on purpose.
import { motion } from "framer-motion";
import Link from "next/link";
import { useMotionReduced } from "./motionPref";
import { MONO, REGISTER_HREF } from "./ui";

export type FooterColumn = { title: string; links: { label: string; href: string }[] };

export function FooterColumns({ columns }: { columns: readonly FooterColumn[] }) {
  const reduced = useMotionReduced();
  return (
    <nav className="mt-12 grid gap-8 sm:grid-cols-3" aria-label="Footer">
      {columns.map((col, i) => (
        <motion.div
          key={col.title}
          initial={reduced ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className={`${MONO} text-(--afvar-text)`}>{col.title}</p>
          <ul className="mt-4 space-y-2.5">
            {col.links.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  prefetch={l.href === REGISTER_HREF ? false : undefined}
                  className="afv-link text-sm text-[#A3AAAC] transition-colors hover:text-(--afvar-text)"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </nav>
  );
}
