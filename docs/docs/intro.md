---
title: "Overview"
sidebar_label: "Overview"
slug: /
description: "Native DatePicker, ContextMenu, SelectionMenu, SegmentedControl and LiquidGlass for React Native, native on iOS and Android."
---

<!-- Generated from the root README by docs/scripts/generate-from-readme.mjs. Edit the README, then run `yarn docs generate`. -->

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

That renders `UISegmentedControl` on iOS and Material 3 segmented buttons (`MaterialButtonToggleGroup`) on Android. The library needs the New Architecture: React Native 0.81+, or Expo SDK 54+ with a dev client (not Expo Go). See [Installation](/installation).
