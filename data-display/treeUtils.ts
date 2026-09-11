/** Minimal shape `TreeView`'s move-planning needs: an id, a reference to its
 * own parent (`null` at the root), and its children. Genericized over the
 * concrete node type `T` so callers keep their own extra fields (name, icon,
 * color, ...) — this file only ever looks at `id`/`parentId`/`children`. */
export interface TreeNode<T> {
  id: number | string;
  parentId: number | string | null;
  children: T[];
}

export type TreeDropZone = "before" | "after" | "into";

export interface TreeMovePlan {
  newParentId: number | string | null;
  orderedIds: (number | string)[];
}

function findNode<T extends TreeNode<T>>(roots: T[], id: number | string): T | null {
  const stack = [...roots];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.id === id) return node;
    stack.push(...node.children);
  }
  return null;
}

/** `true` if `candidateId` is `node` itself or one of its descendants — a
 * forbidden drop target (would create a `parentId` cycle). */
function isSelfOrDescendant<T extends TreeNode<T>>(node: T, candidateId: number | string): boolean {
  if (node.id === candidateId) return true;
  return node.children.some((child) => isSelfOrDescendant(child, candidateId));
}

/** Siblings of a given `parentId`: the root array itself if `null`, otherwise
 * the parent node's `children` (empty array if the parent can't be found —
 * shouldn't happen for a `parentId` taken from the current tree). */
function siblingsOf<T extends TreeNode<T>>(roots: T[], parentId: number | string | null): T[] {
  if (parentId === null) return roots;
  return findNode(roots, parentId)?.children ?? [];
}

/** The given node and all its descendants, as ids: forbidden drop targets for
 * its own drag (would create a cycle) — compute this once at drag-start, not
 * on every hover. */
export function collectSelfAndDescendantIds<T extends TreeNode<T>>(node: T): Set<number | string> {
  const ids = new Set<number | string>([node.id]);
  for (const child of node.children) {
    for (const id of collectSelfAndDescendantIds(child)) ids.add(id);
  }
  return ids;
}

/** Computes the move to apply for a tree drag-and-drop: `draggedId` dropped
 * onto `targetId` in zone `zone` (top third = before, bottom third = after,
 * middle = into, as a new child). Returns `null` if the drop is invalid —
 * unknown target, the dragged node itself, or one of its own descendants
 * (cycle). Otherwise, the new parent and the full ordered sibling list of the
 * destination (including `draggedId`), ready to hand to a move/reorder call. */
export function planTreeMove<T extends TreeNode<T>>(
  roots: T[],
  draggedId: number | string,
  targetId: number | string,
  zone: TreeDropZone,
): TreeMovePlan | null {
  const dragged = findNode(roots, draggedId);
  const target = findNode(roots, targetId);
  if (!dragged || !target || isSelfOrDescendant(dragged, targetId)) return null;

  if (zone === "into") {
    const orderedIds = [...target.children.map((n) => n.id).filter((id) => id !== draggedId), draggedId];
    return { newParentId: target.id, orderedIds };
  }

  const newParentId = target.parentId;
  const withoutDragged = siblingsOf(roots, newParentId).filter((n) => n.id !== draggedId);
  const targetIndex = withoutDragged.findIndex((n) => n.id === targetId);
  const insertAt = zone === "after" ? targetIndex + 1 : targetIndex;
  const orderedIds = withoutDragged.map((n) => n.id);
  orderedIds.splice(insertAt, 0, draggedId);
  return { newParentId, orderedIds };
}
