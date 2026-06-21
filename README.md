# m3e-docs

Generates a Claude Code **skill** that gives agents correct, verified usage of
the [M3E (Material 3 Expressive)](https://github.com/matraic/m3e) web component
library (`@m3e/web`) — so they use real `<m3e-*>` tags, attributes, slots,
events, and CSS tokens instead of hallucinating from generic Material Design
knowledge.

See [`PLAN.md`](PLAN.md) for the design rationale and decisions.

## Pipeline

```
scripts/extract.mjs      CEM + TS + README   ->  data/components.json, sources.json, report.md
scripts/guidance.mjs     m3e docs + taxonomy ->  data/guidance.json (concepts + families)
scripts/build-skill.mjs  data/*.json         ->  skills/m3e/ (SKILL.md, components/*, concepts/*)
```

Run in that order: `guidance.mjs` reads `sources.json`; `build-skill.mjs` reads all three.

Ground truth is the build-time **Custom Elements Manifest** + TypeScript source.
READMEs supply prose/examples but every API claim is verified against the CEM;
drift is recorded in `data/report.md` and the code value wins.

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
node scripts/build-skill.mjs
```

The pinned SHA lives in `data/sources.json`. To bump the library version, re-run
step 1 with a new SHA, then `node scripts/extract.mjs` and review
`data/report.md` for newly introduced drift before rebuilding the skill.

## Layout

| Path | What |
| --- | --- |
| `.cache/m3e/` | upstream checkout (gitignored) |
| `data/components.json` | the asset we own: one record per component, full verified API |
| `data/sources.json` | provenance: pinned SHA + upstream file paths per component |
| `data/report.md` | verification report: README-vs-code drift |
| `skills/m3e/SKILL.md` | the router/index agents read first |
| `skills/m3e/components/*.md` | per-component cards (loaded on demand) |
| `skills/m3e/concepts/*.md` | cross-cutting: theming, color, motion, etc. (WIP) |

## Status

- [x] Fetch + CEM generation
- [x] Extract + verify all 53 components (110 elements)
- [x] Render SKILL.md index + per-component cards
- [x] "When to use" guidance layer: 9 concept pages + selection guide + card cross-links
- [ ] Install/validate the skill against a sample build task

Upstream `matraic/m3e` is MIT-licensed. "Material Design" / "Material 3" are
trademarks of Google LLC; this project is not affiliated with Google.
