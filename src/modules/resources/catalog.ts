import type { PlatformIcon } from "@/modules/platform/kit";
import { CATEGORIES, EVIDENCE, FAQ_GROUPS, GETTING_STARTED, GUIDE_GROUPS, GUIDES, TROUBLESHOOTING, type CategoryId } from "./content";

/** One searchable entry in the Resources browser — built from the page content, never hand-kept. */
export interface CatalogItem {
  id: string;
  category: CategoryId;
  kind: string;
  title: string;
  summary: string;
  detail: string[];
  href: string;
  icon: PlatformIcon;
}

const groupTitle = (id: string) => GUIDE_GROUPS.find((g) => g.id === id)?.title ?? "";

export const CATALOG: CatalogItem[] = [
  ...GETTING_STARTED.steps.map((s, i) => ({
    id: `start-${s.id}`,
    category: "start" as const,
    kind: `Step ${i + 1} of ${GETTING_STARTED.steps.length}`,
    title: s.title,
    summary: s.body,
    detail: s.needs,
    href: `/resources/getting-started#${s.id}`,
    icon: s.icon,
  })),
  ...GUIDES.map((g) => ({
    id: `guide-${g.slug}`,
    category: "guides" as const,
    kind: `Guide · ${groupTitle(g.group)}`,
    title: g.title,
    summary: g.task,
    detail: g.steps.map((s) => s.title),
    href: `/resources/guides/${g.slug}`,
    icon: GUIDE_GROUPS.find((x) => x.id === g.group)?.icon ?? "book",
  })),
  ...[
    { id: "sources", title: "Data sources & attribution", summary: "The provenance envelope every market number carries.", icon: "file" as const, detail: EVIDENCE.badge.map((b) => b.label) },
    { id: "freshness", title: "Freshness, delays & missing data", summary: "What LIVE, DELAYED, SNAPSHOT, CLOSED and UNAVAILABLE mean.", icon: "clock" as const, detail: EVIDENCE.labels.map((l) => l.label) },
    { id: "analysis", title: "Understanding the analysis", summary: "Each part of a verdict, and how every number links to its calculation.", icon: "lightbulb" as const, detail: EVIDENCE.analysis.parts.map((p) => p.label) },
    { id: "records", title: "Measured records: scope and limitations", summary: "How every call — including WAIT — is graded, and what a record can't tell you.", icon: "check" as const, detail: [...EVIDENCE.records.limits] },
    { id: "backtest", title: "Backtest assumptions", summary: "The assumptions every published test result will state.", icon: "flask" as const, detail: [...EVIDENCE.backtest.fields] },
  ].map((e) => ({ ...e, id: `evidence-${e.id}`, category: "evidence" as const, kind: "Evidence", href: `/resources/sources-evidence#${e.id}` })),
  ...FAQ_GROUPS.flatMap((group) =>
    group.items.map((item, i) => ({
      id: `faq-${group.id}-${i}`,
      category: "faqs" as const,
      kind: `FAQ · ${group.title}`,
      title: item.q,
      summary: item.a,
      detail: [],
      href: `/resources/faqs#${group.id}`,
      icon: "message" as const,
    })),
  ),
  ...TROUBLESHOOTING.map((t) => ({
    id: `help-${t.slug}`,
    category: "help" as const,
    kind: `Troubleshooting · ${t.capability}`,
    title: t.title,
    summary: t.symptom,
    detail: t.checks,
    href: `/resources/help/${t.slug}`,
    icon: t.icon,
  })),
  {
    id: "help-contact",
    category: "help",
    kind: "Support",
    title: "Contact support",
    summary: "One shared destination: tell us the topic, how to reach you and what happened.",
    detail: ["Topic", "Contact email", "Problem details"],
    href: "/resources/help#support",
    icon: "message",
  },
];

export function searchCatalog(query: string, category: CategoryId | "all"): CatalogItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return CATALOG.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (!words.length) return true;
    const hay = `${item.title} ${item.summary} ${item.kind} ${item.detail.join(" ")}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export const CATEGORY_COUNTS = Object.fromEntries(CATEGORIES.map((c) => [c.id, CATALOG.filter((i) => i.category === c.id).length])) as Record<CategoryId, number>;
