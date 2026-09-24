---
title: "SelectionMenu"
description: "Native selection menu for React Native: system menus on iOS, Material exposed dropdown or Spinner on Android."
---

<table>
  <tr>
    <td align="center"><strong>iOS</strong></td>
    <td align="center"><strong>Android</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-selectionmenu.gif" height="480" alt="SelectionMenu on iOS" /></td>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-selectionmenu.gif" height="480" alt="SelectionMenu on Android" /></td>
  </tr>
</table>

Native selection menu with **modal** and **embedded** modes.

### Props

| Prop               | Type                                | Description                                     |
| ------------------ | ----------------------------------- | ----------------------------------------------- |
| `options`          | `{ label: string; data: string }[]` | Array of options to display                     |
| `selected`         | `string \| null`                    | Currently selected option's `data` value        |
| `disabled`         | `boolean`                           | Disables the menu                               |
| `placeholder`      | `string`                            | Placeholder text when no selection              |
| `presentation`     | `'modal' \| 'embedded'`             | Presentation mode (default: `'modal'`)          |
| `visible`          | `boolean`                           | Controls modal mode menu visibility             |
| `onSelect`         | `(data, label, index) => void`      | Called when user selects an option              |
| `onRequestClose`   | `() => void`                        | Called when menu is dismissed without selection |
| `android.material` | `'system' \| 'm3'`                  | Material Design style preference                |

### Modes

- **Modal mode** (default): Menu visibility controlled by `visible` prop. Use for custom trigger UI.
- **Embedded mode** (`presentation="embedded"`): Native picker UI rendered inline. Menu managed internally.

### Selected option

The option matching `selected` is marked natively when the menu is open:

- **iOS embedded**: a single-selection `UIMenu` with the system checkmark on the selected action.
- **iOS modal**: a checkmark on the selected row of the popover, in the leading position like a system menu.
- **Android modal**: a single-choice `PopupMenu` group with the selected item checked (radio indicator).
- **Android embedded, `m3`**: the exposed dropdown highlights the selected item.
- **Android embedded, `system`**: the Spinner shows the selected label.

Selection stays controlled: the mark follows the `selected` prop, not the last tap.

> **Note:** On iOS, modal mode uses a custom popover to enable programmatic presentation. For the full native menu experience (system animations, scroll physics), use embedded mode. This is an intentional trade-off: modal gives you control over the trigger UI, embedded gives you the complete system menu behavior.
