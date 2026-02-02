# react-native-platform-components

[![npm version](https://img.shields.io/npm/v/react-native-platform-components.svg)](https://www.npmjs.com/package/react-native-platform-components)
[![npm downloads](https://img.shields.io/npm/dm/react-native-platform-components.svg)](https://www.npmjs.com/package/react-native-platform-components)

High-quality **native UI components for React Native**, implemented with platform-first APIs and exposed through clean, typed JavaScript interfaces.

This library focuses on **true native behavior**, not JavaScript re-implementations.

**Have a component request?** If there's a native UI component you'd like to see added, [open an issue](https://github.com/JarX-Concepts/react-native-platform-components/issues/new) describing the component and its native APIs on iOS and Android.

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

### Components

- **DatePicker** – native date & time pickers with modal and embedded presentations
- **ContextMenu** – native context menus with long-press activation (UIContextMenuInteraction on iOS, PopupMenu on Android)
- **SelectionMenu** – native selection menus (Material on Android, system menus on iOS)
- **SegmentedControl** – native segmented controls (UISegmentedControl on iOS, MaterialButtonToggleGroup on Android)
- **LiquidGlass** – iOS 26+ glass morphism effects (UIGlassEffect on iOS, fallback View on Android)

### Goals

- Feel **100% native** on each platform
- Support modern platform design systems (Material 3 on Android, system pickers on iOS)
- Offer **headless** and **inline** modes for maximum layout control
- Integrate cleanly with **React Native Codegen / Fabric**

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
- **⚠️ Your app may crash if theme is not configured** — See [Android Theme Configuration](#android-theme-configuration) below

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

Add to your `app.json`:

```json
{
  "expo": {
    "plugins": [["react-native-platform-components/app.plugin", {}]]
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

**Tested with:**

- React Native 0.81+ (bare and Expo)
- Expo SDK 54+

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
        onConfirm={(d) => {
          setDate(d);
          setVisible(false);
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
      onConfirm={(d) => setDate(d)}
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
import { Platform } from 'react-native';

const segments = [
  {
    label: 'List',
    value: 'list',
    icon: Platform.OS === 'ios' ? 'list.bullet' : 'list_bullet',
  },
  {
    label: 'Grid',
    value: 'grid',
    icon: Platform.OS === 'ios' ? 'square.grid.2x2' : 'grid_view',
  },
];

export function Example() {
  const [selected, setSelected] = React.useState('list');

  return (
    <SegmentedControl
      segments={segments}
      selectedValue={selected}
      onSelect={(value) => setSelected(value)}
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

| Prop           | Type                                                    | Description                                 |
| -------------- | ------------------------------------------------------- | ------------------------------------------- |
| `date`         | `Date \| null`                                          | Controlled date value                       |
| `minDate`      | `Date \| null`                                          | Minimum selectable date                     |
| `maxDate`      | `Date \| null`                                          | Maximum selectable date                     |
| `locale`       | `string`                                                | Locale identifier (e.g., `'en-US'`)         |
| `timeZoneName` | `string`                                                | Time zone identifier                        |
| `mode`         | `'date' \| 'time' \| 'dateAndTime' \| 'countDownTimer'` | Picker mode                                 |
| `presentation` | `'modal' \| 'embedded'`                                 | Presentation style                          |
| `visible`      | `boolean`                                               | Controls modal visibility (modal mode only) |
| `onConfirm`    | `(date: Date) => void`                                  | Called when user confirms selection         |
| `onClosed`     | `() => void`                                            | Called when modal is dismissed              |

### iOS Props (`ios`)

| Prop                       | Type                                               | Description                       |
| -------------------------- | -------------------------------------------------- | --------------------------------- |
| `preferredStyle`           | `'automatic' \| 'compact' \| 'inline' \| 'wheels'` | iOS date picker style             |
| `countDownDurationSeconds` | `number`                                           | Duration for countdown timer mode |
| `minuteInterval`           | `number`                                           | Minute interval (1-30)            |
| `roundsToMinuteInterval`   | `'inherit' \| 'round' \| 'noRound'`                | Rounding behavior                 |

### Android Props (`android`)

| Prop                  | Type               | Description                                                            |
| --------------------- | ------------------ | ---------------------------------------------------------------------- |
| `firstDayOfWeek`      | `number`           | First day of week (1-7, Sunday=1)                                      |
| `material`            | `'system' \| 'm3'` | Material Design style (modal only; embedded always uses system picker) |
| `dialogTitle`         | `string`           | Custom dialog title                                                    |
| `positiveButtonTitle` | `string`           | Custom confirm button text                                             |
| `negativeButtonTitle` | `string`           | Custom cancel button text                                              |

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

| Prop            | Type                                     | Description                          |
| --------------- | ---------------------------------------- | ------------------------------------ |
| `segments`      | `SegmentedControlSegment[]`              | Array of segments to display         |
| `selectedValue` | `string \| null`                         | Currently selected segment's `value` |
| `disabled`      | `boolean`                                | Disables the entire control          |
| `onSelect`      | `(value: string, index: number) => void` | Called when user selects a segment   |

### SegmentedControlSegment

| Property   | Type      | Description                                       |
| ---------- | --------- | ------------------------------------------------- |
| `label`    | `string`  | Display text for the segment                      |
| `value`    | `string`  | Unique value returned in callbacks                |
| `disabled` | `boolean` | Disables this specific segment                    |
| `icon`     | `string`  | Icon name (SF Symbol on iOS, drawable on Android) |

### iOS Props (`ios`)

| Prop                               | Type      | Description                                         |
| ---------------------------------- | --------- | --------------------------------------------------- |
| `momentary`                        | `boolean` | If true, segments don't show selected state         |
| `apportionsSegmentWidthsByContent` | `boolean` | If true, segment widths are proportional to content |
| `selectedSegmentTintColor`         | `string`  | Tint color for selected segment (hex string)        |

### Android Props (`android`)

| Prop                | Type      | Description                                  |
| ------------------- | --------- | -------------------------------------------- |
| `selectionRequired` | `boolean` | If true, one segment must always be selected |

### Icon Support

Icons work the same as ContextMenu:

- **iOS**: Use SF Symbol names (e.g., `'list.bullet'`, `'square.grid.2x2'`)
- **Android**: Use drawable resource names (e.g., `'list_bullet'`, `'grid_view'`)

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

| Prop            | Type                             | Description                                          |
| --------------- | -------------------------------- | ---------------------------------------------------- |
| `effect`        | `'clear' \| 'regular' \| 'none'` | Glass effect intensity (default: `'regular'`)        |
| `interactive`   | `boolean`                        | Enable touch interaction feedback (default: `false`) |
| `tintColor`     | `string`                         | Overlay tint color (hex string)                      |
| `colorScheme`   | `'light' \| 'dark' \| 'system'`  | Appearance mode (default: `'system'`)                |

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

| Format | Example | Description |
| --- | --- | --- |
| Hex | `#RGB`, `#RRGGBB`, `#RRGGBBAA` | Standard hex colors |
| RGB | `rgb(255, 0, 0)` | RGB values (0-255) |
| RGBA | `rgba(255, 0, 0, 0.5)` | RGB with alpha (0-1) |
| HSL | `hsl(0, 100%, 50%)` | Hue (0-360), saturation, lightness |
| HSLA | `hsla(0, 100%, 50%, 0.5)` | HSL with alpha (0-1) |
| Named | `red`, `steelblue`, `transparent` | CSS named colors |

**Props that accept colors:**

- `ContextMenu`: `imageColor` (icon tint)
- `SegmentedControl`: `ios.selectedSegmentTintColor`
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

> **⚠️ Your app may hard crash if you skip this section.** Android components require specific theme configuration. Components can crash immediately on mount if the required theme attributes are missing.

### Theme Requirements by Component

| Component            | Mode                         | Required Theme      | Crash if Missing |
| -------------------- | ---------------------------- | ------------------- | ---------------- |
| **SegmentedControl** | (always M3)                  | `Theme.Material3.*` | ✅ Yes           |
| **DatePicker**       | `android.material: 'm3'`     | `Theme.Material3.*` | ✅ Yes           |
| **DatePicker**       | `android.material: 'system'` | `Theme.AppCompat.*` | ✅ Yes           |
| **SelectionMenu**    | `android.material: 'm3'`     | `Theme.Material3.*` | ✅ Yes           |
| **SelectionMenu**    | `android.material: 'system'` | `Theme.AppCompat.*` | ✅ Yes           |
| **ContextMenu**      | —                            | Any                 | ❌ No            |
| **LiquidGlass**      | —                            | Any                 | ❌ No            |

### Material 3 Theme Setup (Required for SegmentedControl)

`SegmentedControl` always uses Material 3 widgets (`MaterialButtonToggleGroup`). Your app **must** use a Material 3 theme or the app will crash on component mount.

**1. Update your app theme in `android/app/src/main/res/values/styles.xml`:**

```xml
<resources>
    <!-- Base application theme - MUST inherit from Material3 -->
    <style name="AppTheme" parent="Theme.Material3.DayNight.NoActionBar">
        <!-- Material 3 requires these color attributes -->
        <item name="colorPrimary">@color/md_theme_primary</item>
        <item name="colorOnPrimary">@color/md_theme_onPrimary</item>
        <item name="colorPrimaryContainer">@color/md_theme_primaryContainer</item>
        <item name="colorOnPrimaryContainer">@color/md_theme_onPrimaryContainer</item>
        <item name="colorSecondary">@color/md_theme_secondary</item>
        <item name="colorOnSecondary">@color/md_theme_onSecondary</item>
        <item name="colorSecondaryContainer">@color/md_theme_secondaryContainer</item>
        <item name="colorOnSecondaryContainer">@color/md_theme_onSecondaryContainer</item>
        <item name="colorTertiary">@color/md_theme_tertiary</item>
        <item name="colorOnTertiary">@color/md_theme_onTertiary</item>
        <item name="colorBackground">@color/md_theme_background</item>
        <item name="colorOnBackground">@color/md_theme_onBackground</item>
        <item name="colorSurface">@color/md_theme_surface</item>
        <item name="colorOnSurface">@color/md_theme_onSurface</item>
        <item name="colorError">@color/md_theme_error</item>
        <item name="colorOnError">@color/md_theme_onError</item>
    </style>
</resources>
```

**2. Define your Material 3 colors in `android/app/src/main/res/values/colors.xml`:**

```xml
<resources>
    <!-- Generate these using Material Theme Builder: https://m3.material.io/theme-builder -->
    <color name="md_theme_primary">#6750A4</color>
    <color name="md_theme_onPrimary">#FFFFFF</color>
    <color name="md_theme_primaryContainer">#EADDFF</color>
    <color name="md_theme_onPrimaryContainer">#21005D</color>
    <color name="md_theme_secondary">#625B71</color>
    <color name="md_theme_onSecondary">#FFFFFF</color>
    <color name="md_theme_secondaryContainer">#E8DEF8</color>
    <color name="md_theme_onSecondaryContainer">#1D192B</color>
    <color name="md_theme_tertiary">#7D5260</color>
    <color name="md_theme_onTertiary">#FFFFFF</color>
    <color name="md_theme_background">#FFFBFE</color>
    <color name="md_theme_onBackground">#1C1B1F</color>
    <color name="md_theme_surface">#FFFBFE</color>
    <color name="md_theme_onSurface">#1C1B1F</color>
    <color name="md_theme_error">#B3261E</color>
    <color name="md_theme_onError">#FFFFFF</color>
</resources>
```

> **Tip:** Use Google's [Material Theme Builder](https://m3.material.io/theme-builder) to generate a complete color scheme.

### Common Crash Scenarios

#### Crash: `Cannot find theme attribute materialButtonOutlinedStyle`

**Cause:** Using `SegmentedControl` without a Material 3 theme.

**Fix:** Update your theme to inherit from `Theme.Material3.*`:

```xml
<!-- Change this -->
<style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">

<!-- To this -->
<style name="AppTheme" parent="Theme.Material3.DayNight.NoActionBar">
```

#### Crash: `You need to use a Theme.AppCompat theme`

**Cause:** Using `DatePicker` or `SelectionMenu` with `android.material: 'system'` while not extending AppCompat.

**Fix:** Ensure your theme inherits from `Theme.AppCompat.*` or `Theme.Material3.*` (which extends AppCompat), and your `MainActivity` extends `AppCompatActivity`.

### Mode Selection Guide

Choose the appropriate mode based on your app's theme:

```tsx
// If your app uses Theme.Material3.* (recommended)
<DatePicker android={{ material: 'm3' }} />
<SelectionMenu android={{ material: 'm3' }} />
<SegmentedControl /> // Always M3

// If your app uses Theme.AppCompat.*
<DatePicker android={{ material: 'system' }} />
<SelectionMenu android={{ material: 'system' }} />
// ⚠️ SegmentedControl will crash - upgrade to Material 3
```

### Expo Configuration

For Expo projects, the config plugin can configure your theme automatically. Add to `app.json`:

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

Then run `npx expo prebuild` to apply the configuration.

---

## Icons

ContextMenu supports icons on menu items. Icons are specified by name and resolved differently on each platform.

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
