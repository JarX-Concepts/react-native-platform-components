---
title: "ContextMenu"
description: "Native context menu for React Native: UIContextMenuInteraction on iOS, PopupMenu on Android, with icons."
---

<table>
  <tr>
    <td align="center"><strong>iOS</strong></td>
    <td align="center"><strong>Android</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-contextmenu.gif" height="480" alt="ContextMenu on iOS" /></td>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-contextmenu.gif" height="480" alt="ContextMenu on Android" /></td>
  </tr>
</table>

Native context menu that wraps content and responds to **long-press** or **tap** gestures.

### Props

| Prop            | Type                              | Description                                 |
| --------------- | --------------------------------- | ------------------------------------------- |
| `title`         | `string`                          | Menu title (shown as header on iOS)         |
| `actions`       | `ContextMenuAction[]`             | Array of menu actions                       |
| `disabled`      | `boolean`                         | Disables the menu                           |
| `trigger`       | `'longPress' \| 'tap'`            | How the menu opens (default: `'longPress'`) |
| `haptics`       | `'selection' \| 'light' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error' \| 'none'` | Haptic played when the user presses an action. The long-press open haptic stays; `'none'` also turns it off on Android. See [Haptics](/guides/haptics). Default: none |
| `onPressAction` | `(actionId, actionTitle) => void` | Called when user selects an action          |
| `onMenuOpen`    | `() => void`                      | Called when menu opens                      |
| `onMenuClose`   | `() => void`                      | Called when menu closes                     |
| `children`      | `ReactNode`                       | Content to wrap (required)                  |

### ContextMenuAction

| Property     | Type                                   | Description                                       |
| ------------ | -------------------------------------- | ------------------------------------------------- |
| `id`         | `string`                               | Unique identifier returned in callbacks           |
| `title`      | `string`                               | Display text                                      |
| `subtitle`   | `string`                               | Secondary text (iOS only)                         |
| `image`      | `string`                               | Icon name (SF Symbol on iOS, drawable on Android) |
| `imageColor` | `string`                               | Tint color for the icon (hex string)              |
| `attributes` | `{ destructive?, disabled?, hidden? }` | Action attributes (see [Destructive actions](#destructive-actions)) |
| `state`      | `'off' \| 'on' \| 'mixed'`             | Checkmark state                                   |
| `subactions` | `ContextMenuAction[]`                  | Nested actions for submenu                        |

### iOS Props (`ios`)

| Prop            | Type      | Description                       |
| --------------- | --------- | --------------------------------- |
| `enablePreview` | `boolean` | Enable preview when long-pressing |

### Android Props (`android`)

| Prop             | Type                | Description                                    |
| ---------------- | ------------------- | ---------------------------------------------- |
| `anchorPosition` | `'left' \| 'right'` | Aligns the popup with the start (`'left'`, default) or end (`'right'`) edge of the wrapped content; mirrored in RTL layouts |
| `visible`        | `boolean`           | Programmatic visibility control (Android only) |

### Trigger Modes

- **Long-Press** (default): Long-press on wrapped content triggers the menu.
- **Tap** (`trigger="tap"`): Single tap on wrapped content triggers the menu.
- **Programmatic** (Android only): Use `android.visible` to control menu visibility programmatically. iOS does not support programmatic menu opening due to platform limitations.

### Destructive actions

`attributes: { destructive: true }` draws the action in the platform's destructive style:

- **iOS**: the system red title and icon (`UIMenuElement.Attributes.destructive`).
- **Android**: the title and icon use the theme's `colorError` (Material 3 error red when the theme has none). An explicit `imageColor` still wins for the icon.

### Preview (iOS)

With `ios.enablePreview`, the wrapped content lifts as the menu's preview. On iOS 16+ the component uses the per-item highlight and dismissal preview delegate methods; iOS 15 uses the older configuration-level ones.

### Icon Support

- **iOS**: Use SF Symbol names (e.g., `'trash'`, `'square.and.arrow.up'`, `'doc.on.doc'`)
- **Android**: Use drawable resource names or Material icon names. Icons are shown in the popup menu via `PopupMenu.setForceShowIcon`.
