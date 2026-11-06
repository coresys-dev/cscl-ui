import assert from "node:assert/strict";
import { test } from "node:test";
import { fromMinutes, layoutDay, monthGrid, timeSpan, toMinutes, weekDays } from "./calendar.ts";

test("minutes round trip and clamping", () => {
  assert.equal(toMinutes("09:30"), 570);
  assert.equal(toMinutes("9h30"), null);
  assert.equal(toMinutes(""), null);
  assert.equal(fromMinutes(570), "09:30");
  assert.equal(fromMinutes(-5), "00:00");
  assert.equal(fromMinutes(24 * 60 + 10), "23:59");
});

test("a missing or backwards end reads as one hour", () => {
  assert.deepEqual(timeSpan("10:00", ""), { start: 600, end: 660 });
  assert.deepEqual(timeSpan("10:00", "09:00"), { start: 600, end: 660 });
  assert.deepEqual(timeSpan("10:00", "10:45"), { start: 600, end: 645 });
  assert.equal(timeSpan("", "10:00"), null);
});

test("overlapping entries share columns, separate clusters reset", () => {
  const l = layoutDay([
    { id: "a", start: 540, end: 600 },
    { id: "b", start: 570, end: 630 },
    { id: "c", start: 600, end: 660 },
    { id: "d", start: 720, end: 780 },
  ]);
  assert.deepEqual(l.get("a"), { col: 0, cols: 2 });
  assert.deepEqual(l.get("b"), { col: 1, cols: 2 });
  assert.deepEqual(l.get("c"), { col: 0, cols: 2 });
  assert.deepEqual(l.get("d"), { col: 0, cols: 1 });
});

test("month grid: November 2026 starts on a Sunday", () => {
  const g = monthGrid(2026, 10, true);
  assert.deepEqual(g[0], [null, null, null, null, null, null, 1]);
  assert.equal(g.flat().filter((d) => d !== null).length, 30);
  assert.deepEqual(monthGrid(2026, 10, false)[0], [1, 2, 3, 4, 5, 6, 7]);
});

test("week days", () => {
  assert.deepEqual(weekDays("2026-12-28").slice(-4), ["2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
});
