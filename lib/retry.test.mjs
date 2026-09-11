import { test } from "node:test";
import assert from "node:assert/strict";
import { retrySchedule, MAX_RETRIES } from "./retry.ts";

test("three attempts then gives up", () => {
  assert.equal(retrySchedule(0), 600);
  assert.equal(retrySchedule(1), 2000);
  assert.equal(retrySchedule(2), 6000);
  assert.equal(retrySchedule(3), -1);
  assert.equal(MAX_RETRIES, 3);
});
