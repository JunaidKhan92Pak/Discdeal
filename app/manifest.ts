import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

/** Lets phones add DiscDeal to the home screen like an app, with the right name, colours and icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: discounts in Pakistan`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f3f2ee",
    theme_color: "#1d4ed8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
