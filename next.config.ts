import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
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
