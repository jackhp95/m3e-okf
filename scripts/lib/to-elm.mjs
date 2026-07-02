// Deterministic HTML -> typed M3e.* Elm mapper.
//
// Handles:
//   - simple 2-arg M3e components (Button/Icon/Card-style): enum/bool/string
//     attributes, named + default slots, and text.
//   - required-record view form (3-arg): named required fields (e.g.
//     ariaLabel <- aria-label) AND a required single-value default slot folded
//     into the record as a bare `content` field (IconButton/Heading/Chip).
//   - plain (non-m3e) HTML: Native.<tag> for a known tag list, Native.node
//     Html.<tag> otherwise, and <a href> -> Kit.link. v1 drops non-structural
//     attributes (class/id/for) rather than skipping the example.
//
// Anything genuinely unmappable short-circuits the example with { skip: reason }
// (never emit non-compiling Elm; the compile/elm-review gate is the backstop).
//
// Contract:
//   toElm(htmlString, oracle) -> { code: string } | { skip: reason }

import { parseHTML } from "linkedom";
import { camel } from "./naming.mjs";

/** Escape a JS string for embedding inside an Elm string literal ("..."). */
function escapeElmString(s) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

const isWhitespaceText = (node) =>
  node.nodeType === 3 && node.textContent.trim() === "";

// Non-structural attributes that carry no typed setter (presentational /
// identity only). On a doc EXAMPLE these are safely DROPPED with a log rather
// than skipping the whole example. Plain-HTML elements already drop all attrs;
// this is the m3e-element equivalent for the known-safe set. Anything NOT in
// this set (and without an oracle setter) is still conservatively skipped.
const isDroppableAttr = (name) =>
  name === "id" ||
  name === "class" ||
  name === "style" ||
  name.startsWith("data-");

// Collected across a single toElm() run for logging/inspection.
let droppedAttrs = [];

// Plain HTML tags that have a dedicated `Native.<tag>` constructor.
const NATIVE_TAGS = new Set([
  "div",
  "span",
  "section",
  "nav",
  "p",
  "header",
  "footer",
  "strong",
  "em",
  "small",
  "ul",
  "ol",
  "li",
  "img",
  "br",
  "hr",
]);

/**
 * Sentinel thrown internally to short-circuit on the FIRST unmappable thing.
 * Carries the human-readable skip reason.
 */
class SkipError extends Error {
  constructor(reason) {
    super(reason);
    this.reason = reason;
  }
}

const skip = (reason) => {
  throw new SkipError(reason);
};

/** Map a single node (element or text) to an Elm expression string. */
function nodeToElm(node, oracle) {
  // Text node.
  if (node.nodeType === 3) {
    const trimmed = node.textContent.trim();
    if (trimmed === "") {
      // Whitespace-only text is not renderable content; caller filters these.
      skip("internal: whitespace text should be filtered");
    }
    return `Kit.text "${escapeElmString(trimmed)}"`;
  }

  // Element node.
  if (node.nodeType === 1) {
    return elementToElm(node, oracle);
  }

  skip(`unsupported node type ${node.nodeType}`);
}

/**
 * Map the non-whitespace child nodes of an element to a list of Elm exprs.
 * Used for plain-HTML containers, whose children carry no slot semantics.
 */
function childNodesToElm(node, oracle) {
  const out = [];
  for (const child of node.childNodes) {
    if (isWhitespaceText(child)) continue;
    if (child.nodeType === 1 || child.nodeType === 3) {
      out.push(nodeToElm(child, oracle));
    }
    // Comments and other node types are ignored.
  }
  return out;
}

/**
 * Render the child of a required NAMED slot whose accepted `kinds` are
 * text/link (e.g. NavMenuItem/TreeItem `label`). The codegen types this field
 * as `Element { text, link }`, so a generic `Native.<tag>` wrapper (which
 * carries an `html` row) would NOT unify. We therefore unwrap:
 *   - <a href> child            -> Kit.link "href" [ ...text... ]
 *   - text-only wrapper/bare    -> Kit.text "..."   (span/div wrappers folded)
 * Anything richer than text/link genuinely can't be sourced honestly -> skip.
 */
function textLinkSlotChild(node, tag, field, oracle) {
  // Bare text node.
  if (node.nodeType === 3) {
    return `Kit.text "${escapeElmString(node.textContent.trim())}"`;
  }
  if (node.nodeType !== 1) {
    skip(`unsupported ${field} slot child on ${tag}`);
  }
  const childTag = node.tagName.toLowerCase();

  // <a href> -> Kit.link (a link-kinded label).
  if (childTag === "a") {
    return plainElementToElm(node, oracle);
  }

  // A plain wrapper (span/div/etc.) or the m3e element's own text: fold to the
  // inner text if it is text-only; otherwise it isn't a text/link label.
  const nonWhitespace = [...node.childNodes].filter((c) => !isWhitespaceText(c));
  const allText = nonWhitespace.every((c) => c.nodeType === 3);
  if (allText) {
    const text = nonWhitespace.map((c) => c.textContent.trim()).join(" ");
    return `Kit.text "${escapeElmString(text)}"`;
  }

  skip(`unmappable ${field} slot child <${childTag}> on ${tag}`);
}

/** Map a plain (non-m3e) HTML element to Elm. */
function plainElementToElm(node, oracle) {
  const tag = node.tagName.toLowerCase();

  // <a href="URL"> -> Kit.link "URL" [ children ].
  if (tag === "a") {
    const href = node.getAttribute("href");
    if (href == null) {
      skip("plain <a> without href");
    }
    const children = childNodesToElm(node, oracle);
    const list = children.length === 0 ? "[]" : `[ ${children.join(", ")} ]`;
    return `Kit.link "${escapeElmString(href)}" ${list}`;
  }

  const children = childNodesToElm(node, oracle);
  const list = children.length === 0 ? "[]" : `[ ${children.join(", ")} ]`;

  // v1: attributes other than slot/href are dropped (not skipped).
  if (NATIVE_TAGS.has(tag)) {
    return `Native.${tag} [] ${list}`;
  }

  // Any other tag (label, etc.) -> Native.node Html.<tag>. Emitted code
  // references `Html.<tag>`, so the example module needs an `Html` import
  // (handled by the orchestrator when assembling the module).
  return `Native.node Html.${tag} [] ${list}`;
}

function elementToElm(node, oracle) {
  const tag = node.tagName.toLowerCase();

  // Non-m3e elements are plain HTML.
  if (!tag.startsWith("m3e-")) {
    return plainElementToElm(node, oracle);
  }

  const entry = oracle[tag];
  if (!entry) {
    skip(`unknown m3e tag ${tag}`);
  }

  // Does the default slot fold into the required record as a `content` field?
  // (A required, single-value default slot is not a `child` helper.)
  const defaultSlot = entry.slots.find((s) => s.rawName === "");
  const foldsContent = !!(
    defaultSlot &&
    defaultSlot.required &&
    !defaultSlot.multi
  );

  const attrPairs = [...node.attributes].map((a) => [a.name, a.value]);

  // --- Required-record named fields sourced from ATTRIBUTES. ---
  // (e.g. ariaLabel <- aria-label.) These source attributes are consumed here
  // and are NOT emitted as setters.
  const requiredFields = entry.requiredFields ?? [];
  const requiredHtmlNames = new Set(requiredFields.map((f) => f.htmlName));
  const recordFields = [];
  for (const { field, htmlName } of requiredFields) {
    const pair = attrPairs.find(([name]) => name === htmlName);
    if (!pair) {
      skip(`missing required ${field} on ${tag}`);
    }
    recordFields.push(`${field} = "${escapeElmString(pair[1])}"`);
  }

  // --- Required-record fields sourced from a NAMED SLOT child. ---
  // (e.g. NavMenuItem/TreeItem `label` <- `slot="label"` child.) The codegen
  // folds a required single-value named slot into the required record as a
  // field of the same (camelCased) name — there is NO slot helper for it. We
  // consume the matching child here; it must not also be routed as a slot.
  const requiredSlots = entry.requiredSlots ?? [];
  const consumedRequiredSlotNames = new Set();
  for (const { field, rawName, kinds } of requiredSlots) {
    const matches = [...node.childNodes].filter(
      (c) => c.nodeType === 1 && c.getAttribute("slot") === rawName,
    );
    if (matches.length === 0) {
      skip(`missing required ${field} (slot="${rawName}") on ${tag}`);
    }
    if (matches.length > 1) {
      skip(`multiple children for required ${field} slot on ${tag}`);
    }
    // A text/link-kinded field (e.g. `label`) types as `Element { text, link }`.
    // Render it through the text/link unwrapper so a `<span>`/`<div>` wrapper
    // folds to `Kit.text` rather than an incompatible `Native.<tag>`.
    const onlyTextLink =
      kinds &&
      kinds.length > 0 &&
      kinds.every((k) => k === "text" || k === "link");
    const expr = onlyTextLink
      ? textLinkSlotChild(matches[0], tag, field, oracle)
      : nodeToElm(matches[0], oracle);
    recordFields.push(`${field} = ${expr}`);
    consumedRequiredSlotNames.add(rawName);
  }

  // --- Attributes (skip the `slot` attribute; it is structural). ---
  const attrExprs = [];
  for (const [name, value] of attrPairs) {
    if (name === "slot") continue;
    // Required-record fields were consumed above; they are not setters.
    if (requiredHtmlNames.has(name)) continue;

    const attr = entry.attributes.find((a) => a.htmlName === name);
    if (!attr) {
      // Non-structural presentational/identity attrs (id/class/style/data-*)
      // have no typed setter: drop them (with a log) rather than skipping the
      // whole example. Anything else genuinely unmappable still skips.
      if (isDroppableAttr(name)) {
        droppedAttrs.push({ tag, name, value });
        continue;
      }
      skip(`unmapped attr ${name} on ${tag}`);
    }

    const setterRef = `M3e.${entry.module}.${attr.setter}`;
    if (attr.kind === "enum") {
      attrExprs.push(`${setterRef} M3e.Value.${camel(value)}`);
    } else if (attr.kind === "bool") {
      // Presence of a boolean attribute means "true".
      attrExprs.push(`${setterRef} True`);
    } else if (attr.kind === "string") {
      attrExprs.push(`${setterRef} "${escapeElmString(value)}"`);
    } else {
      skip(`unknown attr kind ${attr.kind} for ${name} on ${tag}`);
    }
  }

  // --- Children: group by slot. ---
  const slottedExprs = [];
  const defaultExprs = [];

  for (const child of node.childNodes) {
    if (isWhitespaceText(child)) continue;

    if (child.nodeType === 1) {
      const slotName = child.getAttribute("slot");
      // A required named slot was already consumed into the record field above.
      if (slotName != null && consumedRequiredSlotNames.has(slotName)) continue;
      if (slotName != null && slotName !== "") {
        const slotEntry = entry.slots.find((s) => s.rawName === slotName);
        if (!slotEntry) {
          skip(`unknown slot "${slotName}" on ${tag}`);
        }
        slottedExprs.push(
          `M3e.${entry.module}.${slotEntry.helper} (${nodeToElm(child, oracle)})`,
        );
        continue;
      }
      defaultExprs.push(nodeToElm(child, oracle));
      continue;
    }

    if (child.nodeType === 3) {
      // Non-whitespace text -> default-slot content.
      defaultExprs.push(nodeToElm(child, oracle));
      continue;
    }

    // Comments and other node types are ignored.
  }

  // A required, single-value default slot is folded into the required record as
  // a bare `content` field (no child/children helper). It is prepended so the
  // record reads `{ content = ..., <named fields> }`, matching the codegen.
  //
  // Otherwise, default children are wrapped by the component's `child`/`children`
  // helper. CRITICAL: `child x` returns ONE `Content`, but `children [ ... ]`
  // returns a `List Content` (the codegen defines it as `List.map (slot "")`).
  // A list-returning helper therefore CANNOT sit as an element inside the
  // `[ ... ]` content list — that yields `List (List Content)` and fails to
  // compile. We keep it as a separate spliced fragment appended with `++`.
  const singleExprs = [...slottedExprs]; // each a single `Content`
  let childrenExpr = null; // a `List Content` fragment, or null
  if (foldsContent) {
    if (defaultExprs.length === 0) {
      skip(`missing required content (default slot) on ${tag}`);
    }
    if (defaultExprs.length > 1) {
      skip(`multiple children for single-value content slot on ${tag}`);
    }
    recordFields.unshift(`content = ${defaultExprs[0]}`);
  } else if (defaultExprs.length === 1) {
    // Wrap default-slot content with the component's `child` helper (single).
    singleExprs.push(`M3e.${entry.module}.child (${defaultExprs[0]})`);
  } else if (defaultExprs.length > 1) {
    // `children` returns a LIST — splice, don't nest.
    childrenExpr = `M3e.${entry.module}.children [ ${defaultExprs.join(", ")} ]`;
  }

  const attrsList =
    attrExprs.length === 0 ? "[]" : `[ ${attrExprs.join(", ")} ]`;

  // Assemble the content argument as a single `List Content` expression:
  //   - only single Contents      -> `[ a, b ]`
  //   - only a children fragment   -> `M3e.X.children [ ... ]`
  //   - both                       -> `[ a, b ] ++ M3e.X.children [ ... ]`
  let contentList;
  const singleList =
    singleExprs.length === 0 ? "[]" : `[ ${singleExprs.join(", ")} ]`;
  if (childrenExpr == null) {
    contentList = singleList;
  } else if (singleExprs.length === 0) {
    // Parenthesize: as the view's content argument, a bare `children [ ... ]`
    // would otherwise be read as two separate arguments (`children` and the
    // list) rather than one applied expression.
    contentList = `(${childrenExpr})`;
  } else {
    contentList = `(${singleList} ++ ${childrenExpr})`;
  }

  // Required record (named fields and/or folded content) -> 3-arg view form.
  const hasRecord = recordFields.length > 0;
  const recordArg = hasRecord ? `{ ${recordFields.join(", ")} } ` : "";

  return `M3e.${entry.module}.view ${recordArg}${attrsList} ${contentList}`;
}

// ---------------------------------------------------------------------------
// Phase A1: middle (`M3e.Cem.*`) and bottom (`M3e.Cem.Html.*`) layer emitters.
//
// These layers are strictly MORE permissive supersets of the strict top layer:
// each upper layer only ADDS constraints (required records, typed Content slots,
// enum Value tokens). So any composition that compiles at top is representable
// here by construction. The surface differs though — there are no required
// records and no Content slot helpers; children are raw `Html`, and a field
// that is a required record at top (e.g. `ariaLabel`) is just an untyped
// attribute here. The emitter is therefore a uniform HTML->elm/html transpile:
//   - typed setter where the oracle knows one (enum -> Value token at middle /
//     raw string at bottom; bool -> True; string -> "..."),
//   - the raw-attribute escape otherwise (`M3e.Cem.Attr.attribute` at middle,
//     `Html.Attributes.attribute` at bottom) — lower layers express anything,
//   - non-structural id/class/style/data-* dropped (as top does),
//   - a slotted child carries its slot via `M3e.Cem.Attr.slot` (middle) or
//     `Html.Attributes.attribute "slot"` (bottom).
// ---------------------------------------------------------------------------

const CEM_PREFIX = { middle: "M3e.Cem", bottom: "M3e.Cem.Html" };

// Plain tags that map to a bare `Html.<tag>`; anything else -> `Html.node "tag"`.
const HTML_TAGS = new Set([
  ...NATIVE_TAGS,
  "a",
  "label",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "figure",
  "figcaption",
  "code",
  "pre",
  "b",
  "i",
  "u",
]);

/** A component's mid/bottom constructor = its module name, decapitalized
 * (`Button` -> `button`, `IconButton` -> `iconButton`). This is NOT `camel`,
 * which folds an already-PascalCase name to all-lowercase. */
const decapitalize = (s) => s.charAt(0).toLowerCase() + s.slice(1);

/** The slot attribute for a slotted child, per layer. */
function cemSlotAttr(layer, slotName) {
  const s = escapeElmString(slotName);
  return layer === "middle"
    ? `M3e.Cem.Attr.slot "${s}"`
    : `Html.Attributes.attribute "slot" "${s}"`;
}

/** An untyped (raw) attribute name/value, per layer. */
function cemRawAttr(layer, name, value) {
  const n = escapeElmString(name);
  const v = escapeElmString(value);
  return layer === "middle"
    ? `M3e.Cem.Attr.attribute (Html.Attributes.attribute "${n}") "${v}"`
    : `Html.Attributes.attribute "${n}" "${v}"`;
}

/** A typed m3e setter for `name=value`, or null if the oracle has no setter. */
function cemTypedAttr(entry, layer, name, value) {
  const attr = entry.attributes.find((a) => a.htmlName === name);
  if (!attr) return null;
  const setterRef = `${CEM_PREFIX[layer]}.${entry.module}.${attr.setter}`;
  if (attr.kind === "enum") {
    return layer === "middle"
      ? `${setterRef} M3e.Value.${camel(value)}`
      : `${setterRef} "${escapeElmString(value)}"`;
  }
  if (attr.kind === "bool") {
    return `${setterRef} True`;
  }
  if (attr.kind === "string") {
    return `${setterRef} "${escapeElmString(value)}"`;
  }
  skip(`unknown attr kind ${attr.kind} for ${name} on ${entry.module}`);
}

/** The `[ ... ]` list literal for a set of expressions ([] when empty). */
const elmList = (exprs) => (exprs.length === 0 ? "[]" : `[ ${exprs.join(", ")} ]`);

/** Render one node to a raw-`Html` Elm expr at the given layer. `slotName` (or
 * null) is injected as the element's slot attribute. */
function cemNodeToElm(node, oracle, layer, slotName) {
  if (node.nodeType === 3) {
    return `Html.text "${escapeElmString(node.textContent.trim())}"`;
  }
  if (node.nodeType !== 1) {
    skip(`unsupported node type ${node.nodeType}`);
  }

  const tag = node.tagName.toLowerCase();
  const attrExprs = [];

  if (!tag.startsWith("m3e-")) {
    // Plain HTML element: its attr list is `List (Html.Attribute msg)`, so a
    // slot is ALWAYS a raw Html attribute — even at the middle layer (where
    // `M3e.Cem.Attr.slot` only fits an m3e element's typed attr list).
    if (slotName) {
      attrExprs.push(
        `Html.Attributes.attribute "slot" "${escapeElmString(slotName)}"`,
      );
    }
    // <a href> keeps its href; other attrs (class/id/...) drop.
    if (tag === "a") {
      const href = node.getAttribute("href");
      if (href != null) {
        attrExprs.push(`Html.Attributes.href "${escapeElmString(href)}"`);
      }
    }
    const children = cemChildren(node, oracle, layer);
    const fn = HTML_TAGS.has(tag) ? `Html.${tag}` : `Html.node "${tag}"`;
    return `${fn} ${elmList(attrExprs)} ${elmList(children)}`;
  }

  // m3e element: the slot goes in its typed attr list (M3e.Cem.Attr.slot at
  // middle, raw Html attribute at bottom).
  if (slotName) attrExprs.push(cemSlotAttr(layer, slotName));

  const entry = oracle[tag];
  if (!entry) skip(`unknown m3e tag ${tag}`);

  for (const [name, value] of [...node.attributes].map((a) => [a.name, a.value])) {
    if (name === "slot") continue; // carried via slotName on this element
    const typed = cemTypedAttr(entry, layer, name, value);
    if (typed != null) {
      attrExprs.push(typed);
      continue;
    }
    if (isDroppableAttr(name)) {
      droppedAttrs.push({ tag, name, value });
      continue;
    }
    // Untyped but semantic (e.g. aria-label): raw-attribute escape. No skip —
    // the bottom layer expresses any attribute; middle via Attr.attribute.
    attrExprs.push(cemRawAttr(layer, name, value));
  }

  const children = cemChildren(node, oracle, layer);
  return `${CEM_PREFIX[layer]}.${entry.module}.${decapitalize(
    entry.module,
  )} ${elmList(attrExprs)} ${elmList(children)}`;
}

/** Non-whitespace child nodes -> raw-`Html` exprs (each carrying its own slot). */
function cemChildren(node, oracle, layer) {
  const out = [];
  for (const child of node.childNodes) {
    if (isWhitespaceText(child)) continue;
    if (child.nodeType === 1 || child.nodeType === 3) {
      const slotName =
        child.nodeType === 1 ? child.getAttribute("slot") || null : null;
      out.push(cemNodeToElm(child, oracle, layer, slotName));
    }
  }
  return out;
}

/**
 * Convert an HTML string to the middle (`M3e.Cem.*`) or bottom
 * (`M3e.Cem.Html.*`) Elm layer.
 * @param {"middle"|"bottom"} layer
 * @returns {{ code: string } | { skip: string }}
 */
export function toElmCem(htmlString, oracle, layer) {
  droppedAttrs = [];
  let document;
  try {
    ({ document } = parseHTML(`<html><body>${htmlString}</body></html>`));
  } catch (err) {
    return { skip: `parse error: ${err.message}` };
  }

  const roots = [...document.body.childNodes].filter(
    (n) => !isWhitespaceText(n) && (n.nodeType === 1 || n.nodeType === 3),
  );
  if (roots.length === 0) {
    return { skip: "empty example" };
  }

  try {
    const codes = roots.map((n) => {
      const slotName =
        n.nodeType === 1 ? n.getAttribute("slot") || null : null;
      return cemNodeToElm(n, oracle, layer, slotName);
    });
    return { code: codes.join("\n") };
  } catch (err) {
    if (err instanceof SkipError) {
      return { skip: err.reason };
    }
    throw err;
  }
}

/**
 * Convert an HTML string to typed M3e.* Elm.
 * @returns {{ code: string } | { skip: string }}
 */
export function toElm(htmlString, oracle) {
  droppedAttrs = [];
  let document;
  try {
    ({ document } = parseHTML(`<html><body>${htmlString}</body></html>`));
  } catch (err) {
    return { skip: `parse error: ${err.message}` };
  }

  // Top-level renderable nodes (ignore whitespace-only text).
  const roots = [...document.body.childNodes].filter(
    (n) => !isWhitespaceText(n) && (n.nodeType === 1 || n.nodeType === 3),
  );

  if (roots.length === 0) {
    return { skip: "empty example" };
  }

  try {
    const codes = roots.map((n) => nodeToElm(n, oracle));
    // Single-root examples are the focus of this task; multi-root just joins.
    return { code: codes.join("\n") };
  } catch (err) {
    if (err instanceof SkipError) {
      return { skip: err.reason };
    }
    throw err;
  }
}
