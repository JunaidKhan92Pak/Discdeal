import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Do not tell visitors which framework or server runs the site.
  poweredByHeader: false,
  // Safe defaults for every response. The API's own rules (methods, other websites) live in proxy.ts.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
      // Search engines should list the page, not the raw API answers.
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
  // The deals spreadsheet is read at runtime (when no database is connected), so ship it with the API.
  outputFileTracingIncludes: {
    "/api/deals": ["./data/**/*"],
    "/api/meta": ["./data/**/*"],
  },
  partialPrefetching: true,
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
