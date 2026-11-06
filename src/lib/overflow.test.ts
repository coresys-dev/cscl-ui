import assert from "node:assert/strict";
import { test } from "node:test";
import { wheelAction } from "./overflow.ts";

const S = { top: 0, left: 0, maxTop: 0, maxLeft: 0 };

test("a vertical wheel scrolls sideways when only the width overflows", () => {
  assert.equal(wheelAction({ dx: 0, dy: 40, ctrl: false }, { ...S, maxLeft: 300 }, false), "x");
});

test("a vertical wheel stays native while there is vertical room", () => {
  assert.equal(wheelAction({ dx: 0, dy: 40, ctrl: false }, { ...S, maxTop: 200, maxLeft: 300 }, false), "native");
  assert.equal(wheelAction({ dx: 0, dy: -40, ctrl: false }, { ...S, top: 50, maxTop: 200 }, false), "native");
});

test("an inner scroller with room keeps the wheel", () => {
  assert.equal(wheelAction({ dx: 0, dy: 40, ctrl: false }, { ...S, maxLeft: 300 }, true), "native");
});

test("at the end of the vertical room the width takes over", () => {
  assert.equal(wheelAction({ dx: 0, dy: 40, ctrl: false }, { ...S, top: 200, maxTop: 200, maxLeft: 300 }, false), "x");
});

test("nothing happens at the horizontal edges, on a sideways gesture or with ctrl", () => {
  assert.equal(wheelAction({ dx: 0, dy: 40, ctrl: false }, { ...S, left: 300, maxLeft: 300 }, false), "none");
  assert.equal(wheelAction({ dx: 0, dy: -40, ctrl: false }, { ...S, left: 0, maxLeft: 300 }, false), "none");
  assert.equal(wheelAction({ dx: 50, dy: 10, ctrl: false }, { ...S, maxLeft: 300 }, false), "none");
  assert.equal(wheelAction({ dx: 0, dy: 40, ctrl: true }, { ...S, maxLeft: 300 }, false), "none");
});

test("a widget that fits is left alone", () => {
  assert.equal(wheelAction({ dx: 0, dy: 40, ctrl: false }, S, false), "none");
});
