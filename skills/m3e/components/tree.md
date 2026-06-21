# tree

**Family:** [Data & collections](../concepts/choosing-components.md#data-display) · See also: [list](list.md), [calendar](calendar.md), [datepicker](datepicker.md)

The `m3e-tree` component presents hierarchical data in a structure that users can navigate, with nested levels that open and collapse as needed.

```ts
import "@m3e/web/tree";
```

**Elements:** `<m3e-tree-item>`, `<m3e-tree>`

## Examples

```html
<m3e-tree>
  <m3e-tree-item open>
    <span slot="label">Getting Started</span>
    <m3e-tree-item>
      <span slot="label">Overview</span>
    </m3e-tree-item>
    <m3e-tree-item>
      <span slot="label">Installation</span>
    </m3e-tree-item>
  </m3e-tree-item>
  <m3e-tree-item>
    <span slot="label">Components</span>
    <m3e-tree-item>
      <span slot="label">Button</span>
    </m3e-tree-item>
    <m3e-tree-item>
      <span slot="label">Card</span>
    </m3e-tree-item>
  </m3e-tree-item>
</m3e-tree>
```

```html
<m3e-tree multi cascade>
  <m3e-tree-item>
    <span slot="label">Fruits</span>
    <m3e-tree-item>
      <span slot="label">Apples</span>
    </m3e-tree-item>
    <m3e-tree-item>
      <span slot="label">Oranges</span>
    </m3e-tree-item>
    <m3e-tree-item>
      <span slot="label">Bananas</span>
    </m3e-tree-item>
  </m3e-tree-item>
  <m3e-tree-item>
    <span slot="label">Vegetables</span>
    <m3e-tree-item>
      <span slot="label">Carrots</span>
    </m3e-tree-item>
    <m3e-tree-item>
      <span slot="label">Broccoli</span>
    </m3e-tree-item>
    <m3e-tree-item>
      <span slot="label">Spinach</span>
    </m3e-tree-item>
  </m3e-tree-item>
</m3e-tree>
```

## API

### `<m3e-tree-item>`

An expandable item in a tree.

**Attributes**

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | false | Whether the element is disabled. |
| `indeterminate` | `boolean` | false | A value indicating whether the element's selected / checked state is indeterminate. |
| `open` | `boolean` | false | Whether the item is expanded. |
| `selected` | `boolean` | false | Whether the item is selected. |

**Properties** (JS-only, no attribute)

| Property | Type | Description |
| --- | --- | --- |
| `link` _(readonly)_ | `HTMLAnchorElement \| null` | A reference to the nested `HTMLAnchorElement`. |
| `label` _(readonly)_ | `HTMLElement \| null` | A reference to the element used to present the label of the item. |
| `visible` _(readonly)_ | `boolean` | Whether the item is visible. |
| `path` _(readonly)_ | `ReadonlyArray<M3eTreeItemElement>` | The full path of the item, starting with the top-most ancestor, including this item. |
| `hasChildItems` _(readonly)_ | `boolean` | Whether the item has child items. |
| `parentItem` _(readonly)_ | `M3eTreeItemElement \| null` | The parenting item. |
| `childItems` _(readonly)_ | `readonly M3eTreeItemElement[]` | The items that immediately descend from this item. |
| `level` _(readonly)_ | `number` | The one-based level of the item. |
| `formAssociated` _(readonly)_ |  | Indicates that this custom element participates in form submission, validation, and form state restoration. |

**Slots**

| Slot | Description |
| --- | --- |
| `(default)` | Renders the nested child items. |
| `label` | Renders the label of the item. |
| `icon` | Renders the icon of the item. |
| `selected-icon` | Renders the icon of the item when selected. |
| `toggle-icon` | Renders the toggle icon. |
| `open-toggle-icon` | Renders the toggle icon when selected. |

**Events**

| Event | Type | Description |
| --- | --- | --- |
| `undefined` | `Event` |  |
| `opening` |  | Dispatched when the item begins to open. |
| `opened` |  | Dispatched when the item has opened. |
| `closing` |  | Dispatched when the item begins to close. |
| `closed` |  | Dispatched when the item has closed. |
| `click` |  | Dispatched when the element is clicked. |

**CSS custom properties** — 20 total across 20 families. Common ones:

| Family (`[size]`/`[variant]` = any value) | Description |
| --- | --- |
| `--m3e-tree-item-font-size` | Font size for the item label. |
| `--m3e-tree-item-font-weight` | Font weight for the item label. |
| `--m3e-tree-item-line-height` | Line height for the item label. |
| `--m3e-tree-item-tracking` | Letter spacing for the item label. |
| `--m3e-tree-item-padding` | Inline padding for the item. |
| `--m3e-tree-item-height` | Height of the item. |
| `--m3e-tree-item-shape` | Border radius of the item and focus ring. |
| `--m3e-tree-item-icon-size` | Size of the icon. |
| `--m3e-tree-item-inset` | Indentation for nested items. |
| `--m3e-tree-item-label-color` | Text color for the item label. |
| `--m3e-tree-item-selected-label-color` | Text color for selected item label. |
| `--m3e-tree-item-selected-container-color` | Background color for selected item. |

_…8 more families. See source for the full list._

### `<m3e-tree>`

Presents hierarchical data in a tree structure.

**Attributes**

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `multi` | `boolean` | false | Whether multiple items can be selected. |
| `cascade` | `boolean` | false | Whether multiple item selection cascades to child items. |

**Properties** (JS-only, no attribute)

| Property | Type | Description |
| --- | --- | --- |
| `selected` _(readonly)_ | `readonly M3eTreeItemElement[]` | The selected items of the tree. |
| `items` _(readonly)_ | `readonly M3eTreeItemElement[]` | All the items of the tree. |

**Slots**

| Slot | Description |
| --- | --- |
| `(default)` | Renders the items of the tree. |

**Events**

| Event | Type | Description |
| --- | --- | --- |
| `change` | `Event` | Dispatched when the selected state changes. |

**CSS custom properties** — 2 total across 2 families. Common ones:

| Family (`[size]`/`[variant]` = any value) | Description |
| --- | --- |
| `--m3e-tree-scrollbar-width` | Width of the tree scrollbar. |
| `--m3e-tree-scrollbar-color` | Color of the tree scrollbar. |

## Source & fidelity

Generated from `matraic/m3e` @ [`c89173f`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/tree/README.md) (MIT).
API values above are taken from the build-time **Custom Elements Manifest** (machine truth), not the prose README.

Source files:
- [`packages/web/src/tree/TreeItemElement.ts`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/tree/TreeItemElement.ts)
- [`packages/web/src/tree/TreeElement.ts`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/tree/TreeElement.ts)
