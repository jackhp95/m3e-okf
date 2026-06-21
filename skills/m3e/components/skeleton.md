# skeleton

**Family:** [Feedback & status](../concepts/choosing-components.md#feedback) · See also: [badge](badge.md), [snackbar](snackbar.md), [tooltip](tooltip.md), [loading-indicator](loading-indicator.md), [progress-indicator](progress-indicator.md)

The `m3e-skeleton` component provides a loading placeholder surface with flexible shape variants and motion-based animations that communicate loading state while preserving layout stability. It mimics the layout of content while it's still loading, ensuring a smooth user experience during data fetching or rendering delays. The component supports different animation effects (`pulse`, `wave`, `none`) and shape variants (`circular`, `rounded`, `square`, `auto`) to adapt to various content types. When the content is loaded, the skeleton fades out with a smooth transition.

```ts
import "@m3e/web/skeleton";
```

## Examples

```html
<m3e-skeleton>
  <m3e-card></m3e-card>
</m3e-skeleton>
```

## API

### `<m3e-skeleton>`

A visual placeholder that mimics the layout of content while it's still loading.

**Attributes**

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `animation` | `'none' \| 'pulse' \| 'wave'` | "wave" | The animation effect of the skeleton. |
| `shape` | `'auto' \| 'rounded' \| 'square' \| 'circular'` | "auto" | The shape of the skeleton. |
| `loaded` | `boolean` | false | Whether the content of the skeleton has been loaded. |

**Slots**

| Slot | Description |
| --- | --- |
| `(default)` | Renders the content to be mimicked by the skeleton. |

**CSS custom properties** — 9 total across 9 families. Common ones:

| Family (`[size]`/`[variant]` = any value) | Description |
| --- | --- |
| `--m3e-skeleton-color` | Base fill color for the skeleton surface. |
| `--m3e-skeleton-tint-color` | Tint fill color for the skeleton surface. |
| `--m3e-skeleton-tint-opacity` | Tint Opacity applied when the skeleton animation is not pulsating. |
| `--m3e-skeleton-accent-color` | Accent color used in wave animation. |
| `--m3e-skeleton-accent-opacity` | Opacity of the accent effect in animations. |
| `--m3e-skeleton-rounded-shape` | Corner radius for the rounded skeleton shape. |
| `--m3e-skeleton-circular-shape` | Corner radius for the circular skeleton shape. |
| `--m3e-skeleton-square-shape` | Corner radius for the square skeleton shape. |
| `--m3e-skeleton-shape` | Corner radius for the skeleton shape. |

## Source & fidelity

Generated from `matraic/m3e` @ [`c89173f`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/skeleton/README.md) (MIT).
API values above are taken from the build-time **Custom Elements Manifest** (machine truth), not the prose README.

Source files:
- [`packages/web/src/skeleton/SkeletonElement.ts`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/skeleton/SkeletonElement.ts)

**README drift corrected** (1 item(s); CEM values used above):
_See `data/report.md` for specifics — defaults/attributes where the README disagreed with or omitted the code._
