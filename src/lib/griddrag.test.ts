import assert from "node:assert/strict";
import { test } from "node:test";
import { cellsFromDelta } from "./grid.ts";

// A cell is 80px with a 12px gap: one step of the grid is 92px.
test("cellsFromDelta rounds to the nearest cell", () => {
  assert.equal(cellsFromDelta(0, 80, 12), 0);
  assert.equal(cellsFromDelta(40, 80, 12), 0);
  assert.equal(cellsFromDelta(47, 80, 12), 1);
  assert.equal(cellsFromDelta(92, 80, 12), 1);
  assert.equal(cellsFromDelta(137, 80, 12), 1);
  assert.equal(cellsFromDelta(139, 80, 12), 2);
  assert.equal(cellsFromDelta(460, 80, 12), 5);
});

test("cellsFromDelta accounts for the gap", () => {
  // Without the gap, 3 cells of 80px would be 240px; with it, the third step only lands at 276px.
  assert.equal(cellsFromDelta(240, 80, 12), 3);
  assert.equal(cellsFromDelta(225, 80, 12), 2);
  assert.equal(cellsFromDelta(276, 80, 12), 3);
  assert.equal(cellsFromDelta(100, 80, 0), 1);
  assert.equal(cellsFromDelta(130, 80, 0), 2);
});

test("cellsFromDelta is symmetric for negative deltas", () => {
  for (const d of [46, 47, 92, 139, 225, 276, 1000]) {
    assert.equal(cellsFromDelta(-d, 80, 12), -cellsFromDelta(d, 80, 12), `delta ${d}`);
  }
  assert.equal(cellsFromDelta(-47, 80, 12), -1);
  // A small move back reads as no move at all, never as -0.
  assert.equal(cellsFromDelta(-20, 80, 12), 0);
  assert.equal(cellsFromDelta(-0, 80, 12), 0);
});

test("cellsFromDelta never divides by zero", () => {
  assert.equal(cellsFromDelta(50, 0, 0), 0);
  assert.equal(cellsFromDelta(Number.NaN, 80, 12), 0);
});
