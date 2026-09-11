import { test } from "node:test";
import assert from "node:assert/strict";
import { planTreeMove, collectSelfAndDescendantIds } from "./treeUtils.ts";

function tree() {
  return [
    {
      id: 1,
      parentId: null,
      label: "alpha",
      children: [{ id: 11, parentId: 1, label: "child", children: [] }],
    },
    { id: 2, parentId: null, label: "beta", children: [] },
    { id: 3, parentId: null, label: "gamma", children: [] },
  ];
}

test("drop before a root node inserts the dragged node just ahead of it", () => {
  const plan = planTreeMove(tree(), 3, 2, "before");
  assert.deepEqual(plan, { newParentId: null, orderedIds: [1, 3, 2] });
});

test("drop after a root node inserts the dragged node just behind it", () => {
  const plan = planTreeMove(tree(), 1, 2, "after");
  assert.deepEqual(plan, { newParentId: null, orderedIds: [2, 1, 3] });
});

test("drop into the middle zone reparents as the target's last child", () => {
  const plan = planTreeMove(tree(), 2, 1, "into");
  assert.deepEqual(plan, { newParentId: 1, orderedIds: [11, 2] });
});

test("drop before/after a root node can un-parent a nested node back to root", () => {
  const plan = planTreeMove(tree(), 11, 2, "before");
  assert.deepEqual(plan, { newParentId: null, orderedIds: [1, 11, 2, 3] });
});

test("rejects dropping a node onto itself", () => {
  assert.equal(planTreeMove(tree(), 1, 1, "into"), null);
});

test("rejects dropping a node into its own descendant", () => {
  assert.equal(planTreeMove(tree(), 1, 11, "into"), null);
});

test("returns null when either id is unknown", () => {
  assert.equal(planTreeMove(tree(), 999, 2, "before"), null);
  assert.equal(planTreeMove(tree(), 1, 999, "before"), null);
});

test("collectSelfAndDescendantIds includes the node itself and every nested descendant", () => {
  const [alpha] = tree();
  assert.deepEqual([...collectSelfAndDescendantIds(alpha)].sort(), [1, 11]);
});
