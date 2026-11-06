import type { NextConfig } from "next";
import { IMAGE_HOSTS } from "./lib/images";

const nextConfig: NextConfig = {
  cacheComponents: true,
  /*
   * Deal pictures are resized for each screen and sent as AVIF/WebP (a fraction of the original's size), then cached
   * for a month. Only pictures we host are optimised: files in public/deals/, and https hosts listed in
   * NEXT_PUBLIC_IMAGE_HOSTS (e.g. your Supabase storage). Anything else is shown as-is, lazily (components/deals/DealImage).
   */
  images: {
    formats: ["image/avif", "image/webp"],
    // 55 for cards (small, many on screen), 75 for the details dialog.
    qualities: [55, 75],
    minimumCacheTTL: 60 * 60 * 24 * 31,
    imageSizes: [96, 128, 192, 256, 320, 384],
    localPatterns: [{ pathname: "/deals/**", search: "" }],
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname, port: "", pathname: "/**", search: "" })),
  },
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
