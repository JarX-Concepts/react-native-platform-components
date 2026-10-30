---
title: 'ContextMenu'
description: 'Native context menu for React Native: UIContextMenuInteraction on iOS, PopupMenu on Android, with sections, submenus and icons.'
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

Native context menu that wraps content and opens on a **long-press** or a **tap**, or from JS with `visible`.

### Props

| Prop             | Type                                                                                           | Description                                                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`          | `string`                                                                                       | Menu title (shown as header on iOS)                                                                                                                                                                   |
| `actions`        | `ContextMenuAction[]`                                                                          | Array of menu actions                                                                                                                                                                                 |
| `disabled`       | `boolean`                                                                                      | Disables the menu                                                                                                                                                                                     |
| `trigger`        | `'longPress' \| 'tap' \| 'none'`                                                               | How the menu opens (default: `'longPress'`). See [Trigger modes](#trigger-modes)                                                                                                                      |
| `visible`        | `boolean`                                                                                      | Opens the menu from JS (controlled). See [Opening from JS](#opening-from-js)                                                                                                                          |
| `haptics`        | `'selection' \| 'light' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error' \| 'none'` | Haptic played when the user presses an action; an action's own `haptics` wins. The long-press open haptic stays; `'none'` also turns it off on Android. See [Haptics](/guides/haptics). Default: none |
| `onPressAction`  | `(actionId, actionTitle) => void`                                                              | Called when user selects an action                                                                                                                                                                    |
| `onMenuOpen`     | `() => void`                                                                                   | Called when menu opens                                                                                                                                                                                |
| `onMenuClose`    | `() => void`                                                                                   | Called when menu closes                                                                                                                                                                               |
| `onPreviewPress` | `() => void`                                                                                   | iOS: the user tapped the preview. See [Preview](#preview-ios)                                                                                                                                         |
| `children`       | `ReactNode`                                                                                    | Content to wrap (required)                                                                                                                                                                            |

### ContextMenuAction

| Property               | Type                                                                                           | Description                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `string`                                                                                       | Unique identifier returned in callbacks                                                                                 |
| `title`                | `string`                                                                                       | Display text. For an inline section, its header (iOS; may be empty)                                                     |
| `subtitle`             | `string`                                                                                       | Secondary text (iOS only)                                                                                               |
| `image`                | `string \| PlatformIcon`                                                                       | Icon. See [Icons](#icons)                                                                                               |
| `imageColor`           | `string`                                                                                       | Tint color for the icon (hex string)                                                                                    |
| `attributes`           | `{ destructive?, disabled?, hidden?, keepsMenuPresented? }`                                    | Action attributes (see [Destructive actions](#destructive-actions) and [Keeping the menu open](#keeping-the-menu-open)) |
| `state`                | `'off' \| 'on' \| 'mixed'`                                                                     | Checkmark state                                                                                                         |
| `haptics`              | `'selection' \| 'light' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error' \| 'none'` | Haptic played when this action is picked, in place of the component's `haptics`. See [Haptics](/guides/haptics)         |
| `subactions`           | `ContextMenuAction[]`                                                                          | Nested actions: a submenu, or an inline section with `displayInline`                                                    |
| `displayInline`        | `boolean`                                                                                      | Shows `subactions` inline as a section instead of a submenu. See [Sections](#sections)                                  |
| `preferredElementSize` | `'small' \| 'medium' \| 'large'`                                                               | Layout of a submenu's or section's actions (iOS 16+). See [Quick actions row](#quick-actions-row-ios)                   |
| `testID`               | `string`                                                                                       | Test ID of the action's menu row, for UI tests. See [Testing menu actions](#testing-menu-actions)                       |

Submenus and sections nest to any depth: a section can hold a submenu, and a submenu can hold sections.

### iOS Props (`ios`)

| Prop            | Type      | Description                       |
| --------------- | --------- | --------------------------------- |
| `enablePreview` | `boolean` | Enable preview when long-pressing |

### Android Props (`android`)

| Prop             | Type                | Description                                                                                                                 |
| ---------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `anchorPosition` | `'left' \| 'right'` | Aligns the popup with the start (`'left'`, default) or end (`'right'`) edge of the wrapped content; mirrored in RTL layouts |
| `visible`        | `boolean`           | Deprecated: use the top-level `visible`, which works on both platforms. The top-level prop wins when both are set           |

### Trigger modes

- **Long-press** (default): a long press anywhere on the wrapped content opens the menu, also when it starts on a button inside the content. That button's press is cancelled, so its `onPress` doesn't fire when the finger lifts. Taps still reach the content's own buttons.
- **Tap** (`trigger="tap"`): a tap on the wrapped content opens the menu, unless a button inside the content takes it. React Native gives a touch to the deepest view that responds to it, so a `Pressable` (or any touchable) inside keeps its taps, and so does a native control such as this library's `Button`. A tap anywhere else on the content opens the menu.
- **None** (`trigger="none"`): no gesture opens the menu, and the wrapped content keeps all its touches. Open the menu with [`visible`](#opening-from-js), for example from one of the content's own buttons.

```tsx
<ContextMenu trigger="tap" actions={actions} onPressAction={handle}>
  <View style={styles.card}>
    <Text>{file.name}</Text>
    {/* Gets its own taps; a tap elsewhere on the card opens the menu */}
    <Button label="Remove" onPress={removeFile} />
  </View>
</ContextMenu>
```

| Platform | Long-press                                                                                                                                                               | Tap                                                                                                                                                                                                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | A `UIContextMenuInteraction` on the view that holds the content, so the long press is recognized wherever it starts. The menu cancels React Native's touch when it opens | The tap reaches the content. A tap no inner button took opens the menu with `UIControl.performPrimaryAction()` on an invisible button, which stays VoiceOver's element for the menu. iOS 15 – 17.3 has no public API for that, so there the invisible button takes every tap on the content, and inner buttons get none: use `trigger="none"` there for content with buttons |
| Android  | Long-press detection on the view, which cancels the touch in React Native and in the content's views when the menu opens                                                 | The tap reaches the content; a tap no inner button took opens the `PopupMenu`. TalkBack opens the menu through the view's click action                                                                                                                                                                                                                                       |

`onMenuOpen` and `onMenuClose` fire in every mode on both platforms, whether the user or `visible` opened the menu.

### Opening from JS

`visible` opens the menu without a touch, anchored to the wrapped content. Like [SelectionMenu](/components/selectionmenu)'s `visible`, it is controlled: set it to `true` to open the menu, and back to `false` in `onMenuClose`, which fires however the menu closes (an action, a tap outside, or `visible` turning `false`). Turning it `false` dismisses an open menu. A menu the user opens with the trigger still calls `onMenuOpen` and `onMenuClose`, and stays open while `visible` stays `false`.

The app then decides whether to show the menu at all: it can skip the menu when only one option applies, run its checks first (a busy state, a permission), or open the menu from a control outside it. With `trigger="none"`, content opens the menu from one of its own buttons:

```tsx
const [sourcesOpen, setSourcesOpen] = useState(false);

<ContextMenu
  trigger="none"
  visible={sourcesOpen}
  onMenuClose={() => setSourcesOpen(false)}
  title="Add From"
  actions={[
    {
      id: 'photo',
      title: 'Photo Library',
      image: { ios: 'photo.on.rectangle', android: 'photo_library' },
    },
    {
      id: 'document',
      title: 'Document',
      image: { ios: 'doc', android: 'description' },
    },
    {
      id: 'camera',
      title: 'Camera',
      image: { ios: 'camera', android: 'photo_camera' },
    },
  ]}
  onPressAction={(id) => addFrom(id)}
>
  <UploadBox file={file}>
    <Button
      label="Choose"
      onPress={() => {
        if (busy) return;
        if (sources.length === 1) addFrom(sources[0]);
        else setSourcesOpen(true);
      }}
    />
    <Button label="Remove" onPress={removeFile} />
  </UploadBox>
</ContextMenu>;
```

| Platform      | Opening from JS                                                                                                                                                                                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS 17.4+     | An invisible `UIButton` over the content presents the menu with `UIControl.performPrimaryAction()` (with `trigger="tap"`, the tap button does). The button takes no touches. Actions, submenus, haptics and the callbacks work as in a menu the user opened; there is no lifted preview |
| iOS 15 – 17.3 | UIKit has no public API to open a menu without a touch, so `visible` does nothing. Keep a trigger the user can reach, or check `Platform.Version` and show your own UI                                                                                                                  |
| Android       | `PopupMenu.show()`, anchored to the content like a menu the user opened                                                                                                                                                                                                                 |

| iOS 26                                                                                                                 | Android                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| ![The source menu opened from the upload card's Choose button on iOS 26](/img/components/contextmenu/visible-ios.webp) | ![The source menu opened from the upload card's Choose button on Android](/img/components/contextmenu/visible-android.webp) |

`android.visible` still works but is deprecated: the top-level `visible` replaces it.

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
        {
          id: 'copy',
          title: 'Copy',
          image: { ios: 'doc.on.doc', android: 'content_copy' },
        },
        {
          id: 'duplicate',
          title: 'Duplicate',
          image: { ios: 'plus.square.on.square', android: 'crop_square' },
        },
      ],
    },
    {
      id: 'share',
      title: 'Share',
      displayInline: true,
      subactions: [
        {
          id: 'remind',
          title: 'Remind Me',
          image: { type: 'image', source: require('./bell.png') },
        },
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
      subactions: [
        {
          id: 'delete',
          title: 'Delete',
          image: { ios: 'trash', android: 'delete' },
          attributes: { destructive: true },
        },
      ],
    },
  ]}
  onPressAction={(id) => handle(id)}
>
  <DocumentRow />
</ContextMenu>
```

| iOS 26                                                                                                          | Android                                                                                               |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| ![Sections with a header, an image icon and a submenu on iOS 26](/img/components/contextmenu/sections-ios.webp) | ![Sections separated by group dividers on Android](/img/components/contextmenu/sections-android.webp) |

### Quick actions row (iOS)

`preferredElementSize` sets how a submenu or an inline section lays out its actions (`UIMenu.preferredElementSize`, iOS 16+). `'medium'` puts up to four actions side by side, each an icon over its title: the row of quick actions at the top of a channel menu in Slack or of a file menu in Files. `'small'` shows them as icons only, as the Cut / Copy / Paste row of a text menu. `'large'`, the default, lists one action per row. Give the actions icons for the smaller sizes; the title still names the action for VoiceOver.

The menu opens out of its anchor with the system animation (on iOS 26, the Liquid Glass morph), so a header pill with a `ContextMenu` and `trigger="tap"` grows into this panel of options. Values next to a row, such as a member count, go in its `subtitle`.

```tsx
<ContextMenu
  trigger="tap"
  onPressAction={handleAction}
  actions={[
    {
      id: 'quick',
      title: '',
      displayInline: true,
      preferredElementSize: 'medium',
      subactions: [
        { id: 'add', title: 'Add', image: 'person.badge.plus' },
        { id: 'move', title: 'Move', image: 'folder' },
        { id: 'search', title: 'Search', image: 'magnifyingglass' },
      ],
    },
    {
      id: 'settings',
      title: '',
      displayInline: true,
      subactions: [
        { id: 'members', title: 'Members', subtitle: '5', image: 'person.2' },
        { id: 'tabs', title: 'Tabs', subtitle: '3', image: 'square.grid.2x2' },
      ],
    },
  ]}
>
  <ChannelHeaderPill />
</ContextMenu>
```

![A channel menu with a row of Add, Move and Search, the settings with their values, and a row of icon-only actions on iOS 26](/img/components/contextmenu/quick-actions-ios.webp)

Android's Material menus have no such layout: the same actions are listed one per row, in their sections. Before iOS 16 the size is ignored.

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
        {
          id: 'decrease',
          title: 'Decrease',
          image: 'minus',
          attributes: { keepsMenuPresented: true },
        },
        {
          id: 'increase',
          title: 'Increase',
          image: 'plus',
          attributes: { keepsMenuPresented: true },
        },
      ],
    },
  ]}
  onPressAction={(id) =>
    setQuantity((q) => (id === 'increase' ? q + 1 : Math.max(0, q - 1)))
  }
>
  <QuantityBadge value={quantity} />
</ContextMenu>;
```

| iOS 26                                                                                                    |
| --------------------------------------------------------------------------------------------------------- |
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

| iOS 26                                                                                       |
| -------------------------------------------------------------------------------------------- |
| ![The lifted preview above the menu on iOS 26](/img/components/contextmenu/preview-ios.webp) |

### Testing menu actions

An action's `testID` goes on its row in the open menu, so an end-to-end test taps it by ID rather than by its title, which changes with the language. Submenus take one too, for the row that opens them. An inline section has no row of its own; give its actions the IDs.

- **iOS**: the `accessibilityIdentifier` of the `UIAction` (or of the submenu's `UIMenu`). UIKit puts it on the menu row.
- **Android 10+**: the tag of the popup's row view, which is what Detox and Espresso match `by.id` against. It is not a `resource-id`, so UiAutomator-based tools (Appium, Maestro) don't see it. AppCompat keeps the popup's list private, so the rows are found through `WindowInspector`, which Android 9 and earlier don't have: there the rows carry no ID.

```tsx
<ContextMenu
  testID="upload-box"
  trigger="tap"
  actions={[
    { id: 'camera', title: t('camera'), testID: 'source-camera' },
    {
      id: 'files',
      title: t('files'),
      testID: 'source-files',
      subactions: [{ id: 'pdf', title: 'PDF', testID: 'source-files-pdf' }],
    },
  ]}
  onPressAction={pick}
>
  <UploadBox />
</ContextMenu>
```

```ts
// Detox
await element(by.id('upload-box')).tap();
await waitFor(element(by.id('source-camera')))
  .toBeVisible()
  .withTimeout(6000);
await element(by.id('source-files')).tap();
await element(by.id('source-files-pdf')).tap();
```

[Button](/components/button#menu) and [SplitButton](/components/buttongroup#splitbutton) menus take the same `testID`.

### Icons

`image` accepts the same shapes as the icons of [SegmentedControl](/components/segmentedcontrol#icon-support), Button and TabBar:

- **A string**: an SF Symbol name on iOS (e.g. `'trash'`, `'square.and.arrow.up'`), also looked up in the app's asset catalog, so custom symbols and images work too. On Android, a drawable resource name (`'delete'`, also tried with an `ic_` prefix).
- **`{ ios, android }`**: a different name per platform, so one action list serves both.
- **`{ type: 'image', source }`**: an image asset (`require('./bell.png')`) or a `{ uri }`. Both platforms load it with the library's image loader. It's drawn as a template (in the menu's text color) unless `tinted: false`. On Android it sits in the 24dp icon box of the menu, scaled down if larger.

`imageColor` tints any of them. Android shows the icons with `PopupMenu.setForceShowIcon`.
