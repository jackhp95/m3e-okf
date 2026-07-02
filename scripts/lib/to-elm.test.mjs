import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOracle } from "./oracle.mjs";
import { toElm, toElmCem } from "./to-elm.mjs";

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

// aria is universal + optional (not a required record): a checkbox WITHOUT
// aria-label converts fine — a11y requirements live in elm-review rules now.
test("checkbox without aria-label converts (aria is optional)", () => {
  assert.deepEqual(conv(`<m3e-checkbox checked></m3e-checkbox>`), {
    code: `M3e.Checkbox.view [ M3e.Checkbox.checked True ] []`,
  });
});

// --- (a) required-record view form ---------------------------------------

// IconButton exposes NO `child`/`children` helper: its default slot is
// `required + single`, so the codegen folds it into the required record as the
// `content` field. aria-label is now a universal optional setter (M3e.Aria.label
// in the attribute list), NOT a required-record field.
test("icon-button folds default icon slot into content; aria is a setter", () => {
  const r = conv(
    `<m3e-icon-button aria-label="Toggle theme"><m3e-icon name="dark_mode"></m3e-icon></m3e-icon-button>`,
  );
  assert.deepEqual(r, {
    code: `M3e.IconButton.view { content = M3e.Icon.view [ M3e.Icon.name "dark_mode" ] [] } [ M3e.Aria.label "Toggle theme" ] []`,
  });
});

// aria-label is a universal setter (M3e.Aria.label), not a required record.
test("checkbox aria-label -> M3e.Aria.label setter", () => {
  const r = conv(`<m3e-checkbox aria-label="Accept" checked></m3e-checkbox>`);
  assert.deepEqual(r, {
    code: `M3e.Checkbox.view [ M3e.Aria.label "Accept", M3e.Checkbox.checked True ] []`,
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

// `children` returns a `List Content` (codegen: `List.map (slot "")`), so it
// must be the content argument directly — NOT nested as one element inside a
// `[ ... ]` list (that would be `List (List Content)` and fail to compile).
test("multiple default children -> children [...] spliced as the content arg", () => {
  assert.deepEqual(
    conv(`<m3e-button variant="text"><m3e-icon name="a"></m3e-icon>Hi</m3e-button>`),
    {
      code: `M3e.Button.view [ M3e.Button.variant M3e.Value.text ] (M3e.Button.children [ M3e.Icon.view [ M3e.Icon.name "a" ] [], Kit.text "Hi" ])`,
    },
  );
});

test("string attr with escaping", () => {
  const r = conv(`<m3e-button href='/a"b'>Go</m3e-button>`);
  assert.deepEqual(r, {
    code: `M3e.Button.view [ M3e.Button.href "/a\\"b" ] [ M3e.Button.child (Kit.text "Go") ]`,
  });
});

// A genuinely unmappable attr (not id/class/style/data-*, no oracle setter)
// still short-circuits the example — we stay conservative about dropping.
test("skip on unmapped attr", () => {
  const r = conv(`<m3e-button data-foo="x" for="y">Hi</m3e-button>`);
  assert.ok(r.skip && /for/.test(r.skip));
});

// Non-structural presentational/identity attrs (id/class/style/data-*) on an
// m3e element are DROPPED (not skipped), matching plain-HTML behavior.
test("m3e element with id/class is converted (attrs dropped), not skipped", () => {
  const r = conv(`<m3e-button variant="filled" id="x" class="y">Go</m3e-button>`);
  assert.ok(
    r.code &&
      /M3e\.Button\.view \[ M3e\.Button\.variant M3e\.Value\.filled \]/.test(
        r.code,
      ),
  );
  assert.ok(!/id|class/.test(r.code));
});

test("skip on unknown m3e tag", () => {
  const r = conv(`<m3e-nope></m3e-nope>`);
  assert.ok(r.skip);
});

// --- Required-record field sourced from a NAMED slot child -----------------

// NavMenuItem/TreeItem have a required `label` NAMED slot that the codegen
// folds into the required record as a `label` field (there is NO `label` slot
// helper). Confirmed against packages/m3e/src/M3e/NavMenuItem.elm:
//   view : { label : Element { text, link } msg } -> ...
// with `M3e.Element.withSlot "label" req_.label`.
test("nav-menu-item required label sourced from slot=label child", () => {
  const r = conv(
    `<m3e-nav-menu-item selected><m3e-icon slot="icon" name="home"></m3e-icon><a slot="label" href="/">Home</a></m3e-nav-menu-item>`,
  );
  assert.deepEqual(r, {
    code: `M3e.NavMenuItem.view { label = Kit.link "/" [ Kit.text "Home" ] } [ M3e.NavMenuItem.selected True ] [ M3e.NavMenuItem.icon (M3e.Icon.view [ M3e.Icon.name "home" ] []) ]`,
  });
});

// TreeItem nests child tree-items via the (default) `child` helper while its
// own `label` comes from the required named slot.
test("tree-item required label + nested child tree-items", () => {
  const r = conv(
    `<m3e-tree-item open><span slot="label">Getting Started</span><m3e-tree-item><span slot="label">Overview</span></m3e-tree-item></m3e-tree-item>`,
  );
  assert.deepEqual(r, {
    code: `M3e.TreeItem.view { label = Kit.text "Getting Started" } [ M3e.TreeItem.open True ] [ M3e.TreeItem.child (M3e.TreeItem.view { label = Kit.text "Overview" } [] []) ]`,
  });
});

// A required named slot with no matching child stays an honest skip.
test("nav-menu-item missing required label slot -> skip", () => {
  const r = conv(`<m3e-nav-menu-item></m3e-nav-menu-item>`);
  assert.ok(r.skip && /label/.test(r.skip));
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

// --- Phase A1: middle (M3e.Cem.*) + bottom (M3e.Cem.Html.*) layers ---------
// Mid/bottom are a uniform HTML->elm/html transpile: typed setters where they
// exist, raw-attribute escape otherwise, raw Html children (no required-record
// folding, no Content slot helpers). Enums are Value tokens at middle, raw
// strings at bottom. Slots: M3e.Cem.Attr.slot at middle / attribute "slot" at
// bottom. Expected strings authored against the real per-layer modules.

const mid = (h) => toElmCem(h, oracle, "middle");
const bot = (h) => toElmCem(h, oracle, "bottom");

test("middle: button with icon slot + text", () => {
  assert.deepEqual(
    mid(`<m3e-button variant="filled"><m3e-icon slot="icon" name="add"></m3e-icon>New</m3e-button>`),
    {
      code: `M3e.Cem.Button.button [ M3e.Cem.Button.variant M3e.Value.filled ] [ M3e.Cem.Icon.icon [ M3e.Cem.Attr.slot "icon", M3e.Cem.Icon.name "add" ] [], Html.text "New" ]`,
    },
  );
});

test("bottom: button with icon slot + text", () => {
  assert.deepEqual(
    bot(`<m3e-button variant="filled"><m3e-icon slot="icon" name="add"></m3e-icon>New</m3e-button>`),
    {
      code: `M3e.Cem.Html.Button.button [ M3e.Cem.Html.Button.variant "filled" ] [ M3e.Cem.Html.Icon.icon [ Html.Attributes.attribute "slot" "icon", M3e.Cem.Html.Icon.name "add" ] [], Html.text "New" ]`,
    },
  );
});

test("middle: aria-label via universal M3e.Aria.label + typed bool", () => {
  assert.deepEqual(mid(`<m3e-checkbox aria-label="Accept" checked></m3e-checkbox>`), {
    code: `M3e.Cem.Checkbox.checkbox [ M3e.Aria.label "Accept", M3e.Cem.Checkbox.checked True ] []`,
  });
});

test("bottom: aria-label via M3e.Cem.Html.Aria.label + typed bool", () => {
  assert.deepEqual(bot(`<m3e-checkbox aria-label="Accept" checked></m3e-checkbox>`), {
    code: `M3e.Cem.Html.Checkbox.checkbox [ M3e.Cem.Html.Aria.label "Accept", M3e.Cem.Html.Checkbox.checked True ] []`,
  });
});

test("mid/bottom: plain text-only button", () => {
  assert.deepEqual(mid(`<m3e-button variant="tonal">Tonal</m3e-button>`), {
    code: `M3e.Cem.Button.button [ M3e.Cem.Button.variant M3e.Value.tonal ] [ Html.text "Tonal" ]`,
  });
  assert.deepEqual(bot(`<m3e-button variant="tonal">Tonal</m3e-button>`), {
    code: `M3e.Cem.Html.Button.button [ M3e.Cem.Html.Button.variant "tonal" ] [ Html.text "Tonal" ]`,
  });
});

test("mid/bottom: icon-button does NOT fold — aria setter + child element", () => {
  const html = `<m3e-icon-button aria-label="Toggle theme"><m3e-icon name="dark_mode"></m3e-icon></m3e-icon-button>`;
  assert.deepEqual(mid(html), {
    code: `M3e.Cem.IconButton.iconButton [ M3e.Aria.label "Toggle theme" ] [ M3e.Cem.Icon.icon [ M3e.Cem.Icon.name "dark_mode" ] [] ]`,
  });
  assert.deepEqual(bot(html), {
    code: `M3e.Cem.Html.IconButton.iconButton [ M3e.Cem.Html.Aria.label "Toggle theme" ] [ M3e.Cem.Html.Icon.icon [ M3e.Cem.Html.Icon.name "dark_mode" ] [] ]`,
  });
});

test("enum: Value token at middle, raw string at bottom", () => {
  assert.deepEqual(mid(`<m3e-button size="extra-large">Big</m3e-button>`), {
    code: `M3e.Cem.Button.button [ M3e.Cem.Button.size M3e.Value.extraLarge ] [ Html.text "Big" ]`,
  });
  assert.deepEqual(bot(`<m3e-button size="extra-large">Big</m3e-button>`), {
    code: `M3e.Cem.Html.Button.button [ M3e.Cem.Html.Button.size "extra-large" ] [ Html.text "Big" ]`,
  });
});

test("numeric attribute -> Float literal (no quotes) at all layers", () => {
  assert.deepEqual(conv(`<m3e-icon name="star" optical-size="24"></m3e-icon>`), {
    code: `M3e.Icon.view [ M3e.Icon.name "star", M3e.Icon.opticalSize 24 ] []`,
  });
  assert.deepEqual(bot(`<m3e-icon name="star" optical-size="24"></m3e-icon>`), {
    code: `M3e.Cem.Html.Icon.icon [ M3e.Cem.Html.Icon.name "star", M3e.Cem.Html.Icon.opticalSize 24 ] []`,
  });
});

test("void elements (<hr>/<br>) are 0-arg Native values, not called with args", () => {
  assert.deepEqual(conv(`<m3e-menu id="m"><hr></m3e-menu>`), {
    code: `M3e.Menu.view [] [ M3e.Menu.child (Native.hr) ]`,
  });
});

test("<main> maps to Html.main_ (reserved name)", () => {
  const r = conv(`<m3e-drawer-container><main>Content</main></m3e-drawer-container>`);
  assert.ok(r.code && /Native\.node Html\.main_ \[\]/.test(r.code), r.code || r.skip);
});
