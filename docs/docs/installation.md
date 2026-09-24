---
title: 'Installation'
description: 'Install react-native-platform-components in a bare React Native or Expo app (New Architecture, dev client, config plugin).'
---

```sh
npm install react-native-platform-components
yarn add react-native-platform-components
```

### iOS

```sh
cd ios
pod install
```

- Minimum iOS version: **iOS 15.1+** (React Native sets this floor; the podspec follows it)
- Uses `UIDatePicker`, SwiftUI Menu, and `UIContextMenuInteraction`

### Android

- Uses native Android Views with Material Design (including `PopupMenu` for context menus)
- Supports **Material 3** styling
- Works with the default React Native and Expo AppCompat theme. To have the Material 3 components use your app's colors, see [Android Theme Configuration](/guides/android-theme)

### Web

With [react-native-web](https://necolas.github.io/react-native-web/), including Expo web, the components render the browser's own controls with the same props. No setup is needed; see [Web](/guides/web).

### Jest

The native views can't render under Jest. Mock the package with the interactive stand-ins it ships, in your Jest setup file:

```js
jest.mock('react-native-platform-components', () =>
  require('react-native-platform-components/jest')
);
```

See [Testing with Jest](/guides/testing) for what each mock renders.

### Expo (Managed Workflow)

> **Note:** This library is **not supported in Expo Go**. It requires native code and must be used with [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/) or EAS Build.

```sh
npx expo install react-native-platform-components
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

The library includes an Expo config plugin that handles all native configuration automatically. No manual native setup is required.

**EAS Build:**

```sh
eas build --platform ios
eas build --platform android
```

**Config Plugin:**

Add to your `app.json`. The `android.theme` option re-parents Expo's generated `AppTheme` onto Material 3, which `SegmentedControl`, `TabBar`, `Button`, `ButtonGroup`, `FloatingActionButton`, `FloatingToolbar` and the `material: 'm3'` modes use for their colors (see [Android Theme Configuration](/guides/android-theme)):

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

For a complete working example, see the [`example-expo/`](https://github.com/JarX-Concepts/react-native-platform-components/tree/main/example-expo) directory.

## React Native New Architecture

This library is built for the **React Native New Architecture** (Fabric + TurboModules).

| Feature               | Status                             |
| --------------------- | ---------------------------------- |
| Fabric (New Renderer) | Supported                          |
| Codegen               | Used for type-safe native bindings |
| TurboModules          | N/A (view components only)         |
| Old Architecture      | Not supported                      |

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

**Requirements:**

- New Architecture must be enabled in your app
- For bare React Native: set `newArchEnabled=true` in `gradle.properties` (Android) and use the `RCT_NEW_ARCH_ENABLED` flag (iOS)
- For Expo: set `"newArchEnabled": true` in `app.json`
