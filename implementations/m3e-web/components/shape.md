# shape

**Family:** [Content & media](../concepts/choosing-components.md#content-media) · See also: [avatar](avatar.md), [icon](icon.md), [heading](heading.md)

The `m3e-shape` component allows you to use abstract shapes thoughtfully to add emphasis and decorative flair, including built-in shape morphing. All shapes are sourced from the Material Shape library: `4-leaf-clover`, `4-sided-cookie`, `6-sided-cookie`, `7-sided-cookie`, `8-leaf-clover`, `9-sided-cookie`, `12-sided-cookie`, `arch`, `arrow`, `boom`, `bun`, `burst`, `circle`, `diamond`, `fan`, `flower`, `gem`, `ghost-ish`, `heart`, `hexagon`, `oval`, `pentagon`, `pill`, `pixel-circle`, `pixel-triangle`, `puffy`, `puffy-diamond`, `semicircle`, `slanted`, `soft-boom`, `soft-burst`, `square`, `sunny`, `triangle`, and `very-sunny`. Refer to the Material Shape library for visual references and details.

```ts
import "@m3e/web/shape";
```

## Examples

```html
<m3e-shape name="sunny"></m3e-shape>
```

## Compositions

_Validated against the manifest — every tag, attribute, slot, and union value checked against the CEM ground truth; pure Material composition, no custom CSS._

**Decorative sunny shape with icon**

```html
<m3e-shape name="sunny">
  <m3e-icon name="star"></m3e-icon>
</m3e-shape>
```

**Row of expressive decorative shapes**

```html
<div>
  <m3e-shape name="4-leaf-clover"></m3e-shape>
  <m3e-shape name="heart"></m3e-shape>
  <m3e-shape name="diamond"></m3e-shape>
  <m3e-shape name="burst"></m3e-shape>
</div>
```

## API

### `<m3e-shape>`

A shape used to add emphasis and decorative flair.

**Attributes**

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `'square' \| '4-leaf-clover' \| '4-sided-cookie' \| '6-sided-cookie' \| '7-sided-cookie' \| '8-leaf-clover' \| '9-sided-cookie' \| '12-sided-cookie' \| 'arch' \| 'arrow' \| 'boom' \| 'bun' \| 'burst' \| 'circle' \| 'diamond' \| 'fan' \| 'flower' \| 'gem' \| 'ghost-ish' \| 'heart' \| 'hexagon' \| 'oval' \| 'pentagon' \| 'pill' \| 'pixel-circle' \| 'pixel-triangle' \| 'puffy' \| 'puffy-diamond' \| 'semicircle' \| 'slanted' \| 'soft-boom' \| 'soft-burst' \| 'sunny' \| 'triangle' \| 'very-sunny' \| null` | null | The name of the shape. |

**Slots**

| Slot | Description |
| --- | --- |
| `(default)` | Renders the clipped content of the shape. |

**CSS custom properties** — 3 total across 3 families. Common ones:

| Family (`[size]`/`[variant]` = any value) | Description |
| --- | --- |
| `--m3e-shape-size` | Default size of the shape. |
| `--m3e-shape-container-color` | Container (background) color of the shape. |
| `--m3e-shape-transition` | Transition used to morph between shapes. |

## Source & fidelity

Generated from `matraic/m3e` @ [`c89173f`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/shape/README.md) (MIT). · No direct Material-spec page (library extension).
API values above are taken from the build-time **Custom Elements Manifest** (machine truth), not the prose README.

Source files:
- [`packages/web/src/shape/ShapeElement.ts`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/shape/ShapeElement.ts)
