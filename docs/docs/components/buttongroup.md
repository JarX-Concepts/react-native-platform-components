---
title: "ButtonGroup"
description: "Native button group and split button for React Native: Material 3 Expressive standard and connected button groups and MaterialSplitButton on Android, a row of UIButtons on iOS, with single and multiple selection and an overflow menu."
---

<table>
  <tr>
    <td align="center"><strong>iOS</strong></td>
    <td align="center"><strong>Android</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-button.gif" height="480" alt="ButtonGroup on iOS" /></td>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-button.gif" height="480" alt="ButtonGroup on Android" /></td>
  </tr>
</table>

A row of related buttons using **MaterialButtonGroup** and **MaterialButtonToggleGroup** (Material 3 Expressive) on Android and a row of **UIButton**s on iOS. Use it for a set of actions, or for single / multiple selection. Buttons that don't fit can fold into an [overflow menu](#overflow). For a main action with an attached menu, use [SplitButton](#splitbutton).

```tsx
import { ButtonGroup } from 'react-native-platform-components';

// Actions
<ButtonGroup
  buttons={[
    { label: 'Copy', value: 'copy' },
    { label: 'Paste', value: 'paste' },
  ]}
  onPress={(value) => run(value)}
/>

// Single selection
<ButtonGroup
  buttons={[
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ]}
  selection="single"
  selectedValues={[range]}
  onSelectionChange={([value]) => value && setRange(value)}
/>
```

### Props

| Prop                | Type                                                     | Description                                                                                                  |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `buttons`           | `ButtonGroupButton[]`                                    | Buttons to display                                                                                           |
| `variant`           | `'filled' \| 'tonal' \| 'outlined' \| 'text' \| 'elevated' \| 'glass' \| 'prominentGlass' \| 'clearGlass' \| 'prominentClearGlass'` | Emphasis of every button. See [Button variants](/components/button#variants). Default: `'outlined'`          |
| `size`              | `'xsmall' \| 'small' \| 'medium' \| 'large' \| 'xlarge'` | Size of every button. Default: `'small'`                                                                     |
| `shape`             | `'round' \| 'square'`                                    | Corner shape of every button. Default: platform default                                                      |
| `connected`         | `boolean`                                                | Connected group. See [Standard and connected](#standard-and-connected). Default: `true` when selecting       |
| `spacing`           | `number`                                                 | Gap between buttons in points. Default: the platform's group spacing                                         |
| `selection`         | `'none' \| 'single' \| 'multiple'`                       | Selection behavior. See [Selection](#selection). Default: `'none'`                                           |
| `selectedValues`    | `string[]`                                               | Values of the selected buttons (controlled)                                                                  |
| `selectionRequired` | `boolean`                                                | Whether one button must stay selected. Default: `true` for `single`, `false` for `multiple`                  |
| `disabled`          | `boolean`                                                | Disables the entire group                                                                                    |
| `color`             | `ColorValue`                                             | Container (background) color of the buttons                                                                  |
| `tintColor`         | `ColorValue`                                             | Label and icon color of the buttons                                                                          |
| `labelStyle`        | `{ fontFamily?, fontSize?, fontWeight?, fontStyle? }`    | Label font                                                                                                   |
| `overflow`          | `'none' \| 'menu' \| 'wrap'`                             | What happens to buttons that don't fit. See [Overflow](#overflow). Default: `'none'`                         |
| `haptics`           | `'selection' \| 'light' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error' \| 'none'` | Haptic played on every press (an overflow-menu pick included), in every selection mode. See [Haptics](/guides/haptics). Default: none |
| `onPress`           | `(value: string, index: number) => void`                 | Called when a button is pressed (or picked from the overflow menu), in every selection mode                 |
| `onSelectionChange` | `(values: string[]) => void`                             | Called when the selection changes, with the selected values in button order                                  |

### ButtonGroupButton

| Property             | Type           | Description                                                          |
| -------------------- | -------------- | -------------------------------------------------------------------- |
| `label`              | `string`       | Button text. Omit for an icon-only button                            |
| `value`              | `string`       | Unique value returned in callbacks                                   |
| `disabled`           | `boolean`      | Disables this specific button                                        |
| `icon`               | `PlatformIcon` | Optional icon. See [Button icons](/components/button#icons)          |
| `accessibilityLabel` | `string`       | Screen-reader label. Defaults to `label`; give icon-only buttons one |

### Android Props (`android`)

| Prop          | Type                           | Description                                                                                                                   |
| ------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `overflow`    | `'none' \| 'menu' \| 'wrap'`   | **Deprecated**: use the cross-platform [`overflow`](#overflow) prop, which wins when both are set |
| `rippleColor` | `ColorValue`                   | Ripple shown while pressing a button                                                                                          |
| `strokeColor` | `ColorValue`                   | Outline color (`outlined` variant)                                                                                            |
| `material`    | `'m3' \| 'expressive'`        | Material style: Material 3 Expressive (default) or the classic Material 3 group, which has one size and shape. See [Button](/components/button#material-style) |

### Standard and connected

Material 3 Expressive has two kinds of button group:

- **Standard** (`connected: false`, the default for actions): each button keeps its own shape and the group has a wider gap. On Android the pressed button **widens and its neighbors shrink**, the Expressive size morph.
- **Connected** (`connected: true`, the default when selecting): the buttons share one outline with a hairline gap and small inner corners; the selected button rounds into a pill. This is the successor of Material's segmented buttons. Buttons size to their content; connected buttons also share any extra width equally when you stretch the group (`alignSelf: 'stretch'`).

On iOS both kinds are a row of content-sized `UIButton`s: a 2pt gap for a connected group, 8pt for a standard one.

### Selection

| `selection`  | Behavior                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `'none'`     | Plain actions; only `onPress` fires                                                                                            |
| `'single'`   | One button selected at a time. Tapping the selected button clears it unless `selectionRequired` (the default for single)      |
| `'multiple'` | Any number of buttons selected. With `selectionRequired`, the last selected button can't be cleared                            |

Selection is controlled: pass `selectedValues` and update it from `onSelectionChange`. Android uses `MaterialButtonToggleGroup`, so the selected buttons take the variant's selected colors and the Expressive checked shape. On iOS selected buttons switch to the filled configuration, as UIKit's own toggle buttons do.

```tsx
const [format, setFormat] = useState<string[]>(['bold']);

<ButtonGroup
  buttons={[
    { label: 'Bold', value: 'bold' },
    { label: 'Italic', value: 'italic' },
    { label: 'Underline', value: 'underline' },
  ]}
  variant="tonal"
  selection="multiple"
  selectedValues={format}
  onSelectionChange={setFormat}
/>
```

### Overflow

`overflow` decides what happens to the buttons that don't fit the group's width:

| `overflow` | Android | iOS |
| ---------- | ------- | --- |
| `'none'` (default) | Clipped | Clipped |
| `'menu'` | `MaterialButtonGroup` overflow mode: the trailing buttons move into the group's overflow menu (a `PopupMenu` behind a ⋮ button) | The trailing buttons fold into a "…" button (`ellipsis`) at the end of the row, with a `UIMenu` of the hidden buttons |
| `'wrap'` | The buttons wrap onto more rows | Clipped: UIKit has no wrapping button row |

A pick from the overflow menu is a press of that button: `onPress` is called with its value and index, and in a selecting group the selection changes as for a tap. The menu shows each hidden button's label (or `accessibilityLabel`), its icon, its disabled state, and on iOS a checkmark on the selected ones.

The group reports the width of all its buttons, so it takes the space its container gives it and folds what doesn't fit. On iOS the fold is recomputed on every layout, so a wider container (rotation, iPad split view) shows more buttons again. `android.overflow` still works as a deprecated alias.

```tsx
<ButtonGroup
  buttons={[
    { label: 'Undo', value: 'undo' },
    { label: 'Redo', value: 'redo' },
    { label: 'Indent', value: 'indent' },
    { label: 'Outdent', value: 'outdent' },
    { label: 'Link', value: 'link' },
    { label: 'Quote', value: 'quote' },
    { label: 'Code', value: 'code' },
  ]}
  variant="tonal"
  overflow="menu"
  onPress={(value) => run(value)}
/>
```

| iOS 26 | iOS 26, menu open | Android, menu open |
| --- | --- | --- |
| ![Four buttons and a "…" button on iOS 26](/img/components/buttongroup/overflow-ios.webp) | ![The overflow menu with the hidden buttons on iOS 26](/img/components/buttongroup/overflow-menu-ios.webp) | ![Material's overflow menu with the hidden buttons on Android](/img/components/buttongroup/overflow-menu-android.webp) |

### Styling

`color`, `tintColor`, `labelStyle` and the Android colors apply to every button; see [Button styling](/components/button#styling). Without them the buttons take their colors from the theme, including the brand color set with [`useNativeTheme`](/guides/theming) on Android.

## SplitButton

A main action with an attached menu, like "Send ▾": the main button calls `onPress`, and the trailing button opens a menu with the same items as [ContextMenu](/components/contextmenu).

```tsx
import { SplitButton } from 'react-native-platform-components';

<SplitButton
  label="Reply"
  menu={[
    { id: 'reply-all', title: 'Reply All', image: { ios: 'arrowshape.turn.up.left.2', android: 'reply_all' } },
    { id: 'forward', title: 'Forward', image: { ios: 'arrowshape.turn.up.right', android: 'forward' } },
    { id: 'delete', title: 'Delete', image: { ios: 'trash', android: 'delete' }, attributes: { destructive: true } },
  ]}
  menuAccessibilityLabel="Reply options"
  onPress={reply}
  onMenuSelect={(id) => handle(id)}
/>
```

| Platform | Split button |
| -------- | ------------ |
| Android  | Material 3 `MaterialSplitButton`: the main button and a trailing button with Material's chevron (`m3_split_button_chevron_avd`), joined with a small gap and small inner corners. The trailing button is checked while the `PopupMenu` is open, which turns the chevron up and rounds its inner corners, as Material's split button does; it keeps the main button's colors. Spacing and chevron size follow the Material split button tokens for each `size` |
| iOS      | UIKit has no split button, so it is a `UIButton` joined to a chevron (`chevron.down`) `UIButton` that shows its `UIMenu` as the primary action (`showsMenuAsPrimaryAction`), 2pt apart like a connected [ButtonGroup](#standard-and-connected). Both take the variant's `UIButton.Configuration` |

It is a separate component rather than a ButtonGroup option because a split button is one action, not a group: it has one label and icon, no selection and no overflow. It is built on the same native view as ButtonGroup.

| iOS 26 | iOS 26, menu open |
| --- | --- |
| ![Split buttons in the filled, tonal and outlined variants on iOS 26](/img/components/buttongroup/split-ios.webp) | ![A split button's menu open on iOS 26](/img/components/buttongroup/split-menu-ios.webp) |

| Android | Android, menu open |
| --- | --- |
| ![Material split buttons in the filled, tonal and outlined variants on Android](/img/components/buttongroup/split-android.webp) | ![A Material split button's menu open, the chevron turned up, on Android](/img/components/buttongroup/split-menu-android.webp) |

### Props

| Prop                     | Type                                                     | Description                                                                                  |
| ------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `label`                  | `string`                                                 | Text of the main button                                                                      |
| `icon`                   | `PlatformIcon`                                           | Icon of the main button. See [Button icons](/components/button#icons)                        |
| `accessibilityLabel`     | `string`                                                 | Screen-reader label of the main button. Defaults to `label`                                  |
| `menu`                   | `ContextMenuAction[]`                                    | The menu the trailing button opens (required)                                                |
| `menuAccessibilityLabel` | `string`                                                 | Screen-reader label of the trailing button. Default: `'More options'`                        |
| `variant`                | `'filled' \| 'tonal' \| 'outlined' \| 'elevated' \| 'glass' \| 'prominentGlass' \| 'clearGlass' \| 'prominentClearGlass'` | Emphasis. `text` has no container to split. Default: `'filled'` |
| `size`                   | `'xsmall' \| 'small' \| 'medium' \| 'large' \| 'xlarge'` | Size. Default: `'small'`                                                                  |
| `disabled`               | `boolean`                                                | Disables both buttons                                                                        |
| `color`                  | `ColorValue`                                             | Container (background) color                                                                 |
| `tintColor`              | `ColorValue`                                             | Label and icon color                                                                         |
| `labelStyle`             | `{ fontFamily?, fontSize?, fontWeight?, fontStyle? }`    | Label font                                                                                   |
| `haptics`                | `'selection' \| 'light' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error' \| 'none'` | Haptic played when the main button is pressed or a menu item is picked; an item's own `haptics` wins. See [Haptics](/guides/haptics). Default: none |
| `onPress`                | `() => void`                                             | Called when the main button is pressed                                                       |
| `onMenuSelect`           | `(id: string, title: string) => void`                    | Called when a menu item is picked                                                            |
| `onMenuOpen`             | `() => void`                                             | Called when the menu opens                                                                   |
| `onMenuClose`            | `() => void`                                             | Called when the menu closes                                                                  |
| `android`                | `{ rippleColor?, strokeColor?, material? }`              | As on [Button](/components/button#android-props-android)                                     |

SplitButton has no `shape` prop: Material's split button is always round on the outside, and on iOS the buttons keep UIKit's corner style. On the web only the main button renders.
