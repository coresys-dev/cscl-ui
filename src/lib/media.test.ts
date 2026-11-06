import assert from "node:assert/strict";
import { test } from "node:test";
import { formatShort, formatTimecode, forwardRate, nextRate, parseTimecode, playbackState } from "./media.ts";

test("format", () => {
  assert.equal(formatTimecode(134.5, 25), "00:02:14:12");
  assert.equal(formatShort(3725), "1:02:05");
  assert.equal(formatShort(134), "2:14");
  assert.equal(formatTimecode(-3, 25), "00:00:00:00");
  assert.equal(formatShort(Number.NaN), "0:00");
});

test("parse", () => {
  for (const [s, v] of [
    ["2:14", 134],
    ["02:14", 134],
    ["1:02:14", 3734],
    ["[2:14]", 134],
    ["(2:14)", 134],
    ["2m14", 134],
    ["2m14s", 134],
    ["134s", 134],
    [" 2:14 ", 134],
  ] as const)
    assert.equal(parseTimecode(s, 25), v);
  assert.equal(parseTimecode("00:02:14:12", 25), 134.48);
  assert.equal(parseTimecode("abc", 25), null);
  assert.equal(parseTimecode("2:14 text", 25), null);
  assert.equal(parseTimecode("2:14-2:20", 25), null);
});

test("playback state: metadata wins, the timeout only gives up while loading", () => {
  assert.equal(playbackState("error", "loading"), "unsupported");
  assert.equal(playbackState("loadedmetadata", "loading"), "ready");
  assert.equal(playbackState("stalled-timeout", "loading"), "unsupported");
  assert.equal(playbackState("stalled-timeout", "ready"), "ready");
});

test("rates", () => {
  assert.equal(forwardRate(false, 2), 1);
  assert.equal(forwardRate(true, 1), 1.5);
  assert.equal(forwardRate(true, 2), 2);
  assert.equal(nextRate(0.5), 1);
  assert.equal(nextRate(2), 0.5);
});
