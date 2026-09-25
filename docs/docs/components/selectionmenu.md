---
title: "SelectionMenu"
description: "Native selection menu for React Native: system menus on iOS, Material exposed dropdown or Spinner on Android, with icons, subtitles and a searchable dropdown."
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

| Prop                 | Type                            | Description                                                         |
| -------------------- | ------------------------------- | ------------------------------------------------------------------- |
| `options`            | `SelectionMenuOption[]`         | Options to display. See [SelectionMenuOption](#selectionmenuoption) |
| `selected`           | `string \| null`                | Currently selected option's `data` value                            |
| `disabled`           | `boolean`                       | Disables the menu                                                   |
| `placeholder`        | `string`                        | Placeholder text when no selection                                  |
| `presentation`       | `'modal' \| 'embedded'`         | Presentation mode (default: `'modal'`)                              |
| `visible`            | `boolean`                       | Controls modal mode menu visibility                                 |
| `onSelect`           | `(data, label, index) => void`  | Called when user selects an option                                  |
| `onRequestClose`     | `() => void`                    | Called when menu is dismissed without selection                     |
| `android.material`   | `'system' \| 'm3'`              | Material Design style preference                                    |
| `android.searchable` | `boolean`                       | Embedded `m3` only: typing filters the options. See [Searchable dropdown](#searchable-dropdown-android) |

### SelectionMenuOption

| Property   | Type                     | Description                                                                         |
| ---------- | ------------------------ | ----------------------------------------------------------------------------------- |
| `label`    | `string`                 | Display text                                                                        |
| `data`     | `string`                 | Payload returned by `onSelect`; what `selected` matches                             |
| `subtitle` | `string`                 | Secondary text under the label. See [Icons and subtitles](#icons-and-subtitles)     |
| `icon`     | `string \| PlatformIcon` | Icon next to the label, the same shapes as [Button icons](/components/button#icons) |

### Modes

- **Modal mode** (default): Menu visibility controlled by `visible` prop. Use for custom trigger UI.
- **Embedded mode** (`presentation="embedded"`): Native picker UI rendered inline. Menu managed internally.

### Modal mode

In modal mode the component is invisible and takes no touches; it only marks where the menu opens. Place it next to your own trigger, set `visible` to open the menu, and close it again from `onSelect` and `onRequestClose`:

```tsx
const [open, setOpen] = useState(false);

<Pressable onPress={() => setOpen(true)}>
  <Text>{selected ?? 'Pick a state'}</Text>
</Pressable>
<SelectionMenu
  options={STATES}
  selected={selected}
  visible={open}
  onSelect={(data) => {
    setSelected(data);
    setOpen(false);
  }}
  onRequestClose={() => setOpen(false)}
/>
```

- **iOS 17.4+**: a real system `UIMenu`, with the system look (Liquid Glass on iOS 26), scrolling and the checkmark on the selected option. It hangs off an invisible `UIButton` over the component's frame (`showsMenuAsPrimaryAction`), which `visible` opens with `UIControl.performPrimaryAction()`. A tap outside dismisses it and calls `onRequestClose`; setting `visible` back to `false` closes it without a callback. On iOS 26 that dismissing tap also reaches the view underneath.
- **iOS 15.1 to 17.3**: UIKit has no public way to open a menu without a touch, so modal mode falls back to a popover styled like a system menu (a blurred material panel), with the checkmark on the selected row. It shows labels only: no icons or subtitles.
- **Android**: a `PopupMenu` anchored to the component, with a radio indicator on the selected option.

| iOS 26 | iOS 18 | Android |
| --- | --- | --- |
| ![The system menu opened from modal mode on iOS 26](/img/components/selectionmenu/modal-ios.webp) | ![The system menu opened from modal mode on iOS 18](/img/components/selectionmenu/modal-ios18.webp) | ![The popup menu with icons on Android](/img/components/selectionmenu/modal-android.webp) |

### Selected option

The option matching `selected` is marked natively when the menu is open:

- **iOS** (both modes): a single-selection `UIMenu` with the system checkmark on the selected action. Before iOS 17.4, modal mode's popover draws the checkmark in the leading position like a system menu.
- **Android modal**: a single-choice `PopupMenu` group with the selected item checked (radio indicator).
- **Android embedded, `m3`**: the exposed dropdown highlights the selected item.
- **Android embedded, `system`**: the Spinner shows the selected label.

Selection stays controlled: the mark follows the `selected` prop, not the last tap.

### Icons and subtitles

Each option can carry an `icon` and a `subtitle`:

```tsx
const OPTIONS = [
  { label: 'Push', data: 'push', subtitle: 'On this device', icon: { type: 'image', source: require('./bell.png') } },
  { label: 'Email', data: 'email', subtitle: 'A daily digest', icon: { ios: 'envelope', android: 'send' } },
  { label: 'Off', data: 'off', subtitle: 'No notifications', icon: { ios: 'bell.slash', android: 'remove_circle' } },
];
```

- **iOS**: `UIAction.image` and `UIAction.subtitle`, in both modes (from iOS 17.4 in modal mode).
- **Android modal**: the `PopupMenu` shows the icons (`setForceShowIcon`). Its rows have a single line, so subtitles aren't shown there.
- **Android embedded, `m3`**: the exposed dropdown's rows get a leading icon and a second line, laid out like Material list items. The closed field shows the label.
- **Android embedded, `system`**: labels only. The platform Spinner sizes its list to the widest row and anchors it at the field's start, so rich rows would run off the edge of the screen.

Image sources are drawn as templates in the menu's icon color unless `tinted: false`; on Android they sit in the 24dp icon box, scaled down if larger.

| Android embedded (`m3`) |
| --- |
| ![Dropdown rows with icons and subtitles in the M3 exposed dropdown](/img/components/selectionmenu/rich-m3-android.webp) |

### Searchable dropdown (Android)

With `presentation="embedded"`, `android.material="m3"` and `android.searchable`, the exposed dropdown's field takes typing and filters the options as the user types: an option matches when its label, or one of its words, starts with the text (case-insensitive, as Android's `ArrayAdapter` filters).

```tsx
<SelectionMenu
  presentation="embedded"
  options={STATES}
  selected={selected}
  placeholder="State"
  android={{ material: 'm3', searchable: true }}
  onSelect={(data) => setSelected(data)}
/>
```

- Tapping the field selects its text, so typing replaces it, and opens the full list.
- Picking an option calls `onSelect`. The text is only a query: `selected` stays the source of truth.
- When the field loses focus (the keyboard's Done key, a tap outside the open list, or a pick), the query goes and the field shows the selected option's label again, or the placeholder when nothing is selected. Text that matches nothing never becomes a selection.

`searchable` is ignored in modal mode, by the `system` Spinner and on iOS, where menus aren't searchable.

| Android |
| --- |
| ![The M3 exposed dropdown filtered to the states starting with "new"](/img/components/selectionmenu/searchable-android.webp) |
