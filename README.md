# react-native-platform-components

> 🚧 In development — not ready for public use.

High-quality **native UI components for React Native**, implemented with platform-first APIs and exposed through clean, typed JavaScript interfaces.

This library focuses on **true native behavior**, not JavaScript re-implementations — starting with:

- **SelectionMenu** – native selection menus (Material on Android, system menus on iOS, web fallback)
- **DatePicker** – native date & time pickers with modal and inline presentations

The goal is to provide components that:

- Feel **100% native** on each platform
- Support modern platform design systems (Material 2 / Material 3 on Android, system pickers on iOS)
- Offer **headless** and **inline** modes for maximum layout control
- Integrate cleanly with **React Native Codegen / Fabric**
- Degrade gracefully on **Web**

---

## 🎥 Demos

### SelectionMenu
Native Material / system selection menus with headless and inline modes.

📹 **Demo video:**  
👉 *(add SelectionMenu demo link here)*

---

### DatePicker
Native date & time pickers using platform system UI.

📹 **Demo video:**  
👉 *(add DatePicker demo link here)*

---

## 📦 Installation

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
- Uses `UIDatePicker` and system selection menus

### Android

- Uses native Android Views
- Supports **Material 2** and **Material 3**
- No additional setup required beyond autolinking

### Web

- **SelectionMenu** is supported with a web-appropriate fallback
- **DatePicker** currently targets native platforms only

---

## 🚀 Quick Start

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

---

## 🧩 Components

## SelectionMenu

Native selection menu with **inline** and **headless** modes.

### Props

```ts
type SelectionMenuProps = {
  style?: StyleProp<ViewStyle>;

  options: readonly {
    label: string;
    data: string;
  }[];

  selected: string | null;

  disabled?: boolean;
  placeholder?: string;

  inlineMode?: boolean;
  visible?: boolean;

  presentation?: 'auto' | 'popover' | 'sheet';

  onSelect?: (data: string, label: string, index: number) => void;
  onRequestClose?: () => void;

  ios?: {};

  android?: {
    material?: 'auto' | 'm2' | 'm3';
  };
};
```

---

## DatePicker

Native date & time picker using **platform system pickers**.

### Props

```ts
type DatePickerProps = {
  style?: StyleProp<ViewStyle>;

  date: Date | null;

  minDate?: Date | null;
  maxDate?: Date | null;

  locale?: string;
  timeZoneName?: string;

  mode?: 'date' | 'time' | 'dateAndTime' | 'countDownTimer';
  presentation?: 'modal' | 'inline';

  visible?: boolean;

  onConfirm?: (dateTime: Date) => void;
  onClosed?: () => void;

  ios?: {
    preferredStyle?: 'automatic' | 'wheels' | 'inline' | 'compact';
    countDownDurationSeconds?: number;
    minuteInterval?: number;
    roundsToMinuteInterval?: boolean;
  };

  android?: {
    firstDayOfWeek?: number;
    material?: 'auto' | 'm2' | 'm3';
    dialogTitle?: string;
    positiveButtonTitle?: string;
    negativeButtonTitle?: string;
  };
};
```

---

## 🧠 Design Philosophy

- **Native first** — no JS re-implementation of pickers
- **Headless-friendly** — works with any custom UI
- **Codegen-safe** — string unions & sentinel values
- **Predictable behavior** — no surprise re-renders or layout hacks

---

## 📄 License

MIT
