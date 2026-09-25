# react-native-platform-components

[![npm version](https://img.shields.io/npm/v/react-native-platform-components.svg)](https://www.npmjs.com/package/react-native-platform-components)
[![npm downloads](https://img.shields.io/npm/dm/react-native-platform-components.svg)](https://www.npmjs.com/package/react-native-platform-components)
[![CI](https://github.com/JarX-Concepts/react-native-platform-components/actions/workflows/ci.yml/badge.svg)](https://github.com/JarX-Concepts/react-native-platform-components/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/react-native-platform-components.svg)](./LICENSE)

Native **TextField**, **DatePicker**, **ContextMenu**, **SelectionMenu**, **SegmentedControl**, **TabBar**, **Button**, **ButtonGroup**, **FloatingToolbar** and **LiquidGlass** for React Native. Every component is the real platform widget on both iOS and Android (UIKit and SwiftUI on iOS, Material 3 Expressive on Android), behind one typed, declarative API. No JavaScript re-implementations.

<p align="center">
  <a href="https://jarx-concepts.github.io/react-native-platform-components">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/hero-dark.webp" />
      <img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/hero-light.webp" alt="DatePicker, TextField, SegmentedControl, Button, ContextMenu, LiquidGlass, FloatingToolbar and SelectionMenu on iOS and Android, and the dark mode from useNativeTheme" />
    </picture>
  </a>
</p>
<p align="center"><sub>Every tile is the platform's own widget, captured from the example app. The <a href="https://jarx-concepts.github.io/react-native-platform-components">docs site</a> has full recordings of each component on both platforms; <a href="https://jarx-concepts.github.io/react-native-platform-components/components/liquidglass">LiquidGlass</a> is iOS 26 only.</sub></p>

<p align="center">
  <a href="https://jarx-concepts.github.io/react-native-platform-components"><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/showreel.gif" width="640" alt="Showreel: the native theme changing brand color and switching to dark mode, then DatePicker, TextField, SegmentedControl, Button, ContextMenu, SelectionMenu, FloatingToolbar and LiquidGlass in use, iOS on the left and Android on the right" /></a>
</p>
<p align="center"><sub>iOS on the left, Android on the right. Recorded by the Detox suite in <code>example/</code>.</sub></p>

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

That renders `UISegmentedControl` on iOS and Material 3 segmented buttons (`MaterialButtonToggleGroup`) on Android. The library needs the New Architecture: React Native 0.81+, or Expo SDK 54+ with a dev client (not Expo Go). See [Installation](#installation) and the [documentation site](https://jarx-concepts.github.io/react-native-platform-components).

## Components

| Component | iOS | Android | Instead of |
| --- | --- | --- | --- |
| [**TextField**](https://jarx-concepts.github.io/react-native-platform-components/components/textfield) | `UITextField` / `UITextView`, with Writing Tools and the iOS 17–18 text traits | Material 3 `TextInputLayout`: outlined or filled, floating label, supporting text, counter | `TextInput` (a bare `EditText` on Android); `react-native-paper` (drawn in JavaScript) |
| [**DatePicker**](https://jarx-concepts.github.io/react-native-platform-components/components/datepicker) | `UIDatePicker`, modal or embedded | `MaterialDatePicker` / `MaterialTimePicker`, or the AppCompat dialogs | `@react-native-community/datetimepicker` (no Material 3 pickers) |
| [**SelectionMenu**](https://jarx-concepts.github.io/react-native-platform-components/components/selectionmenu) | System menus | Material exposed dropdown or `Spinner` | `@react-native-picker/picker` (wheel or dialog, no menu) |
| [**ContextMenu**](https://jarx-concepts.github.io/react-native-platform-components/components/contextmenu) | `UIContextMenuInteraction` | `PopupMenu` | `zeego` (through two more native packages) |
| [**SegmentedControl**](https://jarx-concepts.github.io/react-native-platform-components/components/segmentedcontrol) | `UISegmentedControl` | Material 3 Expressive connected buttons, or classic segmented buttons | `@react-native-segmented-control/segmented-control` (JavaScript on Android) |
| [**TabBar**](https://jarx-concepts.github.io/react-native-platform-components/components/tabbar) | `UITabBar`, the floating Liquid Glass bar on iOS 26 | Material 3 navigation bar | React Navigation's bottom tabs (JavaScript); `react-native-bottom-tabs` (tied to its navigator) |
| [**Button**](https://jarx-concepts.github.io/react-native-platform-components/components/button) | `UIButton` configurations, Liquid Glass variants on iOS 26 | Material 3 Expressive `MaterialButton`: five sizes, shape morph | `react-native-paper` (Material 3, not Expressive, in JavaScript) |
| [**ButtonGroup**](https://jarx-concepts.github.io/react-native-platform-components/components/buttongroup) | A row of `UIButton`s with a "…" overflow menu; SplitButton: a button and a chevron `UIMenu` button | Material 3 Expressive button groups, single or multiple selection, overflow menu; `MaterialSplitButton` | `react-native-paper` segmented buttons (JavaScript) |
| [**FloatingToolbar**](https://jarx-concepts.github.io/react-native-platform-components/components/floatingtoolbar) | Liquid Glass capsule on iOS 26, blur before | Material 3 Expressive `FloatingToolbarLayout` | A custom view |
| [**LiquidGlass**](https://jarx-concepts.github.io/react-native-platform-components/components/liquidglass) | `UIGlassEffect` on iOS 26+ | A fallback `View` | `@callstack/liquid-glass`, `expo-glass-effect` |

One package and one API shape: platform-only props go under `ios={{ }}` and `android={{ }}`, with Fabric + Codegen typed bindings, an Expo config plugin and TypeScript, instead of four or five packages with their own conventions, install steps and upgrade cadences.

**Have a component request?** If there's a native UI component you'd like to see added, [open an issue](https://github.com/JarX-Concepts/react-native-platform-components/issues/new) describing the component and its native APIs on iOS and Android.

**Using it in a shipped app?** Open a PR to list it here.

---

## Installation

```sh
npm install react-native-platform-components
# or
yarn add react-native-platform-components
```

**iOS:** `cd ios && pod install`. Nothing else to configure.

**Android:** nothing to configure. The components work with the default AppCompat app theme; give the app a Material 3 theme to have `SegmentedControl` and the Material pickers use your colors. See [Android Theme Configuration](https://jarx-concepts.github.io/react-native-platform-components/guides/android-theme).

**Expo:** needs a dev client or EAS Build (native code, so not Expo Go). The config plugin sets up the Material 3 theme for you:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-platform-components/app.plugin",
        { "android": { "theme": "material3" } }
      ]
    ]
  }
}
```

Either form of the reference works: `react-native-platform-components/app.plugin`
as above, or the bare package name.

```sh
npx expo install react-native-platform-components
npx expo prebuild
npx expo run:ios   # or run:android
```

The library is built for the New Architecture (Fabric + Codegen) and does not support the old architecture.

**Compatibility:**

| Platform     | Minimum                                                   |
| ------------ | --------------------------------------------------------- |
| React Native | 0.81 with the New Architecture enabled                    |
| Expo SDK     | 54, with a dev client or EAS Build (not Expo Go)          |
| React        | 19                                                        |
| iOS          | 15.1 (LiquidGlass needs iOS 26)                           |
| Android      | API 24 (Android 7.0); Material Components 1.14 is bundled |

iOS sets that minimum. LiquidGlass uses iOS 26 APIs, so the library has to be
built with Xcode 26, and React Native's bundled `fmt` only compiles under Xcode
26 from 0.81 on. The Android code itself builds against React Native 0.76, and
CI keeps it that way.

Full details: [Installation](https://jarx-concepts.github.io/react-native-platform-components/installation).

## Documentation

Everything else lives on the documentation site:

- [Quick Start](https://jarx-concepts.github.io/react-native-platform-components/quick-start): copy-paste examples for every component
- [DatePicker](https://jarx-concepts.github.io/react-native-platform-components/components/datepicker), [ContextMenu](https://jarx-concepts.github.io/react-native-platform-components/components/contextmenu), [SelectionMenu](https://jarx-concepts.github.io/react-native-platform-components/components/selectionmenu), [SegmentedControl](https://jarx-concepts.github.io/react-native-platform-components/components/segmentedcontrol), [Button](https://jarx-concepts.github.io/react-native-platform-components/components/button), [ButtonGroup](https://jarx-concepts.github.io/react-native-platform-components/components/buttongroup), [FloatingToolbar](https://jarx-concepts.github.io/react-native-platform-components/components/floatingtoolbar), [LiquidGlass](https://jarx-concepts.github.io/react-native-platform-components/components/liquidglass): props, platform options and behavior
- [Android Theme Configuration](https://jarx-concepts.github.io/react-native-platform-components/guides/android-theme): Material 3 setup and what happens without it
- [Icons](https://jarx-concepts.github.io/react-native-platform-components/guides/icons): SF Symbols, drawables and images
- [Theming and Colors](https://jarx-concepts.github.io/react-native-platform-components/guides/theming): light/dark mode and your brand color from JavaScript (`useNativeTheme`), accepted color formats

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

## Author

**Andrew Tosh** — Santa Barbara, California

Full-stack developer with deep experience across entertainment and defense industries, specializing in simulation, visualization, and cross-platform mobile development. Technical focus areas include React Native, Rust, C++, real-time 3D visualization, and game engine technologies.

**Available for contract work** — Always interested in connecting with new clients for mobile development, visualization systems, and related projects. Hit me up at [andrew.tosh@jarxconcepts.com](mailto:andrew.tosh@jarxconcepts.com).

[LinkedIn](https://www.linkedin.com/in/atosh/) · [JarX Concepts](https://github.com/JarX-Concepts)
