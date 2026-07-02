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

  // --- Required-record named fields (e.g. ariaLabel <- aria-label). ---
  // These source attributes are consumed here and are NOT emitted as setters.
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

  // --- Attributes (skip the `slot` attribute; it is structural). ---
  const attrExprs = [];
  for (const [name, value] of attrPairs) {
    if (name === "slot") continue;
    // Required-record fields were consumed above; they are not setters.
    if (requiredHtmlNames.has(name)) continue;

    const attr = entry.attributes.find((a) => a.htmlName === name);
    if (!attr) {
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
  const defaultWrapped = [];
  if (foldsContent) {
    if (defaultExprs.length === 0) {
      skip(`missing required content (default slot) on ${tag}`);
    }
    if (defaultExprs.length > 1) {
      skip(`multiple children for single-value content slot on ${tag}`);
    }
    recordFields.unshift(`content = ${defaultExprs[0]}`);
  } else if (defaultExprs.length === 1) {
    // Wrap default-slot content with the component's child helper.
    defaultWrapped.push(`M3e.${entry.module}.child (${defaultExprs[0]})`);
  } else if (defaultExprs.length > 1) {
    defaultWrapped.push(
      `M3e.${entry.module}.children [ ${defaultExprs.join(", ")} ]`,
    );
  }

  const contentExprs = [...slottedExprs, ...defaultWrapped];
  const attrsList =
    attrExprs.length === 0 ? "[]" : `[ ${attrExprs.join(", ")} ]`;
  const contentList =
    contentExprs.length === 0 ? "[]" : `[ ${contentExprs.join(", ")} ]`;

  // Required record (named fields and/or folded content) -> 3-arg view form.
  const hasRecord = recordFields.length > 0;
  const recordArg = hasRecord ? `{ ${recordFields.join(", ")} } ` : "";

  return `M3e.${entry.module}.view ${recordArg}${attrsList} ${contentList}`;
}

/**
 * Convert an HTML string to typed M3e.* Elm.
 * @returns {{ code: string } | { skip: string }}
 */
export function toElm(htmlString, oracle) {
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
