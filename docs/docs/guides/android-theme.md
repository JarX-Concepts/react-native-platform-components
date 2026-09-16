---
title: "Android Theme Configuration"
description: "How the Android components use your Material 3 theme, what happens under an AppCompat theme, and the Expo plugin option."
---

<!-- Generated from the root README by docs/scripts/generate-from-readme.mjs. Edit the README, then run `yarn docs generate`. -->

No theme setup is required to avoid a crash. React Native and Expo templates ship an AppCompat app theme, and every component works with it. When the theme is not a Material theme, `SegmentedControl` and the inline M3 `SelectionMenu` render with Material 3 default colors, the M3 date and time pickers use a built-in Material 3 dialog theme, and the library logs one warning under the `PlatformComponents` tag. Give the app a Material 3 theme to have those components use your app's colors instead.

> Releases up to 0.9.x crashed on mount in these cases (`Cannot find theme attribute materialButtonOutlinedStyle`, `You need to use a Theme.AppCompat theme`). Upgrade to get the fallback behavior.

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

**Expo:** pass `{ "android": { "theme": "material3" } }` to the config plugin. See [Expo Configuration](#expo-configuration) below.

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

For Expo projects, the config plugin configures the theme for you. With `android.theme` set to `material3`, `npx expo prebuild` re-parents the generated `AppTheme` onto `Theme.Material3.DayNight.NoActionBar` and keeps every item Expo already put there (`colorPrimary`, status bar colors, and so on). Material 3 supplies the remaining colors, so you only add the ones you want to override. Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-platform-components/app.plugin",
        {
          "android": {
            "theme": "material3"
          }
        }
      ]
    ]
  }
}
```

Then run `npx expo prebuild` to apply the configuration. Leave the option out (or set it to `appcompat`) to keep Expo's default AppCompat theme.
