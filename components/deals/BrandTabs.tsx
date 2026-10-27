import { Icon } from "@/components/ui/Icon";
import type { BrowseView } from "@/hooks/useBrowseFilters";

type BrandTabsProps = {
  brands: string[];
  brand: string;
  view: BrowseView;
  likedCount: number;
  onSelectBrand: (brand: string) => void;
  onSelectLiked: () => void;
  count: number;
};

/** One row of tabs: Liked, All brands, then every brand in the current selection. */
export function BrandTabs({ brands, brand, view, likedCount, onSelectBrand, onSelectLiked, count }: BrandTabsProps) {
  const browsing = view === "browse";

  return (
    <div className="flex items-center gap-4">
      <div role="tablist" aria-label="Deal views and brands" className="-mx-gutter flex min-w-0 flex-1 gap-1 overflow-x-auto px-gutter [scrollbar-width:none] sm:mx-0 sm:px-0">
        <button type="button" role="tab" aria-selected={view === "liked"} className="tab inline-flex items-center gap-1.5" onClick={onSelectLiked}>
          <Icon name="heart" className="size-4" fill={view === "liked" ? "currentColor" : "none"} />
          Liked
          <span className="count">{likedCount}</span>
        </button>

        <button type="button" role="tab" aria-selected={browsing && brand === "all"} className="tab" onClick={() => onSelectBrand("all")}>
          All brands
        </button>
        {brands.map((name) => (
          <button key={name} type="button" role="tab" aria-selected={browsing && brand === name} className="tab" onClick={() => onSelectBrand(name)}>
            {name}
          </button>
        ))}
      </div>
      <p className="hidden shrink-0 text-small tabular-nums text-muted sm:block">
        {count} deal{count === 1 ? "" : "s"}
      </p>
    </div>
  );
}
