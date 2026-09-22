# react-native-platform-components

[![npm version](https://img.shields.io/npm/v/react-native-platform-components.svg)](https://www.npmjs.com/package/react-native-platform-components)
[![npm downloads](https://img.shields.io/npm/dm/react-native-platform-components.svg)](https://www.npmjs.com/package/react-native-platform-components)
[![CI](https://github.com/JarX-Concepts/react-native-platform-components/actions/workflows/ci.yml/badge.svg)](https://github.com/JarX-Concepts/react-native-platform-components/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/react-native-platform-components.svg)](./LICENSE)

Native **DatePicker**, **ContextMenu**, **SelectionMenu**, **SegmentedControl**, **Button**, **ButtonGroup**, **FloatingToolbar** and **LiquidGlass** for React Native. Every component is the real platform widget on both iOS and Android (UIKit and SwiftUI on iOS, Material 3 Expressive on Android), behind one typed, declarative API. No JavaScript re-implementations.

<p align="center">
  <a href="https://jarx-concepts.github.io/react-native-platform-components"><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/showreel.gif" width="394" alt="DatePicker, SelectionMenu, ContextMenu, SegmentedControl, Button, FloatingToolbar and the native theme, iOS on the left and Android on the right" /></a>
</p>
<p align="center"><sub>iOS on the left, Android on the right. Every component page on the <a href="https://jarx-concepts.github.io/react-native-platform-components">docs site</a> has full recordings for each platform; <a href="https://jarx-concepts.github.io/react-native-platform-components/components/liquidglass">LiquidGlass</a> is iOS 26 only.</sub></p>

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

## Components

| Component            | iOS                        | Android                                                          | Docs                                                                                                             |
| -------------------- | -------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **DatePicker**       | `UIDatePicker`             | `MaterialDatePicker` / `MaterialTimePicker` or AppCompat dialogs | [DatePicker](https://jarx-concepts.github.io/react-native-platform-components/components/datepicker)             |
| **ContextMenu**      | `UIContextMenuInteraction` | `PopupMenu`                                                      | [ContextMenu](https://jarx-concepts.github.io/react-native-platform-components/components/contextmenu)           |
| **SelectionMenu**    | System menus               | Material exposed dropdown or `Spinner`                           | [SelectionMenu](https://jarx-concepts.github.io/react-native-platform-components/components/selectionmenu)       |
| **SegmentedControl** | `UISegmentedControl`       | `MaterialButtonToggleGroup` (Material 3 Expressive connected buttons, or classic) | [SegmentedControl](https://jarx-concepts.github.io/react-native-platform-components/components/segmentedcontrol) |
| **Button**           | `UIButton` (configurations) | `MaterialButton` (Material 3 Expressive: five sizes, round or square, shape morph) | [Button](https://jarx-concepts.github.io/react-native-platform-components/components/button)                     |
| **ButtonGroup**      | Row of `UIButton`s         | `MaterialButtonGroup` / `MaterialButtonToggleGroup` (Material 3 Expressive) | [ButtonGroup](https://jarx-concepts.github.io/react-native-platform-components/components/buttongroup)           |
| **FloatingToolbar**  | `UIGlassEffect` capsule (iOS 26+), blur below | `FloatingToolbarLayout` (Material 3 Expressive)               | [FloatingToolbar](https://jarx-concepts.github.io/react-native-platform-components/components/floatingtoolbar)   |
| **LiquidGlass**      | `UIGlassEffect` (iOS 26+)  | Fallback `View`                                                  | [LiquidGlass](https://jarx-concepts.github.io/react-native-platform-components/components/liquidglass)           |

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
