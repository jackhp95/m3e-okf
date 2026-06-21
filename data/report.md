# Extraction report

Upstream `matraic/m3e` @ `c89173f392134df452422ffad051d5a5c90934b6`

Components: 53  ·  Elements: 110

## Verification findings (README vs CEM ground truth)

- **DEFAULT-UNDOCUMENTED**: 37
- **UNDOCUMENTED**: 37
- **DEFAULT-MISMATCH**: 10
- **EXAMPLE-DRIFT**: 9

> UNDOCUMENTED = real attribute (in CEM) missing from README. README-only = README lists an
> attribute the CEM doesn't expose (likely stale/typo). DEFAULT-MISMATCH = default disagrees.
> EXAMPLE-DRIFT = a README example uses a tag/attribute/slot the CEM doesn't expose (markup an
> agent might copy verbatim). These snippets are withheld from the generated cards.

### autocomplete
- `panel-class` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `results-label` — **DEFAULT-UNDOCUMENTED** (CEM=(count) => `${count} options`, README blank)
- `for` — **UNDOCUMENTED** (in CEM, not in README)
- `slot="label" not a slot of <m3e-form-field>` — **EXAMPLE-DRIFT** (in README example)

### badge
- `for` — **UNDOCUMENTED** (in CEM, not in README)

### bottom-sheet
- `detent` — **DEFAULT-MISMATCH** (README=0 CEM=undefined)
- `handle-label` — **DEFAULT-UNDOCUMENTED** (CEM="Drag handle", README blank)
- `hide-friction` — **DEFAULT-UNDOCUMENTED** (CEM=0.5, README blank)
- `for` — **UNDOCUMENTED** (in CEM, not in README)

### button
- `href` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `target` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `rel` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)

### calendar
- `today` — **UNDOCUMENTED** (in CEM, not in README)
- `active-date` — **UNDOCUMENTED** (in CEM, not in README)

### card
- `href` — **UNDOCUMENTED** (in CEM, not in README)
- `target` — **UNDOCUMENTED** (in CEM, not in README)
- `rel` — **UNDOCUMENTED** (in CEM, not in README)
- `download` — **UNDOCUMENTED** (in CEM, not in README)
- `name` — **UNDOCUMENTED** (in CEM, not in README)
- `value` — **UNDOCUMENTED** (in CEM, not in README)
- `type` — **UNDOCUMENTED** (in CEM, not in README)
- `disabled-interactive` — **UNDOCUMENTED** (in CEM, not in README)
- `disabled` — **UNDOCUMENTED** (in CEM, not in README)

### chips
- `href` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `rel` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `target` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `type` — **DEFAULT-UNDOCUMENTED** (CEM="button", README blank)
- `href` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `rel` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `target` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `type` — **DEFAULT-UNDOCUMENTED** (CEM="button", README blank)
- `slot="label" not a slot of <m3e-form-field>` — **EXAMPLE-DRIFT** (in README example)

### datepicker
- `for` — **UNDOCUMENTED** (in CEM, not in README)

### dialog
- `return-value` — **UNDOCUMENTED** (in CEM, not in README)
- `for` — **UNDOCUMENTED** (in CEM, not in README)

### drawer-container
- `for` — **UNDOCUMENTED** (in CEM, not in README)

### expansion-panel
- `toggle-direction` — **DEFAULT-MISMATCH** (README="end" CEM="vertical")
- `toggle-position` — **DEFAULT-MISMATCH** (README="end" CEM="after")

### fab
- `href` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `target` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `rel` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)

### fab-menu
- `href` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `rel` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `target` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `for` — **UNDOCUMENTED** (in CEM, not in README)
- `unknown tag <m3e-fab-menu-item>` — **EXAMPLE-DRIFT** (in README example)

### form-field
- `slot="label" not a slot of <m3e-form-field>` — **EXAMPLE-DRIFT** (in README example)

### icon
- `name` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)

### icon-button
- `href` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `target` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `rel` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)

### list
- `href` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `rel` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `target` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `value` — **UNDOCUMENTED** (in CEM, not in README)
- `name` — **UNDOCUMENTED** (in CEM, not in README)

### menu
- `href` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `rel` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `target` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `for` — **UNDOCUMENTED** (in CEM, not in README)
- `submenu` — **UNDOCUMENTED** (in CEM, not in README)

### nav-bar
- `href` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `rel` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `target` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)

### nav-rail
- `mode` — **DEFAULT-MISMATCH** (README=auto CEM="compact")
- `for` — **UNDOCUMENTED** (in CEM, not in README)

### option
- `term` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `state` — **UNDOCUMENTED** (in CEM, not in README)
- `scroll-strategy` — **UNDOCUMENTED** (in CEM, not in README)
- `fit-anchor-width` — **UNDOCUMENTED** (in CEM, not in README)
- `anchor-offset` — **UNDOCUMENTED** (in CEM, not in README)

### progress-indicator
- `variant` — **UNDOCUMENTED** (in CEM, not in README)

### radio-group
- `value` — **DEFAULT-MISMATCH** (README="" CEM="on")
- `aria-invalid` — **UNDOCUMENTED** (in CEM, not in README)

### search
- `hide-search-icon` — **UNDOCUMENTED** (in CEM, not in README)

### select
- `panel-class` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)
- `slot="label" not a slot of <m3e-form-field>` — **EXAMPLE-DRIFT** (in README example)

### skeleton
- `animation` — **DEFAULT-MISMATCH** (README="none" CEM="wave")

### snackbar
- `action` — **DEFAULT-UNDOCUMENTED** (CEM="", README blank)

### split-pane
- `valueFormatter` — **UNDOCUMENTED** (in CEM, not in README)
- `name` — **UNDOCUMENTED** (in CEM, not in README)
- `disabled` — **UNDOCUMENTED** (in CEM, not in README)

### stepper
- `invalid` — **UNDOCUMENTED** (in CEM, not in README)
- `slot="label" not a slot of <m3e-form-field>` — **EXAMPLE-DRIFT** (in README example)
- `slot="actions" not a slot of <m3e-step-panel>` — **EXAMPLE-DRIFT** (in README example)
- `unknown tag <m3e-stepper-next>` — **EXAMPLE-DRIFT** (in README example)

### switch
- `icons` — **DEFAULT-MISMATCH** (README=false CEM="none")

### textarea-autosize
- `slot="label" not a slot of <m3e-form-field>` — **EXAMPLE-DRIFT** (in README example)

### theme
- `variant` — **DEFAULT-MISMATCH** (README="content" CEM="neutral")
- `variant` — **DEFAULT-MISMATCH** (README="content" CEM="neutral")

### tooltip
- `position` — **DEFAULT-MISMATCH** (README="below-after" CEM="below")
- `disable-restore-focus` — **UNDOCUMENTED** (in CEM, not in README)
- `touch-gestures` — **UNDOCUMENTED** (in CEM, not in README)

