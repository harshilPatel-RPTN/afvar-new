import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone build for the Docker image (see docker/Dockerfile).
  output: "standalone",
  // Next 16 allowlists image qualities (default [75]); 85 keeps the large full-bleed /market photos crisp.
  images: {
    qualities: [75, 85],
  },
  // Old or removed addresses still linked from some pages / bookmarks. Temporary (307)
  // so they can be repointed once the real destinations ship.
  async redirects() {
    return [
      { source: "/markets", destination: "/market", permanent: false },
      { source: "/markets/:path*", destination: "/market/:path*", permanent: false },
      // The desk lives in the app (app.afvar.com); on the website it is the platform tour.
      { source: "/desk", destination: "/platform", permanent: false },
      { source: "/communities", destination: "/platform/community", permanent: false },
    ];
  },
  // Baseline security headers on every response. Deliberately no script/connect CSP:
  // three.js and the cross-origin avatar iframe (afvar-avatar-final.vercel.app) must
  // keep working. frame-ancestors / X-Frame-Options only stop OTHER sites framing us;
  // they don't affect iframes we embed.
  async headers() {
    const headers = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];
    if (process.env.NODE_ENV === "production") {
      headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" });
    }
    return [{ source: "/:path*", headers }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
