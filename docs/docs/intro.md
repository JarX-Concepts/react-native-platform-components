---
title: "Overview"
sidebar_label: "Overview"
slug: /
description: "Native TextField, DatePicker, ContextMenu, SelectionMenu, SegmentedControl, Button, ButtonGroup, FloatingToolbar and LiquidGlass for React Native, native on iOS and Android. Material 3 Expressive on Android."
---

Native **TextField**, **DatePicker**, **ContextMenu**, **SelectionMenu**, **SegmentedControl**, **Button**, **ButtonGroup**, **FloatingToolbar** and **LiquidGlass** for React Native. Every component is the real platform widget on both iOS and Android (UIKit and SwiftUI on iOS, Material 3 Expressive on Android), behind one typed, declarative API. No JavaScript re-implementations.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/hero-dark.webp" />
    <img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/hero-light.webp" alt="DatePicker, TextField, SegmentedControl, Button, ContextMenu, LiquidGlass, FloatingToolbar and SelectionMenu on iOS and Android, and the dark mode from useNativeTheme" />
  </picture>
</p>
<p align="center"><sub>Every tile is the platform's own widget, captured from the example app. Each component page has full recordings on both platforms; <a href="/components/liquidglass">LiquidGlass</a> is iOS 26 only.</sub></p>

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

## Why this library

| You need              | This library                                                                                                                                             | Common alternative                                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Date and time pickers | `UIDatePicker` on iOS; `MaterialDatePicker` / `MaterialTimePicker` or the AppCompat dialogs on Android. Declarative `visible` prop, modal or embedded.   | `@react-native-community/datetimepicker`: platform dialogs on Android; Material 3 pickers are an [open request](https://github.com/react-native-datetimepicker/datetimepicker/issues/790). |
| Segmented control     | `UISegmentedControl` on iOS; Material 3 segmented buttons on Android. Icons and badges on both.                                                          | `@react-native-segmented-control/segmented-control`: native on iOS, drawn in JavaScript on Android.                                                                                        |
| Context menu          | `UIContextMenuInteraction` on iOS; `PopupMenu` on Android. Long-press gesture or modal trigger, icons on both.                                           | `zeego`: native on both platforms, through two additional native dependencies (`react-native-ios-context-menu`, `@react-native-menu/menu`).                                                |
| Selection menu        | System menus on iOS; Material exposed dropdown or `Spinner` on Android. Headless or inline.                                                              | `@react-native-picker/picker`: wheel picker on iOS, dialog or dropdown `Spinner` on Android; no menu-style presentation.                                                                   |
| Buttons and toolbars  | Material 3 Expressive `MaterialButton`, button groups and `FloatingToolbarLayout` on Android (five sizes, shape morphing); `UIButton` configurations and a Liquid Glass toolbar on iOS. | `react-native-paper`: Material 3 (not Expressive) drawn in JavaScript on both platforms.                                                                                                   |
| Liquid glass          | `UIGlassEffect` on iOS 26+, a fallback `View` elsewhere, `isLiquidGlassSupported` flag.                                                                  | `@callstack/liquid-glass`, `expo-glass-effect`: same idea on iOS; here it ships with the components above.                                                                                 |
| All of the above      | One package, one API shape (platform-only props under `ios={{ }}` and `android={{ }}`), Fabric + Codegen typed bindings, Expo config plugin, TypeScript. | Four or five packages with different conventions, install steps and upgrade cadences.                                                                                                      |

### Components

- **TextField** – Material 3 text field on Android (floating label, outlined or filled, supporting text, error state, icons, counter), UITextField on iOS with the iOS 17 and 18 text traits and the grouped-form row
- **DatePicker** – native date & time pickers with modal and embedded presentations
- **ContextMenu** – native context menus with long-press activation (UIContextMenuInteraction on iOS, PopupMenu on Android)
- **SelectionMenu** – native selection menus (Material on Android, system menus on iOS)
- **SegmentedControl** – native segmented controls (UISegmentedControl on iOS, Material 3 Expressive connected buttons on Android, classic Material 3 on request)
- **Button** – Material 3 Expressive buttons on Android (five sizes, round or square, shape morphing on press), UIButton on iOS
- **ButtonGroup** – Material 3 Expressive standard and connected button groups on Android, a row of UIButtons on iOS, with single and multiple selection
- **FloatingToolbar** – Material 3 Expressive floating toolbar on Android, a Liquid Glass capsule on iOS 26
- **LiquidGlass** – iOS 26+ glass morphism effects (UIGlassEffect on iOS, fallback View on Android)

<p align="center">
  <video src="/react-native-platform-components/video/showreel.mp4" poster="/react-native-platform-components/video/showreel.jpg" width="100%" autoplay loop muted playsinline controls></video>
</p>
<p align="center"><sub>iOS on the left, Android on the right: the native theme changing brand color and switching to dark mode, then each component in use. Recorded by the Detox suite in <code>example/</code>.</sub></p>

**Have a component request?** If there's a native UI component you'd like to see added, [open an issue](https://github.com/JarX-Concepts/react-native-platform-components/issues/new) describing the component and its native APIs on iOS and Android.

**Using it in a shipped app?** Open a PR to list it here.
