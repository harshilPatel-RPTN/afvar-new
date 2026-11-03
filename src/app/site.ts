// Public origin of the marketing site, for absolute URLs in metadata, the sitemap and robots.txt.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://afvar.com").replace(/\/$/, "");
