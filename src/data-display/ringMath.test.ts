import assert from "node:assert/strict";
import { test } from "node:test";
import { ringDash, segmentDashes } from "./ringMath.ts";

test("ringDash clamps the ratio", () => {
  assert.equal(ringDash(2, 10).offset, 0);
  assert.equal(ringDash(-1, 10).offset, ringDash(0, 10).circumference);
  assert.equal(ringDash(Number.NaN, 10).offset, ringDash(0, 10).circumference);
});

test("ringDash of 0 and 1", () => {
  const c = 2 * Math.PI * 10;
  assert.deepEqual(ringDash(0, 10), { circumference: c, offset: c });
  assert.deepEqual(ringDash(1, 10), { circumference: c, offset: 0 });
  assert.ok(Math.abs(ringDash(0.25, 10).offset - c * 0.75) < 1e-9);
});

test("segmentDashes gives each share its own arc", () => {
  const c = 2 * Math.PI * 10;
  const [a, b, none] = segmentDashes([1, 1, 0], 10, 2);
  assert.ok(Math.abs(a.dash - (c / 2 - 2)) < 1e-9 && a.offset === 0);
  assert.ok(Math.abs(b.dash - (c / 2 - 2)) < 1e-9 && Math.abs(b.offset + c / 2) < 1e-9);
  assert.deepEqual(none, { dash: 0, offset: 0 });
});

test("segmentDashes: a single share fills the ring without a gap, no shares draw nothing", () => {
  assert.ok(Math.abs(segmentDashes([3, 0], 10)[0].dash - 2 * Math.PI * 10) < 1e-9);
  assert.deepEqual(segmentDashes([0, 0], 10), [
    { dash: 0, offset: 0 },
    { dash: 0, offset: 0 },
  ]);
});
