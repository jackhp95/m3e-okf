// extract.mjs — merge CEM (ground truth) + TS source + README into data/components.json
//
// Fidelity rule (locked): the generated Custom Elements Manifest and the TS
// source are ground truth. README prose/examples are kept, but every README API
// claim is verified against the CEM; drift is flagged in data/report.md, never
// silently trusted.
//
// Usage:
//   node scripts/extract.mjs                 # all components
//   node scripts/extract.mjs button dialog   # only the named dirs (POC)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const M3E = path.join(ROOT, ".cache/m3e");
const WEB = path.join(M3E, "packages/web");
const SRC = path.join(WEB, "src");
const CEM = path.join(WEB, "dist/custom-elements.json");
const PINNED_SHA = readSha();

const only = process.argv.slice(2); // optional dir filter

// ---------------------------------------------------------------------------
// Load + index the manifest
// ---------------------------------------------------------------------------
const manifest = JSON.parse(fs.readFileSync(CEM, "utf8"));

/** dir -> [{ decl, modulePath }] for every custom element under src/<dir>/ */
const elementsByDir = new Map();
for (const mod of manifest.modules) {
  const p = mod.path || "";
  const parts = p.split("/");
  if (parts[0] !== "src" || parts.length < 3) continue;
  const dir = parts[1];
  for (const decl of mod.declarations || []) {
    if (decl.customElement && decl.tagName) {
      if (!elementsByDir.has(dir)) elementsByDir.set(dir, []);
      elementsByDir.get(dir).push({ decl, modulePath: p });
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readSha() {
  try {
    const head = fs.readFileSync(path.join(M3E, ".git/HEAD"), "utf8").trim();
    if (head.startsWith("ref:")) {
      return fs.readFileSync(path.join(M3E, ".git", head.slice(5).trim()), "utf8").trim();
    }
    return head;
  } catch {
    return "unknown";
  }
}

/** Prefer the type-parser's expanded union (parsedType) over the raw type name. */
function typeOf(node) {
  return node?.parsedType?.text || node?.type?.text || undefined;
}

/** Public, documentable fields that are NOT reflected as attributes (JS-only props). */
function propsOf(decl) {
  const attrNames = new Set((decl.attributes || []).map((a) => a.fieldName || a.name));
  return (decl.members || [])
    .filter(
      (m) =>
        m.kind === "field" &&
        (m.privacy == null || m.privacy === "public") &&
        !m.name.startsWith("_") &&
        !attrNames.has(m.name) &&
        (m.description || m.attribute === undefined) && // keep documented props
        m.description // require a description to avoid internal noise
    )
    .map((m) => ({
      name: m.name,
      type: typeOf(m),
      default: m.default,
      readonly: m.readonly || undefined,
      description: m.description,
    }));
}

/**
 * Collapse the (often hundreds of) CSS custom properties into families by
 * replacing size/variant/state tokens with placeholders — recreating the
 * README's smart summary, but derived from CEM ground truth.
 */
function summarizeCssProps(cssProps) {
  // Segment-aware: only collapse a hyphen-delimited segment that EXACTLY equals
  // a known token. "text" is excluded — it's an ambiguous word ("label-text-…")
  // and collapsing it as a variant mislabels non-variant tokens.
  const SIZE = new Set(["extra-small", "small", "medium", "large", "extra-large"]);
  const VARIANT = new Set(["filled", "tonal", "elevated", "outlined"]);
  const collapse = (name) => {
    // handle the two-word "extra-small"/"extra-large" first
    let n = name.replace(/-(extra-small|extra-large)\b/g, "-[size]");
    return n
      .split("-")
      .map((seg) => (SIZE.has(seg) ? "[size]" : VARIANT.has(seg) ? "[variant]" : seg))
      .join("-");
  };
  const families = new Map(); // pattern -> { members:Set, description }
  for (const c of cssProps) {
    const pat = collapse(c.name);
    if (!families.has(pat)) families.set(pat, { members: new Set(), description: c.description });
    families.get(pat).members.add(c.name);
  }
  const grouped = [...families.entries()].map(([pattern, v]) => ({
    pattern,
    count: v.members.size,
    description: v.description,
  }));
  return { total: cssProps.length, families: grouped.length, grouped };
}

/** Extract every markdown pipe-table as { headers:[], rows:[{}] }. */
function parseTables(md) {
  const lines = md.split("\n");
  const tables = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*\|.*\|\s*$/.test(lines[i])) continue;
    if (!/^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || "")) continue; // separator row
    // split on UNescaped pipes only (Type columns contain literal `\|` unions),
    // then unescape so `"a" \| "b"` survives as a single cell.
    const cells = (row) =>
      row
        .replace(/^\s*\||\|\s*$/g, "")
        .split(/(?<!\\)\|/)
        .map((c) => c.trim().replace(/\\\|/g, "|").replace(/^`|`$/g, ""));
    const headers = cells(lines[i]);
    const rows = [];
    let j = i + 2;
    for (; j < lines.length && /^\s*\|.*\|\s*$/.test(lines[j]); j++) {
      const vals = cells(lines[j]);
      const row = {};
      headers.forEach((h, k) => (row[h] = vals[k]));
      rows.push(row);
    }
    tables.push({ headers, rows });
    i = j - 1;
  }
  return tables;
}

/** Pull intro prose, import statement, and example code from a README. */
function parseReadme(md) {
  const importMatch = md.match(/```ts\n([^`]*?import[^`]*?)```/s);
  const description =
    md
      .replace(/^#[^\n]*\n/, "") // drop H1
      .split(/\n##? /)[0] // up to first sub-heading
      .replace(/```[\s\S]*?```/g, "") // drop code fences
      .trim()
      .split(/\n\s*\n/)
      .filter((p) => p.trim() && !p.startsWith("|"))
      .slice(0, 3)
      .join("\n\n") || undefined;
  const examples = [...md.matchAll(/```html\n([\s\S]*?)```/g)].map((m) => ({
    code: m[1].trim(),
  }));
  const elements = [...md.matchAll(/^- `([a-z0-9-]+)`\s+—\s+(.*)$/gim)].map((m) => ({
    tag: m[1],
    note: m[2].trim(),
  }));
  return {
    description,
    import: importMatch ? importMatch[1].trim() : undefined,
    examples,
    elements,
    tables: parseTables(md),
  };
}

/**
 * Verify README attribute claims against CEM. Returns per-attribute status and
 * a list of drift findings.
 */
function verify(dir, cemAttrsByName, readme) {
  const findings = [];
  // Only true Attribute tables. "Property" headers are either CSS custom
  // properties (summarized from CEM elsewhere) or JS props (captured from CEM),
  // not attributes — matching them produces false README-only noise.
  const attrTables = readme.tables.filter((t) => t.headers.some((h) => /^attribute$/i.test(h)));
  const seen = new Set();
  for (const t of attrTables) {
    const nameKey = t.headers.find((h) => /attribute|property|name/i.test(h));
    const typeKey = t.headers.find((h) => /type/i.test(h));
    const defKey = t.headers.find((h) => /default/i.test(h));
    for (const row of t.rows) {
      const name = (row[nameKey] || "").trim();
      if (!name || name === "_(default)_") continue;
      seen.add(name);
      const cem = cemAttrsByName.get(name);
      if (!cem) {
        findings.push({ dir, attr: name, kind: "README-only", detail: "not in CEM" });
        continue;
      }
      // default comparison (normalize quotes). A blank/em-dash README default is
      // an omission, not a conflict — flag it softly only when the CEM has a
      // meaningful default to surface.
      const norm = (s) => (s || "").replace(/["'`]/g, "").trim();
      const blank = (s) => !s || /^(—|-|–|\(none\)|_\(none\)_|n\/a)$/i.test(norm(s));
      const cemMeaningful = cem.default != null && !/^(undefined|null|""|''|\[\]|\{\}|0|"")$/.test(norm(cem.default));
      if (defKey && cem.default != null) {
        if (blank(row[defKey])) {
          if (cemMeaningful)
            findings.push({ dir, attr: name, kind: "DEFAULT-UNDOCUMENTED", detail: `CEM=${cem.default}, README blank` });
        } else if (norm(row[defKey]) !== norm(cem.default)) {
          findings.push({
            dir,
            attr: name,
            kind: "DEFAULT-MISMATCH",
            detail: `README=${row[defKey]} CEM=${cem.default}`,
          });
        }
      }
    }
  }
  // attributes present in CEM but undocumented in README
  for (const [name] of cemAttrsByName) {
    if (!seen.has(name)) findings.push({ dir, attr: name, kind: "UNDOCUMENTED", detail: "in CEM, not in README" });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Build records
// ---------------------------------------------------------------------------
const dirs = (only.length ? only : [...elementsByDir.keys()].filter((d) => d !== "core")).sort();
const components = [];
const sources = [];
const allFindings = [];

for (const dir of dirs) {
  const els = elementsByDir.get(dir) || [];
  const readmePath = path.join(SRC, dir, "README.md");
  const hasReadme = fs.existsSync(readmePath);
  const readme = hasReadme ? parseReadme(fs.readFileSync(readmePath, "utf8")) : null;

  const elements = els.map(({ decl, modulePath }) => {
    const attributes = (decl.attributes || []).map((a) => ({
      name: a.name,
      type: typeOf(a),
      default: a.default,
      description: a.description,
    }));
    return {
      tag: decl.tagName,
      summary: (decl.description || "").split("\n")[0] || undefined,
      sourceFile: `packages/web/${modulePath}`,
      attributes,
      properties: propsOf(decl),
      slots: (decl.slots || []).map((s) => ({ name: s.name || "(default)", description: s.description })),
      events: (decl.events || []).map((e) => ({ name: e.name, type: typeOf(e), description: e.description })),
      css: summarizeCssProps(decl.cssProperties || []),
      cssParts: (decl.cssParts || []).map((p) => ({ name: p.name, description: p.description })),
    };
  });

  // verification against the union of all element attributes in this dir
  const cemAttrsByName = new Map();
  for (const el of elements) for (const a of el.attributes) cemAttrsByName.set(a.name, a);
  const findings = readme ? verify(dir, cemAttrsByName, readme) : [];
  allFindings.push(...findings);

  components.push({
    name: dir,
    primaryTag: elements.find((e) => e.tag === `m3e-${dir}`)?.tag || elements[0]?.tag,
    summary: readme?.description?.split("\n")[0]?.slice(0, 200),
    description: readme?.description,
    import: readme?.import || `import "@m3e/web/${dir}";`,
    elementCount: elements.length,
    elements,
    examples: readme?.examples || [],
    verification: {
      checked: !!readme,
      findings: findings.length,
      byKind: countBy(findings, "kind"),
    },
  });

  sources.push({
    name: dir,
    sha: PINNED_SHA,
    readme: hasReadme ? `packages/web/src/${dir}/README.md` : null,
    sourceFiles: els.map((e) => `packages/web/${e.modulePath}`),
  });
}

function countBy(arr, key) {
  const o = {};
  for (const x of arr) o[x[key]] = (o[x[key]] || 0) + 1;
  return o;
}

// ---------------------------------------------------------------------------
// Write outputs
// ---------------------------------------------------------------------------
const dataDir = path.join(ROOT, "data");
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, "components.json"), JSON.stringify(components, null, 2));
fs.writeFileSync(
  path.join(dataDir, "sources.json"),
  JSON.stringify({ upstream: "matraic/m3e", sha: PINNED_SHA, license: "MIT", components: sources }, null, 2)
);

// drift report
const byKind = countBy(allFindings, "kind");
let report = `# Extraction report\n\nUpstream \`matraic/m3e\` @ \`${PINNED_SHA}\`\n\n`;
report += `Components: ${components.length}  ·  Elements: ${components.reduce((n, c) => n + c.elementCount, 0)}\n\n`;
report += `## Verification findings (README vs CEM ground truth)\n\n`;
report += Object.entries(byKind).map(([k, n]) => `- **${k}**: ${n}`).join("\n") + "\n\n";
report += `> UNDOCUMENTED = real attribute (in CEM) missing from README. README-only = README lists an\n`;
report += `> attribute the CEM doesn't expose (likely stale/typo). DEFAULT-MISMATCH = default disagrees.\n\n`;
for (const c of components) {
  const f = allFindings.filter((x) => x.dir === c.name);
  if (!f.length) continue;
  report += `### ${c.name}\n`;
  for (const x of f) report += `- \`${x.attr}\` — **${x.kind}** (${x.detail})\n`;
  report += "\n";
}
fs.writeFileSync(path.join(dataDir, "report.md"), report);

console.log(
  `extracted ${components.length} components, ${components.reduce((n, c) => n + c.elementCount, 0)} elements; ` +
    `${allFindings.length} findings (${JSON.stringify(byKind)})`
);
