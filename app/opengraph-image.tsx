import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_PROMISE } from "@/lib/site";

/** The picture shown when someone shares DiscDeal on WhatsApp, Facebook, X or LinkedIn. Built once at build time. */
export const alt = `${SITE_NAME}: ${SITE_PROMISE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#f7f6f3", color: "#1c1b19" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 44, fontWeight: 700 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: "#1d4ed8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>d</div>
          discdeal
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Every sale, every card.</div>
          <div style={{ fontSize: 84, fontWeight: 400, lineHeight: 1.05, color: "#1d4ed8", fontStyle: "italic" }}>All in one place.</div>
        </div>
        <div style={{ fontSize: 34, color: "#55524c" }}>Brand sales and bank card offers across Pakistan, in one search.</div>
      </div>
    ),
    size,
  );
}
