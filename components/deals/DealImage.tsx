"use client";

import { useState } from "react";
import Image from "next/image";
import { canOptimize } from "@/lib/images";

type DealImageProps = {
  src: string;
  /** How wide it is drawn, so the browser downloads the smallest file that is still sharp. */
  sizes: string;
  /** 55 for cards, 75 for the dialog (must be one of `qualities` in next.config.ts). */
  quality: 55 | 75;
};

/**
 * A deal's picture, filling its frame (the frame has a fixed shape, so nothing jumps while it loads). It loads only
 * when it is about to scroll into view, fades in once it has arrived, and simply disappears if the link is broken,
 * leaving the green offer panel behind it. Our own pictures are resized and converted (AVIF/WebP); others as-is.
 */
export function DealImage({ src, sizes, quality }: DealImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  const className = `absolute inset-0 -z-20 size-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`;
  const events = { onLoad: () => setLoaded(true), onError: () => setFailed(true) };

  if (canOptimize(src)) return <Image src={src} alt="" fill sizes={sizes} quality={quality} className={className} {...events} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" decoding="async" fetchPriority="low" className={className} {...events} />;
}
