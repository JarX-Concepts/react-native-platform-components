---
title: "Installation"
description: "Install react-native-platform-components in a bare React Native or Expo app (New Architecture, dev client, config plugin)."
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

- Minimum iOS version: **iOS 13+**
- Uses `UIDatePicker`, SwiftUI Menu, and `UIContextMenuInteraction`

### Android

- Uses native Android Views with Material Design (including `PopupMenu` for context menus)
- Supports **Material 3** styling
- Works with the default React Native and Expo AppCompat theme. To have the Material 3 components use your app's colors, see [Android Theme Configuration](/guides/android-theme)

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

Add to your `app.json` with your brand color. On Android, `seedColor` switches Expo's generated `AppTheme` to Material 3 and generates its light and dark color scheme, which `SegmentedControl` and the `material: 'm3'` modes use. On iOS it becomes the app's accent color:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-platform-components/app.plugin",
        { "seedColor": "#00897B" }
      ]
    ]
  }
}
```

All options are optional; without any, the plugin changes nothing. See [Brand colors](/guides/theming#brand-colors) for per-platform colors and [Android Theme Configuration](/guides/android-theme#expo-configuration) for what prebuild writes.

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
| iOS          | 13 (LiquidGlass needs iOS 26)                             |
| Android      | API 24 (Android 7.0); Material Components 1.12 is bundled |

**Requirements:**

- New Architecture must be enabled in your app
- For bare React Native: set `newArchEnabled=true` in `gradle.properties` (Android) and use the `RCT_NEW_ARCH_ENABLED` flag (iOS)
- For Expo: set `"newArchEnabled": true` in `app.json`
