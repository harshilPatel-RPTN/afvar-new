import type { MetadataRoute } from "next";
import { SITE_URL } from "./site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/home-2", "/home-demo"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
