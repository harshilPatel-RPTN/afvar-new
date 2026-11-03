import type { MetadataRoute } from "next";
import { CATEGORIES, INSTRUMENTS } from "@/modules/markets";
import { CAPABILITIES, capabilityPath } from "@/modules/platform";
import { GUIDES, TROUBLESHOOTING } from "@/modules/resources";
import { SITE_URL } from "./site";

const STATIC = [
  "/",
  "/about",
  "/pricing",
  "/contact",
  "/platform",
  "/market",
  "/resources",
  "/resources/getting-started",
  "/resources/guides",
  "/resources/sources-evidence",
  "/resources/faqs",
  "/resources/help",
  "/privacy",
  "/terms",
  "/cookies",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...STATIC,
    ...CATEGORIES.map((c) => `/market/${c.id}`),
    ...INSTRUMENTS.map((i) => `/market/${i.category}/${i.slug}`),
    ...CAPABILITIES.map((c) => capabilityPath(c.slug)),
    ...GUIDES.map((g) => `/resources/guides/${g.slug}`),
    ...TROUBLESHOOTING.map((t) => `/resources/help/${t.slug}`),
  ];
  return [...new Set(paths)].map((path) => ({ url: `${SITE_URL}${path === "/" ? "" : path}` }));
}
