import assert from "node:assert/strict";
import { test } from "node:test";
import {
  COLS,
  type Bounds,
  type Box,
  clampBox,
  colsFor,
  compact,
  derive,
  mergeVisible,
  move,
  nextInReadingOrder,
  overlaps,
  place,
  resize,
  sanitize,
  settle,
} from "./grid.ts";

const b = (id: string, x: number, y: number, w: number, h: number): Box => ({ id, x, y, w, h });
const byId = (boxes: Box[], id: string) => boxes.find((x) => x.id === id)!;
const wide: Bounds = { min: { w: 1, h: 1 }, max: { w: 12, h: 64 } };

function assertNoOverlap(boxes: Box[], cols = COLS) {
  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i];
    assert.ok(a.x >= 0 && a.y >= 0, `negative coordinate ${JSON.stringify(a)}`);
    assert.ok(a.x + a.w <= cols, `out of the grid ${JSON.stringify(a)}`);
    assert.ok(a.w >= 1 && a.h >= 1, `empty box ${JSON.stringify(a)}`);
    for (let j = i + 1; j < boxes.length; j++) {
      assert.ok(!overlaps(a, boxes[j]), `overlap ${JSON.stringify(a)} ${JSON.stringify(boxes[j])}`);
    }
  }
}

/** Fixed-seed PRNG (mulberry32), so the property test is reproducible. */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("overlaps only when the rectangles share a cell", () => {
  assert.equal(overlaps(b("a", 0, 0, 4, 2), b("b", 3, 1, 2, 2)), true);
  assert.equal(overlaps(b("a", 0, 0, 4, 2), b("b", 4, 0, 2, 2)), false);
  assert.equal(overlaps(b("a", 0, 0, 4, 2), b("b", 0, 2, 4, 2)), false);
});

test("clampBox brings size and position into the bounds", () => {
  const bounds: Bounds = { min: { w: 2, h: 2 }, max: { w: 6, h: 4 } };
  assert.deepEqual(clampBox(b("a", 10, -3, 9, 1), bounds), b("a", 6, 0, 6, 2));
  assert.deepEqual(clampBox(b("a", -1, 3, 1, 9), bounds), b("a", 0, 3, 2, 4));
  // A minimum wider than the grid still fits the grid.
  assert.deepEqual(clampBox(b("a", 0, 0, 4, 2), bounds, 1), b("a", 0, 0, 1, 2));
});

test("place finds the first free cell top to bottom", () => {
  const boxes = [b("a", 0, 0, 4, 2), b("b", 8, 0, 4, 2)];
  assert.deepEqual(place(boxes, { w: 4, h: 2 }), { x: 4, y: 0 });
  assert.deepEqual(place([], { w: 3, h: 3 }), { x: 0, y: 0 });
  // A gap too narrow is skipped.
  assert.deepEqual(place(boxes, { w: 5, h: 1 }), { x: 0, y: 2 });
});

test("place wraps to a new row when the row is full", () => {
  const boxes = [b("a", 0, 0, 6, 2), b("b", 6, 0, 6, 1)];
  assert.deepEqual(place(boxes, { w: 6, h: 2 }), { x: 6, y: 1 });
  const full = [b("a", 0, 0, 6, 2), b("b", 6, 0, 6, 2)];
  assert.deepEqual(place(full, { w: 4, h: 2 }), { x: 0, y: 2 });
});

test("move pushes the widget below down", () => {
  const boxes = [b("a", 0, 0, 4, 2), b("b", 0, 2, 4, 2), b("c", 4, 0, 4, 2)];
  const out = move(boxes, "c", { x: 0, y: 0 });
  assertNoOverlap(out);
  assert.deepEqual(byId(out, "c"), b("c", 0, 0, 4, 2));
  assert.deepEqual(byId(out, "a"), b("a", 0, 2, 4, 2));
  assert.deepEqual(byId(out, "b"), b("b", 0, 4, 4, 2));
});

test("move down onto a neighbour swaps them", () => {
  const boxes = [b("a", 0, 0, 4, 2), b("b", 0, 2, 4, 2)];
  const out = move(boxes, "a", { x: 0, y: 2 });
  assert.deepEqual(byId(out, "b"), b("b", 0, 0, 4, 2));
  assert.deepEqual(byId(out, "a"), b("a", 0, 2, 4, 2));
});

test("move clamps to the right edge", () => {
  const out = move([b("a", 0, 0, 4, 2)], "a", { x: 10, y: 0 });
  assert.deepEqual(out, [b("a", 8, 0, 4, 2)]);
  const narrow = move([b("a", 0, 0, 4, 2)], "a", { x: 3, y: 0 }, 4);
  assert.deepEqual(narrow, [b("a", 0, 0, 4, 2)]);
});

test("move never leaves a negative coordinate", () => {
  const boxes = [b("a", 0, 0, 4, 2), b("b", 4, 0, 4, 2)];
  const out = move(boxes, "b", { x: -5, y: -9 });
  assertNoOverlap(out);
  assert.deepEqual(byId(out, "b"), b("b", 0, 0, 4, 2));
  assert.deepEqual(byId(out, "a"), b("a", 0, 2, 4, 2));
});

test("move of an unknown id changes nothing and never mutates", () => {
  const boxes = [b("a", 0, 0, 4, 2)];
  const frozen = structuredClone(boxes);
  assert.deepEqual(move(boxes, "zz", { x: 5, y: 5 }), frozen);
  move(boxes, "a", { x: 5, y: 5 });
  assert.deepEqual(boxes, frozen);
});

test("resize respects min and max", () => {
  const bounds: Bounds = { min: { w: 2, h: 2 }, max: { w: 6, h: 4 } };
  const boxes = [b("a", 0, 0, 4, 2)];
  assert.deepEqual(resize(boxes, "a", { w: 1, h: 1 }, bounds), [b("a", 0, 0, 2, 2)]);
  assert.deepEqual(resize(boxes, "a", { w: 20, h: 99 }, bounds), [b("a", 0, 0, 6, 4)]);
  // Growing past the right edge shifts the box left instead of leaving the grid.
  assert.deepEqual(resize([b("a", 10, 0, 2, 2)], "a", { w: 6, h: 2 }, bounds), [b("a", 6, 0, 6, 2)]);
});

test("resize pushes neighbours down", () => {
  const boxes = [b("a", 0, 0, 4, 2), b("b", 4, 0, 4, 2), b("c", 0, 2, 4, 2)];
  const out = resize(boxes, "a", { w: 6, h: 3 }, wide);
  assertNoOverlap(out);
  assert.deepEqual(byId(out, "a"), b("a", 0, 0, 6, 3));
  assert.deepEqual(byId(out, "b"), b("b", 4, 3, 4, 2));
  assert.deepEqual(byId(out, "c"), b("c", 0, 3, 4, 2));
});

test("compact removes holes and keeps order", () => {
  const boxes = [b("c", 0, 9, 4, 2), b("a", 0, 3, 4, 2), b("b", 4, 7, 4, 1)];
  const out = compact(boxes);
  assertNoOverlap(out);
  assert.deepEqual(
    out.map((x) => x.id),
    ["c", "a", "b"],
  );
  assert.deepEqual(byId(out, "a"), b("a", 0, 0, 4, 2));
  assert.deepEqual(byId(out, "b"), b("b", 4, 0, 4, 1));
  assert.deepEqual(byId(out, "c"), b("c", 0, 2, 4, 2));
});

test("compact resolves overlapping input by pushing down", () => {
  const out = compact([b("a", 0, 0, 4, 2), b("b", 2, 1, 4, 2)]);
  assertNoOverlap(out);
  assert.deepEqual(byId(out, "b"), b("b", 2, 2, 4, 2));
});

test("compact is idempotent", () => {
  const boxes = [b("a", 0, 5, 3, 4), b("b", 3, 2, 6, 2), b("c", 2, 12, 4, 3), b("d", 9, 0, 3, 7)];
  const once = compact(boxes);
  assert.deepEqual(compact(once), once);
});

test("no result ever contains two overlapping boxes", () => {
  const rnd = mulberry32(20261024);
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  for (let run = 0; run < 200; run++) {
    let boxes: Box[] = [];
    const bounds = new Map<string, Bounds>();
    const count = int(1, 9);
    for (let i = 0; i < count; i++) {
      const minW = int(1, 4);
      const minH = int(1, 3);
      const bd: Bounds = { min: { w: minW, h: minH }, max: { w: int(minW, 12), h: int(minH, 8) } };
      const size = { w: int(bd.min.w, bd.max.w), h: int(bd.min.h, bd.max.h) };
      const at = place(boxes, size);
      const id = `w${i}`;
      bounds.set(id, bd);
      boxes = [...boxes, { id, ...at, ...size }];
    }
    assertNoOverlap(boxes);
    for (let step = 0; step < 25; step++) {
      const target = boxes[int(0, boxes.length - 1)];
      const before = structuredClone(boxes);
      if (rnd() < 0.5) {
        boxes = move(boxes, target.id, { x: int(-4, 15), y: int(-4, 20) });
      } else {
        const bd = bounds.get(target.id)!;
        boxes = resize(boxes, target.id, { w: int(-2, 16), h: int(-2, 12) }, bd);
        const r = byId(boxes, target.id);
        assert.ok(r.w >= bd.min.w && r.w <= bd.max.w && r.h >= bd.min.h && r.h <= bd.max.h);
      }
      assert.equal(boxes.length, before.length);
      assertNoOverlap(boxes);
      assert.deepEqual(compact(boxes), boxes, "results are already compact");
      for (const cols of [8, 4, 1] as const) assertNoOverlap(derive(boxes, cols), cols);
    }
  }
});

test("colsFor thresholds", () => {
  assert.equal(colsFor(1400), 12);
  assert.equal(colsFor(900), 12);
  assert.equal(colsFor(899), 8);
  assert.equal(colsFor(640), 8);
  assert.equal(colsFor(639), 4);
  assert.equal(colsFor(400), 4);
  assert.equal(colsFor(399), 1);
  assert.equal(colsFor(0), 1);
});

test("derive to one column keeps reading order", () => {
  const boxes = [b("d", 6, 4, 6, 3), b("b", 6, 0, 6, 2), b("a", 0, 0, 6, 4), b("c", 0, 4, 6, 1)];
  const out = derive(boxes, 1);
  assertNoOverlap(out, 1);
  const order = [...out].sort((p, q) => p.y - q.y).map((x) => x.id);
  assert.deepEqual(order, ["a", "b", "c", "d"]);
  assert.deepEqual(byId(out, "a"), b("a", 0, 0, 1, 4));
  assert.deepEqual(byId(out, "b"), b("b", 0, 4, 1, 2));
  assert.deepEqual(byId(out, "c"), b("c", 0, 6, 1, 1));
  assert.deepEqual(byId(out, "d"), b("d", 0, 7, 1, 3));
});

test("derive to 8 columns never overlaps and never mutates the input", () => {
  const boxes = [b("a", 0, 0, 4, 2), b("b", 4, 0, 4, 2), b("c", 8, 0, 4, 2), b("d", 0, 2, 12, 3), b("e", 9, 5, 3, 2)];
  const frozen = structuredClone(boxes);
  const out = derive(boxes, 8);
  assert.deepEqual(boxes, frozen);
  assertNoOverlap(out, 8);
  assert.equal(out.length, boxes.length);
  assert.ok(out.every((x) => x.w <= 8));
  // Reading order (y then x) is kept.
  const read = (l: Box[]) => [...l].sort((p, q) => p.y - q.y || p.x - q.x).map((x) => x.id);
  assert.deepEqual(read(out), read(boxes));
});

test("derive to 12 columns keeps the saved positions", () => {
  const boxes = [b("a", 0, 0, 4, 2), b("b", 4, 6, 4, 2)];
  assert.deepEqual(derive(boxes, 12), boxes);
});

test("mergeVisible leaves hidden boxes untouched", () => {
  const all = [b("a", 0, 0, 4, 2), b("hidden", 4, 0, 4, 2), b("c", 8, 0, 4, 2)];
  const frozen = structuredClone(all);
  const visible = [b("a", 0, 3, 4, 2), b("c", 0, 0, 6, 3)];
  const out = mergeVisible(all, visible);
  assert.deepEqual(all, frozen);
  assert.deepEqual(out, [b("a", 0, 3, 4, 2), b("hidden", 4, 0, 4, 2), b("c", 0, 0, 6, 3)]);
});

test("duplicated ids neither crash nor collapse boxes together", () => {
  const all = [b("x", 0, 0, 4, 2), b("x", 0, 0, 4, 2), b("y", 4, 0, 4, 2)];
  const visible = compact(all);
  assertNoOverlap(visible);
  const merged = mergeVisible(all, visible);
  assertNoOverlap(merged);
  assert.equal(merged.length, 3);
  assertNoOverlap(move(all, "x", { x: 4, y: 0 }));
  assertNoOverlap(derive(all, 12));
});

test("functions keep the extra fields of their boxes", () => {
  const boxes = [{ ...b("a", 0, 0, 4, 2), kind: "note", config: { t: 1 } }];
  const out = move(boxes, "a", { x: 2, y: 0 });
  assert.equal(out[0].kind, "note");
  assert.deepEqual(out[0].config, { t: 1 });
});

test("settle shifts only the returning box when its cell was taken", () => {
  // "a" comes back at its old cell, which "b" took while "a" was hidden: only "a" moves.
  const r = settle([b("a", 0, 0, 4, 2), b("b", 0, 0, 4, 2), b("c", 4, 0, 4, 2)], ["a"]);
  assert.deepEqual(byId(r, "b"), b("b", 0, 0, 4, 2));
  assert.deepEqual(byId(r, "c"), b("c", 4, 0, 4, 2));
  assert.deepEqual(byId(r, "a"), b("a", 0, 2, 4, 2));
  assert.deepEqual(
    r.map((x) => x.id),
    ["a", "b", "c"],
  );
});

test("settle leaves a returning box whose cell is free exactly where it was", () => {
  const input = [b("a", 4, 3, 4, 2), b("b", 0, 0, 4, 2)];
  const r = settle(input, ["a"]);
  assert.deepEqual(r, input);
  assert.notEqual(r[0], input[0]);
});

test("settle drops a returning box below everything it meets and never overlaps", () => {
  const r = settle([b("a", 0, 1, 6, 2), b("b", 0, 0, 4, 2), b("c", 4, 2, 4, 3), b("d", 2, 1, 4, 1)], ["a", "d"]);
  assertNoOverlap(r);
  assert.deepEqual(byId(r, "b"), b("b", 0, 0, 4, 2));
  assert.deepEqual(byId(r, "c"), b("c", 4, 2, 4, 3));
  assert.ok(byId(r, "a").y >= 5);
});

test("settle repairs overlapping non-returning boxes in reading order", () => {
  const r = settle([b("a", 0, 0, 4, 2), b("b", 0, 1, 4, 2)], []);
  assertNoOverlap(r);
  assert.deepEqual(byId(r, "a"), b("a", 0, 0, 4, 2));
  assert.equal(byId(r, "b").y, 2);
});

test("sanitize brings boxes into their bounds and caps an absurd y at the sum of the heights", () => {
  const input = [b("a", 0, 0, 4, 2), b("b", 30, 1e9, 99, 500), b("c", Number.NaN, -4, 0, 0)];
  const r = sanitize(input, () => ({ min: { w: 2, h: 1 }, max: { w: 12, h: 8 } }));
  assert.deepEqual(r[0], b("a", 0, 0, 4, 2));
  assert.deepEqual(r[1], b("b", 0, 11, 12, 8));
  assert.deepEqual(r[2], b("c", 0, 0, 2, 1));
  assert.equal(input[1].y, 1e9);
  // Compacting the result is fast and sane.
  assert.ok(compact(r).every((x) => x.y <= 11));
});

test("nextInReadingOrder gives the widget after, by y then x, whatever the array order", () => {
  const boxes = [b("c", 0, 2, 4, 2), b("b", 4, 0, 4, 2), b("a", 0, 0, 4, 2)];
  assert.equal(nextInReadingOrder(boxes, "a"), "b");
  assert.equal(nextInReadingOrder(boxes, "b"), "c");
});

test("nextInReadingOrder falls back to the one before for the last widget", () => {
  const boxes = [b("a", 0, 0, 4, 2), b("b", 4, 0, 4, 2)];
  assert.equal(nextInReadingOrder(boxes, "b"), "a");
});

test("nextInReadingOrder gives null when nothing is left or the id is unknown", () => {
  assert.equal(nextInReadingOrder([b("a", 0, 0, 4, 2)], "a"), null);
  assert.equal(nextInReadingOrder([b("a", 0, 0, 4, 2)], "zz"), null);
  assert.equal(nextInReadingOrder([], "a"), null);
});
