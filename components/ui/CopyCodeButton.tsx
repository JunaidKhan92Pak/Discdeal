"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { boing } from "@/lib/motion";

export function CopyCodeButton({ code, className = "" }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function copy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      boing(buttonRef.current);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button ref={buttonRef} type="button" onClick={copy} className={`code-btn ${className}`} aria-label={`Copy code ${code}`}>
      {copied ? (
        <span className="inline-flex items-center gap-1 font-sans">
          <Icon name="check" className="size-4" strokeWidth={2.5} /> Copied
        </span>
      ) : (
        <>
          {code}
          <Icon name="copy" className="size-4 opacity-70" />
        </>
      )}
    </button>
  );
}
