---
title: "Android Theme Configuration"
description: "How the Android components use your Material 3 theme, what happens under an AppCompat theme, and the Expo plugin options that generate your color scheme."
---

No theme setup is required to avoid a crash. React Native and Expo templates ship an AppCompat app theme, and every component works with it. When the theme is not a Material theme, `SegmentedControl` and the inline M3 `SelectionMenu` render with Material 3 default colors, the M3 date and time pickers use a built-in Material 3 dialog theme, and the library logs one warning under the `PlatformComponents` tag. Give the app a Material 3 theme to have those components use your app's colors instead.

> Releases before 1.0.0 crashed on mount in these cases (`Cannot find theme attribute materialButtonOutlinedStyle`, `You need to use a Theme.AppCompat theme`). Upgrade to get the fallback behavior.

### Theme Requirements by Component

| Component            | Mode                         | Uses your colors with | Without it                                           |
| -------------------- | ---------------------------- | --------------------- | ---------------------------------------------------- |
| **SegmentedControl** | (always M3)                  | `Theme.Material3.*`   | Material 3 default colors, one warning logged        |
| **DatePicker**       | `android.material: 'm3'`     | `Theme.Material3.*`   | Built-in Material 3 dialog theme, one warning logged |
| **DatePicker**       | `android.material: 'system'` | `Theme.AppCompat.*`   | Built-in AppCompat dialog theme, one warning logged  |
| **SelectionMenu**    | `android.material: 'm3'`     | `Theme.Material3.*`   | Material 3 default colors, one warning logged        |
| **SelectionMenu**    | `android.material: 'system'` | `Theme.AppCompat.*`   | Platform widgets, no theme dependency                |
| **ContextMenu**      | —                            | Any                   | —                                                    |
| **LiquidGlass**      | —                            | Any                   | —                                                    |

`Theme.Material3.*` extends `Theme.AppCompat.*`, so a Material 3 theme satisfies every row.

### Material 3 Theme Setup (Recommended)

**Expo:** pass `{ "seedColor": "#00897B" }` (your brand color) to the config plugin. It switches the app to Material 3 and generates the color scheme for you. See [Expo Configuration](#expo-configuration) below.

**Bare React Native:** change the parent of your app theme in `android/app/src/main/res/values/styles.xml`:

```xml
<resources>
    <style name="AppTheme" parent="Theme.Material3.DayNight.NoActionBar">
        <!-- Keep the items the React Native template put here -->
        <item name="android:editTextBackground">@drawable/rn_edit_text_material</item>
    </style>
</resources>
```

Material 3 supplies a complete default color scheme. To use your own, override the colors you care about in the same style:

```xml
<item name="colorPrimary">@color/md_theme_primary</item>
<item name="colorOnPrimary">@color/md_theme_onPrimary</item>
<item name="colorPrimaryContainer">@color/md_theme_primaryContainer</item>
<item name="colorOnPrimaryContainer">@color/md_theme_onPrimaryContainer</item>
<item name="colorSecondaryContainer">@color/md_theme_secondaryContainer</item>
<item name="colorOnSecondaryContainer">@color/md_theme_onSecondaryContainer</item>
<item name="colorSurface">@color/md_theme_surface</item>
<item name="colorOnSurface">@color/md_theme_onSurface</item>
```

> **Tip:** Use Google's [Material Theme Builder](https://m3.material.io/theme-builder) to generate a complete color scheme, and define the colors in `res/values/colors.xml`.

### Mode Selection Guide

Choose the mode that matches your app's theme:

```tsx
// If your app uses Theme.Material3.* (recommended)
<DatePicker android={{ material: 'm3' }} />
<SelectionMenu android={{ material: 'm3' }} />
<SegmentedControl /> // Always M3

// If your app uses Theme.AppCompat.* (the React Native default)
<DatePicker android={{ material: 'system' }} />
<SelectionMenu android={{ material: 'system' }} />
<SegmentedControl /> // Renders with Material 3 default colors
```

### Expo Configuration

For Expo projects, the config plugin sets up the theme and its colors during `npx expo prebuild`.

#### From one seed color

Pass your brand color as `seedColor`. The plugin generates a complete Material 3 color scheme for light and dark mode from it, with the same Tonal Spot algorithm that Material Theme Builder and Android dynamic color use:

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

Prebuild then:

- re-parents the generated `AppTheme` onto `Theme.Material3.DayNight.NoActionBar`, keeping the items Expo already put there (status bar colors and so on)
- writes every color role to `values/colors.xml` and `values-night/colors.xml` as `pc_theme_*` resources
- points the `AppTheme` color attributes (`colorPrimary`, `colorSecondaryContainer`, `colorSurfaceContainerHigh`, ...) at those resources, replacing Expo's `colorPrimary`

The top-level `seedColor` also sets the iOS accent color (see [Theming and Colors](/guides/theming#brand-colors)). Use `android.seedColor` to set the Android scheme alone.

#### Specific colors

`android.colors` sets individual color roles on top of the generated scheme, separately for light and dark mode:

```json
{
  "android": {
    "seedColor": "#00897B",
    "colors": {
      "light": { "primary": "#00897B" },
      "dark": { "primary": "#4DB6AC" }
    }
  }
}
```

Role names are the Material 3 names Material Theme Builder uses: `primary`, `onPrimaryContainer`, `surfaceContainerHigh`, and so on. Colors are `#RRGGBB` hex. A role you set for only `light` or only `dark` is used in both. `android.colors` also works without a seed color: roles you leave out keep the Material 3 defaults, and `colorPrimary` stays Expo's `primaryColor` unless you set `primary`.

#### From a Material Theme Builder export

Export your theme from [Material Theme Builder](https://m3.material.io/theme-builder) as **Material Theme (JSON)** and pass its `schemes` from `app.config.ts`:

```ts
import type { ExpoConfig } from 'expo/config';

import materialTheme from './material-theme.json';

const config: ExpoConfig = {
  name: 'my-app',
  slug: 'my-app',
  plugins: [
    [
      'react-native-platform-components/app.plugin',
      { android: { colors: materialTheme.schemes } },
    ],
  ],
};

export default config;
```

The plugin reads the `light` and `dark` schemes and skips the roles Android themes have no attribute for (`surfaceTint`, `shadow`, `scrim`).

#### Material 3 without custom colors

To switch to Material 3 but keep its default colors, set the theme only:

```json
{ "android": { "theme": "material3" } }
```

`AppTheme` is re-parented and no colors are written, so everything except `colorPrimary` (which stays Expo's `primaryColor`) uses the Material 3 baseline scheme.

Leave all of these options out to keep Expo's default AppCompat theme. Custom colors need Material 3, so combining `seedColor` or `android.colors` with `"theme": "appcompat"` stops prebuild with an error.

Re-run `npx expo prebuild` after changing any of these options.
