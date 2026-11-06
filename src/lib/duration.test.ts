import assert from "node:assert/strict";
import { test } from "node:test";
import { formatClock } from "./duration.ts";

test("clock formats", () => {
  assert.equal(formatClock(0), "00:00:00");
  assert.equal(formatClock(3725.9), "01:02:05");
  assert.equal(formatClock(-4), "00:00:00");
  assert.equal(formatClock(1500, true), "25:00");
  assert.equal(formatClock(3725, true), "62:05");
});
