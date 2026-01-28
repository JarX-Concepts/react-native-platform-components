# react-native-platform-components

[![npm version](https://img.shields.io/npm/v/react-native-platform-components.svg)](https://www.npmjs.com/package/react-native-platform-components)
[![npm downloads](https://img.shields.io/npm/dm/react-native-platform-components.svg)](https://www.npmjs.com/package/react-native-platform-components)

<table>
  <tr>
    <td valign="top">
      <table>
        <tr>
          <td align="center"><strong>iOS DatePicker</strong></td>
          <td align="center"><strong>Android DatePicker</strong></td>
        </tr>
        <tr>
          <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-datepicker.gif" height="350" /></td>
          <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-datepicker.gif" height="350" /></td>
        </tr>
        <tr>
          <td align="center"><strong>iOS ContextMenu</strong></td>
          <td align="center"><strong>Android ContextMenu</strong></td>
        </tr>
        <tr>
          <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-contextmenu.gif" height="350" /></td>
          <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-contextmenu.gif" height="350" /></td>
        </tr>
        <tr>
          <td align="center"><strong>iOS SelectionMenu</strong></td>
          <td align="center"><strong>Android SelectionMenu</strong></td>
        </tr>
        <tr>
          <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-selectionmenu.gif" height="350" /></td>
          <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-selectionmenu.gif" height="350" /></td>
        </tr>
      </table>
    </td>
    <td valign="top">
      <p>High-quality <strong>native UI components for React Native</strong>, implemented with platform-first APIs and exposed through clean, typed JavaScript interfaces.</p>
      <p>This library focuses on <strong>true native behavior</strong>, not JavaScript re-implementations — providing:</p>
      <ul>
        <li><strong>DatePicker</strong> – native date & time pickers with modal and embedded presentations</li>
        <li><strong>ContextMenu</strong> – native context menus with long-press activation (UIContextMenuInteraction on iOS, PopupMenu on Android)</li>
        <li><strong>SelectionMenu</strong> – native selection menus (Material on Android, system menus on iOS)</li>
      </ul>
      <p>The goal is to provide components that:</p>
      <ul>
        <li>Feel <strong>100% native</strong> on each platform</li>
        <li>Support modern platform design systems (Material 3 on Android, system pickers on iOS)</li>
        <li>Offer <strong>headless</strong> and <strong>inline</strong> modes for maximum layout control</li>
        <li>Integrate cleanly with <strong>React Native Codegen / Fabric</strong></li>
      </ul>
    </td>
  </tr>
</table>

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
- No additional setup required beyond autolinking

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
        ios={{preferredStyle: 'inline'}}
        android={{material: 'system'}}
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
      ios={{preferredStyle: 'inline'}}
      android={{material: 'system'}}
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
      <View style={{ padding: 20, backgroundColor: '#E8F4FD', borderRadius: 8 }}>
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

## Components

## DatePicker

Native date & time picker using **platform system pickers**.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `date` | `Date \| null` | Controlled date value |
| `minDate` | `Date \| null` | Minimum selectable date |
| `maxDate` | `Date \| null` | Maximum selectable date |
| `locale` | `string` | Locale identifier (e.g., `'en-US'`) |
| `timeZoneName` | `string` | Time zone identifier |
| `mode` | `'date' \| 'time' \| 'dateAndTime' \| 'countDownTimer'` | Picker mode |
| `presentation` | `'modal' \| 'embedded'` | Presentation style |
| `visible` | `boolean` | Controls modal visibility (modal mode only) |
| `onConfirm` | `(date: Date) => void` | Called when user confirms selection |
| `onClosed` | `() => void` | Called when modal is dismissed |

### iOS Props (`ios`)

| Prop | Type | Description |
|------|------|-------------|
| `preferredStyle` | `'automatic' \| 'compact' \| 'inline' \| 'wheels'` | iOS date picker style |
| `countDownDurationSeconds` | `number` | Duration for countdown timer mode |
| `minuteInterval` | `number` | Minute interval (1-30) |
| `roundsToMinuteInterval` | `'inherit' \| 'round' \| 'noRound'` | Rounding behavior |

### Android Props (`android`)

| Prop | Type | Description |
|------|------|-------------|
| `firstDayOfWeek` | `number` | First day of week (1-7, Sunday=1) |
| `material` | `'system' \| 'm3'` | Material Design style (modal only; embedded always uses system picker) |
| `dialogTitle` | `string` | Custom dialog title |
| `positiveButtonTitle` | `string` | Custom confirm button text |
| `negativeButtonTitle` | `string` | Custom cancel button text |

---

## ContextMenu

Native context menu that wraps content and responds to **long-press** or **tap** gestures.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Menu title (shown as header on iOS) |
| `actions` | `ContextMenuAction[]` | Array of menu actions |
| `disabled` | `boolean` | Disables the menu |
| `trigger` | `'longPress' \| 'tap'` | How the menu opens (default: `'longPress'`) |
| `onPressAction` | `(actionId, actionTitle) => void` | Called when user selects an action |
| `onMenuOpen` | `() => void` | Called when menu opens |
| `onMenuClose` | `() => void` | Called when menu closes |
| `children` | `ReactNode` | Content to wrap (required) |

### ContextMenuAction

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier returned in callbacks |
| `title` | `string` | Display text |
| `subtitle` | `string` | Secondary text (iOS only) |
| `image` | `string` | Icon name (SF Symbol on iOS, drawable on Android) |
| `imageColor` | `string` | Tint color for the icon (hex string) |
| `attributes` | `{ destructive?, disabled?, hidden? }` | Action attributes |
| `state` | `'off' \| 'on' \| 'mixed'` | Checkmark state |
| `subactions` | `ContextMenuAction[]` | Nested actions for submenu |

### iOS Props (`ios`)

| Prop | Type | Description |
|------|------|-------------|
| `enablePreview` | `boolean` | Enable preview when long-pressing |

### Android Props (`android`)

| Prop | Type | Description |
|------|------|-------------|
| `anchorPosition` | `'left' \| 'right'` | Anchor position for the popup menu |
| `visible` | `boolean` | Programmatic visibility control (Android only) |

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

| Prop | Type | Description |
|------|------|-------------|
| `options` | `{ label: string; data: string }[]` | Array of options to display |
| `selected` | `string \| null` | Currently selected option's `data` value |
| `disabled` | `boolean` | Disables the menu |
| `placeholder` | `string` | Placeholder text when no selection |
| `presentation` | `'modal' \| 'embedded'` | Presentation mode (default: `'modal'`) |
| `visible` | `boolean` | Controls modal mode menu visibility |
| `onSelect` | `(data, label, index) => void` | Called when user selects an option |
| `onRequestClose` | `() => void` | Called when menu is dismissed without selection |
| `android.material` | `'system' \| 'm3'` | Material Design style preference |

### Modes

- **Modal mode** (default): Menu visibility controlled by `visible` prop. Use for custom trigger UI.
- **Embedded mode** (`presentation="embedded"`): Native picker UI rendered inline. Menu managed internally.

> **Note:** On iOS, modal mode uses a custom popover to enable programmatic presentation. For the full native menu experience (system animations, scroll physics), use embedded mode. This is an intentional trade-off: modal gives you control over the trigger UI, embedded gives you the complete system menu behavior.

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

## Icons

ContextMenu supports icons on menu items. Icons are specified by name and resolved differently on each platform.

### iOS

Use [SF Symbols](https://developer.apple.com/sf-symbols/) names. These are built into iOS and require no additional setup.

```tsx
// Common SF Symbols
image: 'doc.on.doc'        // Copy
image: 'square.and.arrow.up' // Share
image: 'trash'             // Delete
image: 'pencil'            // Edit
image: 'checkmark.circle'  // Checkmark
```

Browse available symbols using Apple's SF Symbols app or [sfsymbols.com](https://sfsymbols.com).

### Android

Use drawable resource names from your app's `res/drawable` directory. You must add these resources yourself.

```tsx
// Reference drawable by name (without extension)
image: 'content_copy'  // res/drawable/content_copy.xml
image: 'share'         // res/drawable/share.xml
image: 'delete'        // res/drawable/delete.xml
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

## License

MIT
