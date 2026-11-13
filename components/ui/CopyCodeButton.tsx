"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { boing } from "@/lib/animate";

export function CopyCodeButton({ code, className = "" }: { code: string; className?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function show(next: "copied" | "failed") {
    setStatus(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), next === "copied" ? 1500 : 3000);
  }

  function copy() {
    if (!navigator.clipboard) return show("failed");
    navigator.clipboard.writeText(code).then(
      () => {
        show("copied");
        boing(buttonRef.current);
      },
      () => show("failed"),
    );
  }

  return (
    <>
      <button ref={buttonRef} type="button" onClick={copy} className={`code-btn ${className}`} aria-label={`Copy code ${code}`}>
        {status === "copied" ? (
          <span className="inline-flex items-center gap-1 font-sans">
            <Icon name="check" className="size-4" strokeWidth={2.5} /> Copied
          </span>
        ) : status === "failed" ? (
          <span className="font-sans">Copy it by hand: {code}</span>
        ) : (
          <>
            <span translate="no">{code}</span>
            <Icon name="copy" className="size-4 opacity-70" />
          </>
        )}
      </button>
      {/* The button's name stays "Copy code …", so the result is announced here instead. */}
      <span className="sr-only" aria-live="polite">
        {status === "copied" ? `Code ${code} copied` : status === "failed" ? `Could not copy. The code is ${code}` : ""}
      </span>
    </>
  );
}
