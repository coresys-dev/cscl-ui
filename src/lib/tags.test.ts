import assert from "node:assert/strict";
import { test } from "node:test";
import { splitTags } from "./tags.ts";

test("splits on commas, trims, drops empties", () => {
  assert.deepEqual(splitTags(" kick, 808 ,,dark ", []), ["kick", "808", "dark"]);
});

test("skips tags already present or repeated", () => {
  assert.deepEqual(splitTags("kick, snare, snare", ["kick"]), ["snare"]);
});

test("a single tag without comma", () => {
  assert.deepEqual(splitTags("ambient", []), ["ambient"]);
});
