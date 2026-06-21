# form-field

**Family:** [Text input & forms](../concepts/choosing-components.md#text-inputs) · See also: [select](select.md), [autocomplete](autocomplete.md), [search](search.md), [textarea-autosize](textarea-autosize.md), [option](option.md)

The `m3e-form-field` component is a semantic, expressive container for form controls that anchors label behavior, subscript messaging, and variant-specific layout. Designed according to Material Design 3 guidelines, it supports two visual variants—`outlined` and `filled`—each with dynamic elevation, shape transitions, and adaptive color theming. The component responds to control state changes (focus, hover, press, disabled, invalid) with smooth motion and semantic clarity, ensuring visual hierarchy and emotional resonance.

```ts
import "@m3e/web/form-field";
```

## Examples

```html
<m3e-form-field>
  <label slot="label" for="field">Text field</label>
  <input id="field" />
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

Generated from `matraic/m3e` @ [`c89173f`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/form-field/README.md) (MIT).
API values above are taken from the build-time **Custom Elements Manifest** (machine truth), not the prose README.

Source files:
- [`packages/web/src/form-field/FormFieldElement.ts`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/form-field/FormFieldElement.ts)
