---
title: "Theming and Colors"
description: "Design philosophy, light/dark mode and brand colors from JavaScript, and the color formats accepted by react-native-platform-components."
---

- **Native first** — no JS re-implementation of pickers
- **Headless-friendly** — works with any custom UI
- **Codegen-safe** — string unions & sentinel values for type safety
- **Predictable behavior** — no surprise re-renders or layout hacks
- **Platform conventions** — respects native UX patterns

## Theming

This library does not expose per-component theming props. Components take their appearance from the native platform theme, so they match the rest of the platform UI. You control that theme from JavaScript in two ways: light or dark mode, and a brand color.

- **iOS**: Components follow the system appearance and use system-defined styles (e.g., `UIBlurEffect` for menu backgrounds). Controls that use the tint color, such as the `DatePicker` selection and the `SelectionMenu` label, use the brand color.
- **Android**: Components use your app's Material theme. A brand color replaces its colors with a Material 3 color scheme generated from that color.

This is intentional. The goal is native fidelity, not pixel-level customization. If you need custom styling beyond what the platform theme provides, this library may not be the right fit.

### Light and dark mode

Components follow the native appearance and update when it changes, including when the app sets it with React Native's `Appearance.setColorScheme`. If your app has its own light/dark setting, keep the native appearance in sync with it:

```tsx
import { Appearance } from 'react-native';

// 'light' | 'dark', or 'unspecified' to follow the system again
Appearance.setColorScheme(theme.dark ? 'dark' : 'light');
```

If your theme already follows the system through `useColorScheme()`, there is nothing to do. Don't also call `setColorScheme` with the value it returned: that pins the appearance, and the app stops following system changes.

### Brand color

<table>
  <tr>
    <td align="center"><strong>iOS</strong></td>
    <td align="center"><strong>Android</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-theme.gif" height="480" alt="Brand color and dark mode on iOS" /></td>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-theme.gif" height="480" alt="Brand color and dark mode on Android" /></td>
  </tr>
</table>

`useNativeTheme` applies your theme's brand color to the native platform theme, app-wide. Call it once, near the root of the app. A [React Navigation](https://reactnavigation.org/docs/themes/) theme can be passed as is:

```tsx
import { useColorScheme } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { useNativeTheme } from 'react-native-platform-components';

const LightTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: '#00897B' },
};

export default function App() {
  const theme = useColorScheme() === 'dark' ? DarkTheme : LightTheme;
  useNativeTheme(theme);

  return <NavigationContainer theme={theme}>{/* ... */}</NavigationContainer>;
}
```

Only `colors.primary` is read. It accepts any color value, including `PlatformColor` and `DynamicColorIOS`. Pass `null` to go back to the app's own theme colors.

- **iOS**: the color becomes the tint color of every window, including windows opened later. These components and any other UIKit view that uses the tint color inherit it and update right away. Switches keep their green "on" color, as elsewhere on iOS; pass `trackColor={{ true: theme.colors.primary }}` to brand a React Native `Switch`.
- **Android 13 and later**: the color seeds a Material 3 color scheme (Material's content-based dynamic color) for the current light or dark mode, applied to the activity. `SegmentedControl`, `SelectionMenu` and both `DatePicker` modes use it, and so do other Material and AppCompat widgets, such as React Native's `Switch`. These components rebuild right away; other native views pick up the colors the next time they are created. On older Android versions the app theme's colors stay in place.

To apply the color outside of React, use `setNativeTheme`:

```ts
import { setNativeTheme } from 'react-native-platform-components';

setNativeTheme({ colors: { primary: '#00897B' } });
setNativeTheme(null);
```

## Color Formats

All color props in this library support the same formats as React Native's `backgroundColor`:

| Format | Example                           | Description                        |
| ------ | --------------------------------- | ---------------------------------- |
| Hex    | `#RGB`, `#RRGGBB`, `#RRGGBBAA`    | Standard hex colors                |
| RGB    | `rgb(255, 0, 0)`                  | RGB values (0-255)                 |
| RGBA   | `rgba(255, 0, 0, 0.5)`            | RGB with alpha (0-1)               |
| HSL    | `hsl(0, 100%, 50%)`               | Hue (0-360), saturation, lightness |
| HSLA   | `hsla(0, 100%, 50%, 0.5)`         | HSL with alpha (0-1)               |
| Named  | `red`, `steelblue`, `transparent` | CSS named colors                   |

**Props that accept colors:**

- `ContextMenu`: `imageColor` (icon tint)
- `SegmentedControl`: `selectedSegmentColor`, `activeTintColor`, `inactiveTintColor`, `badgeStyle.backgroundColor`, `badgeStyle.color`, `android.rippleColor`, `android.strokeColor` (these also accept `PlatformColor` / `DynamicColorIOS`)
- `TabBar`: `activeTintColor`, `inactiveTintColor`, `barColor`, `badgeStyle.backgroundColor`, `badgeStyle.color`, `android.indicatorColor`, `android.rippleColor`
- `LiquidGlass`: `ios.tintColor`, `android.fallbackBackgroundColor`

```tsx
// All of these are equivalent
<ContextMenu actions={[{ id: '1', title: 'Red', imageColor: '#FF0000' }]} />
<ContextMenu actions={[{ id: '1', title: 'Red', imageColor: 'rgb(255, 0, 0)' }]} />
<ContextMenu actions={[{ id: '1', title: 'Red', imageColor: 'hsl(0, 100%, 50%)' }]} />
<ContextMenu actions={[{ id: '1', title: 'Red', imageColor: 'red' }]} />
```
