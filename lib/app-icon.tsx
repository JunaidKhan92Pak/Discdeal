import { ImageResponse } from "next/og";

/**
 * The installed app's icon as a PNG at any size: the blue square with the white "d", the same mark as app/icon.svg.
 * Full-bleed (no rounded corners, the phone rounds or masks it itself) with the letter inside the middle 60%, so it
 * also works as an Android "maskable" icon whatever shape the phone cuts it to.
 * Used by the manifest's PNG icons (app/app-icon/…) and the iPhone home-screen icon (app/apple-icon.tsx).
 */
export function appIcon(size: number): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1d4ed8",
          color: "#ffffff",
          fontSize: size * 0.62,
          fontWeight: 700,
          // The letter's own box sits a little high; this centres the visible "d".
          paddingBottom: size * 0.06,
        }}
      >
        d
      </div>
    ),
    { width: size, height: size },
  );
}
