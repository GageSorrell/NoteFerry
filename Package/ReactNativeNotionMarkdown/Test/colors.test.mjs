import assert from "node:assert/strict";
import { test } from "node:test";
import { ColorLabel, ColorStyle, IsColorValue, NotionColors } from "../Distribution/Colors.js";

test("NotionColors lists exactly Notion's 9 named colors", () => {
  assert.deepEqual(NotionColors, ["gray", "brown", "orange", "yellow", "green", "blue", "purple", "pink", "red"]);
});

test("IsColorValue accepts default, base colors, and _bg variants; rejects anything else", () => {
  assert.equal(IsColorValue("default"), true);
  assert.equal(IsColorValue("red"), true);
  assert.equal(IsColorValue("red_bg"), true);
  assert.equal(IsColorValue("red_background"), false);
  assert.equal(IsColorValue("not-a-color"), false);
});

test("ColorStyle returns a foreground color for a base color and a background color for its _bg variant", () => {
  assert.deepEqual(ColorStyle("red"), { color: "#D44C47" });
  assert.deepEqual(ColorStyle("red_bg"), { backgroundColor: "#FDEBEC" });
});

test("ColorStyle is a no-op for default and undefined", () => {
  assert.deepEqual(ColorStyle("default"), {});
  assert.deepEqual(ColorStyle(undefined), {});
});

test("ColorLabel returns a human-readable label for each base color", () => {
  for (const Color of NotionColors) {
    assert.equal(typeof ColorLabel(Color), "string");
    assert.ok(ColorLabel(Color).length > 0);
  }
});
