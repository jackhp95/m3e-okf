# Typography

## Typography

M3E applies the [Material Design 3 typography system](https://m3.material.io/styles/typography) to encode visual hierarchy, editorial tone, and spatial rhythm across components. The system defines a **30-style type scale**—comprising 15 baseline and 15 emphasized roles.

Typography tokens follow the prefix `--md-sys-typescale-*` for the **standard** typescale and `--md-sys-typescale-emphasized-*` for **emphasized**. Each typescale variant encodes font size, line height, weight, and tracking (or letter spacing).

For example, `body-large` is encoded using `--md-sys-typescale-body-large-font-size`, `--md-sys-typescale-body-large-font-weight`, `--md-sys-typescale-body-large-line-height`, and `--md-sys-typescale-body-large-tracking`.

M3E components support the full semantic range of the Material 3 type system, including **standard** and **emphasized** variants of: `display-large`, `display-medium`, `display-small`, `headline-large`, `headline-medium`, `headline-small`, `title-large`, `title-medium`, `title-small`, `body-large`, `body-medium`, `body-small`, `label-large`, `label-medium`, and `label-small`.

Each role is mapped to a tokenized style and applied contextually—for example, `label-large` for buttons, `body-large` for list items, and `body-small` for form-field hints.

---
_Source: [`docs/styles/typography.html`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/docs/styles/typography.html) · `matraic/m3e` @ `c89173f`._
