import { useRef, useState, type ReactNode } from "react";
import { TreeItem, type TreeDndActions, type TreeDndState } from "./TreeItem";
import { collectSelfAndDescendantIds, planTreeMove, type TreeDropZone, type TreeMovePlan, type TreeNode } from "./treeUtils";

/** Below this pointer-travel distance (px), a pointerdown→pointerup stays a
 * plain click (selection) rather than engaging a drag. */
const DRAG_ENGAGE_THRESHOLD = 5;

interface TreeViewProps<T extends TreeNode<T>> {
  nodes: T[];
  selectedId: number | string | null;
  onSelect: (id: number | string) => void;
  /** Renders a row's label content (icon, name, ...) — this component only
   * knows `id`/`parentId`/`children`, everything else is the caller's. */
  renderLabel: (node: T, selected: boolean) => ReactNode;
  /** Reports a right-click on a row with its screen position; rendering the
   * actual context menu (e.g. `ContextMenu`) is the caller's job. */
  onContextMenu: (node: T, x: number, y: number) => void;
  renamingId: number | string | null;
  /** Initial text shown in the rename field for a node — defaults to reading
   * a `label`/`name` string field isn't assumed; supply it explicitly. */
  getRenameValue: (node: T) => string;
  onRenameSubmit: (node: T, value: string) => void;
  onRenameCancel: () => void;
  /** A drag-and-drop reorder/reparent was committed: apply `plan` (e.g. call
   * your move/reorder API) then refresh `nodes`. */
  onMove: (draggedId: number | string, plan: TreeMovePlan) => void;
  /** Expand children by default (otherwise every node starts collapsed, as
   * in SLDR's folder tree). */
  defaultExpanded?: boolean;
  emptyState?: ReactNode;
  className?: string;
}

/** Generic recursive tree with selection, expand/collapse, inline rename, a
 * context-menu callback, and pointer-based drag reorder/reparent with a
 * three-zone (before/after/into) drop indicator — ported from SLDR's
 * `Sidebar`/`FolderTreeItem` folder tree. This component owns the tree-wide
 * drag orchestration (it alone has the full tree needed to compute a move);
 * each row (`TreeItem`) only reports pointer events up and renders indicators
 * from the shared `dnd` state it's given. */
export function TreeView<T extends TreeNode<T>>({
  nodes,
  selectedId,
  onSelect,
  renderLabel,
  onContextMenu,
  renamingId,
  getRenameValue,
  onRenameSubmit,
  onRenameCancel,
  onMove,
  defaultExpanded,
  emptyState,
  className,
}: TreeViewProps<T>) {
  const [dragState, setDragState] = useState<{
    draggingId: number | string | null;
    invalidIds: ReadonlySet<number | string>;
    overTarget: { id: number | string; zone: TreeDropZone } | null;
  }>({ draggingId: null, invalidIds: new Set(), overTarget: null });
  const suppressNextClickRef = useRef(false);

  function findRowAt(x: number, y: number): { id: number | string; zone: TreeDropZone } | null {
    const rowEl = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>("[data-tree-row-id]");
    if (!rowEl) return null;
    const raw = rowEl.dataset.treeRowId!;
    // Ids come back through the DOM as strings; the tree may key nodes by
    // number (e.g. a numeric database id) or string, so recover the original
    // type by checking whether the source node used a numeric id.
    const id: number | string = /^-?\d+$/.test(raw) ? Number(raw) : raw;
    const rect = rowEl.getBoundingClientRect();
    const relY = (y - rect.top) / rect.height;
    const zone: TreeDropZone = relY < 0.25 ? "before" : relY > 0.75 ? "after" : "into";
    return { id, zone };
  }

  /** Pointer-Events-based drag-and-drop (not the HTML5 Drag API — see
   * `TreeDndActions`): this single entry point attaches the `window`
   * listeners for the whole gesture, only engages the drag past
   * `DRAG_ENGAGE_THRESHOLD` (below which it stays a plain click/select), and
   * resolves the target via `elementFromPoint` rather than each row's own
   * `dragover`. */
  function handlePointerDown(node: T, e: React.PointerEvent) {
    const startX = e.clientX;
    const startY = e.clientY;
    let engaged = false;
    let invalidIds: ReadonlySet<number | string> = new Set();
    let currentTarget: { id: number | string; zone: TreeDropZone } | null = null;

    function onMoveEvt(moveEvent: PointerEvent) {
      if (!engaged) {
        if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < DRAG_ENGAGE_THRESHOLD) return;
        engaged = true;
        invalidIds = collectSelfAndDescendantIds(node);
        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";
        setDragState({ draggingId: node.id, invalidIds, overTarget: null });
      }
      const hit = findRowAt(moveEvent.clientX, moveEvent.clientY);
      const next = hit && !invalidIds.has(hit.id) ? hit : null;
      if (next?.id === currentTarget?.id && next?.zone === currentTarget?.zone) return;
      currentTarget = next;
      setDragState((s) => (s.draggingId == null ? s : { ...s, overTarget: next }));
    }

    function onUp() {
      window.removeEventListener("pointermove", onMoveEvt);
      window.removeEventListener("pointerup", onUp);
      if (engaged) {
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        suppressNextClickRef.current = true;
        commitMove(node.id, currentTarget);
      }
      setDragState({ draggingId: null, invalidIds: new Set(), overTarget: null });
    }

    window.addEventListener("pointermove", onMoveEvt);
    window.addEventListener("pointerup", onUp);
  }

  function commitMove(draggedId: number | string, target: { id: number | string; zone: TreeDropZone } | null) {
    if (!target) return;
    const plan = planTreeMove(nodes, draggedId, target.id, target.zone);
    if (!plan) return;
    onMove(draggedId, plan);
  }

  const dnd: TreeDndState = {
    draggingId: dragState.draggingId,
    invalidDropIds: dragState.invalidIds,
    overTarget: dragState.overTarget,
    suppressNextClickRef,
  };
  const dndActions: TreeDndActions<T> = { onPointerDown: handlePointerDown };

  if (nodes.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div className={className}>
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          depth={0}
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
  );
}
