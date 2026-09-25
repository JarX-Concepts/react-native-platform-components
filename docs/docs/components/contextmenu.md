---
title: "ContextMenu"
description: "Native context menu for React Native: UIContextMenuInteraction on iOS, PopupMenu on Android, with sections, submenus and icons."
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

| Prop             | Type                              | Description                                                                 |
| ---------------- | --------------------------------- | --------------------------------------------------------------------------- |
| `title`          | `string`                          | Menu title (shown as header on iOS)                                         |
| `actions`        | `ContextMenuAction[]`             | Array of menu actions                                                       |
| `disabled`       | `boolean`                         | Disables the menu                                                           |
| `trigger`        | `'longPress' \| 'tap'`            | How the menu opens (default: `'longPress'`)                                 |
| `haptics`        | `'selection' \| 'light' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error' \| 'none'` | Haptic played when the user presses an action; an action's own `haptics` wins. The long-press open haptic stays; `'none'` also turns it off on Android. See [Haptics](/guides/haptics). Default: none |
| `onPressAction`  | `(actionId, actionTitle) => void` | Called when user selects an action                                          |
| `onMenuOpen`     | `() => void`                      | Called when menu opens                                                      |
| `onMenuClose`    | `() => void`                      | Called when menu closes                                                     |
| `onPreviewPress` | `() => void`                      | iOS: the user tapped the preview. See [Preview](#preview-ios)               |
| `children`       | `ReactNode`                       | Content to wrap (required)                                                  |

### ContextMenuAction

| Property        | Type                                                        | Description                                                                          |
| --------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `id`            | `string`                                                    | Unique identifier returned in callbacks                                              |
| `title`         | `string`                                                    | Display text. For an inline section, its header (iOS; may be empty)                  |
| `subtitle`      | `string`                                                    | Secondary text (iOS only)                                                            |
| `image`         | `string \| PlatformIcon`                                    | Icon. See [Icons](#icons)                                                            |
| `imageColor`    | `string`                                                    | Tint color for the icon (hex string)                                                 |
| `attributes`    | `{ destructive?, disabled?, hidden?, keepsMenuPresented? }` | Action attributes (see [Destructive actions](#destructive-actions) and [Keeping the menu open](#keeping-the-menu-open)) |
| `state`         | `'off' \| 'on' \| 'mixed'`                                  | Checkmark state                                                                      |
| `haptics`       | `'selection' \| 'light' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error' \| 'none'` | Haptic played when this action is picked, in place of the component's `haptics`. See [Haptics](/guides/haptics) |
| `subactions`    | `ContextMenuAction[]`                                       | Nested actions: a submenu, or an inline section with `displayInline`                 |
| `displayInline` | `boolean`                                                   | Shows `subactions` inline as a section instead of a submenu. See [Sections](#sections) |

Submenus and sections nest to any depth: a section can hold a submenu, and a submenu can hold sections.

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

`onMenuOpen` and `onMenuClose` fire in both modes on both platforms.

### Sections

An action with `subactions` and `displayInline: true` is an inline group, set off from the rest of the menu by separators:

- **iOS**: `UIMenu(options: .displayInline)`. A non-empty `title` shows as the section header.
- **Android**: a menu group, with group dividers turned on (`MenuCompat.setGroupDividerEnabled`). Android menus have no section headers, so the title isn't shown.

```tsx
<ContextMenu
  title="Document"
  actions={[
    {
      id: 'edit',
      title: '',
      displayInline: true,
      subactions: [
        { id: 'copy', title: 'Copy', image: { ios: 'doc.on.doc', android: 'content_copy' } },
        { id: 'duplicate', title: 'Duplicate', image: { ios: 'plus.square.on.square', android: 'crop_square' } },
      ],
    },
    {
      id: 'share',
      title: 'Share',
      displayInline: true,
      subactions: [
        { id: 'remind', title: 'Remind Me', image: { type: 'image', source: require('./bell.png') } },
        {
          id: 'send',
          title: 'Send To',
          image: { ios: 'paperplane', android: 'send' },
          subactions: [
            { id: 'messages', title: 'Messages' },
            { id: 'mail', title: 'Mail' },
          ],
        },
      ],
    },
    {
      id: 'danger',
      title: '',
      displayInline: true,
      subactions: [{ id: 'delete', title: 'Delete', image: { ios: 'trash', android: 'delete' }, attributes: { destructive: true } }],
    },
  ]}
  onPressAction={(id) => handle(id)}
>
  <DocumentRow />
</ContextMenu>
```

| iOS 26 | Android |
| --- | --- |
| ![Sections with a header, an image icon and a submenu on iOS 26](/img/components/contextmenu/sections-ios.webp) | ![Sections separated by group dividers on Android](/img/components/contextmenu/sections-android.webp) |

### Keeping the menu open

`attributes: { keepsMenuPresented: true }` keeps the menu open after the action is pressed, for steppers and toggles. Change the action's `title` or `state` in `onPressAction` and the open menu updates in place.

- **iOS 16+**: `UIMenuElement.Attributes.keepsMenuPresented`. Ignored on iOS 15, where the menu closes.
- **Android**: not supported. `PopupMenu` closes on every press, as Android menus do; the press is still reported and the next open shows the new titles and states.

```tsx
const [quantity, setQuantity] = useState(1);

<ContextMenu
  trigger="tap"
  actions={[
    {
      id: 'quantity',
      title: `Quantity: ${quantity}`,
      displayInline: true,
      subactions: [
        { id: 'decrease', title: 'Decrease', image: 'minus', attributes: { keepsMenuPresented: true } },
        { id: 'increase', title: 'Increase', image: 'plus', attributes: { keepsMenuPresented: true } },
      ],
    },
  ]}
  onPressAction={(id) => setQuantity((q) => (id === 'increase' ? q + 1 : Math.max(0, q - 1)))}
>
  <QuantityBadge value={quantity} />
</ContextMenu>
```

| iOS 26 |
| --- |
| ![A stepper and a toggle that keep the menu open on iOS 26](/img/components/contextmenu/stepper-ios.webp) |

### Destructive actions

`attributes: { destructive: true }` draws the action in the platform's destructive style:

- **iOS**: the system red title and icon (`UIMenuElement.Attributes.destructive`).
- **Android**: the title and icon use the theme's `colorError` (Material 3 error red when the theme has none). An explicit `imageColor` still wins for the icon.

### Preview (iOS)

With `ios.enablePreview`, the wrapped content lifts as the menu's preview. On iOS 16+ the component uses the per-item highlight and dismissal preview delegate methods; iOS 15 uses the older configuration-level ones.

Tapping the preview dismisses the menu back to the content and then calls `onPreviewPress` (`contextMenuInteraction(_:willPerformPreviewActionForMenuWith:animator:)`), so you can open the item, as Photos and Mail do. Without `enablePreview` there's no preview to tap. Android has no preview.

```tsx
<ContextMenu
  actions={actions}
  ios={{ enablePreview: true }}
  onPreviewPress={() => navigation.navigate('Photo', { id })}
>
  <Thumbnail id={id} />
</ContextMenu>
```

| iOS 26 |
| --- |
| ![The lifted preview above the menu on iOS 26](/img/components/contextmenu/preview-ios.webp) |

### Icons

`image` accepts the same shapes as the icons of [SegmentedControl](/components/segmentedcontrol#icon-support), Button and TabBar:

- **A string**: an SF Symbol name on iOS (e.g. `'trash'`, `'square.and.arrow.up'`), also looked up in the app's asset catalog, so custom symbols and images work too. On Android, a drawable resource name (`'delete'`, also tried with an `ic_` prefix).
- **`{ ios, android }`**: a different name per platform, so one action list serves both.
- **`{ type: 'image', source }`**: an image asset (`require('./bell.png')`) or a `{ uri }`. Both platforms load it with the library's image loader. It's drawn as a template (in the menu's text color) unless `tinted: false`. On Android it sits in the 24dp icon box of the menu, scaled down if larger.

`imageColor` tints any of them. Android shows the icons with `PopupMenu.setForceShowIcon`.
