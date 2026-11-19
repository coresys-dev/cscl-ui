import assert from "node:assert/strict";
import { test } from "node:test";
import { ambientContours, ambientMix, ambientWaves } from "./ambient.ts";

const subpaths = (d: string) => (d.match(/M/g) ?? []).length;
const numbers = (d: string) => d.match(/-?\d+(\.\d+)?/g) ?? [];

test("contours: 27 loops, two of them highlighted, all closed", () => {
  const { lines, highlights } = ambientContours();
  assert.equal(subpaths(lines), 25);
  assert.equal(subpaths(highlights[0]), 1);
  assert.equal(subpaths(highlights[1]), 1);
  assert.equal((lines.match(/Z/g) ?? []).length, 25);
  for (const h of highlights) assert.ok(h.endsWith("Z"));
});

test("waves: 17 lines, the centre one highlighted", () => {
  const { lines, highlight } = ambientWaves();
  assert.equal(subpaths(lines), 16);
  assert.equal(subpaths(highlight), 1);
});

test("paths are finite and deterministic", () => {
  const all = [ambientContours().lines, ...ambientContours().highlights, ambientWaves().lines, ambientWaves().highlight];
  for (const d of all) {
    assert.ok(!/NaN|Infinity/.test(d));
    assert.ok(numbers(d).length > 0);
  }
  assert.equal(ambientContours(), ambientContours());
  assert.equal(ambientWaves().highlight, ambientWaves().highlight);
});

test("ambientMix scales with strength and caps at 100%", () => {
  assert.equal(ambientMix(10), "color-mix(in srgb, var(--ambient-color) 10%, transparent)");
  assert.equal(ambientMix(10, "soft"), "color-mix(in srgb, var(--ambient-color) 6%, transparent)");
  assert.equal(ambientMix(10, "strong"), "color-mix(in srgb, var(--ambient-color) 15%, transparent)");
  assert.equal(ambientMix(90, "strong"), "color-mix(in srgb, var(--ambient-color) 100%, transparent)");
  assert.equal(ambientMix(-5), "color-mix(in srgb, var(--ambient-color) 0%, transparent)");
});
