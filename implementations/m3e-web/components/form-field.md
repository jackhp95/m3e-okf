# form-field

**Family:** [Text input & forms](../concepts/choosing-components.md#text-inputs) · See also: [select](select.md), [autocomplete](autocomplete.md), [search](search.md), [textarea-autosize](textarea-autosize.md), [option](option.md)

The `m3e-form-field` component is a semantic, expressive container for form controls that anchors label behavior, subscript messaging, and variant-specific layout. Designed according to Material Design 3 guidelines, it supports two visual variants—`outlined` and `filled`—each with dynamic elevation, shape transitions, and adaptive color theming. The component responds to control state changes (focus, hover, press, disabled, invalid) with smooth motion and semantic clarity, ensuring visual hierarchy and emotional resonance.

```ts
import "@m3e/web/form-field";
```

_1 README example(s) withheld — markup drifts from the manifest (see the extraction report `data/report.md` in the m3e-docs repo that generated this skill). The validated **Compositions** below are CEM-checked._

## Compositions

_Validated against the manifest — every tag, attribute, slot, and union value checked against the CEM ground truth; pure Material composition, no custom CSS._

**Outlined field with prefix, hint and required marker**

```html
<m3e-form-field variant="outlined">
  <label for="site-url">Website</label>
  <m3e-icon slot="prefix" name="public"></m3e-icon>
  <span slot="prefix-text">https://</span>
  <input id="site-url" type="text" name="website" placeholder="yourdomain.com" />
  <span slot="hint">Include the full domain without a path.</span>
</m3e-form-field>
```

**Filled field with always-floating label and error**

```html
<m3e-form-field variant="filled" float-label="always">
  <label for="amount">Amount</label>
  <span slot="prefix-text">$</span>
  <input id="amount" type="text" name="amount" value="0.00" />
  <span slot="suffix-text">USD</span>
  <span slot="error">Enter an amount greater than zero.</span>
</m3e-form-field>
```

**Search field with leading and trailing icons**

```html
<m3e-form-field variant="outlined" hide-required-marker>
  <label for="search">Search docs</label>
  <m3e-icon slot="prefix" name="search"></m3e-icon>
  <input id="search" type="text" name="q" placeholder="Type to search" />
  <m3e-icon slot="suffix" name="close"></m3e-icon>
</m3e-form-field>
```

## API

### `<m3e-form-field>`

A container for form controls that applies Material Design styling and behavior.

**Attributes**

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `float-label` | `'always' \| 'auto'` | "auto" | Specifies whether the label should float always or only when necessary. |
| `hide-required-marker` | `boolean` | false | Whether the required marker should be hidden. |
| `hide-subscript` | `'always' \| 'auto' \| 'never'` | "auto" | Whether subscript content is hidden. |
| `variant` | `'filled' \| 'outlined'` | "outlined" | The appearance variant of the field. |

**Properties** (JS-only, no attribute)

| Property | Type | Description |
| --- | --- | --- |
| `menuAnchor` _(readonly)_ |  | A reference to the element used to anchor dropdown menus. |
| `control` _(readonly)_ |  | A reference to the hosted form field control. |
| `formAssociated` _(readonly)_ |  | Indicates that this custom element participates in form submission, validation, and form state restoration. |

**Slots**

| Slot | Description |
| --- | --- |
| `(default)` | Renders the control of the field. |
| `prefix` | Renders content before the fields's control. |
| `prefix-text` | Renders text before the fields's control. |
| `suffix` | Renders content after the fields's control. |
| `suffix-text` | Renders text after the fields's control. |
| `hint` | Renders hint text in the fields's subscript, when the control is valid. |
| `error` | Renders error text in the fields's subscript, when the control is invalid. |

**CSS custom properties** — 27 total across 27 families. Common ones:

| Family (`[size]`/`[variant]` = any value) | Description |
| --- | --- |
| `--m3e-form-field-font-size` | Font size for the form field container text. |
| `--m3e-form-field-font-weight` | Font weight for the form field container text. |
| `--m3e-form-field-line-height` | Line height for the form field container text. |
| `--m3e-form-field-tracking` | Letter spacing for the form field container text. |
| `--m3e-form-field-label-font-size` | Font size for the floating label. |
| `--m3e-form-field-label-font-weight` | Font weight for the floating label. |
| `--m3e-form-field-label-line-height` | Line height for the floating label. |
| `--m3e-form-field-label-tracking` | Letter spacing for the floating label. |
| `--m3e-form-field-subscript-font-size` | Font size for hint and error text. |
| `--m3e-form-field-subscript-font-weight` | Font weight for hint and error text. |
| `--m3e-form-field-subscript-line-height` | Line height for hint and error text. |
| `--m3e-form-field-subscript-tracking` | Letter spacing for hint and error text. |

_…15 more families. See source for the full list._

## Source & fidelity

Generated from `matraic/m3e` @ [`c89173f`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/form-field/README.md) (MIT). · Material spec: <https://m3.material.io/components/text-fields/overview> (retrieved 2026-07-10).
API values above are taken from the build-time **Custom Elements Manifest** (machine truth), not the prose README.

Source files:
- [`packages/web/src/form-field/FormFieldElement.ts`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/form-field/FormFieldElement.ts)

**README drift corrected** (1 item(s); CEM values used above):
_See the extraction report `data/report.md` in the m3e-docs repo that generated this skill for specifics — attributes, defaults, or slots where the README disagreed with or omitted the code._
