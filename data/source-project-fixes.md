# Source-project m3e usage — drift vs. bugs

_Hand-authored analysis (not auto-generated): a one-time write-up of why certain
mined snippets were rejected when re-validated against the pinned CEM. The pinned
docs track `@m3e/web` **2.5.12**, i.e. SHA `c89173f…` in `data/sources.json`._

## Version situation

| Project | `@m3e/web` resolved | vs. pinned docs (2.5.12) |
| --- | --- | --- |
| `2026.jackhpeterson.com` | 2.5.7 | one minor behind |
| `kinfolk` | 2.5.12 | **identical** |

**Verdict:** the rejected snippets are *bugs in the project markup*, not version drift —
`filled-tonal` exists in neither 2.5.7 nor 2.5.12, and `m3e-progress-indicator` is not a
registered element in either (only `m3e-linear-/circular-progress-indicator`). kinfolk runs
the exact pinned version, so its rejects are unambiguous bugs. The docs are correct as-is.

## Specific fixes (per source file)

### 2026

- **`src/pages/speed-reader.astro`** — _Button with leading icon_ (button)
  - <m3e-button> variant="filled-tonal" not in 'text' | 'filled' | 'outlined' | 'elevated' | 'tonal'
- **`src/pages/consumption.astro`** — _Text button with trailing icon_ (button)
  - slot="trailing" not a slot of <m3e-button>
- **`src/pages/library.astro`** — _Selectable topic chips_ (chips)
  - <m3e-chip> has undocumented attribute "selected"
- **`src/components/ReadingToolbar.astro`** — _Select with options_ (select)
  - <m3e-select> has undocumented attribute "label"
- **`src/pages/library.astro`** — _Linear progress indicator_ (progress-indicator)
  - unknown tag <m3e-progress-indicator>
- **`src/pages/speed-reader.astro`** — _Form field with label and textarea_ (form-field)
  - slot="label" not a slot of <m3e-form-field>
- **`src/pages/consumption.astro`** — _Tonal play button with leading icon_ (button)
  - slot="leading" not a slot of <m3e-button>

### kinfolk

- **`src/pages/recording/index.astro`** — _Large primary FAB with icon and label_ (fab)
  - slot="icon" not a slot of <m3e-fab>
- **`src/pages/slideshow.astro`** — _Small tertiary FAB inside a link_ (fab)
  - <m3e-fab> has undocumented attribute "label"
  - slot="icon" not a slot of <m3e-fab>
- **`src/pages/people/name.astro`** — _Determinate and indeterminate progress indicators_ (progress-indicator)
  - unknown tag <m3e-progress-indicator>
- **`src/pages/photos/[id].astro`** — _Selectable chips for variant switching_ (chips)
  - <m3e-chip> has undocumented attribute "selected"

