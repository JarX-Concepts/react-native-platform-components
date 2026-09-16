---
title: "Overview"
sidebar_label: "Overview"
slug: /
description: "Native DatePicker, ContextMenu, SelectionMenu, SegmentedControl and LiquidGlass for React Native, native on iOS and Android."
---

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

## Why this library

| You need              | This library                                                                                                                                             | Common alternative                                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Date and time pickers | `UIDatePicker` on iOS; `MaterialDatePicker` / `MaterialTimePicker` or the AppCompat dialogs on Android. Declarative `visible` prop, modal or embedded.   | `@react-native-community/datetimepicker`: platform dialogs on Android; Material 3 pickers are an [open request](https://github.com/react-native-datetimepicker/datetimepicker/issues/790). |
| Segmented control     | `UISegmentedControl` on iOS; Material 3 segmented buttons on Android. Icons and badges on both.                                                          | `@react-native-segmented-control/segmented-control`: native on iOS, drawn in JavaScript on Android.                                                                                        |
| Context menu          | `UIContextMenuInteraction` on iOS; `PopupMenu` on Android. Long-press gesture or modal trigger, icons on both.                                           | `zeego`: native on both platforms, through two additional native dependencies (`react-native-ios-context-menu`, `@react-native-menu/menu`).                                                |
| Selection menu        | System menus on iOS; Material exposed dropdown or `Spinner` on Android. Headless or inline.                                                              | `@react-native-picker/picker`: wheel picker on iOS, dialog or dropdown `Spinner` on Android; no menu-style presentation.                                                                   |
| Liquid glass          | `UIGlassEffect` on iOS 26+, a fallback `View` elsewhere, `isLiquidGlassSupported` flag.                                                                  | `@callstack/liquid-glass`, `expo-glass-effect`: same idea on iOS; here it ships with the components above.                                                                                 |
| All of the above      | One package, one API shape (platform-only props under `ios={{ }}` and `android={{ }}`), Fabric + Codegen typed bindings, Expo config plugin, TypeScript. | Four or five packages with different conventions, install steps and upgrade cadences.                                                                                                      |

### Components

- **DatePicker** – native date & time pickers with modal and embedded presentations
- **ContextMenu** – native context menus with long-press activation (UIContextMenuInteraction on iOS, PopupMenu on Android)
- **SelectionMenu** – native selection menus (Material on Android, system menus on iOS)
- **SegmentedControl** – native segmented controls (UISegmentedControl on iOS, MaterialButtonToggleGroup on Android)
- **LiquidGlass** – iOS 26+ glass morphism effects (UIGlassEffect on iOS, fallback View on Android)

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

**Have a component request?** If there's a native UI component you'd like to see added, [open an issue](https://github.com/JarX-Concepts/react-native-platform-components/issues/new) describing the component and its native APIs on iOS and Android.

**Using it in a shipped app?** Open a PR to list it here.
