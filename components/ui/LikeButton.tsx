import { Icon } from "@/components/ui/Icon";

type LikeButtonProps = { liked: boolean; title: string; onToggle: () => void; className?: string };

export function LikeButton({ liked, title, onToggle, className = "" }: LikeButtonProps) {
  return (
    <button
      type="button"
      className={`like-btn ${className}`}
      data-liked={liked}
      aria-pressed={liked}
      aria-label={liked ? `Remove ${title} from liked deals` : `Like ${title}`}
      onClick={onToggle}
    >
      <Icon name="heart" className="size-5" fill={liked ? "currentColor" : "none"} />
    </button>
  );
}
