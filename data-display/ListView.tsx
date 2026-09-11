import { useState, type ReactNode } from "react";
import { useInfiniteScrollSentinel } from "../lib/hooks/useInfiniteScrollSentinel";
import { useListKeyboardNav } from "../lib/hooks/useListKeyboardNav";
import { ContextMenu, type MenuEntry } from "../overlays/ContextMenu";
import { useToast } from "../feedback/ToastProvider";

export interface ListViewRenderCtx {
  index: number;
  renaming: boolean;
  /** Initial value for the rename field, from `getRenameValue` — pass to
   * `ListRow`'s `renameValue` (or your own `InlineRenameInput`). */
  renameValue: string;
  onRenameSubmit: (value: string) => void;
  onRenameCancel: () => void;
  /** Wire this to the row's own right-click handler (e.g. via `ListRow`'s
   * `onContextMenu`) — `ListView` positions and owns the actual menu. */
  onContextMenu: (e: { clientX: number; clientY: number; preventDefault: () => void }) => void;
}

interface ListViewProps<T> {
  items: T[];
  getId: (item: T) => string | number;
  selectedId: string | number | null;
  onSelect: (item: T) => void;
  /** Space bar on the selected row (e.g. toggle play/pause). Omit if this
   * list has no such action. */
  onActivate?: () => void;
  /** `false` when this list isn't the currently active one among several
   * mounted at once — see `useListKeyboardNav`. Defaults to `true`. */
  keyboardNavEnabled?: boolean;
  hasMore?: boolean;
  loading?: boolean;
  onLoadMore?: () => void;
  /** Renders one row. `ctx.renaming` is true while this item is being renamed
   * inline — swap to an `InlineRenameInput` (or use `ListRow`, which does
   * this for you) when it is. */
  renderRow: (item: T, ctx: ListViewRenderCtx) => ReactNode;
  /** Initial text for the rename field — required if `getContextMenuItems`
   * (or anything else) can trigger `startRename`. */
  getRenameValue?: (item: T) => string;
  /** Commits a rename. May be async (e.g. an API call) — errors are caught
   * and surfaced via `useToast().showError` rather than thrown. */
  onRenameSubmit?: (item: T, value: string) => void | Promise<void>;
  /** Builds the context menu for a right-clicked item. `startRename` flips
   * that item into rename mode (wire an entry's `onSelect` to it) — build a
   * "Rename" entry with it if you want one. Omit entirely for no menu. */
  getContextMenuItems?: (item: T, helpers: { startRename: () => void }) => MenuEntry[];
  emptyState?: ReactNode;
  loadingIndicator?: ReactNode;
  className?: string;
}

/** Generic list plumbing: infinite-scroll sentinel, arrow-key/Space keyboard
 * navigation, and the inline-rename + right-click context-menu state pattern
 * duplicated in SLDR's `AudioFileList` (there also wired to waveform loading,
 * favorites and transcode — all of which stay app-specific and don't belong
 * here). Row content and its domain concerns are entirely up to `renderRow`. */
export function ListView<T>({
  items,
  getId,
  selectedId,
  onSelect,
  onActivate,
  keyboardNavEnabled = true,
  hasMore = false,
  loading = false,
  onLoadMore,
  renderRow,
  getRenameValue,
  onRenameSubmit,
  getContextMenuItems,
  emptyState,
  loadingIndicator,
  className,
}: ListViewProps<T>) {
  const { showError } = useToast();
  const [renamingId, setRenamingId] = useState<string | number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ item: T; x: number; y: number } | null>(null);
  const sentinelRef = useInfiniteScrollSentinel(() => onLoadMore?.(), hasMore && !loading);

  const selectedItem = selectedId == null ? null : (items.find((item) => getId(item) === selectedId) ?? null);
  useListKeyboardNav({
    enabled: keyboardNavEnabled,
    items,
    selected: selectedItem,
    getId,
    onSelect,
    onActivate: onActivate ?? (() => {}),
  });

  async function handleRenameSubmit(item: T, value: string) {
    setRenamingId(null);
    try {
      await onRenameSubmit?.(item, value);
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    }
  }

  if (items.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div className={className}>
      {items.map((item, index) => {
        const id = getId(item);
        return (
          <div key={id}>
            {renderRow(item, {
              index,
              renaming: renamingId === id,
              renameValue: getRenameValue?.(item) ?? "",
              onRenameSubmit: (value) => handleRenameSubmit(item, value),
              onRenameCancel: () => setRenamingId(null),
              onContextMenu: (e) => {
                if (!getContextMenuItems) return;
                e.preventDefault();
                setContextMenu({ item, x: e.clientX, y: e.clientY });
              },
            })}
          </div>
        );
      })}
      {hasMore && <div ref={sentinelRef} className="h-8" />}
      {loading && loadingIndicator}

      {contextMenu && getContextMenuItems && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.item, {
            startRename: () => {
              setRenamingId(getId(contextMenu.item));
              setContextMenu(null);
            },
          })}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
