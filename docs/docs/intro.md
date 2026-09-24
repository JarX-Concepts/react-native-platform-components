---
title: "Overview"
sidebar_label: "Overview"
slug: /
description: "Native TextField, DatePicker, ContextMenu, SelectionMenu, SegmentedControl, TabBar, Button, ButtonGroup, FloatingActionButton, FloatingToolbar and LiquidGlass for React Native, native on iOS and Android. Material 3 Expressive on Android."
---

Native **TextField**, **DatePicker**, **ContextMenu**, **SelectionMenu**, **SegmentedControl**, **TabBar**, **Button**, **ButtonGroup**, **FloatingActionButton**, **FloatingToolbar** and **LiquidGlass** for React Native. Every component is the real platform widget on both iOS and Android (UIKit and SwiftUI on iOS, Material 3 Expressive on Android), behind one typed, declarative API. No JavaScript re-implementations.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/hero-dark.webp" />
    <img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/hero-light.webp" alt="DatePicker, TextField, SegmentedControl, Button, ContextMenu, LiquidGlass, FloatingToolbar and SelectionMenu on iOS and Android, and the dark mode from useNativeTheme" />
  </picture>
</p>
<p align="center"><sub>Every tile is the platform's own widget, captured from the example app. Each component page has full recordings on both platforms; <a href="/components/liquidglass">LiquidGlass</a> is iOS 26 only.</sub></p>

<p align="center">
  <video src="/react-native-platform-components/video/showreel.mp4" poster="/react-native-platform-components/video/showreel.jpg" width="100%" autoplay loop muted playsinline controls></video>
</p>
<p align="center"><sub>iOS on the left, Android on the right: the native theme changing brand color and switching to dark mode, then each component in use. Recorded by the Detox suite in <code>example/</code>.</sub></p>

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

## Components

| Component | iOS | Android | Instead of |
| --- | --- | --- | --- |
| [**TextField**](/components/textfield) | `UITextField` / `UITextView`, with Writing Tools and the iOS 17–18 text traits | Material 3 `TextInputLayout`: outlined or filled, floating label, supporting text, counter | `TextInput` (a bare `EditText` on Android); `react-native-paper` (drawn in JavaScript) |
| [**DatePicker**](/components/datepicker) | `UIDatePicker`, modal or embedded | `MaterialDatePicker` / `MaterialTimePicker`, or the AppCompat dialogs | `@react-native-community/datetimepicker` (no Material 3 pickers) |
| [**SelectionMenu**](/components/selectionmenu) | System menus | Material exposed dropdown or `Spinner` | `@react-native-picker/picker` (wheel or dialog, no menu) |
| [**ContextMenu**](/components/contextmenu) | `UIContextMenuInteraction` | `PopupMenu` | `zeego` (through two more native packages) |
| [**SegmentedControl**](/components/segmentedcontrol) | `UISegmentedControl` | Material 3 Expressive connected buttons, or classic segmented buttons | `@react-native-segmented-control/segmented-control` (JavaScript on Android) |
| [**TabBar**](/components/tabbar) | `UITabBar`, the floating Liquid Glass bar on iOS 26 | Material 3 navigation bar | React Navigation's bottom tabs (JavaScript); `react-native-bottom-tabs` (tied to its navigator) |
| [**Button**](/components/button) | `UIButton` configurations, Liquid Glass variants on iOS 26 | Material 3 Expressive `MaterialButton`: five sizes, shape morph | `react-native-paper` (Material 3, not Expressive, in JavaScript) |
| [**ButtonGroup**](/components/buttongroup) | A row of `UIButton`s | Material 3 Expressive button groups, single or multiple selection | `react-native-paper` segmented buttons (JavaScript) |
| [**FloatingActionButton**](/components/floatingactionbutton) | A round prominent `UIButton`, Liquid Glass on iOS 26 (iOS has no FAB) | Material `FloatingActionButton` / `ExtendedFloatingActionButton`: four sizes, shrink on scroll | `react-native-paper` FAB (drawn in JavaScript) |
| [**FloatingToolbar**](/components/floatingtoolbar) | Liquid Glass capsule on iOS 26, blur before | Material 3 Expressive `FloatingToolbarLayout` | A custom view |
| [**LiquidGlass**](/components/liquidglass) | `UIGlassEffect` on iOS 26+ | A fallback `View` | `@callstack/liquid-glass`, `expo-glass-effect` |

One package and one API shape: platform-only props go under `ios={{ }}` and `android={{ }}`, with Fabric + Codegen typed bindings, an Expo config plugin and TypeScript, instead of four or five packages with their own conventions, install steps and upgrade cadences.

**Have a component request?** If there's a native UI component you'd like to see added, [open an issue](https://github.com/JarX-Concepts/react-native-platform-components/issues/new) describing the component and its native APIs on iOS and Android.

**Using it in a shipped app?** Open a PR to list it here.
