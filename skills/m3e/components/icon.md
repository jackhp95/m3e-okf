# icon

**Family:** [Content & media](../concepts/choosing-components.md#content-media) · See also: [avatar](avatar.md), [heading](heading.md), [shape](shape.md)

The `m3e-icon` component makes it easy to use Material Symbols in your application. It supports outlined, rounded, and sharp variants, as well as variable font features like fill, weight, grade, and optical size. For more information, see the [Material Symbol Guide](https://developers.google.com/fonts/docs/material_symbols) and [Material Symbol Library](https://fonts.google.com/icons). The Material Symbols font is the easiest way to incorporate Material Symbols into your application. Using the [Fonts CSS API](https://developers.google.com/fonts/docs/css2#forming_api_urls), you can use variable fonts to optimize icon usage within your application. See [Can I Use's Variable Fonts](https://caniuse.com/variable-fonts) to determine whether your user's browser support variable fonts.

```ts
import "@m3e/web/icon";
```

## Examples

```html
<m3e-icon name="home"></m3e-icon>
```

```html
<link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0"
  rel="stylesheet"
/>
```

## API

### `<m3e-icon>`

A small symbol used to easily identify an action or category.

**Attributes**

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `filled` | `boolean` | false | Whether the icon is filled. |
| `grade` | `'medium' \| 'low' \| 'high'` | "medium" | The grade of the icon. |
| `optical-size` | `number` | 24 | A value from 20 to 48 indicating the optical size of the icon. |
| `name` | `string` | "" | The name of the icon. |
| `variant` | `'outlined' \| 'rounded' \| 'sharp'` | "outlined" | The appearance variant of the icon. |
| `weight` | `100 \| 200 \| 300 \| 400 \| 500 \| 600 \| 700` | 400 | A value from 100 to 700 indicating the weight of the icon. |

## Source & fidelity

Generated from `matraic/m3e` @ [`c89173f`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/icon/README.md) (MIT).
API values above are taken from the build-time **Custom Elements Manifest** (machine truth), not the prose README.

Source files:
- [`packages/web/src/icon/IconElement.ts`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/icon/IconElement.ts)

**README drift corrected** (1 item(s); CEM values used above):
_See `data/report.md` for specifics — defaults/attributes where the README disagreed with or omitted the code._
