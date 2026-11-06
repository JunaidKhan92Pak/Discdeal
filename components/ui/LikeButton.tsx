"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { boing } from "@/lib/motion";

type LikeButtonProps = { liked: boolean; title: string; onToggle: () => void; className?: string };

export function LikeButton({ liked, title, onToggle, className = "" }: LikeButtonProps) {
  const iconRef = useRef<SVGSVGElement>(null);
  const wasLiked = useRef(liked);

  // The heart gives a little bounce (anime.js) the moment a deal is liked; not on load, and not if login is needed first.
  useEffect(() => {
    if (liked && !wasLiked.current) boing(iconRef.current);
    wasLiked.current = liked;
  }, [liked]);

  return (
    <button
      type="button"
      className={`like-btn ${className}`}
      aria-pressed={liked}
      aria-label={liked ? `Remove ${title} from liked deals` : `Like ${title}`}
      onClick={onToggle}
    >
      <Icon ref={iconRef} name="heart" className="size-6" fill={liked ? "currentColor" : "none"} />
    </button>
  );
}
