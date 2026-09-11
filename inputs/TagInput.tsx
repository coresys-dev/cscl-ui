import { useEffect, useId, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "../lib/cn";

interface TagChipProps {
  label: string;
  removeLabel: string;
  onRemove: () => void;
  onDoubleClick?: () => void;
  compact?: boolean;
}

/** Single removable pill shared by both density variants — full-size chip in
 * `"full"`, condensed with a hover-revealed close button in `"compact"`. */
function TagChip({ label, removeLabel, onRemove, onDoubleClick, compact }: TagChipProps) {
  return (
    <span
      onDoubleClick={onDoubleClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface-raised text-text",
        compact ? "group py-0.5 pl-1.5 pr-1 text-[11px]" : "px-2 py-0.5 text-xs",
      )}
    >
      <span className={cn("truncate", compact && "max-w-[10rem]")}>{label}</span>
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className={cn(
          "shrink-0 text-text-muted transition-colors hover:text-danger",
          compact && "opacity-0 transition-opacity group-hover:opacity-100",
        )}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

interface TagInputLabels {
  /** Placeholder for the "add a tag" text field. */
  addPlaceholder: string;
  /** `aria-label` for each chip's remove button. */
  remove: string;
  /** `aria-label` for the compact variant's `+` add-trigger button. */
  add?: string;
  /** Shown in the `"full"` variant when there are no tags yet. */
  empty?: string;
}

interface TagInputProps {
  /** `"full"` (default): wrapped chip list + a persistent add field below it,
   * matching an editable-list-in-a-details-panel layout. `"compact"`: a
   * single scrollable row of chips (with edge fade + wheel-to-horizontal-
   * scroll) plus an inline `+` that swaps to a field, for a tight toolbar/
   * status-bar layout. */
  variant?: "full" | "compact";
  /** Current tags, as plain labels — no source/score metadata: that kind of
   * per-tag provenance is domain-specific and belongs in your own wrapper
   * (e.g. render richer chips yourself and skip this component) if needed. */
  tags: string[];
  /** Autocomplete vocabulary offered via a native `<datalist>` — free text is
   * still allowed, this is a suggestion list, not a closed set. */
  vocabulary: string[];
  onAdd: (label: string) => void;
  onRemove: (label: string) => void;
  /** Enables double-click-to-rename on a chip in the `"full"` variant only
   * (the compact strip has no room for an inline rename field). Omit to
   * disable renaming entirely. */
  onRename?: (oldLabel: string, newLabel: string) => void;
  labels: TagInputLabels;
  className?: string;
}

/** Generic tag/chip input: a list of removable string chips plus a way to add
 * one from a suggested vocabulary. Covers two density variants of the same
 * underlying concept — a fully editable list with its own add row
 * (`"full"`), or a compact inline strip meant to share a line with other
 * content (`"compact"`). Neither variant talks to any backend: pass the
 * current `tags` and vocabulary as plain data, and handle persistence in
 * `onAdd`/`onRemove`/`onRename`. */
export function TagInput({
  variant = "full",
  tags,
  vocabulary,
  onAdd,
  onRemove,
  onRename,
  labels,
  className,
}: TagInputProps) {
  const listId = useId();

  if (variant === "compact") {
    return (
      <CompactTagInput
        tags={tags}
        vocabulary={vocabulary}
        onAdd={onAdd}
        onRemove={onRemove}
        labels={labels}
        listId={listId}
        className={className}
      />
    );
  }

  return (
    <FullTagInput
      tags={tags}
      vocabulary={vocabulary}
      onAdd={onAdd}
      onRemove={onRemove}
      onRename={onRename}
      labels={labels}
      listId={listId}
      className={className}
    />
  );
}

interface VariantProps {
  tags: string[];
  vocabulary: string[];
  onAdd: (label: string) => void;
  onRemove: (label: string) => void;
  labels: TagInputLabels;
  listId: string;
  className?: string;
}

/** Wrapped chip list + a persistent add field, with double-click-to-rename
 * when `onRename` is supplied. */
function FullTagInput({
  tags,
  vocabulary,
  onAdd,
  onRemove,
  onRename,
  labels,
  listId,
  className,
}: VariantProps & { onRename?: (oldLabel: string, newLabel: string) => void }) {
  const [draft, setDraft] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) renameRef.current?.focus();
  }, [renaming]);

  function submitAdd() {
    if (draft.trim()) onAdd(draft);
    setDraft("");
  }

  function submitRename(oldLabel: string) {
    if (renameDraft.trim() && onRename) onRename(oldLabel, renameDraft);
    setRenaming(null);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-1.5">
        {tags.length === 0 && labels.empty && <span className="text-xs text-text-muted">{labels.empty}</span>}
        {tags.map((label) =>
          renaming === label ? (
            <input
              key={label}
              ref={renameRef}
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename(label);
                if (e.key === "Escape") setRenaming(null);
              }}
              onBlur={() => setRenaming(null)}
              className="w-32 rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-text outline-none focus:border-accent"
            />
          ) : (
            <TagChip
              key={label}
              label={label}
              removeLabel={labels.remove}
              onRemove={() => onRemove(label)}
              onDoubleClick={
                onRename
                  ? () => {
                      setRenaming(label);
                      setRenameDraft(label);
                    }
                  : undefined
              }
            />
          ),
        )}
      </div>
      <input
        list={listId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submitAdd();
        }}
        placeholder={labels.addPlaceholder}
        className="w-full rounded-md border border-border bg-surface-raised px-2.5 py-1 text-xs text-text outline-none focus:border-accent"
      />
      <datalist id={listId}>
        {vocabulary.map((label) => (
          <option key={label} value={label} />
        ))}
      </datalist>
    </div>
  );
}

/** Single scrollable row of chips with edge-fade masking + wheel-to-
 * horizontal-scroll, and an inline `+` that swaps to an add field — for a
 * layout with no room for a full editable list (a status bar, a compact
 * toolbar row). No rename affordance: use `"full"` where that's needed. */
function CompactTagInput({ tags, vocabulary, onAdd, onRemove, labels, listId, className }: VariantProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [edges, setEdges] = useState({ start: true, end: true });
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  // Track scroll edges (for the fade mask) and turn vertical wheel input
  // into horizontal scroll. Non-passive `wheel` listener: `preventDefault`
  // stops the wheel from "leaking" to a parent while there's still tag
  // content left to reveal.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sync = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft >= max - 1 });
    };
    const onWheel = (e: WheelEvent) => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      if ((delta < 0 && el.scrollLeft > 0) || (delta > 0 && el.scrollLeft < max)) {
        el.scrollLeft += delta;
        e.preventDefault();
      }
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      el.removeEventListener("wheel", onWheel);
      ro.disconnect();
    };
  }, [tags.length]);

  function commit() {
    if (draft.trim()) onAdd(draft);
    setDraft("");
    setAdding(false);
  }

  // Only fade an edge if there's actually hidden content on that side.
  const fadeLeft = edges.start ? "0" : "1.25rem";
  const fadeRight = edges.end ? "0" : "1.25rem";
  const mask = `linear-gradient(to right, transparent 0, #000 ${fadeLeft}, #000 calc(100% - ${fadeRight}), transparent 100%)`;

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-1", className)}>
      <div
        ref={scrollRef}
        className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        {tags.map((label) => (
          <TagChip key={label} label={label} removeLabel={labels.remove} onRemove={() => onRemove(label)} compact />
        ))}
      </div>

      {adding ? (
        <input
          ref={inputRef}
          list={listId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft("");
              setAdding(false);
            }
          }}
          onBlur={commit}
          placeholder={labels.addPlaceholder}
          className="h-5 w-32 shrink-0 rounded-full border border-border bg-surface px-2 text-[11px] text-text outline-none focus:border-accent"
        />
      ) : (
        <button
          type="button"
          aria-label={labels.add ?? labels.addPlaceholder}
          onClick={() => setAdding(true)}
          className="shrink-0 rounded-full border border-dashed border-border p-0.5 text-text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}

      <datalist id={listId}>
        {vocabulary.map((label) => (
          <option key={label} value={label} />
        ))}
      </datalist>
    </div>
  );
}
