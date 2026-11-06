import assert from "node:assert/strict";
import { test } from "node:test";
import { hexToRgb, hslToHsv, hsvToHsl, hsvToRgb, parseHex, rgbToHex, rgbToHsv } from "./colors.ts";

test("hex is read with or without #, short or long", () => {
  assert.equal(parseHex("F80"), "#ff8800");
  assert.equal(parseHex(" #A1b2C3 "), "#a1b2c3");
  assert.equal(parseHex("#12345"), null);
  assert.equal(parseHex("red"), null);
});

test("hex, rgb, hsv and hsl agree", () => {
  for (const hex of ["#ff0000", "#00ff00", "#0000ff", "#808080", "#000000", "#ffffff", "#34d399", "#f472b6"]) {
    assert.equal(rgbToHex(hsvToRgb(rgbToHsv(hexToRgb(hex)))), hex);
    assert.equal(rgbToHex(hsvToRgb(hslToHsv(hsvToHsl(rgbToHsv(hexToRgb(hex)))))), hex);
  }
  assert.deepEqual(hsvToHsl(rgbToHsv({ r: 255, g: 0, b: 0 })), { h: 0, s: 1, l: 0.5 });
});
