# react-native-platform-components

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
| `material` | `'system' \| 'm3'` | Material Design style |
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

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
