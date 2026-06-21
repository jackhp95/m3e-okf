# loading-indicator

**Family:** [Feedback & status](../concepts/choosing-components.md#feedback) · See also: [badge](badge.md), [snackbar](snackbar.md), [tooltip](tooltip.md), [progress-indicator](progress-indicator.md), [skeleton](skeleton.md)

The `m3e-loading-indicator` component uses animation to grab attention, mitigate perceived latency, and indicate that an activity is in progress. Use the `variant` attribute to switch between `uncontained` (default) and `contained` appearances for contrast and context.

```ts
import "@m3e/web/loading-indicator";
```

## Examples

```html
<m3e-loading-indicator></m3e-loading-indicator>
```

## API

### `<m3e-loading-indicator>`

Shows indeterminate progress for a short wait time.

**Attributes**

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'uncontained' \| 'contained'` | "uncontained" | The appearance variant of the indicator. |

**CSS custom properties** — 6 total across 6 families. Common ones:

| Family (`[size]`/`[variant]` = any value) | Description |
| --- | --- |
| `--m3e-loading-indicator-active-indicator-color` | Uncontained active indicator color. |
| `--m3e-loading-indicator-contained-active-indicator-color` | Contained active indicator color. |
| `--m3e-loading-indicator-contained-container-color` | Contained container (background) color. |
| `--m3e-loading-indicator-active-indicator-size` | Size of the active indicator. |
| `--m3e-loading-indicator-container-shape` | Container shape. |
| `--m3e-loading-indicator-container-size` | Container size. |

## Source & fidelity

Generated from `matraic/m3e` @ [`c89173f`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/loading-indicator/README.md) (MIT).
API values above are taken from the build-time **Custom Elements Manifest** (machine truth), not the prose README.

Source files:
- [`packages/web/src/loading-indicator/LoadingIndicatorElement.ts`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/loading-indicator/LoadingIndicatorElement.ts)
