// Tests for the shared CEM-validator. Run: node --test scripts/lib/
// Uses a small synthetic ground truth so the tests don't depend on the
// generated components.json (they assert the rules, not the data).
import test from "node:test";
import assert from "node:assert/strict";
import { buildGroundTruth, validateMarkup } from "./validate-markup.mjs";

// A two-element component: <m3e-button> (union attr + slots) and <m3e-icon>.
const GT = buildGroundTruth([
  {
    elements: [
      {
        tag: "m3e-button",
        attributes: [
          { name: "variant", type: "'text' | 'filled' | 'tonal'" },
          { name: "disabled", type: "boolean" },
          { name: "href", type: "string" },
        ],
        properties: [],
        slots: [{ name: "(default)" }, { name: "icon" }, { name: "trailing-icon" }],
      },
      {
        tag: "m3e-icon",
        attributes: [{ name: "name", type: "string" }],
        properties: [],
        slots: [{ name: "(default)" }],
      },
    ],
  },
]);

const clean = (code, opts) => validateMarkup(code, GT, opts);

test("clean markup passes", () => {
  assert.deepEqual(clean(`<m3e-button variant="filled"><m3e-icon slot="icon" name="add"></m3e-icon>Go</m3e-button>`), []);
});

test("unknown m3e tag is flagged", () => {
  const errs = clean(`<m3e-bogus></m3e-bogus>`);
  assert.ok(errs.some((e) => e.includes("unknown tag <m3e-bogus>")));
});

test("undocumented attribute is flagged", () => {
  const errs = clean(`<m3e-button colour="red">x</m3e-button>`);
  assert.ok(errs.some((e) => e.includes(`undocumented attribute "colour"`)));
});

test("value outside a closed union is flagged", () => {
  const errs = clean(`<m3e-button variant="ghost">x</m3e-button>`);
  assert.ok(errs.some((e) => e.includes(`variant="ghost" not in`)));
});

test("open-ended types (string/boolean) are not union-checked", () => {
  assert.deepEqual(clean(`<m3e-button href="/x" disabled>x</m3e-button>`), []);
});

test("slot not on the nearest m3e ancestor is flagged", () => {
  const errs = clean(`<m3e-button><m3e-icon slot="leading" name="x"></m3e-icon></m3e-button>`);
  assert.ok(errs.some((e) => e.includes(`slot="leading" not a slot of <m3e-button>`)));
});

test("valid slot on nearest ancestor passes", () => {
  assert.deepEqual(clean(`<m3e-button><m3e-icon slot="trailing-icon" name="x"></m3e-icon></m3e-button>`), []);
});

test("global attributes are allowed (aria-/data-/on*/autofocus)", () => {
  assert.deepEqual(
    clean(`<m3e-button aria-label="a" data-id="1" onclick="f()" autofocus>x</m3e-button>`),
    []
  );
});

test("non-standard native tag is flagged", () => {
  const errs = clean(`<marquee>hi</marquee>`);
  assert.ok(errs.some((e) => e.includes("non-standard tag <marquee>")));
});

test("standard head/document tags (script, meta) are recognized", () => {
  assert.deepEqual(
    clean(`<script type="module" src="/x.js"></script><meta name="a" content="b">`),
    []
  );
});

test("custom CSS is flagged by default but allowed with allowCss", () => {
  assert.ok(clean(`<m3e-button class="x">y</m3e-button>`).some((e) => e.includes("custom CSS")));
  assert.deepEqual(clean(`<m3e-button class="x">y</m3e-button>`, { allowCss: true }), []);
});

test("errors are de-duplicated", () => {
  const errs = clean(`<m3e-bad></m3e-bad><m3e-bad></m3e-bad>`);
  assert.equal(errs.filter((e) => e.includes("m3e-bad")).length, 1);
});

// #2 — tags inside HTML comments must not be validated (they never render).
test("tags inside HTML comments are ignored", () => {
  assert.deepEqual(clean(`<!-- <m3e-fake bogus="1"> --><m3e-button>x</m3e-button>`), []);
});

test("a commented-out invalid slot does not fail a valid element", () => {
  assert.deepEqual(
    clean(`<m3e-button><!-- <span slot="nope">old</span> --><m3e-icon slot="icon" name="x"></m3e-icon></m3e-button>`),
    []
  );
});

// #3 — a '>' inside a quoted attribute value must not truncate the tag and
// silently drop later attributes.
test("a '>' inside a quoted attribute value does not hide later attributes", () => {
  const errs = clean(`<m3e-button data-fn="a > b" colour="red">x</m3e-button>`);
  assert.ok(
    errs.some((e) => e.includes(`undocumented attribute "colour"`)),
    `expected the trailing 'colour' attribute to still be checked, got: ${JSON.stringify(errs)}`
  );
});
