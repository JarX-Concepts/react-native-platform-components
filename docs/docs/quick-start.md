---
title: "Quick Start"
description: "Copy-paste examples for every component: DatePicker, ContextMenu, SelectionMenu, SegmentedControl and LiquidGlass."
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
