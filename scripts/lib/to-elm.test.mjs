import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOracle } from "./oracle.mjs";
import { toElm } from "./to-elm.mjs";

const oracle = buildOracle();
const conv = (h) => toElm(h, oracle);

test("button with icon slot + text", () => {
  const r = conv(
    `<m3e-button variant="filled"><m3e-icon slot="icon" name="add"></m3e-icon>New</m3e-button>`,
  );
  assert.deepEqual(r, {
    code: `M3e.Button.view [ M3e.Button.variant M3e.Value.filled ] [ M3e.Button.icon (M3e.Icon.view [ M3e.Icon.name "add" ] []), M3e.Button.child (Kit.text "New") ]`,
  });
});

test("plain text-only button", () => {
  assert.deepEqual(conv(`<m3e-button variant="tonal">Tonal</m3e-button>`), {
    code: `M3e.Button.view [ M3e.Button.variant M3e.Value.tonal ] [ M3e.Button.child (Kit.text "Tonal") ]`,
  });
});

// NOTE: The real `M3e.Checkbox.view` takes a required record `{ ariaLabel : String }`
// as its first argument (oracle.requiredFields.length === 1). Per this task's scope
// (2-arg simple components only) and the rule "never emit wrong Elm", a bare checkbox
// is skipped as a required-record component. The originally-suggested golden string
// `M3e.Checkbox.view [ ... ] []` would NOT compile, so we assert a skip instead.
test("checkbox is required-record -> skip for now", () => {
  const r = conv(`<m3e-checkbox checked></m3e-checkbox>`);
  assert.ok(r.skip && /required-record/.test(r.skip));
});

test("icon standalone", () => {
  assert.deepEqual(conv(`<m3e-icon name="add"></m3e-icon>`), {
    code: `M3e.Icon.view [ M3e.Icon.name "add" ] []`,
  });
});

test("bool attr on a 2-arg component (icon filled)", () => {
  assert.deepEqual(conv(`<m3e-icon name="add" filled></m3e-icon>`), {
    code: `M3e.Icon.view [ M3e.Icon.name "add", M3e.Icon.filled True ] []`,
  });
});

test("enum attr rendered via M3e.Value with camelCase", () => {
  assert.deepEqual(conv(`<m3e-button size="extra-large">Big</m3e-button>`), {
    code: `M3e.Button.view [ M3e.Button.size M3e.Value.extraLarge ] [ M3e.Button.child (Kit.text "Big") ]`,
  });
});

test("multiple default children -> children [...]", () => {
  assert.deepEqual(
    conv(`<m3e-button variant="text"><m3e-icon name="a"></m3e-icon>Hi</m3e-button>`),
    {
      code: `M3e.Button.view [ M3e.Button.variant M3e.Value.text ] [ M3e.Button.children [ M3e.Icon.view [ M3e.Icon.name "a" ] [], Kit.text "Hi" ] ]`,
    },
  );
});

test("string attr with escaping", () => {
  const r = conv(`<m3e-button href='/a"b'>Go</m3e-button>`);
  assert.deepEqual(r, {
    code: `M3e.Button.view [ M3e.Button.href "/a\\"b" ] [ M3e.Button.child (Kit.text "Go") ]`,
  });
});

test("skip on unmapped attr", () => {
  const r = conv(`<m3e-button data-foo="x">Hi</m3e-button>`);
  assert.ok(r.skip && /data-foo/.test(r.skip));
});

test("skip on unknown m3e tag", () => {
  const r = conv(`<m3e-nope></m3e-nope>`);
  assert.ok(r.skip);
});

test("skip on required-record component (icon-button) for now", () => {
  const r = conv(
    `<m3e-icon-button aria-label="X"><m3e-icon name="a"></m3e-icon></m3e-icon-button>`,
  );
  assert.ok(r.skip);
});

test("skip on plain HTML for now", () => {
  const r = conv(`<div>hi</div>`);
  assert.ok(r.skip && /plain HTML/.test(r.skip));
});
