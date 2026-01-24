# react-native-platform-components

[![npm version](https://img.shields.io/npm/v/react-native-platform-components.svg)](https://www.npmjs.com/package/react-native-platform-components)
[![npm downloads](https://img.shields.io/npm/dm/react-native-platform-components.svg)](https://www.npmjs.com/package/react-native-platform-components)

<table>
  <tr>
    <td align="center"><strong>iOS DatePicker</strong></td>
    <td align="center"><strong>Android DatePicker</strong></td>
    <td align="center"><strong>iOS SelectionMenu</strong></td>
    <td align="center"><strong>Android SelectionMenu</strong></td>
  </tr>
  <tr>
    <td><video src="https://github.com/user-attachments/assets/a9fb6237-6078-496b-8a58-1f2fae4f1af5" autoplay muted loop playsinline></video></td>
    <td><video src="https://github.com/user-attachments/assets/70e42d98-7ea6-40fe-90c5-c1efc2227f25" autoplay muted loop playsinline></video></td>
    <td><video src="https://github.com/user-attachments/assets/c8858be9-1b13-4049-8e43-f8aa44622983" autoplay muted loop playsinline></video></td>
    <td><video src="https://github.com/user-attachments/assets/ca4dab18-2dd0-4d1d-aabc-b49597ef678c" autoplay muted loop playsinline></video></td>
  </tr>
</table>

> 🚧 In development — not ready for public use.

High-quality **native UI components for React Native**, implemented with platform-first APIs and exposed through clean, typed JavaScript interfaces.

This library focuses on **true native behavior**, not JavaScript re-implementations — providing:

- **SelectionMenu** – native selection menus (Material on Android, system menus on iOS)
- **DatePicker** – native date & time pickers with modal and embedded presentations

The goal is to provide components that:

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
- Uses `UIDatePicker` and SwiftUI Menu

### Android

- Uses native Android Views with Material Design
- Supports **Material 3** styling
- No additional setup required beyond autolinking

---

## Quick Start

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
      inlineMode
      placeholder="Select fruit"
      onSelect={(data) => setValue(data)}
      android={{ material: 'm3' }}
    />
  );
}
```

---

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
        onConfirm={(d) => {
          setDate(d);
          setVisible(false);
        }}
        onClosed={() => setVisible(false)}
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
      mode="dateAndTime"
      onConfirm={(d) => setDate(d)}
    />
  );
}
```

---

## Components

## SelectionMenu

Native selection menu with **inline** and **headless** modes.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `options` | `{ label: string; data: string }[]` | Array of options to display |
| `selected` | `string \| null` | Currently selected option's `data` value |
| `disabled` | `boolean` | Disables the menu |
| `placeholder` | `string` | Placeholder text when no selection |
| `inlineMode` | `boolean` | If true, renders native inline picker UI |
| `visible` | `boolean` | Controls headless mode menu visibility |
| `onSelect` | `(data, label, index) => void` | Called when user selects an option |
| `onRequestClose` | `() => void` | Called when menu is dismissed without selection |
| `android.material` | `'system' \| 'm3'` | Material Design style preference |

### Modes

- **Headless mode** (default): Menu visibility controlled by `visible` prop. Use for custom trigger UI.
- **Inline mode** (`inlineMode={true}`): Native picker UI rendered inline. Menu managed internally.

> **Note:** On iOS, headless mode uses a custom popover to enable programmatic presentation. For the full native menu experience (system animations, scroll physics), use inline mode. This is an intentional trade-off: headless gives you control over the trigger UI, inline gives you the complete system menu behavior.

---

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

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
