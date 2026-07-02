// Deterministic HTML -> typed M3e.* Elm mapper (core cases).
//
// Scope for THIS task: simple 2-arg M3e components (Button/Checkbox/Icon-style),
// enum/bool/string attributes, named + default slots, and text. Anything that
// cannot be mapped short-circuits the whole example with { skip: reason }.
//
// Out of scope here (deferred to the next task -> { skip }):
//   - components whose oracle entry has requiredFields.length > 0
//     (they need the required-record view form)
//   - plain (non-m3e) HTML elements and links
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

function elementToElm(node, oracle) {
  const tag = node.tagName.toLowerCase();

  // Non-m3e elements are plain HTML -> next task.
  if (!tag.startsWith("m3e-")) {
    skip("plain HTML (next task)");
  }

  const entry = oracle[tag];
  if (!entry) {
    skip(`unknown m3e tag ${tag}`);
  }

  // Required-record components need the 3-arg view form -> next task.
  if (entry.requiredFields && entry.requiredFields.length > 0) {
    skip(`required-record form (next task) for ${tag}`);
  }

  const attrPairs = [...node.attributes].map((a) => [a.name, a.value]);

  // --- Attributes (skip the `slot` attribute; it is structural). ---
  const attrExprs = [];
  for (const [name, value] of attrPairs) {
    if (name === "slot") continue;

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

  // Wrap default-slot content with the component's child/children helpers.
  const defaultWrapped = [];
  if (defaultExprs.length === 1) {
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

  return `M3e.${entry.module}.view ${attrsList} ${contentList}`;
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
