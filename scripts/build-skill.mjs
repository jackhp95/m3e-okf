// build-skill.mjs — render data/components.json into the m3e skill.
//
//   skills/m3e/SKILL.md            the router/index (the "lobby")
//   skills/m3e/components/<n>.md   one card per component (the "rooms")
//
// Cards lead with CEM-verified API; a fidelity footer cites the pinned SHA and
// lists any README drift we corrected, so an agent can trust + trace each value.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGroundTruth, validateMarkup } from "./lib/validate-markup.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const DATA = path.join(ROOT, "data");
const OUT = path.join(ROOT, "skills/m3e");
const components = JSON.parse(fs.readFileSync(path.join(DATA, "components.json"), "utf8"));
const GT = buildGroundTruth(components);
const sources = JSON.parse(fs.readFileSync(path.join(DATA, "sources.json"), "utf8"));
const guidance = JSON.parse(fs.readFileSync(path.join(DATA, "guidance.json"), "utf8"));
const examplesPath = path.join(DATA, "examples.json");
const realExamples = fs.existsSync(examplesPath) ? JSON.parse(fs.readFileSync(examplesPath, "utf8")) : {};
const SHA = sources.sha;
const SHORT = SHA.slice(0, 7);
const REPO = "https://github.com/matraic/m3e/blob";

// component -> family map
const familyOf = new Map();
for (const f of guidance.families) for (const m of f.members) familyOf.set(m, f);

fs.mkdirSync(path.join(OUT, "components"), { recursive: true });
fs.mkdirSync(path.join(OUT, "concepts"), { recursive: true });

const oneLine = (s) => (s || "").replace(/\s+/g, " ").trim();
const firstSentence = (s) => {
  let t = oneLine(s)
    // strip boilerplate lead-ins so the router column is scannable
    .replace(/^The `?m3e-[a-z-]+`?(,? (and|or) `?m3e-[a-z-]+`?)*\s+(component|element)s?\s+(is|are)\s+(a|an|the)?\s*/i, "")
    .replace(/^The `?m3e-[a-z-]+`?(,? (and|or) `?m3e-[a-z-]+`?)*\s+(component|element)s?\s+/i, "");
  t = t.charAt(0).toUpperCase() + t.slice(1);
  const m = t.match(/^(.*?[.])\s/);
  return (m ? m[1] : t).slice(0, 150);
};

// ---------------------------------------------------------------------------
// Per-component cards
// ---------------------------------------------------------------------------
function table(headers, rows) {
  if (!rows.length) return "";
  const esc = (c) => String(c ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  let out = `| ${headers.join(" | ")} |\n| ${headers.map(() => "---").join(" | ")} |\n`;
  for (const r of rows) out += `| ${r.map(esc).join(" | ")} |\n`;
  return out + "\n";
}

function renderElement(el) {
  let s = `### \`<${el.tag}>\`\n\n`;
  if (el.summary) s += `${oneLine(el.summary)}\n\n`;
  if (el.attributes.length)
    s +=
      "**Attributes**\n\n" +
      table(
        ["Attribute", "Type", "Default", "Description"],
        el.attributes.map((a) => [`\`${a.name}\``, a.type ? `\`${a.type}\`` : "", a.default ?? "", oneLine(a.description)])
      );
  if (el.properties.length)
    s +=
      "**Properties** (JS-only, no attribute)\n\n" +
      table(
        ["Property", "Type", "Description"],
        el.properties.map((p) => [`\`${p.name}\`${p.readonly ? " _(readonly)_" : ""}`, p.type ? `\`${p.type}\`` : "", oneLine(p.description)])
      );
  if (el.slots.length)
    s += "**Slots**\n\n" + table(["Slot", "Description"], el.slots.map((sl) => [`\`${sl.name}\``, oneLine(sl.description)]));
  // Defensive: never render an event row for a nameless event (extract.mjs
  // already drops these, but guard here so stale data can't ship an
  // `undefined`-named row).
  const events = el.events.filter((e) => e.name);
  if (events.length)
    s +=
      "**Events**\n\n" +
      table(["Event", "Type", "Description"], events.map((e) => [`\`${e.name}\``, e.type ? `\`${e.type}\`` : "", oneLine(e.description)]));
  if (el.css.total) {
    s += `**CSS custom properties** — ${el.css.total} total across ${el.css.families} families. Common ones:\n\n`;
    s += table(
      ["Family (`[size]`/`[variant]` = any value)", "Description"],
      el.css.grouped.slice(0, 12).map((f) => [`\`${f.pattern}\``, oneLine(f.description)])
    );
    if (el.css.families > 12) s += `_…${el.css.families - 12} more families. See source for the full list._\n\n`;
  }
  return s;
}

for (const c of components) {
  const src = sources.components.find((x) => x.name === c.name);
  let md = `# ${c.name}\n\n`;
  const fam = familyOf.get(c.name);
  if (fam) {
    const siblings = fam.members.filter((m) => m !== c.name);
    md += `**Family:** [${fam.title}](../concepts/choosing-components.md#${fam.slug})`;
    if (siblings.length) md += ` · See also: ${siblings.map((s) => `[${s}](${s}.md)`).join(", ")}`;
    md += "\n\n";
  }
  md += `${oneLine(c.description)}\n\n`;
  md += "```ts\n" + c.import + "\n```\n\n";
  if (c.elementCount > 1) md += `**Elements:** ${c.elements.map((e) => `\`<${e.tag}>\``).join(", ")}\n\n`;

  // README example snippets — but only those whose markup checks out against the
  // CEM. Some READMEs drift (e.g. <m3e-fab-menu-item>, slot="label"); we never
  // show markup an agent might copy verbatim that the manifest contradicts.
  const cleanExamples = c.examples.filter((ex) => validateMarkup(ex.code, GT, { allowCss: true }).length === 0);
  const withheld = c.examples.length - cleanExamples.length;
  if (cleanExamples.length) {
    md += "## Examples\n\n";
    for (const ex of cleanExamples.slice(0, 4)) md += "```html\n" + ex.code + "\n```\n\n";
  }
  if (withheld) md += `_${withheld} README example(s) withheld — markup drifts from the manifest (see \`data/report.md\`). The validated **Compositions** below are CEM-checked._\n\n`;

  // validated compositions: every tag/attribute/slot/union value checked against
  // the CEM ground truth, no custom CSS. Either authored straight from the API or
  // mined from real projects (provenance noted per example).
  const real = realExamples[c.name];
  if (real && real.length) {
    md += "## Compositions\n\n";
    md += "_Validated against the manifest — every tag, attribute, slot, and union value checked against the CEM ground truth; pure Material composition, no custom CSS._\n\n";
    for (const ex of real) {
      md += `**${ex.title}**\n\n\`\`\`html\n${ex.code}\n\`\`\`\n\n`;
      if (ex.origin === "mined" && ex.source) md += `_Source: ${ex.source}_\n\n`;
    }
  }

  md += "## API\n\n";
  for (const el of c.elements) md += renderElement(el);

  // fidelity footer
  md += `## Source & fidelity\n\n`;
  md += `Generated from \`matraic/m3e\` @ [\`${SHORT}\`](${REPO}/${SHA}/${src.readme || src.sourceFiles[0]}) (MIT).\n`;
  md += `API values above are taken from the build-time **Custom Elements Manifest** (machine truth), not the prose README.\n\n`;
  md += "Source files:\n" + src.sourceFiles.map((f) => `- [\`${f}\`](${REPO}/${SHA}/${f})`).join("\n") + "\n";
  if (c.verification.findings) {
    md += `\n**README drift corrected** (${c.verification.findings} item(s); CEM values used above):\n`;
    md += "_See `data/report.md` for specifics — attributes, defaults, or slots where the README disagreed with or omitted the code._\n";
  }
  fs.writeFileSync(path.join(OUT, "components", `${c.name}.md`), md);
}

// ---------------------------------------------------------------------------
// Concept pages
// ---------------------------------------------------------------------------
const byName = new Map(components.map((c) => [c.name, c]));
for (const con of guidance.concepts) {
  let md = `# ${con.title}\n\n`;
  md += con.markdown + "\n\n";
  md += con.authored
    ? `---\n_Authored for this skill; every example is validated against the CEM (\`matraic/m3e\` @ \`${SHORT}\`)._\n`
    : `---\n_Source: [\`${con.source}\`](${REPO}/${SHA}/${con.source}) · \`matraic/m3e\` @ \`${SHORT}\`._\n`;
  fs.writeFileSync(path.join(OUT, "concepts", `${con.slug}.md`), md);
}

// the selection guide
let choosing = `# Choosing components — which m3e component when\n\n`;
choosing += `Pick the right \`<m3e-*>\` element by intent. Each component links to its verified API card.\n\n`;
for (const f of guidance.families) {
  choosing += `## ${f.title}\n<a id="${f.slug}"></a>\n\n${f.blurb}\n\n`;
  choosing += `**Components:** ${f.members.map((m) => `[${m}](../components/${m}.md)`).join(" · ")}\n\n`;
  choosing += `${f.choosing}\n\n`;
}
choosing += `---\n_Selection guidance synthesized from m3e component descriptions and Material Design 3 principles; component APIs are verified against the CEM (see each card)._\n`;
fs.writeFileSync(path.join(OUT, "concepts", "choosing-components.md"), choosing);

// ---------------------------------------------------------------------------
// SKILL.md — the router (grouped by family)
// ---------------------------------------------------------------------------
const rows = guidance.families
  .map((f) => {
    const items = f.members
      .map((name) => {
        const c = byName.get(name);
        if (!c) return null;
        const tags = c.elementCount > 1 ? `${c.primaryTag} +${c.elementCount - 1}` : c.primaryTag;
        return `| [${name}](components/${name}.md) | \`${tags}\` | ${firstSentence(c.description)} |`;
      })
      .filter(Boolean)
      .join("\n");
    return `### ${f.title}\n\n${f.blurb}\n\n| Component | Tag(s) | What it's for |\n| --- | --- | --- |\n${items}\n`;
  })
  .join("\n");

const skill = `---
name: m3e
description: >-
  Building web UIs with the M3E (Material 3 Expressive) web component library
  (@m3e/web, the matraic/m3e <m3e-*> custom elements). Use when adding, wiring,
  or styling m3e components — buttons, dialogs, lists, navigation, forms, chips,
  etc. — so component tags, attributes, slots, events, and CSS tokens are correct
  and not hallucinated from generic Material Design knowledge.
---

# M3E — Material 3 Expressive web components

Correct, verified usage for the **@m3e/web** custom-element library
(\`matraic/m3e\`). Every component here is a real \`<m3e-*>\` custom element.

## How to use this skill (read only what you need)

1. **Not sure which component?** Read [\`concepts/choosing-components.md\`](concepts/choosing-components.md) — selection guidance by intent.
2. **Know the component?** Open **\`components/<name>.md\`** for its verified API —
   tags, attributes (exact types/defaults), slots, events, CSS properties, examples.
3. Import per component: \`import "@m3e/web/<name>";\` (ESM, tree-shakeable).
4. Cross-cutting concerns (theming, type, motion, framework setup) live in \`concepts/\`.
5. Don't guess attribute names/values from generic Material Design — the card is
   the source of truth. If a card lacks something, follow its source link.

> **Fidelity:** cards are generated from the library's build-time Custom
> Elements Manifest (machine truth) + TypeScript source, pinned at
> \`${SHORT}\`. Where the upstream prose README disagreed with the code, the
> code value is used and the drift is noted on the card.

## Components (${components.length}, by family)

${rows}

## Concepts

- [Choosing components](concepts/choosing-components.md) — which component when
- [Forms & validation](concepts/forms.md) — wiring m3e controls into a native \`<form>\`
- [Color & theming](concepts/color.md) · [Density](concepts/density.md) · [Motion](concepts/motion.md) · [Typography](concepts/typography.md)
- [Getting started](concepts/getting-started.md) · [Installation](concepts/installation.md)
- Frameworks: [React](concepts/frameworks-react.md) · [Vue](concepts/frameworks-vue.md) · [Angular](concepts/frameworks-angular.md)

## Conventions

- All tags are prefixed \`m3e-\`. Many components export several elements
  (e.g. \`chips\` → \`m3e-chip-set\`, \`m3e-filter-chip\`, …) — see the card.
- Boolean attributes follow the HTML convention (present = true).
- Icons use \`m3e-icon\` (see the \`icon\` component card).
- Theming uses Material \`--md-sys-*\` design tokens — see [Color & theming](concepts/color.md).
`;

fs.writeFileSync(path.join(OUT, "SKILL.md"), skill);
console.log(`rendered SKILL.md + ${components.length} component cards -> skills/m3e/`);
