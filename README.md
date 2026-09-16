# react-native-platform-components

[![npm version](https://img.shields.io/npm/v/react-native-platform-components.svg)](https://www.npmjs.com/package/react-native-platform-components)
[![npm downloads](https://img.shields.io/npm/dm/react-native-platform-components.svg)](https://www.npmjs.com/package/react-native-platform-components)
[![CI](https://github.com/JarX-Concepts/react-native-platform-components/actions/workflows/ci.yml/badge.svg)](https://github.com/JarX-Concepts/react-native-platform-components/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/react-native-platform-components.svg)](./LICENSE)

Native **DatePicker**, **ContextMenu**, **SelectionMenu**, **SegmentedControl** and **LiquidGlass** for React Native. Every component is the real platform widget on both iOS and Android (UIKit and SwiftUI on iOS, Material 3 on Android), behind one typed, declarative API. No JavaScript re-implementations.

```sh
npm install react-native-platform-components
```

```tsx
import { SegmentedControl } from 'react-native-platform-components';

<SegmentedControl
  segments={[
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
  ]}
  selectedValue={range}
  onSelect={setRange}
/>;
```

That renders `UISegmentedControl` on iOS and Material 3 segmented buttons (`MaterialButtonToggleGroup`) on Android. The library needs the New Architecture: React Native 0.81+, or Expo SDK 54+ with a dev client (not Expo Go). See [Installation](#installation).

## Why this library

| You need              | This library                                                                                                                                             | Common alternative                                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Date and time pickers | `UIDatePicker` on iOS; `MaterialDatePicker` / `MaterialTimePicker` or the AppCompat dialogs on Android. Declarative `visible` prop, modal or embedded.   | `@react-native-community/datetimepicker`: platform dialogs on Android; Material 3 pickers are an [open request](https://github.com/react-native-datetimepicker/datetimepicker/issues/790). |
| Segmented control     | `UISegmentedControl` on iOS; Material 3 segmented buttons on Android. Icons and badges on both.                                                          | `@react-native-segmented-control/segmented-control`: native on iOS, drawn in JavaScript on Android.                                                                                        |
| Context menu          | `UIContextMenuInteraction` on iOS; `PopupMenu` on Android. Long-press gesture or modal trigger, icons on both.                                           | `zeego`: native on both platforms, through two additional native dependencies (`react-native-ios-context-menu`, `@react-native-menu/menu`).                                                |
| Selection menu        | System menus on iOS; Material exposed dropdown or `Spinner` on Android. Headless or inline.                                                              | `@react-native-picker/picker`: wheel picker on iOS, dialog or dropdown `Spinner` on Android; no menu-style presentation.                                                                   |
| Liquid glass          | `UIGlassEffect` on iOS 26+, a fallback `View` elsewhere, `isLiquidGlassSupported` flag.                                                                  | `@callstack/liquid-glass`, `expo-glass-effect`: same idea on iOS; here it ships with the components above.                                                                                 |
| All of the above      | One package, one API shape (platform-only props under `ios={{ }}` and `android={{ }}`), Fabric + Codegen typed bindings, Expo config plugin, TypeScript. | Four or five packages with different conventions, install steps and upgrade cadences.                                                                                                      |

### Components

- **DatePicker** – native date & time pickers with modal and embedded presentations
- **ContextMenu** – native context menus with long-press activation (UIContextMenuInteraction on iOS, PopupMenu on Android)
- **SelectionMenu** – native selection menus (Material on Android, system menus on iOS)
- **SegmentedControl** – native segmented controls (UISegmentedControl on iOS, MaterialButtonToggleGroup on Android)
- **LiquidGlass** – iOS 26+ glass morphism effects (UIGlassEffect on iOS, fallback View on Android)

<table>
  <tr>
    <td align="center"><strong>iOS DatePicker</strong></td>
    <td align="center"><strong>Android DatePicker</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-datepicker.gif" height="550" /></td>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-datepicker.gif" height="550" /></td>
  </tr>
  <tr>
    <td align="center"><strong>iOS ContextMenu</strong></td>
    <td align="center"><strong>Android ContextMenu</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-contextmenu.gif" height="550" /></td>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-contextmenu.gif" height="550" /></td>
  </tr>
  <tr>
    <td align="center"><strong>iOS SelectionMenu</strong></td>
    <td align="center"><strong>Android SelectionMenu</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-selectionmenu.gif" height="550" /></td>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-selectionmenu.gif" height="550" /></td>
  </tr>
  <tr>
    <td align="center"><strong>iOS SegmentedControl</strong></td>
    <td align="center"><strong>Android SegmentedControl</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-segmentedcontrol.gif" height="550" /></td>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-segmentedcontrol.gif" height="550" /></td>
  </tr>
  <tr>
    <td align="center"><strong>iOS LiquidGlass</strong></td>
    <td align="center"><strong>Android LiquidGlass</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-liquidglass.gif" height="550" /></td>
    <td align="center"><em>iOS 26+ only</em><br/><br/>On Android, renders as a<br/>regular View with optional<br/>fallback background color.</td>
  </tr>
</table>

**Have a component request?** If there's a native UI component you'd like to see added, [open an issue](https://github.com/JarX-Concepts/react-native-platform-components/issues/new) describing the component and its native APIs on iOS and Android.

**Using it in a shipped app?** Open a PR to list it here.

---

## Installation

```sh
npm install react-native-platform-components
# or
yarn add react-native-platform-components
```

### iOS

```sh
cd ios
pod install
```

- Minimum iOS version: **iOS 13+**
- Uses `UIDatePicker`, SwiftUI Menu, and `UIContextMenuInteraction`

### Android

- Uses native Android Views with Material Design (including `PopupMenu` for context menus)
- Supports **Material 3** styling
- Works with the default React Native and Expo AppCompat theme. To have the Material 3 components use your app's colors, see [Android Theme Configuration](#android-theme-configuration)

### Expo (Managed Workflow)

> **Note:** This library is **not supported in Expo Go**. It requires native code and must be used with [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/) or EAS Build.

```sh
npx expo install react-native-platform-components
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

The library includes an Expo config plugin that handles all native configuration automatically. No manual native setup is required.

**EAS Build:**

```sh
eas build --platform ios
eas build --platform android
```

**Config Plugin:**

Add to your `app.json`. The `android.theme` option re-parents Expo's generated `AppTheme` onto Material 3, which `SegmentedControl` and the `material: 'm3'` modes use for their colors (see [Android Theme Configuration](#android-theme-configuration)):

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-platform-components/app.plugin",
        { "android": { "theme": "material3" } }
      ]
    ]
  }
}
```

For a complete working example, see the [`example-expo/`](./example-expo) directory.

---

## React Native New Architecture

This library is built for the **React Native New Architecture** (Fabric + TurboModules).

| Feature               | Status                             |
| --------------------- | ---------------------------------- |
| Fabric (New Renderer) | Supported                          |
| Codegen               | Used for type-safe native bindings |
| TurboModules          | N/A (view components only)         |
| Old Architecture      | Not supported                      |

**Compatibility:**

| Platform     | Minimum                                                   |
| ------------ | --------------------------------------------------------- |
| React Native | 0.81 with the New Architecture enabled                    |
| Expo SDK     | 54, with a dev client or EAS Build (not Expo Go)          |
| React        | 19                                                        |
| iOS          | 13 (LiquidGlass needs iOS 26)                             |
| Android      | API 24 (Android 7.0); Material Components 1.12 is bundled |

**Requirements:**

- New Architecture must be enabled in your app
- For bare React Native: set `newArchEnabled=true` in `gradle.properties` (Android) and use the `RCT_NEW_ARCH_ENABLED` flag (iOS)
- For Expo: set `"newArchEnabled": true` in `app.json`

---

## Quick Start

### DatePicker (Modal)

```tsx
import { DatePicker } from 'react-native-platform-components';

export function Example() {
  const [date, setDate] = React.useState<Date | null>(null);
  const [visible, setVisible] = React.useState(false);

  return (
    <>
      <Button title="Pick date" onPress={() => setVisible(true)} />

      <DatePicker
        date={date}
        visible={visible}
        presentation="modal"
        mode="date"
        onConfirm={(d, confirmed) => {
          setDate(d);
          if (confirmed) setVisible(false);
        }}
        onClosed={() => setVisible(false)}
        ios={{ preferredStyle: 'inline' }}
        android={{ material: 'system' }}
      />
    </>
  );
}
```

### DatePicker (Embedded)

```tsx
import { DatePicker } from 'react-native-platform-components';

export function Example() {
  const [date, setDate] = React.useState<Date | null>(new Date());

  return (
    <DatePicker
      date={date}
      presentation="embedded"
      mode="date"
      onConfirm={(d, confirmed) => setDate(d)}
      ios={{ preferredStyle: 'inline' }}
      android={{ material: 'system' }}
    />
  );
}
```

---

### ContextMenu (Gesture Mode)

```tsx
import { ContextMenu } from 'react-native-platform-components';
import { Platform, View, Text } from 'react-native';

export function Example() {
  const [lastAction, setLastAction] = React.useState<string | null>(null);

  return (
    <ContextMenu
      title="Options"
      actions={[
        {
          id: 'copy',
          title: 'Copy',
          image: Platform.OS === 'ios' ? 'doc.on.doc' : 'content_copy',
        },
        {
          id: 'share',
          title: 'Share',
          image: Platform.OS === 'ios' ? 'square.and.arrow.up' : 'share',
        },
        {
          id: 'delete',
          title: 'Delete',
          image: Platform.OS === 'ios' ? 'trash' : 'delete',
          attributes: { destructive: true },
        },
      ]}
      onPressAction={(id, title) => setLastAction(title)}
    >
      <View
        style={{ padding: 20, backgroundColor: '#E8F4FD', borderRadius: 8 }}
      >
        <Text>Long-press me</Text>
      </View>
    </ContextMenu>
  );
}
```

### ContextMenu (Modal Mode)

```tsx
import { ContextMenu } from 'react-native-platform-components';
import { View, Text } from 'react-native';

export function Example() {
  return (
    <ContextMenu
      title="Actions"
      actions={[
        { id: 'edit', title: 'Edit' },
        { id: 'duplicate', title: 'Duplicate' },
        { id: 'delete', title: 'Delete', attributes: { destructive: true } },
      ]}
      trigger="tap" // or "longPress" (default)
      onPressAction={(id) => console.log('Selected:', id)}
    >
      <View style={{ padding: 16, backgroundColor: '#eee' }}>
        <Text>Tap or long-press me</Text>
      </View>
    </ContextMenu>
  );
}
```

---

### SelectionMenu (Headless)

```tsx
import { SelectionMenu } from 'react-native-platform-components';

const options = [
  { label: 'Apple', data: 'apple' },
  { label: 'Banana', data: 'banana' },
  { label: 'Orange', data: 'orange' },
];

export function Example() {
  const [visible, setVisible] = React.useState(false);
  const [value, setValue] = React.useState<string | null>(null);

  return (
    <>
      <Button title="Open menu" onPress={() => setVisible(true)} />

      <SelectionMenu
        options={options}
        selected={value}
        visible={visible}
        onSelect={(data) => {
          setValue(data);
          setVisible(false);
        }}
        onRequestClose={() => setVisible(false)}
      />
    </>
  );
}
```

### SelectionMenu (Inline)

```tsx
import { SelectionMenu } from 'react-native-platform-components';

const options = [
  { label: 'Apple', data: 'apple' },
  { label: 'Banana', data: 'banana' },
  { label: 'Orange', data: 'orange' },
];

export function Example() {
  const [value, setValue] = React.useState<string | null>(null);

  return (
    <SelectionMenu
      options={options}
      selected={value}
      presentation="embedded"
      placeholder="Select fruit"
      onSelect={(data) => setValue(data)}
      android={{ material: 'm3' }}
    />
  );
}
```

---

### SegmentedControl

```tsx
import { SegmentedControl } from 'react-native-platform-components';

const segments = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

export function Example() {
  const [selected, setSelected] = React.useState('day');

  return (
    <SegmentedControl
      segments={segments}
      selectedValue={selected}
      onSelect={(value) => setSelected(value)}
    />
  );
}
```

### SegmentedControl (With Icons)

```tsx
import { SegmentedControl } from 'react-native-platform-components';

const segments = [
  {
    label: 'List',
    value: 'list',
    // Native symbol on each platform, no Platform.OS branching
    icon: {
      ios: { type: 'sfSymbol', name: 'list.bullet' },
      android: { type: 'drawable', name: 'list_bullet' },
    },
  },
  {
    label: 'Alerts',
    value: 'alerts',
    // One image asset shared by both platforms, tinted like a template
    icon: { type: 'image', source: require('./bell.png') },
  },
];

export function Example() {
  const [selected, setSelected] = React.useState('list');

  return (
    <SegmentedControl
      segments={segments}
      selectedValue={selected}
      onSelect={(value) => setSelected(value)}
      // 'auto' | 'labeled' | 'unlabeled'
      labelVisibility="auto"
      ios={{ apportionsSegmentWidthsByContent: true }}
    />
  );
}
```

---

### LiquidGlass

```tsx
import {
  LiquidGlass,
  isLiquidGlassSupported,
} from 'react-native-platform-components';
import { View, Text, Image } from 'react-native';

export function Example() {
  return (
    <View style={{ flex: 1 }}>
      {/* Background content */}
      <Image
        source={{ uri: 'https://example.com/photo.jpg' }}
        style={{ flex: 1 }}
      />

      {/* Glass effect overlay */}
      <LiquidGlass
        style={{
          position: 'absolute',
          top: 50,
          left: 20,
          right: 20,
          padding: 20,
        }}
        cornerRadius={20}
        ios={{
          effect: 'regular',
          interactive: true,
          colorScheme: 'system',
        }}
        android={{
          fallbackBackgroundColor: '#FFFFFF80',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '600' }}>
          {isLiquidGlassSupported ? 'Glass Effect!' : 'Fallback View'}
        </Text>
      </LiquidGlass>
    </View>
  );
}
```

---

## Components

## DatePicker

Native date & time picker using **platform system pickers**.

### Props

| Prop           | Type                                                    | Description                                                                        |
| -------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `date`         | `Date \| null`                                          | Controlled date value                                                              |
| `minDate`      | `Date \| null`                                          | Minimum selectable date                                                            |
| `maxDate`      | `Date \| null`                                          | Maximum selectable date                                                            |
| `locale`       | `string`                                                | Locale identifier (e.g., `'en-US'`)                                                |
| `timeZoneName` | `string`                                                | Time zone identifier                                                               |
| `mode`         | `'date' \| 'time' \| 'dateAndTime' \| 'countDownTimer'` | Picker mode                                                                        |
| `presentation` | `'modal' \| 'embedded'`                                 | Presentation style                                                                 |
| `visible`      | `boolean`                                               | Controls modal visibility (modal mode only)                                        |
| `onConfirm`    | `(date: Date, confirmed: boolean) => void`              | Called on date change; `confirmed` is `true` for deliberate selections (see below) |
| `onClosed`     | `() => void`                                            | Called when modal is dismissed                                                     |

### iOS Props (`ios`)

| Prop                       | Type                                               | Description                                                                           |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `preferredStyle`           | `'automatic' \| 'compact' \| 'inline' \| 'wheels'` | iOS date picker style                                                                 |
| `countDownDurationSeconds` | `number`                                           | Duration for countdown timer mode                                                     |
| `minuteInterval`           | `number`                                           | Minute interval (1-30)                                                                |
| `roundsToMinuteInterval`   | `'inherit' \| 'round' \| 'noRound'`                | Rounding behavior                                                                     |
| `showConfirmToolbar`       | `boolean`                                          | Modal only. Show Cancel/Done toolbar below the picker. Defaults to `true`. See below. |

### Android Props (`android`)

| Prop                  | Type               | Description                                                            |
| --------------------- | ------------------ | ---------------------------------------------------------------------- |
| `firstDayOfWeek`      | `number`           | First day of week (1-7, Sunday=1)                                      |
| `material`            | `'system' \| 'm3'` | Material Design style (modal only; embedded always uses system picker) |
| `dialogTitle`         | `string`           | Custom dialog title                                                    |
| `positiveButtonTitle` | `string`           | Custom confirm button text                                             |
| `negativeButtonTitle` | `string`           | Custom cancel button text                                              |

### The `confirmed` Flag

`onConfirm` fires on every date/time change, but the second argument (`confirmed`) lets you distinguish between browsing and deliberate selections:

| Platform / Mode      | Every change                              | Deliberate selection                 |
| -------------------- | ----------------------------------------- | ------------------------------------ |
| **iOS modal**        | `confirmed: false` (user still adjusting) | `confirmed: true` (tapping **Done**) |
| **iOS embedded**     | `confirmed: true`                         | —                                    |
| **Android modal**    | —                                         | `confirmed: true` (pressing OK)      |
| **Android embedded** | `confirmed: true`                         | —                                    |

On iOS in modal presentation, the picker is shown in a popover with a Cancel/Done toolbar below it. Tapping **Done** emits `confirmed: true`; tapping **Cancel** or outside the popover calls `onClosed`. Set `ios.showConfirmToolbar: false` to hide the toolbar — in that mode `confirmed: true` never fires, and your app is expected to drive dismissal by flipping `visible` off (reading the current date from the stream of `confirmed: false` events). This only makes UX sense paired with `ios.preferredStyle: 'inline'`.

A common pattern is to close the modal only on a confirmed selection:

```tsx
<DatePicker
  date={date}
  visible={visible}
  presentation="modal"
  mode="time"
  onConfirm={(d, confirmed) => {
    setDate(d);
    if (confirmed) setVisible(false);
  }}
  onClosed={() => setVisible(false)}
/>
```

---

## ContextMenu

Native context menu that wraps content and responds to **long-press** or **tap** gestures.

### Props

| Prop            | Type                              | Description                                 |
| --------------- | --------------------------------- | ------------------------------------------- |
| `title`         | `string`                          | Menu title (shown as header on iOS)         |
| `actions`       | `ContextMenuAction[]`             | Array of menu actions                       |
| `disabled`      | `boolean`                         | Disables the menu                           |
| `trigger`       | `'longPress' \| 'tap'`            | How the menu opens (default: `'longPress'`) |
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
| `attributes` | `{ destructive?, disabled?, hidden? }` | Action attributes                                 |
| `state`      | `'off' \| 'on' \| 'mixed'`             | Checkmark state                                   |
| `subactions` | `ContextMenuAction[]`                  | Nested actions for submenu                        |

### iOS Props (`ios`)

| Prop            | Type      | Description                       |
| --------------- | --------- | --------------------------------- |
| `enablePreview` | `boolean` | Enable preview when long-pressing |

### Android Props (`android`)

| Prop             | Type                | Description                                    |
| ---------------- | ------------------- | ---------------------------------------------- |
| `anchorPosition` | `'left' \| 'right'` | Anchor position for the popup menu             |
| `visible`        | `boolean`           | Programmatic visibility control (Android only) |

### Trigger Modes

- **Long-Press** (default): Long-press on wrapped content triggers the menu.
- **Tap** (`trigger="tap"`): Single tap on wrapped content triggers the menu.
- **Programmatic** (Android only): Use `android.visible` to control menu visibility programmatically. iOS does not support programmatic menu opening due to platform limitations.

### Icon Support

- **iOS**: Use SF Symbol names (e.g., `'trash'`, `'square.and.arrow.up'`, `'doc.on.doc'`)
- **Android**: Use drawable resource names or Material icon names

---

## SelectionMenu

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

> **Note:** On iOS, modal mode uses a custom popover to enable programmatic presentation. For the full native menu experience (system animations, scroll physics), use embedded mode. This is an intentional trade-off: modal gives you control over the trigger UI, embedded gives you the complete system menu behavior.

---

## SegmentedControl

Native segmented control using **UISegmentedControl** on iOS and **MaterialButtonToggleGroup** on Android.

### Props

| Prop                   | Type                                                  | Description                                                                                                                          |
| ---------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `segments`             | `SegmentedControlSegment[]`                           | Array of segments to display                                                                                                         |
| `selectedValue`        | `string \| null`                                      | Currently selected segment's `value`                                                                                                 |
| `disabled`             | `boolean`                                             | Disables the entire control                                                                                                          |
| `labelVisibility`      | `'auto' \| 'labeled' \| 'unlabeled'`                  | How labels and icons combine. See [Label visibility](#label-visibility). Default: `'auto'`                                           |
| `selectedSegmentColor` | `ColorValue`                                          | Background of the selected segment                                                                                                   |
| `activeTintColor`      | `ColorValue`                                          | Text and icon color of the selected segment                                                                                          |
| `inactiveTintColor`    | `ColorValue`                                          | Text and icon color of unselected segments                                                                                           |
| `labelStyle`           | `{ fontFamily?, fontSize?, fontWeight?, fontStyle? }` | Font for segment labels. See [Styling](#styling)                                                                                     |
| `badgeStyle`           | `{ backgroundColor?, color? }`                        | Colors for segment badges. See [Badges](#badges)                                                                                     |
| `onSelect`             | `(value: string, index: number) => void`              | Called when user selects a segment                                                                                                   |
| `onDeselect`           | `() => void`                                          | Called when the user clears the selection by tapping the selected segment. Android only; requires `android.selectionRequired: false` |

### SegmentedControlSegment

| Property             | Type                   | Description                                                                                                      |
| -------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `label`              | `string`               | Display text for the segment                                                                                     |
| `value`              | `string`               | Unique value returned in callbacks                                                                               |
| `disabled`           | `boolean`              | Disables this specific segment                                                                                   |
| `icon`               | `SegmentedControlIcon` | Optional icon. See [Icon Support](#icon-support-1)                                                               |
| `badge`              | `string \| number`     | Badge at the segment's top-right corner, e.g. an unread count. See [Badges](#badges)                             |
| `accessibilityLabel` | `string`               | Screen-reader label. Defaults to `label`. On iOS it applies to icon segments; text segments announce their title |

### iOS Props (`ios`)

| Prop                               | Type      | Description                                                                |
| ---------------------------------- | --------- | -------------------------------------------------------------------------- |
| `momentary`                        | `boolean` | If true, segments don't show selected state                                |
| `apportionsSegmentWidthsByContent` | `boolean` | If true, segment widths are proportional to content                        |
| `selectedSegmentTintColor`         | `string`  | **Deprecated.** Use `selectedSegmentColor`, which works on both platforms. |

### Android Props (`android`)

| Prop                | Type         | Description                                                                                                                                 |
| ------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `selectionRequired` | `boolean`    | If true (default), one segment must always be selected. Set to `false` to let a tap on the selected segment clear it and fire `onDeselect`. |
| `rippleColor`       | `ColorValue` | Ripple shown while pressing a segment                                                                                                       |
| `strokeColor`       | `ColorValue` | Outline color of the segments                                                                                                               |

### Icon Support

`icon` accepts a single source, or an `{ ios, android }` pair so you never branch on `Platform.OS`:

| Shape                                  | iOS                               | Android                           |
| -------------------------------------- | --------------------------------- | --------------------------------- |
| `'name'` (string)                      | SF Symbol name                    | Drawable resource name            |
| `{ type: 'sfSymbol', name }`           | SF Symbol                         | Ignored (segment shows its label) |
| `{ type: 'drawable', name }`           | Ignored (segment shows its label) | Drawable from `res/drawable`      |
| `{ type: 'image', source, tinted? }`   | Image asset or `{ uri }`          | Image asset or `{ uri }`          |
| `{ ios: <source>, android: <source> }` | Uses `ios`                        | Uses `android`                    |

```tsx
// A bundled asset works everywhere and is tinted like a template.
icon: { type: 'image', source: require('./icons/bell.png') }

// Keep the original colors of a full-color image.
icon: { type: 'image', source: require('./icons/logo.png'), tinted: false }

// Remote images load asynchronously; pass `scale` for @2x/@3x artwork.
icon: { type: 'image', source: { uri: 'https://example.com/icon@2x.png', scale: 2 } }
```

Image icons render at their point size, so ship `@2x` / `@3x` variants sized around 18–22 points. Local assets load synchronously in release builds; in development they stream from Metro and the segment shows its label until the image arrives.

### Label visibility

`UISegmentedControl` shows either a title or an image per segment, while Material buttons can show both. `labelVisibility` makes the outcome predictable:

| Value              | iOS                                       | Android               |
| ------------------ | ----------------------------------------- | --------------------- |
| `'auto'` (default) | Icon when the segment has one, else label | Icon and label        |
| `'labeled'`        | Label only (icon is not shown)            | Icon and label        |
| `'unlabeled'`      | Icon when the segment has one, else label | Icon only, else label |

Screen readers announce the label (or `accessibilityLabel`) in every mode on both platforms.

### Styling

Colors take any React Native `ColorValue` (hex, `rgba()`, named colors, `PlatformColor`, `DynamicColorIOS`). Fonts follow the `Text` style conventions, and each field falls back to the platform default.

```tsx
<SegmentedControl
  segments={segments}
  selectedValue={selected}
  onSelect={setSelected}
  selectedSegmentColor="#FF6B35"
  activeTintColor="white"
  inactiveTintColor="#8E8E93"
  labelStyle={{ fontWeight: '700', fontSize: 14 }}
  android={{ rippleColor: 'rgba(255, 107, 53, 0.25)', strokeColor: '#FF6B35' }}
/>
```

| Prop                   | iOS                                   | Android                                   |
| ---------------------- | ------------------------------------- | ----------------------------------------- |
| `selectedSegmentColor` | `selectedSegmentTintColor` (the pill) | Checked button background                 |
| `activeTintColor`      | Selected title / template image color | Checked button text and icon tint         |
| `inactiveTintColor`    | Normal title / template image color   | Unchecked button text and icon tint       |
| `labelStyle`           | Title font (default: 13pt system)     | Button typeface and size (default: theme) |
| `android.rippleColor`  | —                                     | Press ripple                              |
| `android.strokeColor`  | —                                     | Button outline                            |

Images with `tinted: false` keep their own colors and ignore the tint props.

### Badges

Give a segment a `badge` to show a count or short status at its top-right corner. Numbers render as-is, so format them yourself (`'99+'`); `undefined` hides the badge.

```tsx
<SegmentedControl
  segments={[
    { label: 'Inbox', value: 'inbox', badge: unreadCount || undefined },
    { label: 'Sent', value: 'sent' },
    { label: 'Drafts', value: 'drafts', badge: 'new' },
  ]}
  selectedValue={mailbox}
  onSelect={setMailbox}
  badgeStyle={{ backgroundColor: '#5856D6', color: 'white' }}
/>
```

- **iOS**: a capsule label drawn over the segment (UISegmentedControl has no badge API). Defaults to system red with white text.
- **Android**: a Material `BadgeDrawable` attached to the button. Defaults to the theme's error color.
- Screen readers announce the badge with the segment label ("Inbox, 3").

---

## LiquidGlass

Native glass morphism effect using **UIGlassEffect** on iOS 26+. On Android and older iOS versions, renders as a regular View with optional fallback styling.

> **Note:** LiquidGlass requires **iOS 26+** (Xcode 16+). On older iOS versions and Android, the component renders children without the glass effect. Use `isLiquidGlassSupported` to check availability and provide fallback UI.

### Props

| Prop           | Type        | Description                                       |
| -------------- | ----------- | ------------------------------------------------- |
| `cornerRadius` | `number`    | Corner radius for the glass effect (default: `0`) |
| `children`     | `ReactNode` | Content to render inside the glass container      |

### iOS Props (`ios`)

| Prop          | Type                             | Description                                          |
| ------------- | -------------------------------- | ---------------------------------------------------- |
| `effect`      | `'clear' \| 'regular' \| 'none'` | Glass effect intensity (default: `'regular'`)        |
| `interactive` | `boolean`                        | Enable touch interaction feedback (default: `false`) |
| `tintColor`   | `string`                         | Overlay tint color (hex string)                      |
| `colorScheme` | `'light' \| 'dark' \| 'system'`  | Appearance mode (default: `'system'`)                |

### Android Props (`android`)

| Prop                      | Type     | Description                                    |
| ------------------------- | -------- | ---------------------------------------------- |
| `fallbackBackgroundColor` | `string` | Background color when glass effect unavailable |

### Constants

| Export                   | Type      | Description                          |
| ------------------------ | --------- | ------------------------------------ |
| `isLiquidGlassSupported` | `boolean` | `true` on iOS 26+, `false` otherwise |

### Effect Modes

- **`'regular'`** (default): Standard glass blur intensity with full glass morphism effect
- **`'clear'`**: More transparent, subtle glass effect
- **`'none'`**: No glass effect (useful for animating materialization/dematerialization)

### Platform Behavior

| Platform      | iOS 26+             | iOS < 26    | Android      |
| ------------- | ------------------- | ----------- | ------------ |
| Glass Effect  | Full glass morphism | No effect   | No effect    |
| Corner Radius | Applied             | Applied     | Applied      |
| Tint Color    | Supported           | Ignored     | Ignored      |
| Interactive   | Supported           | Ignored     | Ignored      |
| Fallback BG   | N/A                 | Transparent | Configurable |

### Usage Tips

1. **Check support first**: Use `isLiquidGlassSupported` to conditionally render fallback UI
2. **Background content**: Glass effects work best over images or colorful backgrounds
3. **Interactive mode**: Only applies on mount; cannot be toggled after initial render
4. **Android fallback**: Set `android.fallbackBackgroundColor` for a semi-transparent background

---

## Design Philosophy

- **Native first** — no JS re-implementation of pickers
- **Headless-friendly** — works with any custom UI
- **Codegen-safe** — string unions & sentinel values for type safety
- **Predictable behavior** — no surprise re-renders or layout hacks
- **Platform conventions** — respects native UX patterns

---

## Theming

This library does not expose theming props. Components inherit their appearance from your app's native platform theme.

- **iOS**: Components follow system appearance (light/dark mode) and use system-defined styles (e.g., `UIBlurEffect` for menu backgrounds). These are not customizable per-component.
- **Android**: Components respect your app's Material Theme. Customize via your `styles.xml` or Material 3 theme configuration.

This is intentional. The goal is native fidelity, not pixel-level customization. If you need custom styling beyond what the platform theme provides, this library may not be the right fit.

---

## Color Formats

All color props in this library support the same formats as React Native's `backgroundColor`:

| Format | Example                           | Description                        |
| ------ | --------------------------------- | ---------------------------------- |
| Hex    | `#RGB`, `#RRGGBB`, `#RRGGBBAA`    | Standard hex colors                |
| RGB    | `rgb(255, 0, 0)`                  | RGB values (0-255)                 |
| RGBA   | `rgba(255, 0, 0, 0.5)`            | RGB with alpha (0-1)               |
| HSL    | `hsl(0, 100%, 50%)`               | Hue (0-360), saturation, lightness |
| HSLA   | `hsla(0, 100%, 50%, 0.5)`         | HSL with alpha (0-1)               |
| Named  | `red`, `steelblue`, `transparent` | CSS named colors                   |

**Props that accept colors:**

- `ContextMenu`: `imageColor` (icon tint)
- `SegmentedControl`: `selectedSegmentColor`, `activeTintColor`, `inactiveTintColor`, `badgeStyle.backgroundColor`, `badgeStyle.color`, `android.rippleColor`, `android.strokeColor` (these also accept `PlatformColor` / `DynamicColorIOS`)
- `LiquidGlass`: `ios.tintColor`, `android.fallbackBackgroundColor`

```tsx
// All of these are equivalent
<ContextMenu actions={[{ id: '1', title: 'Red', imageColor: '#FF0000' }]} />
<ContextMenu actions={[{ id: '1', title: 'Red', imageColor: 'rgb(255, 0, 0)' }]} />
<ContextMenu actions={[{ id: '1', title: 'Red', imageColor: 'hsl(0, 100%, 50%)' }]} />
<ContextMenu actions={[{ id: '1', title: 'Red', imageColor: 'red' }]} />
```

---

## Android Theme Configuration

No theme setup is required to avoid a crash. React Native and Expo templates ship an AppCompat app theme, and every component works with it. When the theme is not a Material theme, `SegmentedControl` and the inline M3 `SelectionMenu` render with Material 3 default colors, the M3 date and time pickers use a built-in Material 3 dialog theme, and the library logs one warning under the `PlatformComponents` tag. Give the app a Material 3 theme to have those components use your app's colors instead.

> Releases up to 0.9.x crashed on mount in these cases (`Cannot find theme attribute materialButtonOutlinedStyle`, `You need to use a Theme.AppCompat theme`). Upgrade to get the fallback behavior.

### Theme Requirements by Component

| Component            | Mode                         | Uses your colors with | Without it                                           |
| -------------------- | ---------------------------- | --------------------- | ---------------------------------------------------- |
| **SegmentedControl** | (always M3)                  | `Theme.Material3.*`   | Material 3 default colors, one warning logged        |
| **DatePicker**       | `android.material: 'm3'`     | `Theme.Material3.*`   | Built-in Material 3 dialog theme, one warning logged |
| **DatePicker**       | `android.material: 'system'` | `Theme.AppCompat.*`   | Built-in AppCompat dialog theme, one warning logged  |
| **SelectionMenu**    | `android.material: 'm3'`     | `Theme.Material3.*`   | Material 3 default colors, one warning logged        |
| **SelectionMenu**    | `android.material: 'system'` | `Theme.AppCompat.*`   | Platform widgets, no theme dependency                |
| **ContextMenu**      | —                            | Any                   | —                                                    |
| **LiquidGlass**      | —                            | Any                   | —                                                    |

`Theme.Material3.*` extends `Theme.AppCompat.*`, so a Material 3 theme satisfies every row.

### Material 3 Theme Setup (Recommended)

**Expo:** pass `{ "android": { "theme": "material3" } }` to the config plugin. See [Expo Configuration](#expo-configuration) below.

**Bare React Native:** change the parent of your app theme in `android/app/src/main/res/values/styles.xml`:

```xml
<resources>
    <style name="AppTheme" parent="Theme.Material3.DayNight.NoActionBar">
        <!-- Keep the items the React Native template put here -->
        <item name="android:editTextBackground">@drawable/rn_edit_text_material</item>
    </style>
</resources>
```

Material 3 supplies a complete default color scheme. To use your own, override the colors you care about in the same style:

```xml
<item name="colorPrimary">@color/md_theme_primary</item>
<item name="colorOnPrimary">@color/md_theme_onPrimary</item>
<item name="colorPrimaryContainer">@color/md_theme_primaryContainer</item>
<item name="colorOnPrimaryContainer">@color/md_theme_onPrimaryContainer</item>
<item name="colorSecondaryContainer">@color/md_theme_secondaryContainer</item>
<item name="colorOnSecondaryContainer">@color/md_theme_onSecondaryContainer</item>
<item name="colorSurface">@color/md_theme_surface</item>
<item name="colorOnSurface">@color/md_theme_onSurface</item>
```

> **Tip:** Use Google's [Material Theme Builder](https://m3.material.io/theme-builder) to generate a complete color scheme, and define the colors in `res/values/colors.xml`.

### Mode Selection Guide

Choose the mode that matches your app's theme:

```tsx
// If your app uses Theme.Material3.* (recommended)
<DatePicker android={{ material: 'm3' }} />
<SelectionMenu android={{ material: 'm3' }} />
<SegmentedControl /> // Always M3

// If your app uses Theme.AppCompat.* (the React Native default)
<DatePicker android={{ material: 'system' }} />
<SelectionMenu android={{ material: 'system' }} />
<SegmentedControl /> // Renders with Material 3 default colors
```

### Expo Configuration

For Expo projects, the config plugin configures the theme for you. With `android.theme` set to `material3`, `npx expo prebuild` re-parents the generated `AppTheme` onto `Theme.Material3.DayNight.NoActionBar` and keeps every item Expo already put there (`colorPrimary`, status bar colors, and so on). Material 3 supplies the remaining colors, so you only add the ones you want to override. Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-platform-components/app.plugin",
        {
          "android": {
            "theme": "material3"
          }
        }
      ]
    ]
  }
}
```

Then run `npx expo prebuild` to apply the configuration. Leave the option out (or set it to `appcompat`) to keep Expo's default AppCompat theme.

---

## Icons

ContextMenu supports icons on menu items. Icons are specified by name and resolved differently on each platform. SegmentedControl accepts the same names, plus image assets and per-platform pairs; see [SegmentedControl Icon Support](#icon-support-1).

### iOS

Use [SF Symbols](https://developer.apple.com/sf-symbols/) names. These are built into iOS and require no additional setup.

```tsx
// Common SF Symbols
image: 'doc.on.doc'; // Copy
image: 'square.and.arrow.up'; // Share
image: 'trash'; // Delete
image: 'pencil'; // Edit
image: 'checkmark.circle'; // Checkmark
```

Browse available symbols using Apple's SF Symbols app or [sfsymbols.com](https://sfsymbols.com).

### Android

Use drawable resource names from your app's `res/drawable` directory. You must add these resources yourself.

```tsx
// Reference drawable by name (without extension)
image: 'content_copy'; // res/drawable/content_copy.xml
image: 'share'; // res/drawable/share.xml
image: 'delete'; // res/drawable/delete.xml
```

**Adding drawable resources:**

1. Create vector drawable XML files in `android/app/src/main/res/drawable/`
2. Use [Material Icons](https://fonts.google.com/icons) as a source — download SVG and convert to Android Vector Drawable
3. Name the file to match the `image` prop value (e.g., `content_copy.xml` for `image: 'content_copy'`)

Example vector drawable (`res/drawable/content_copy.xml`):

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
  <path
      android:fillColor="@android:color/white"
      android:pathData="M16,1L4,1c-1.1,0 -2,0.9 -2,2v14h2L4,3h12L16,1zM19,5L8,5c-1.1,0 -2,0.9 -2,2v14c0,1.1 0.9,2 2,2h11c1.1,0 2,-0.9 2,-2L21,7c0,-1.1 -0.9,-2 -2,-2zM19,21L8,21L8,7h11v14z"/>
</vector>
```

### Cross-platform pattern

Use `Platform.OS` to provide the correct icon name for each platform:

```tsx
import { Platform } from 'react-native';

const actions = [
  {
    id: 'copy',
    title: 'Copy',
    image: Platform.OS === 'ios' ? 'doc.on.doc' : 'content_copy',
  },
  {
    id: 'share',
    title: 'Share',
    image: Platform.OS === 'ios' ? 'square.and.arrow.up' : 'share',
  },
  {
    id: 'delete',
    title: 'Delete',
    image: Platform.OS === 'ios' ? 'trash' : 'delete',
    attributes: { destructive: true },
  },
];
```

---

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

**Have a component request?** If there's a native UI component you'd like to see added, [open an issue](https://github.com/JarX-Concepts/react-native-platform-components/issues/new) describing the component and its native APIs on iOS and Android.

## License

MIT

---

## Author

**Andrew Tosh** — Santa Barbara, California

Full-stack developer with deep experience across entertainment and defense industries, specializing in simulation, visualization, and cross-platform mobile development. Technical focus areas include React Native, Rust, C++, real-time 3D visualization, and game engine technologies.

**Available for contract work** — Always interested in connecting with new clients for mobile development, visualization systems, and related projects. Hit me up at [andrew.tosh@jarxconcepts.com](mailto:andrew.tosh@jarxconcepts.com).

[LinkedIn](https://www.linkedin.com/in/atosh/) · [JarX Concepts](https://github.com/JarX-Concepts)
