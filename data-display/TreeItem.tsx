import { memo, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { InlineRenameInput } from "./InlineRenameInput";
import type { TreeNode } from "./treeUtils";

/** Drag-and-drop state shared by an entire `TreeView` (root and every nested
 * row) — owned by `TreeView`, read here only to render the drop indicators. */
export interface TreeDndState {
  draggingId: number | string | null;
  /** The dragged node itself and all its descendants: forbidden targets
   * (would create a cycle) — never highlighted, never kept as a target. */
  invalidDropIds: ReadonlySet<number | string>;
  overTarget: { id: number | string; zone: "before" | "after" | "into" } | null;
  /** `true` right after a drag actually engaged (moved past the threshold):
   * consumed by the row that receives the pointer-up so its `onClick` doesn't
   * also select the drop target. Shared (not a per-row ref) because the row
   * that releases isn't necessarily the one that started the drag. */
  suppressNextClickRef: { current: boolean };
}

/** Drag-and-drop implemented with Pointer Events rather than the HTML5 Drag
 * API: under Tauri/WebView2, `dragDropEnabled` (needed elsewhere for
 * OS-file-drop import) intercepts `dragstart`/`dragover`/`drop` before they
 * reach the DOM on Windows. Only `TreeView` knows the full tree (needed to
 * compute the new sibling order), so it alone owns this single entry point. */
export interface TreeDndActions<T> {
  onPointerDown: (node: T, e: React.PointerEvent) => void;
}

interface TreeItemProps<T extends TreeNode<T>> {
  node: T;
  depth: number;
  selectedId: number | string | null;
  onSelect: (id: number | string) => void;
  /** Renders a row's label content (icon, name, whatever) — full control is
   * left to the caller since this component knows nothing about the node's
   * domain fields beyond `id`/`parentId`/`children`. */
  renderLabel: (node: T, selected: boolean) => ReactNode;
  onContextMenu: (node: T, x: number, y: number) => void;
  renamingId: number | string | null;
  getRenameValue: (node: T) => string;
  onRenameSubmit: (node: T, value: string) => void;
  onRenameCancel: () => void;
  dnd: TreeDndState;
  dndActions: TreeDndActions<T>;
  /** Expanded by default when a node has children — mirrors SLDR's folder
   * tree (collapsed on first render, no persisted expand state). */
  defaultExpanded?: boolean;
}

function TreeItemImpl<T extends TreeNode<T>>({
  node,
  depth,
  selectedId,
  onSelect,
  renderLabel,
  onContextMenu,
  renamingId,
  getRenameValue,
  onRenameSubmit,
  onRenameCancel,
  dnd,
  dndActions,
  defaultExpanded = false,
}: TreeItemProps<T>) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isRenaming = renamingId === node.id;
  const isDragging = dnd.draggingId === node.id;
  const overZone = dnd.overTarget?.id === node.id ? dnd.overTarget.zone : null;

  return (
    <div
      className={`group/tree-row relative ${isDragging ? "opacity-40" : ""}`}
      data-tree-row-id={node.id}
      onPointerDown={(e) => {
        if (!isRenaming && e.button === 0) dndActions.onPointerDown(node, e);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(node, e.clientX, e.clientY);
      }}
    >
      {overZone === "before" && (
        <div
          className="pointer-events-none absolute inset-x-2 top-0 z-10 h-0.5 rounded-full bg-accent"
          style={{ left: `${depth * 14 + 8}px` }}
        />
      )}
      {isRenaming ? (
        <div
          style={{ paddingLeft: `${depth * 14 + 12}px` }}
          className="mx-2 flex w-[calc(100%-1rem)] items-center gap-1.5 py-1.5 pr-2"
        >
          <span className="w-3 shrink-0" />
          <InlineRenameInput
            initialValue={getRenameValue(node)}
            onSubmit={(value) => onRenameSubmit(node, value)}
            onCancel={onRenameCancel}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (dnd.suppressNextClickRef.current) {
              dnd.suppressNextClickRef.current = false;
              return;
            }
            onSelect(node.id);
          }}
          style={{ paddingLeft: `${depth * 14 + 12}px` }}
          className={`mx-2 flex w-[calc(100%-1rem)] items-center gap-1.5 rounded-sm py-1.5 pr-2 text-left text-sm transition-colors ${
            isSelected ? "bg-accent-muted text-accent" : "text-text-muted hover:bg-surface-hover hover:text-text"
          } ${overZone === "into" ? "ring-1 ring-inset ring-accent bg-accent-muted/40" : ""}`}
        >
          {hasChildren ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }}
              className="inline-block w-3 shrink-0 select-none text-[10px] transition-transform duration-200"
              style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              <ChevronRight className="h-3 w-3" />
            </span>
          ) : (
            <span className="w-3 shrink-0" />
          )}
          <span className="min-w-0 flex-1 truncate">{renderLabel(node, isSelected)}</span>
        </button>
      )}
      {overZone === "after" && (
        <div
          className="pointer-events-none absolute inset-x-2 bottom-0 z-10 h-0.5 rounded-full bg-accent"
          style={{ left: `${depth * 14 + 8}px` }}
        />
      )}
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              renderLabel={renderLabel}
              onContextMenu={onContextMenu}
              renamingId={renamingId}
              getRenameValue={getRenameValue}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
              dnd={dnd}
              dndActions={dndActions}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** One row of a `TreeView`, recursing into its own children. Reports pointer
 * events up to `dndActions.onPointerDown` and renders the before/after/into
 * drop indicators from the shared `dnd` state — the actual drag orchestration
 * lives in `TreeView`, which alone has the full tree needed to compute a move. */
export const TreeItem = memo(TreeItemImpl) as typeof TreeItemImpl;
