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

// The real `M3e.Checkbox.view` takes a required record `{ ariaLabel : String }`
// as its first argument. A checkbox WITHOUT aria-label cannot call the typed view
// honestly, so it is skipped (those examples fall through to the fallback later).
test("checkbox missing required aria-label -> skip", () => {
  const r = conv(`<m3e-checkbox checked></m3e-checkbox>`);
  assert.ok(r.skip && /ariaLabel|aria-label/.test(r.skip));
});

// --- (a) required-record view form ---------------------------------------

// IconButton exposes NO `child`/`children` helper: its default slot is
// `required + single`, so the codegen folds it into the required record as the
// `content` field (record order: content first, then named required fields).
// Confirmed against packages/m3e/src/M3e/IconButton.elm:
//   view : { content : Element {icon}, ariaLabel : String } -> ...
test("icon-button required record folds default icon slot into content", () => {
  const r = conv(
    `<m3e-icon-button aria-label="Toggle theme"><m3e-icon name="dark_mode"></m3e-icon></m3e-icon-button>`,
  );
  assert.deepEqual(r, {
    code: `M3e.IconButton.view { content = M3e.Icon.view [ M3e.Icon.name "dark_mode" ] [], ariaLabel = "Toggle theme" } [] []`,
  });
});

// Checkbox has no default slot, so its required record is just { ariaLabel }.
test("checkbox required record", () => {
  const r = conv(`<m3e-checkbox aria-label="Accept" checked></m3e-checkbox>`);
  assert.deepEqual(r, {
    code: `M3e.Checkbox.view { ariaLabel = "Accept" } [ M3e.Checkbox.checked True ] []`,
  });
});

test("icon-button missing required content (default slot) -> skip", () => {
  const r = conv(`<m3e-icon-button aria-label="X"></m3e-icon-button>`);
  assert.ok(r.skip && /content/.test(r.skip));
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

// --- Card with slotted content (2-arg view) + folded-content children ------

// Heading/Chip also fold their required single text default slot into a
// `content` record field; assert structurally (not brittle deepEqual) that the
// whole Card example maps without skipping and uses the real helper names.
test("card with header + content(div) slots", () => {
  const r = conv(
    `<m3e-card variant="outlined"><m3e-heading slot="header" variant="title" size="small">People</m3e-heading><div slot="content"><m3e-chip-set><m3e-chip>Name</m3e-chip></m3e-chip-set></div></m3e-card>`,
  );
  assert.ok(!r.skip, `expected no skip, got: ${r.skip}`);
  assert.match(r.code, /M3e\.Card\.view/);
  assert.match(r.code, /M3e\.Card\.header/);
  assert.match(r.code, /M3e\.Card\.content/);
  assert.match(r.code, /Native\.div/);
  assert.match(r.code, /M3e\.Heading\.view \{ content = Kit\.text "People" \}/);
  assert.match(r.code, /M3e\.Chip\.view \{ content = Kit\.text "Name" \}/);
});

// --- (b) plain HTML + (c) anchor -> Kit.link --------------------------------

test("plain div maps to Native.div", () => {
  const r = conv(`<div><m3e-icon name="a"></m3e-icon></div>`);
  assert.deepEqual(r, {
    code: `Native.div [] [ M3e.Icon.view [ M3e.Icon.name "a" ] [] ]`,
  });
});

test("plain div drops class attribute but does not skip", () => {
  const r = conv(`<div class="grid"><m3e-icon name="a"></m3e-icon></div>`);
  assert.deepEqual(r, {
    code: `Native.div [] [ M3e.Icon.view [ M3e.Icon.name "a" ] [] ]`,
  });
});

test("label maps to Native.node Html.label", () => {
  const r = conv(`<label>Hi</label>`);
  assert.deepEqual(r, {
    code: `Native.node Html.label [] [ Kit.text "Hi" ]`,
  });
});

test("anchor-wrapped card -> Kit.link", () => {
  const r = conv(`<a href="/x"><m3e-card variant="filled">hi</m3e-card></a>`);
  assert.ok(r.code && /Kit\.link "\/x"/.test(r.code) && /M3e\.Card\.view/.test(r.code));
});
