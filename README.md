# m3e-docs

Generates a Claude Code **skill** that gives agents correct, verified usage of
the [M3E (Material 3 Expressive)](https://github.com/matraic/m3e) web component
library (`@m3e/web`) — so they use real `<m3e-*>` tags, attributes, slots,
events, and CSS tokens instead of hallucinating from generic Material Design
knowledge.

See [`PLAN.md`](PLAN.md) for the design rationale and decisions.

## Pipeline

```
scripts/extract.mjs        CEM + TS + README     ->  data/components.json, sources.json, report.md
scripts/guidance.mjs       m3e docs + taxonomy   ->  data/guidance.json (concepts + families)
scripts/build-examples.mjs mined + authored      ->  data/examples.json (validated compositions)
scripts/build-skill.mjs    data/*.json           ->  skills/m3e/ (SKILL.md, components/*, concepts/*)
scripts/check-skill.mjs    skills/m3e/**         ->  guard: every html block valid vs the CEM
```

Run in that order. `build-examples.mjs` validates candidate compositions from
`data/examples_raw.json` (mined from real projects) and `data/authored_candidates.json`
(hand-authored from the API) against the manifest — rejecting any with custom CSS
or any tag/attribute/slot/enum value not in the ground truth — and keeps only the
clean, correct ones (tagged `origin: mined|authored`). `build-skill.mjs` reads all
the data files and additionally withholds any README example snippet whose markup
drifts from the CEM. The shared validator lives in `scripts/lib/validate-markup.mjs`.

Ground truth is the build-time **Custom Elements Manifest** + TypeScript source.
READMEs supply prose/examples but every API claim — attributes, defaults, slots,
and the markup in README examples — is verified against the CEM; drift is recorded
in `data/report.md` (with kinds like `DEFAULT-MISMATCH`, `UNDOCUMENTED`,
`EXAMPLE-DRIFT`) and the code value wins.

## Regenerate

```bash
# 1. fetch upstream at the pinned SHA and generate the manifest
cd .cache && git clone --depth 1 https://github.com/matraic/m3e.git
cd m3e && git fetch --depth 1 origin <SHA> && git checkout <SHA>
npm install --no-audit --no-fund
cd packages/web && npm run cem          # -> dist/custom-elements.json

# 2. extract + build (from repo root)
node scripts/extract.mjs                 # all components (or pass dir names for a subset)
node scripts/guidance.mjs                # concept pages + component taxonomy
node scripts/build-examples.mjs          # validate mined + authored compositions
node scripts/build-skill.mjs
node scripts/check-skill.mjs             # guard: assert no card/concept ships drifted markup
```

The pinned SHA lives in `data/sources.json`. To bump the library version, re-run
step 1 with a new SHA, then `node scripts/extract.mjs` and review
`data/report.md` for newly introduced drift before rebuilding the skill.

Check whether upstream has moved past the pinned SHA at any time:

```bash
node scripts/check-staleness.mjs   # exit 0 = current, 1 = stale, 2 = unreachable
```

## Tests

The shared CEM-validator (`scripts/lib/validate-markup.mjs`) is load-bearing —
it gates compositions, audits README examples, and guards the rendered skill.
It has unit tests against a self-contained ground truth:

```bash
node --test scripts/lib/*.test.mjs
```

CI (`.github/workflows/ci.yml`) runs these tests on every push/PR, rebuilds the
downstream artifacts from committed data to assert nothing is stale, and runs the
`check-skill` guard. It does **not** re-fetch upstream m3e — version drift is a
separate, SHA-pinned step (`check-staleness.mjs`).

## Install

The skill is the `skills/m3e/` directory. Symlink it into your personal skills
so it stays live across regenerations (or copy it for a per-project install):

```bash
ln -s "$(pwd)/skills/m3e" ~/.claude/skills/m3e         # personal (all projects)
# or:  ln -s "$(pwd)/skills/m3e" /path/to/project/.claude/skills/m3e
```

## Layout

| Path | What |
| --- | --- |
| `.cache/m3e/` | upstream checkout (gitignored) |
| `data/components.json` | the asset we own: one record per component, full verified API |
| `data/sources.json` | provenance: pinned SHA + upstream file paths per component |
| `data/report.md` | verification report: README-vs-code drift (attrs, defaults, slots, examples) |
| `data/examples_raw.json` | mined candidate snippets (curated input to build-examples) |
| `data/authored_candidates.json` | hand-authored candidate compositions (input to build-examples) |
| `data/examples.json` | validated compositions (mined + authored), keyed by component |
| `scripts/lib/validate-markup.mjs` | shared CEM-validator used by build-examples, extract, check-skill |
| `skills/m3e/SKILL.md` | the router/index agents read first |
| `skills/m3e/components/*.md` | per-component cards (loaded on demand) |
| `skills/m3e/concepts/*.md` | cross-cutting: theming, color, motion, etc. (WIP) |

## Status

- [x] Fetch + CEM generation
- [x] Extract + verify all 53 components (110 elements)
- [x] Render SKILL.md index + per-component cards
- [x] "When to use" guidance layer: 9 concept pages + selection guide + card cross-links
- [x] Type aliases resolved from TS source (no opaque `FormSubmitterType`/`LinkTarget`)
- [x] Validated compositions for every component (106 across 53: 89 authored + 17 mined)
- [x] README example markup verified against the CEM; drifting snippets withheld from cards
- [x] Dogfooded: agents built 4 realistic UIs (settings, media bar, signup form, dashboard shell) from the skill alone — output markup spanning ~20 components validated against the CEM with **0 hallucinations**
- [x] Staleness check (`scripts/check-staleness.mjs`) + skill guard (`scripts/check-skill.mjs`)
- [x] Installed to `~/.claude/skills/m3e` (symlink)

Upstream `matraic/m3e` is MIT-licensed. "Material Design" / "Material 3" are
trademarks of Google LLC; this project is not affiliated with Google.
