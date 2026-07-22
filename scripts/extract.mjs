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
import { buildGroundTruth, validateMarkup } from "./lib/validate-markup.mjs";

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

/**
 * The type-parser can't inline imported type aliases (e.g. `FormSubmitterType`,
 * `LinkTarget`), so the CEM leaves them as bare identifiers — opaque to an agent.
 * Detect that case so we can fall back to the README's literal union.
 */
function isOpaqueAlias(t) {
  return !!t && /^[A-Za-z_][A-Za-z0-9_]*(\s*\|\s*(null|undefined))?$/.test(t) && !/^(boolean|string|number|Date|Event|object|any|unknown|void|null|undefined)\b/.test(t);
}
/** A README type worth trusting over an opaque alias: an actual literal union. */
function isLiteralUnion(t) {
  return !!t && t.includes("|") && /["']/.test(t);
}

/**
 * Resolve string-literal type aliases from the TS source (ground truth) so the
 * CEM's un-inlined aliases (FormSubmitterType, LinkTarget, …) become real unions.
 * Scans `export type X = "a" | "b" | …;` across packages/web/src.
 */
function buildAliasMap() {
  const map = new Map();
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(fp);
      else if (ent.name.endsWith(".ts") && !ent.name.endsWith(".spec.ts")) {
        const re = /export type (\w+)\s*=\s*([^;]+);/g;
        let m;
        const src = fs.readFileSync(fp, "utf8");
        while ((m = re.exec(src))) {
          const body = m[2].replace(/\s+/g, " ").replace(/\(string & \{\}\)/g, "string").trim();
          if (/["']/.test(body)) map.set(m[1], body); // string-literal unions only
        }
      }
    }
  };
  walk(SRC);
  return map;
}
const ALIASES = buildAliasMap();

// ---------------------------------------------------------------------------
// Catalog metadata: display (derived from TS `:host`) + hostContract overlay.
// See scripts/README or the systems-solidification plan (Piece B).
// ---------------------------------------------------------------------------

/** Resolve a RELATIVE import/re-export specifier to an on-disk .ts file. */
function resolveRelativeImport(fromFile, spec) {
  if (!spec.startsWith(".")) return null; // non-relative (e.g. @m3e/web/core) — not chased
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const cand of [base + ".ts", path.join(base, "index.ts")]) {
    if (fs.existsSync(cand)) return cand;
  }
  return null;
}

/** Every relative import/export specifier in a TS source (for style-barrel + base-class chasing). */
function relativeSpecsIn(src) {
  const specs = [];
  const re = /(?:import|export)\s+(?:type\s+)?(?:[^"';]*?from\s+)?["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src))) specs.push(m[1]);
  return specs;
}

/**
 * Collect the primary TS file + the files it (transitively, relatively) pulls
 * in — element styles live in a `./styles` barrel (`export * from "./XStyle"`),
 * and some elements inherit their `:host` from a same-dir base class. Bounded
 * depth; only relative specifiers are chased (non-relative `@m3e/web/core`
 * bases fall to the display-overlay).
 */
function relatedTsFiles(file, depth, seen) {
  if (depth < 0 || seen.has(file)) return;
  seen.add(file);
  let src;
  try {
    src = fs.readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const spec of relativeSpecsIn(src)) {
    const target = resolveRelativeImport(file, spec);
    if (target) relatedTsFiles(target, depth - 1, seen);
  }
}

/**
 * Extract the host's DEFAULT display from a `css`…`` block: the first bare
 * `:host { … display: X }` (or card's conditional `:host(:not([inline]))`).
 * Deliberately ignores state/variant/descendant selectors
 * (`:host([variant=…])`, `:host(:popover-open)`, `:host(…) .child`) — those are
 * conditional overrides, not the resting display.
 */
function hostDisplayFrom(src) {
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const sel = lines[i].trim();
    const bareHost = /^:host\s*\{$/.test(sel);
    const notInline = /^:host\(:not\(\[inline\]\)\)\s*\{$/.test(sel); // card default
    if (!bareHost && !notInline) continue;
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j].trim();
      if (l === "}") break; // block ended without a display: → keep scanning later :host blocks
      const dm = l.match(/^display:\s*([a-z-]+)\s*;/);
      if (dm) return { value: dm[1], conditional: notInline };
    }
  }
  return null;
}

/** Optional overlay for the handful of elements whose `:host` lives behind a
 *  non-relative base class (e.g. `@m3e/web/core` `ActionElementBase`). */
const DISPLAY_OVERLAY = (() => {
  const p = path.join(ROOT, "data/display-overlay.json");
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
})();

/**
 * The `display` catalog field for one element, given its primary CEM source
 * path (`packages/web/src/…`). Derived from TS `:host` first; falls back to the
 * checked-in overlay (keyed by tag) for the residual non-relative-base cases.
 */
function displayFor(cemSourcePath, tag) {
  const primaryAbs = path.join(M3E, cemSourcePath); // cemSourcePath is `packages/web/src/…`
  if (fs.existsSync(primaryAbs)) {
    const seen = new Set();
    relatedTsFiles(primaryAbs, 3, seen);
    const ordered = [primaryAbs, ...[...seen].filter((f) => f !== primaryAbs)];
    for (const f of ordered) {
      const d = hostDisplayFrom(fs.readFileSync(f, "utf8"));
      if (d) {
        const out = { value: d.value, source: "ts" };
        if (d.conditional) out.note = "block by default; inline-block with the `inline` attribute";
        return out;
      }
    }
  }
  if (DISPLAY_OVERLAY[tag]) return { ...DISPLAY_OVERLAY[tag], source: "overlay" };
  return undefined;
}

/** hostContract overlay — component-level composition contracts, hand-authored. */
const HOST_CONTRACT_OVERLAY = (() => {
  const p = path.join(ROOT, "data/host-contract-overlay.json");
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
})();

/** Build { attrName -> readmeType } from a README's Attribute tables. */
function readmeAttrTypes(readme) {
  const map = new Map();
  if (!readme) return map;
  for (const tbl of readme.tables) {
    if (!tbl.headers.some((h) => /^attribute$/i.test(h))) continue;
    const nameKey = tbl.headers.find((h) => /attribute/i.test(h));
    const typeKey = tbl.headers.find((h) => /type/i.test(h));
    if (!typeKey) continue;
    for (const row of tbl.rows) {
      const n = (row[nameKey] || "").trim();
      if (n && row[typeKey]) map.set(n, row[typeKey].trim());
    }
  }
  return map;
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

  const rmTypes = readmeAttrTypes(readme);
  const elements = els.map(({ decl, modulePath }) => {
    const attributes = (decl.attributes || []).map((a) => {
      let type = typeOf(a);
      let typeSource = "cem";
      if (isOpaqueAlias(type)) {
        // CEM left an imported alias un-inlined. Resolve from TS source (truth),
        // then fall back to the README's literal union.
        const base = type.replace(/\s*\|\s*(null|undefined)\s*$/, "");
        const suffix = type.slice(base.length);
        const rt = rmTypes.get(a.name);
        if (ALIASES.has(base)) {
          type = ALIASES.get(base) + suffix;
          typeSource = "ts";
        } else if (isLiteralUnion(rt)) {
          type = rt;
          typeSource = "readme";
        }
      }
      return { name: a.name, type, typeSource, default: a.default, description: a.description };
    });
    const sourceFile = `packages/web/${modulePath}`;
    // navigable: derived — an element is navigable if it carries a native `href`.
    const navigable = attributes.some((a) => a.name === "href") || undefined;
    // display: derived from the element's `:host` CSS (overlay fallback for
    // non-relative base classes).
    const display = displayFor(sourceFile, decl.tagName);
    return {
      tag: decl.tagName,
      summary: (decl.description || "").split("\n")[0] || undefined,
      sourceFile,
      navigable,
      display,
      attributes,
      properties: propsOf(decl),
      slots: (decl.slots || []).map((s) => ({ name: s.name || "(default)", description: s.description })),
      // Skip CEM event entries with no resolvable name — the analyzer emits a
      // nameless entry for some declarations, which would otherwise render an
      // Events row for an event literally named "undefined".
      events: (decl.events || [])
        .filter((e) => e.name)
        .map((e) => ({ name: e.name, type: typeOf(e), description: e.description })),
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
    // hostContract: hand-authored composition contract (manual overlay), for
    // components whose host expects a specific slotted structure.
    hostContract: HOST_CONTRACT_OVERLAY[dir],
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
// README example drift: validate every README example shown on a card against
// the *global* CEM ground truth (needs all components, so this runs after the
// build loop). Catches unknown tags, undocumented attributes, and slots the
// manifest doesn't expose (e.g. README uses <m3e-fab-menu-item> / slot="label"
// that don't exist) — the markup an agent would otherwise copy verbatim. CSS is
// allowed here: styling in a README example is not an API claim.
// ---------------------------------------------------------------------------
const GT = buildGroundTruth(components);
for (const c of components) {
  const errs = new Set();
  for (const ex of c.examples) for (const e of validateMarkup(ex.code, GT, { allowCss: true })) errs.add(e);
  if (!errs.size) continue;
  for (const e of errs) allFindings.push({ dir: c.name, attr: e, kind: "EXAMPLE-DRIFT", detail: "in README example" });
  c.verification.findings += errs.size;
  c.verification.byKind = countBy(allFindings.filter((f) => f.dir === c.name), "kind");
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
report += `> DEFAULT-UNDOCUMENTED = the CEM specifies a default the README doesn't state.\n`;
report += `> UNDOCUMENTED = real attribute (in CEM) missing from the README.\n`;
report += `> DEFAULT-MISMATCH = README and CEM disagree on an attribute's default.\n`;
report += `> EXAMPLE-DRIFT = a README example uses a tag/attribute/slot the CEM doesn't expose\n`;
report += `> (markup an agent might copy verbatim); these snippets are withheld from the cards.\n`;
report += `> README-only = the README lists an attribute the CEM doesn't expose (likely stale/typo).\n`;
report += `> In every case the CEM value wins. (Categories with a 0 count above don't appear here.)\n\n`;
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
