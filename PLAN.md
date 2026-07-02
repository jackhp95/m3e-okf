# Plan: m3e component context for agents

## Goal

Give coding agents correct, token-efficient context for building UIs with the
**M3E (Material 3 Expressive) web component library** — so they pick the right
component and use its real API, instead of hallucinating from generic Material
Design training data or referencing the wrong component library.

## Decisions (locked)

- **Deliverable:** a Claude Code **Skill** (progressive disclosure = the "memory
  palace": thin index front-door, per-component files loaded on demand).
- **Scope:** all `@m3e/web` components **plus** a Material Design "when to use"
  guidance layer.
- **Fidelity:** the generated **CEM manifest** and **TypeScript source** are the
  ground truth. READMEs are valuable prose but every API claim is verified
  against the CEM/TS; mismatches are flagged, not silently trusted.

## Sources

| Source | What it gives | Trust |
| --- | --- | --- |
| `packages/web/dist/custom-elements.json` (generated) | Machine API: tags, attributes, properties, events, slots, CSS props/parts, types | **Ground truth** |
| `packages/web/src/**/*.ts` (incl. enum types, JSDoc) | Exact union types, defaults, behavior notes | **Ground truth** |
| `packages/web/src/<c>/README.md` (57) | Prose description, examples, "elements", curated API tables | Verify vs CEM/TS |
| `docs/components/*.html` | Live demo markup / richer examples | Examples only |
| `m3.material.io` guideline pages (curated set) | *When* to use a component, anatomy, do/don't | Design layer |

Upstream pinned at commit `c89173f392134df452422ffad051d5a5c90934b6`
(matraic/m3e, MIT). Never scrape the rendered SPA site; pull from the repo.

## Architecture

```
scripts/
  fetch.mjs        # clone/pull m3e at pinned SHA into .cache/; npm ci in packages/web
  build-cem.mjs    # run their cem.config -> .cache/.../dist/custom-elements.json
  extract.mjs      # CEM + TS + README -> data/components.json (+ verify, flag drift)
  guidance.mjs     # fetch curated m3.material.io pages -> data/guidance.json
  build-skill.mjs  # data/*.json -> skills/m3e/** (index + cards + concepts)
data/
  components.json  # one record per component; the asset we own
  guidance.json    # component -> when-to-use / anatomy / do-dont
  sources.json     # provenance: upstream path + SHA per record + verification status
skills/m3e/
  SKILL.md         # the lobby: when-to-use index + navigation rules
  components/<name>.md
  concepts/{theming,color,density,motion,typography,frameworks,icons}.md
```

Two stages on purpose: **scrape -> JSON (we own)**, then **JSON -> skill**. The
JSON intermediate lets us re-render formats, diff for staleness, and later emit
an MCP server or search index without re-scraping.

### `components.json` record shape (draft)

```jsonc
{
  "name": "button",
  "tag": "m3e-button",
  "summary": "<one line for the index router>",
  "description": "<from README, verified>",
  "import": "import \"@m3e/web/button\";",
  "attributes": [{ "name": "variant", "type": "\"filled\"|...", "default": "\"text\"",
                   "description": "...", "verified": "cem|ts|README-only|MISMATCH" }],
  "slots": [...], "events": [...], "cssProperties": [...], "cssParts": [...],
  "examples": [{ "code": "<m3e-button variant=\"tonal\">...", "note": "..." }],
  "source": { "readme": "packages/web/src/button/README.md", "sha": "c89173f" }
}
```

## Verification rule

For each component, build the field set from CEM (machine truth), enrich type
unions/defaults from the TS source, then reconcile the README table:
- present in both & matching -> `verified: "cem"`
- in README, absent from CEM -> `verified: "README-only"` (kept, flagged)
- conflicting type/default -> `verified: "MISMATCH"` (kept, surfaced in build report)

Build emits `data/report.md` listing every MISMATCH / README-only field so we
never silently ship a wrong API claim.

## Phases

> **On the counts:** "57" below is the number of upstream
> `packages/web/src/<c>/README.md` source files. The distilled skill covers
> **53 components / 110 elements** (some source dirs collapse into one component
> record, some expose several elements). README.md and SKILL.md report the final
> 53/110; the "57" here is the raw upstream input count.

0. **Scaffold + pin** — repo, dirs, plan. *(done)*
1. **Fetch + CEM** — clone at SHA, generate `custom-elements.json`. Validate the
   manifest covers all 57 components.
2. **Extract (POC on 3)** — button, dialog, autocomplete: prove the CEM+TS+README
   merge + verification on representative simple/medium/complex components.
3. **Extract (all 57)** — scale, produce `components.json` + `report.md`.
4. **Guidance layer** — curated `m3.material.io` fetch -> `guidance.json`; map
   Material concepts -> m3e tags.
5. **Build skill** — render SKILL.md index + per-component cards + concept pages.
6. **Validate** — spot-check cards against source; dry-run the skill on a sample
   "build me X" task; document regeneration in README.

## Non-goals

- No RAG/vector index (57 components route better via a hand-written index, and
  determinism preserves auditability / "see sources").
- No crawling the full Material site (curated pages only).
- No forking m3e; we distill and cite.
