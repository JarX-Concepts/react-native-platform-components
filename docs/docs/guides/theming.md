---
title: "Theming and Colors"
description: "Design philosophy, theming, and the color formats accepted by react-native-platform-components."
---

- **Native first** — no JS re-implementation of pickers
- **Headless-friendly** — works with any custom UI
- **Codegen-safe** — string unions & sentinel values for type safety
- **Predictable behavior** — no surprise re-renders or layout hacks
- **Platform conventions** — respects native UX patterns

## Theming

This library does not expose theming props. Components take their appearance from your app's native platform theme, so they match the rest of the platform UI.

- **iOS**: Components follow system appearance (light/dark mode) and use system-defined styles (e.g., `UIBlurEffect` for menu backgrounds). Controls that use the tint color, such as the `DatePicker` selection and navigation, pick up the app's accent color.
- **Android**: Components respect your app's Material Theme: the Material 3 color scheme in `styles.xml` and `colors.xml`.

This is intentional. The goal is native fidelity, not pixel-level customization. If you need custom styling beyond what the platform theme provides, this library may not be the right fit.

### Brand colors

With Expo you don't have to edit `styles.xml` or the Xcode asset catalog. Give the config plugin your brand color:

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

After `npx expo prebuild`:

- **Android** gets a complete Material 3 color scheme for light and dark mode, generated from the seed color the way Material Theme Builder does it, on a Material 3 app theme. `SegmentedControl`, the Material pickers and the dropdowns use it. See [Android Theme Configuration](/guides/android-theme#expo-configuration).
- **iOS** gets the color as the app's accent color: an `AccentColor` color set in the asset catalog, selected by the target's **Global Accent Color Name** build setting. UIKit uses it as the default tint color across the app, including in `DatePicker`.

Set the platforms separately when one color doesn't fit both:

```json
{
  "android": {
    "seedColor": "#00897B",
    "colors": { "light": { "primary": "#00897B" } }
  },
  "ios": {
    "accentColor": { "light": "#00897B", "dark": "#4DB6AC" }
  }
}
```

| Option              | Platform | Description                                                                                                                               |
| ------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `seedColor`         | Both     | Seed for the Android color scheme and the iOS accent color                                                                                |
| `android.seedColor` | Android  | Seed for the Android color scheme. Takes precedence over `seedColor`                                                                      |
| `android.colors`    | Android  | `{ light, dark }` colors by Material 3 role, on top of the generated scheme. See [Specific colors](/guides/android-theme#specific-colors) |
| `android.theme`     | Android  | `material3` or `appcompat`. Defaults to `material3` when colors are set                                                                   |
| `ios.accentColor`   | iOS      | `"#RRGGBB"`, or `{ light, dark }` for a separate dark mode color. Takes precedence over `seedColor`                                       |

Colors are `#RRGGBB` hex.

#### Sharing colors with your JavaScript theme

`app.config.ts` runs in Node, so it can import the same color constants your JavaScript theme uses. Keep them in a file with no React Native imports:

```ts
// theme/colors.ts
export const brand = '#00897B';
```

```ts
// app.config.ts
import type { ExpoConfig } from 'expo/config';

import { brand } from './theme/colors';

const config: ExpoConfig = {
  name: 'my-app',
  slug: 'my-app',
  plugins: [
    ['react-native-platform-components/app.plugin', { seedColor: brand }],
  ],
};

export default config;
```

#### Bare React Native

- **iOS**: in Xcode, add a color set named `AccentColor` to `Images.xcassets`, then set the app target's **Global Accent Color Name** build setting to `AccentColor`.
- **Android**: see [Material 3 Theme Setup](/guides/android-theme#material-3-theme-setup-recommended).

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
- `LiquidGlass`: `ios.tintColor`, `android.fallbackBackgroundColor`

```tsx
// All of these are equivalent
<ContextMenu actions={[{ id: '1', title: 'Red', imageColor: '#FF0000' }]} />
<ContextMenu actions={[{ id: '1', title: 'Red', imageColor: 'rgb(255, 0, 0)' }]} />
<ContextMenu actions={[{ id: '1', title: 'Red', imageColor: 'hsl(0, 100%, 50%)' }]} />
<ContextMenu actions={[{ id: '1', title: 'Red', imageColor: 'red' }]} />
```
