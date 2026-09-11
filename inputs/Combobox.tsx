import { useInfiniteScrollSentinel } from "../lib/hooks/useInfiniteScrollSentinel";
import { cn } from "../lib/cn";

const NOOP = () => {};

export interface ComboboxItem {
  id: string | number;
  label: string;
  /** Present (and truthy) for a tree-shaped item that has children one level
   * down — e.g. a folder. Omit entirely for a flat list — e.g. a tag
   * vocabulary — and the descend chevron never renders. */
  hasChildren?: boolean;
}

export interface ComboboxProps<T extends ComboboxItem> {
  items: T[];
  /** Breadcrumb of the current tree level (e.g. "Sounds / Drums"), or
   * `null`/omitted at the root. Leave unset entirely for a flat list. */
  breadcrumb?: string | null;
  /** More items exist below the current page (pagination by scroll) — only
   * meaningful for a level that can be large (a flat vocabulary, or a tree
   * level with many siblings). */
  hasMore?: boolean;
  /** Reveals the next page — called once the end-of-list sentinel becomes
   * visible, or the caller can call it directly from its own keyboard nav
   * when the highlighted index approaches the end. */
  onLoadMore?: () => void;
  highlightedIndex: number;
  onHover: (index: number) => void;
  onSelect: (item: T) => void;
  labels: {
    /** Shown instead of the list when `items` is empty. */
    noResults: string;
    /** `aria-label` for the listbox itself. */
    listAriaLabel: string;
  };
  className?: string;
}

/** Generic autocomplete popup for a "type a trigger character, get a
 * filtered dropdown" field — an `@mention`-style folder/file picker (tree,
 * via `breadcrumb`/`hasChildren`/pagination) or a flat `#tag`-style picker,
 * covered by the same component since only the tree-specific props differ.
 *
 * This component is presentational only: it renders the popup and reports
 * hover/select, but owns neither the text input nor the trigger-detection
 * state machine (leftmost-trigger scanning, keyboard nav, "descend a tree
 * level" text rewriting). Wire it to your own input's `onChange`/`onKeyDown`
 * using `detectMention` from `lib/mentionTrigger` plus your own filtering —
 * mirroring the split of concerns in the app this was extracted from, where
 * a hook owns the state and this component only renders the current page of
 * `items`.
 *
 * Position it with a `relative` wrapper around your input; this popup is
 * `absolute` and anchors to that wrapper's bottom edge. */
export function Combobox<T extends ComboboxItem>({
  items,
  breadcrumb = null,
  hasMore = false,
  onLoadMore,
  highlightedIndex,
  onHover,
  onSelect,
  labels,
  className,
}: ComboboxProps<T>) {
  const sentinelRef = useInfiniteScrollSentinel(onLoadMore ?? NOOP, hasMore);

  return (
    <div
      role="listbox"
      aria-label={labels.listAriaLabel}
      className={cn(
        "animate-modal-in absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-surface shadow-float",
        className,
      )}
    >
      {breadcrumb && (
        <p className="truncate border-b border-border px-3 py-1 text-[11px] uppercase tracking-wide text-text-muted">
          {breadcrumb}
        </p>
      )}
      {items.length === 0 ? (
        <p className="px-3 py-2 text-xs text-text-muted">{labels.noResults}</p>
      ) : (
        items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={index === highlightedIndex}
            onMouseDown={(e) => {
              // `mousedown`, not `click`: fires before the input's `blur`, so
              // the popup doesn't close (losing focus) before the click
              // reaches this button.
              e.preventDefault();
              onSelect(item);
            }}
            onMouseEnter={() => onHover(index)}
            className={cn(
              "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors",
              index === highlightedIndex ? "bg-accent-muted text-accent" : "text-text hover:bg-surface-hover",
            )}
          >
            <span className="truncate">{item.label}</span>
            {item.hasChildren && <span className="shrink-0 text-text-muted">›</span>}
          </button>
        ))
      )}
      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}
