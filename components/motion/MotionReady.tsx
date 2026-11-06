"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __motionReady?: boolean;
  }
}

/** Tells the fallback in app/layout.tsx that the page's scripts are running, so entrance animations may hide content. */
export function MotionReady() {
  useEffect(() => {
    window.__motionReady = true;
  }, []);
  return null;
}
