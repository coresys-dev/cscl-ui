import assert from "node:assert/strict";
import { test } from "node:test";
import { pageItems } from "./pages.ts";

test("long list: first, neighbours, last, with gaps", () => {
  assert.deepEqual(pageItems(6, 24), [1, "gap", 5, 6, 7, "gap", 24]);
});

test("a one-page hole shows the page, not an ellipsis", () => {
  assert.deepEqual(pageItems(3, 24), [1, 2, 3, 4, "gap", 24]);
});

test("edges and tiny counts", () => {
  assert.deepEqual(pageItems(1, 1), [1]);
  assert.deepEqual(pageItems(1, 3), [1, 2, 3]);
  assert.deepEqual(pageItems(24, 24), [1, "gap", 23, 24]);
  assert.deepEqual(pageItems(1, 0), []);
});
