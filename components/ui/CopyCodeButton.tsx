"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button type="button" onClick={copy} className="code-btn" aria-label={`Copy code ${code}`}>
      {copied ? (
        <span className="inline-flex items-center gap-1">
          <Icon name="check" className="size-3.5" strokeWidth={2.5} /> copied
        </span>
      ) : (
        code
      )}
    </button>
  );
}
