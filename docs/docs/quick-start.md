---
title: "Quick Start"
description: "Copy-paste examples for every component: TextField, DatePicker, ContextMenu, SelectionMenu, SegmentedControl, Button, ButtonGroup, FloatingToolbar and LiquidGlass."
---

### TextField

```tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { TextField } from 'react-native-platform-components';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const emailError =
    email.length > 0 && !email.includes('@') ? 'Enter a valid email' : undefined;

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <TextField
        label="Email"
        placeholder="you@example.com"
        supportingText="We never share it"
        value={email}
        onChangeText={setEmail}
        error={emailError}
        keyboardType="email-address"
        autoComplete="email"
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        passwordToggle
        autoComplete="new-password"
        supportingText="At least 8 characters"
      />
      <TextField
        label="Notes"
        multiline
        maxLength={200}
        showCharacterCount
        android={{ variant: 'filled' }}
      />
    </View>
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

### Button

```tsx
import { Button } from 'react-native-platform-components';

export function Example() {
  return (
    <>
      {/* Material 3 Expressive filled button on Android, UIButton .filled() on iOS */}
      <Button label="Save" onPress={() => console.log('save')} />

      {/* Lower emphasis, larger size, square corners */}
      <Button
        label="Cancel"
        variant="text"
        size="medium"
        shape="square"
        onPress={() => console.log('cancel')}
      />

      {/* Icon-only button: a Material icon button on Android */}
      <Button
        icon={{
          ios: { type: 'sfSymbol', name: 'plus' },
          android: { type: 'drawable', name: 'add' },
        }}
        variant="tonal"
        accessibilityLabel="Add"
        onPress={() => console.log('add')}
      />
    </>
  );
}
```

### ButtonGroup

```tsx
import { ButtonGroup } from 'react-native-platform-components';

export function Example() {
  const [range, setRange] = React.useState<string[]>(['week']);

  return (
    <>
      {/* Actions: a standard group, buttons keep their shape */}
      <ButtonGroup
        buttons={[
          { label: 'Copy', value: 'copy' },
          { label: 'Paste', value: 'paste' },
        ]}
        variant="tonal"
        onPress={(value) => console.log(value)}
      />

      {/* Single selection: a connected group, the Expressive segmented buttons */}
      <ButtonGroup
        buttons={[
          { label: 'Day', value: 'day' },
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' },
        ]}
        selection="single"
        selectedValues={range}
        onSelectionChange={setRange}
      />
    </>
  );
}
```

### FloatingToolbar

```tsx
import { Button, FloatingToolbar } from 'react-native-platform-components';
import { View } from 'react-native';

export function Example() {
  return (
    <View style={{ flex: 1 }}>
      {/* Content the toolbar floats over */}

      <FloatingToolbar style={{ position: 'absolute', bottom: 24 }}>
        <Button
          icon={{
            ios: { type: 'sfSymbol', name: 'square.and.arrow.up' },
            android: { type: 'drawable', name: 'share' },
          }}
          variant="text"
          accessibilityLabel="Share"
          onPress={() => console.log('share')}
        />
        <Button
          icon={{
            ios: { type: 'sfSymbol', name: 'trash' },
            android: { type: 'drawable', name: 'delete' },
          }}
          variant="text"
          accessibilityLabel="Delete"
          onPress={() => console.log('delete')}
        />
        <Button label="Send" variant="tonal" onPress={() => console.log('send')} />
      </FloatingToolbar>
    </View>
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
