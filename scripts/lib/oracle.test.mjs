import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOracle } from "./oracle.mjs";
const oracle = buildOracle();
test("button module + variant enum + bool", () => {
  const b = oracle["m3e-button"];
  assert.equal(b.module, "Button");
  const variant = b.attributes.find((a) => a.htmlName === "variant");
  assert.equal(variant.kind, "enum");
  assert.deepEqual(variant.enumValues.slice().sort(), ["elevated","filled","outlined","text","tonal"]);
  assert.equal(b.attributes.find((a) => a.htmlName === "disabled").kind, "bool");
});
test("button slot helpers incl. selected->selectedSlot bump + default child", () => {
  const b = oracle["m3e-button"];
  assert.equal(b.slots.find((s) => s.rawName === "icon").helper, "icon");
  assert.equal(b.slots.find((s) => s.rawName === "selected").helper, "selectedSlot");
  assert.equal(b.slots.find((s) => s.rawName === "").helper, "child");
});
test("icon-button module; aria-label is NOT a required field (universal setter)", () => {
  const ib = oracle["m3e-icon-button"];
  assert.equal(ib.module, "IconButton");
  // aria moved off the phantom/required system -> settable via M3e.Aria on anything.
  assert.ok(!ib.requiredFields.some((f) => f.field === "ariaLabel"));
});
