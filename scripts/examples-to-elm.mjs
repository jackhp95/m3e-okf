// Orchestrator: run the deterministic HTML->Elm converter over the whole mined
// corpus (data/examples.json) and emit the generated example config the docs
// build consumes:
//
//   config/examples.generated.json  keyed by PascalCase module ->
//     { examples: [ { title, code, section? } ], docMeta: { category } }
//   config/examples.skipped.txt     one line per skipped example:
//     <module> :: <title> :: <reason>
//
// A component appears only if it has >=1 successfully-converted example. Each
// example's `code` is a self-contained Elm expression (or a gallery of several
// joined by a blank line). `section` is present only when non-null.
//
// Multi-root handling: many mined examples have several top-level sibling
// elements (e.g. five button variants). `toElm` maps a single root; here we
// detect >1 top-level node, convert EACH sibling separately, and assemble their
// code into ONE Elm LIST expression (`[ expr1\n    , expr2\n    ... ]`) — a
// single, compilable expression. Single-root examples stay a bare expression.
// If any sibling skips, the whole example skips with that reason.
//
// Every candidate example is then COMPILE-VERIFIED against the real M3e.* / Kit
// API (see verify-examples.mjs); non-compiling examples are DROPPED and logged
// to config/examples.skipped.txt with a `compile: <firstErrorLine>` reason.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parseHTML } from "linkedom";

import { buildOracle } from "./lib/oracle.mjs";
import { toElm } from "./lib/to-elm.mjs";
import { deriveSection } from "./lib/sections.mjs";
import { pascal } from "./lib/naming.mjs";
import { verifyExamples } from "./verify-examples.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
// scripts/examples-to-elm.mjs -> repo root is two levels up (m3e-docs/scripts).
const REPO_ROOT = resolve(HERE, "..", "..");

const EXAMPLES_PATH = resolve(HERE, "..", "data", "examples.json");
const CATEGORIES_PATH = resolve(REPO_ROOT, "config", "categories.json");
const OUT_GENERATED = resolve(REPO_ROOT, "config", "examples.generated.json");
const OUT_SKIPPED = resolve(REPO_ROOT, "config", "examples.skipped.txt");

const DEFAULT_CATEGORY = "Layout & style";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Non-whitespace top-level nodes (elements + non-empty text). */
function topLevelNodes(htmlString) {
  const { document } = parseHTML(`<html><body>${htmlString}</body></html>`);
  return [...document.body.childNodes].filter(
    (n) =>
      n.nodeType === 1 ||
      (n.nodeType === 3 && n.textContent.trim() !== ""),
  );
}

/** Serialize a single top-level node back to an HTML string for re-conversion. */
function nodeToHtml(node) {
  if (node.nodeType === 3) return node.textContent;
  return node.outerHTML;
}

/**
 * Convert one mined example's raw HTML to Elm, handling multi-root galleries.
 * @returns {{ code: string } | { skip: string }}
 */
function convertExample(html, oracle) {
  const roots = topLevelNodes(html);

  // Single root (or empty) -> defer entirely to toElm.
  if (roots.length <= 1) {
    return toElm(html, oracle);
  }

  // Multiple roots -> convert each sibling independently, assemble as a single
  // Elm LIST expression so the whole example is one compilable expression.
  const pieces = [];
  for (const node of roots) {
    const res = toElm(nodeToHtml(node), oracle);
    if (res.skip) return { skip: res.skip };
    pieces.push(res.code);
  }
  return { code: toElmList(pieces) };
}

/**
 * Assemble sibling expressions into one Elm list literal:
 *   [ expr1
 *   , expr2
 *   ]
 * Multi-line sibling expressions are re-indented so the list stays valid.
 */
function toElmList(pieces) {
  const indented = pieces.map((p) =>
    p.split("\n").join("\n      "),
  );
  return "[ " + indented.join("\n    , ") + "\n    ]";
}

function main() {
  const corpus = readJson(EXAMPLES_PATH);
  const categories = readJson(CATEGORIES_PATH);
  const oracle = buildOracle();

  const generated = {};
  const skippedLines = [];

  let total = 0;
  let converted = 0;

  // Deterministic order over corpus keys.
  for (const slug of Object.keys(corpus).sort()) {
    const module = pascal(slug);
    let category = categories[module];
    if (category == null) {
      console.warn(
        `warning: no category for module "${module}" (slug "${slug}"); using "${DEFAULT_CATEGORY}"`,
      );
      category = DEFAULT_CATEGORY;
    }

    const examples = [];
    for (const ex of corpus[slug]) {
      total += 1;
      const { title, code: rawHtml } = ex;
      const res = convertExample(rawHtml, oracle);

      if (res.skip) {
        skippedLines.push(`${module} :: ${title} :: ${res.skip}`);
        continue;
      }

      converted += 1;
      const section = deriveSection(rawHtml, oracle);
      examples.push({
        title,
        code: res.code,
        ...(section ? { section } : {}),
      });
    }

    if (examples.length > 0) {
      generated[module] = { examples, docMeta: { category } };
    }
  }

  // --- COMPILE-VERIFY every candidate against the real M3e.* / Kit API. ------
  // Anything that fails `elm make` is DROPPED and logged with its reason. This
  // is the "examples can't lie" gate: only compiling Elm survives.
  const { failures, fatal } = verifyExamples(generated);
  if (fatal) {
    console.error(
      "FATAL: the scratch verification app did not build (harness/elm.json issue):\n" +
        fatal,
    );
    process.exit(2);
  }

  // Index failures by module for O(1) drop; sort each module's drop indices
  // descending so splicing doesn't shift later indices.
  const failByModule = new Map(); // module -> Map(idx -> firstErrorLine)
  for (const f of failures) {
    if (!failByModule.has(f.module)) failByModule.set(f.module, new Map());
    failByModule.get(f.module).set(f.idx, f.firstErrorLine);
  }

  let compileDropped = 0;
  for (const module of Object.keys(generated)) {
    const drops = failByModule.get(module);
    if (!drops) continue;
    const kept = [];
    generated[module].examples.forEach((ex, idx) => {
      if (drops.has(idx)) {
        compileDropped += 1;
        converted -= 1;
        skippedLines.push(
          `${module} :: ${ex.title} :: compile: ${drops.get(idx)}`,
        );
      } else {
        kept.push(ex);
      }
    });
    if (kept.length > 0) {
      generated[module].examples = kept;
    } else {
      delete generated[module];
    }
  }

  // Sort output keys alphabetically for a stable diff.
  const sortedGenerated = {};
  for (const key of Object.keys(generated).sort()) {
    sortedGenerated[key] = generated[key];
  }

  // Keep the skip log deterministic.
  skippedLines.sort();

  writeFileSync(OUT_GENERATED, JSON.stringify(sortedGenerated, null, 2) + "\n");
  writeFileSync(
    OUT_SKIPPED,
    skippedLines.length ? skippedLines.join("\n") + "\n" : "",
  );

  const componentCount = Object.keys(sortedGenerated).length;
  const zeroExampleCount = Object.keys(corpus).length - componentCount;

  console.log(
    `converted+compiled ${converted} / total ${total}; ` +
      `skipped ${total - converted} (convert ${total - converted - compileDropped}, compile ${compileDropped}) ` +
      `across ${componentCount} components`,
  );
  console.log(`components with zero examples: ${zeroExampleCount}`);
}

main();
