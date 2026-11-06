import assert from "node:assert/strict";
import { test } from "node:test";
import { addDaysISO, calendarHeatmap, heatLevel, mondayOf } from "./heat.ts";

test("levels are quarters of the max, any activity at least 1", () => {
  assert.equal(heatLevel(0, 10), 0);
  assert.equal(heatLevel(1, 100), 1);
  assert.equal(heatLevel(50, 100), 2);
  assert.equal(heatLevel(100, 100), 4);
  assert.equal(heatLevel(5, 0), 0);
});

test("dates cross months, years and DST", () => {
  assert.equal(addDaysISO("2026-12-31", 1), "2027-01-01");
  assert.equal(addDaysISO("2026-03-29", 1), "2026-03-30");
  assert.equal(mondayOf("2026-11-08"), "2026-11-02"); // a Sunday
  assert.equal(mondayOf("2026-11-02"), "2026-11-02");
});

test("calendar: 7 rows, one column per week, future days empty", () => {
  const grid = calendarHeatmap(new Map([["2026-11-04", 3]]), "2026-11-05", 2);
  assert.equal(grid.length, 7);
  assert.equal(grid[0].length, 2);
  assert.deepEqual(grid[0][0], { date: "2026-10-26", value: 0 });
  assert.deepEqual(grid[2][1], { date: "2026-11-04", value: 3 });
  assert.equal(grid[4][1], null); // Friday 6 Nov, after today
});
