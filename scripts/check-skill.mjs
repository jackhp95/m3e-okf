// check-skill.mjs — guard: assert no rendered skill file ships HTML markup that
// drifts from the CEM ground truth. Walks every ```html block in skills/m3e/**
// (component cards AND concept pages) and validates it against the manifest, so
// a regression — drift slipping into a concept page from guidance.json, a hand
// edit, a future generator change — fails loudly instead of teaching agents a
// tag/attribute/slot that doesn't exist. Exits non-zero on any drift.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGroundTruth, validateMarkup } from "./lib/validate-markup.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const comps = JSON.parse(fs.readFileSync(path.join(ROOT, "data/components.json"), "utf8"));
const GT = buildGroundTruth(comps);

const SKILL = path.join(ROOT, "skills/m3e");
const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".md")) files.push(p);
  }
})(SKILL);

let blocks = 0;
const problems = [];
for (const file of files.sort()) {
  const md = fs.readFileSync(file, "utf8");
  for (const m of md.matchAll(/```html\n([\s\S]*?)```/g)) {
    blocks++;
    const errs = validateMarkup(m[1], GT, { allowCss: true });
    if (errs.length) problems.push({ file: path.relative(ROOT, file), errs });
  }
}

if (problems.length) {
  console.error(`✗ ${problems.length}/${blocks} html block(s) drift from the CEM:\n`);
  for (const p of problems) console.error(`  [${p.file}]\n    ${p.errs.join("\n    ")}`);
  process.exit(1);
}
console.log(`✓ ${blocks} html blocks across ${files.length} skill files — all valid against the CEM.`);
