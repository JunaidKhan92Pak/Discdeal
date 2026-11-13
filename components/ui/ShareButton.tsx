"use client";

import { useEffect, useRef, useState } from "react";
import { Hint } from "@/components/ui/Hint";
import { Icon } from "@/components/ui/Icon";
import { boing } from "@/lib/animate";

type ShareButtonProps = {
  /** What is being shared, for the button's name: "Domino's 30% OFF". */
  title: string;
  /** The message sent with the link. */
  text: string;
  /** Path on this site, e.g. "/deals/brand/domino-s"; the current origin is added. */
  path: string;
  className?: string;
};

/**
 * Shares a deal: a round icon button, next to the heart (on cards and in the details). Phones (and other devices with
 * a share sheet): the system sheet opens, so WhatsApp, Messages and the rest are one tap away. Elsewhere: the message
 * and link are copied, and the icon turns into a tick for a moment.
 */
export function ShareButton({ title, text, path, className = "" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const iconRef = useRef<SVGSVGElement>(null);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} | DiscDeal`, text, url });
      } catch {
        // Closing the sheet without sharing is not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      boing(iconRef.current);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked (rare): nothing to undo; the button simply does not confirm.
    }
  }

  return (
    <>
      <Hint label={copied ? "Link copied" : "Share deal"} detail={copied ? undefined : "Send it to family and friends"} side="left">
        <button type="button" className={`like-btn ${className}`} onClick={share} aria-label={`Share ${title}`}>
          <Icon ref={iconRef} name={copied ? "check" : "share"} className="size-[1.375rem]" strokeWidth={copied ? 2.5 : 2} />
        </button>
      </Hint>
      {/* A changed button name is not reliably read out; a live region is. */}
      <span className="sr-only" aria-live="polite">
        {copied ? `Link to ${title} copied` : ""}
      </span>
    </>
  );
}
