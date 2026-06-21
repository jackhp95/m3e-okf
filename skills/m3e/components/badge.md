# badge

**Family:** [Feedback & status](../concepts/choosing-components.md#feedback) · See also: [snackbar](snackbar.md), [tooltip](tooltip.md), [loading-indicator](loading-indicator.md), [progress-indicator](progress-indicator.md), [skeleton](skeleton.md)

The `m3e-badge` component is a compact visual indicator used to label content. Designed according to Material Design 3 guidelines, it can display counts, presence, or semantic emphasis, and is attachable to icons, buttons, or other components. Badges support dynamic sizing, color, and shape, ensuring clarity and accessibility while maintaining a consistent, expressive appearance across surfaces.

```ts
import "@m3e/web/badge";
```

## Examples

```html
<m3e-button id="button">Button</m3e-button><m3e-badge for="button">10</m3e-badge>
```

## API

### `<m3e-badge>`

A visual indicator used to label content.

**Attributes**

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `'small' \| 'medium' \| 'large'` | "medium" | The size of the badge. |
| `position` | `'above' \| 'below' \| 'above-after' \| 'above-before' \| 'below-before' \| 'below-after' \| 'before' \| 'after'` | "above-after" | The position of the badge, when attached to another element. |
| `for` | `string \| null` | null | The identifier of the interactive control to which this element is attached. |

**Properties** (JS-only, no attribute)

| Property | Type | Description |
| --- | --- | --- |
| `control` _(readonly)_ |  | The interactive element to which this element is attached. |

**Slots**

| Slot | Description |
| --- | --- |
| `(default)` | Renders the content of the badge. |

**CSS custom properties** — 14 total across 8 families. Common ones:

| Family (`[size]`/`[variant]` = any value) | Description |
| --- | --- |
| `--m3e-badge-shape` | Corner radius of the badge. |
| `--m3e-badge-color` | Foreground color of badge content. |
| `--m3e-badge-container-color` | Background color of the badge. |
| `--m3e-badge-[size]-size` | Fixed dimensions for small badge. Used for minimal indicators (e.g. dot). |
| `--m3e-badge-[size]-font-size` | Font size for medium badge label. |
| `--m3e-badge-[size]-font-weight` | Font weight for medium badge label. |
| `--m3e-badge-[size]-line-height` | Line height for medium badge label. |
| `--m3e-badge-[size]-tracking` | Letter spacing for medium badge label. |

## Source & fidelity

Generated from `matraic/m3e` @ [`c89173f`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/badge/README.md) (MIT).
API values above are taken from the build-time **Custom Elements Manifest** (machine truth), not the prose README.

Source files:
- [`packages/web/src/badge/BadgeElement.ts`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/badge/BadgeElement.ts)

**README drift corrected** (1 item(s); CEM values used above):
_See `data/report.md` for specifics — defaults/attributes where the README disagreed with or omitted the code._
