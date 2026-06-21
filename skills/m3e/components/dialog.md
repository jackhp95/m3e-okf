# dialog

**Family:** [Containers & surfaces](../concepts/choosing-components.md#containers) · See also: [card](card.md), [content-pane](content-pane.md), [bottom-sheet](bottom-sheet.md), [split-pane](split-pane.md), [expansion-panel](expansion-panel.md), [divider](divider.md), [menu](menu.md)

The `m3e-dialog` component presents important prompts, alerts, and actions in user flows. Designed according to Material 3 principles, it supports custom header, content, and close icon slots, ARIA accessibility, focus management, and theming via CSS custom properties.

```ts
import "@m3e/web/dialog";
```

**Elements:** `<m3e-dialog-action>`, `<m3e-dialog>`, `<m3e-dialog-trigger>`

## Examples

```html
<m3e-button variant="filled">
  <m3e-dialog-trigger for="dlg">Open Dialog</m3e-dialog-trigger>
</m3e-button>
<m3e-dialog id="dlg" dismissible onclosed="console.log(this.returnValue)">
  <span slot="header">Dialog Title</span>
  Dialog content goes here.
  <div slot="actions" end>
    <m3e-button autofocus><m3e-dialog-action return-value="ok">Close</m3e-dialog-action></m3e-button>
  </div>
</m3e-dialog>
```

## API

### `<m3e-dialog-action>`

An element, nested within a clickable element, used to close a parenting dialog.

**Attributes**

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `return-value` | `string` | "" | The value to return from the dialog. |

**Slots**

| Slot | Description |
| --- | --- |
| `(default)` | Renders the content of the action. |

### `<m3e-dialog>`

A dialog that provides important prompts in a user flow.

**Attributes**

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `alert` | `boolean` | false | Whether the dialog is an alert. |
| `close-label` | `string` | "Close" | The accessible label given to the button used to dismiss the dialog. |
| `disable-close` | `boolean` | false | Whether users cannot click the backdrop or press ESC to dismiss the dialog. |
| `dismissible` | `boolean` | false | Whether a button is presented that can be used to close the dialog. |
| `no-focus-trap` | `boolean` | false | Whether to disable focus trapping, which keeps keyboard `Tab` navigation within the dialog. |
| `open` |  | false | Whether the dialog is open. |

**Properties** (JS-only, no attribute)

| Property | Type | Description |
| --- | --- | --- |
| `returnValue` | `string` | The return value of the dialog. |
| `formAssociated` _(readonly)_ |  | Indicates that this custom element participates in form submission, validation, and form state restoration. |

**Slots**

| Slot | Description |
| --- | --- |
| `(default)` | Renders the content of the dialog. |
| `header` | Renders the header of the dialog. |
| `actions` | Renders the actions of the dialog. |
| `close-icon` | Renders the icon of the button used to close the dialog. |

**Events**

| Event | Type | Description |
| --- | --- | --- |
| `opening` | `Event` | Dispatched when the dialog begins to open. |
| `opened` | `Event` | Dispatched when the dialog has opened. |
| `closing` | `Event` | Dispatched when the dialog begins to close. |
| `closed` | `Event` | Dispatched when the dialog has closed. |
| `cancel` | `Event` | Dispatched when the dialog is cancelled. |

**CSS custom properties** — 18 total across 18 families. Common ones:

| Family (`[size]`/`[variant]` = any value) | Description |
| --- | --- |
| `--m3e-dialog-shape` | Border radius of the dialog container. |
| `--m3e-dialog-min-width` | Minimum width of the dialog. |
| `--m3e-dialog-max-width` | Maximum width of the dialog. |
| `--m3e-dialog-color` | Foreground color of the dialog. |
| `--m3e-dialog-container-color` | Background color of the dialog container. |
| `--m3e-dialog-scrim-color` | Color of the scrim (backdrop overlay). |
| `--m3e-dialog-scrim-opacity` | Opacity of the scrim when open. |
| `--m3e-dialog-header-container-color` | Background color of the dialog header. |
| `--m3e-dialog-header-color` | Foreground color of the dialog header. |
| `--m3e-dialog-header-font-size` | Font size for the dialog header. |
| `--m3e-dialog-header-font-weight` | Font weight for the dialog header. |
| `--m3e-dialog-header-line-height` | Line height for the dialog header. |

_…6 more families. See source for the full list._

### `<m3e-dialog-trigger>`

An element, nested within a clickable element, used to open a dialog.

**Attributes**

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `for` | `string \| null` | null | The identifier of the interactive control to which this element is attached. |

**Properties** (JS-only, no attribute)

| Property | Type | Description |
| --- | --- | --- |
| `control` _(readonly)_ |  | The interactive element to which this element is attached. |

## Source & fidelity

Generated from `matraic/m3e` @ [`c89173f`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/dialog/README.md) (MIT).
API values above are taken from the build-time **Custom Elements Manifest** (machine truth), not the prose README.

Source files:
- [`packages/web/src/dialog/DialogActionElement.ts`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/dialog/DialogActionElement.ts)
- [`packages/web/src/dialog/DialogElement.ts`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/dialog/DialogElement.ts)
- [`packages/web/src/dialog/DialogTriggerElement.ts`](https://github.com/matraic/m3e/blob/c89173f392134df452422ffad051d5a5c90934b6/packages/web/src/dialog/DialogTriggerElement.ts)

**README drift corrected** (2 item(s); CEM values used above):
_See `data/report.md` for specifics — defaults/attributes where the README disagreed with or omitted the code._
