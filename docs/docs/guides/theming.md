---
title: "Theming and Colors"
description: "Design philosophy, theming, and the color formats accepted by react-native-platform-components."
---

<!-- Generated from the root README by docs/scripts/generate-from-readme.mjs. Edit the README, then run `yarn docs generate`. -->

- **Native first** — no JS re-implementation of pickers
- **Headless-friendly** — works with any custom UI
- **Codegen-safe** — string unions & sentinel values for type safety
- **Predictable behavior** — no surprise re-renders or layout hacks
- **Platform conventions** — respects native UX patterns

## Theming

This library does not expose theming props. Components inherit their appearance from your app's native platform theme.

- **iOS**: Components follow system appearance (light/dark mode) and use system-defined styles (e.g., `UIBlurEffect` for menu backgrounds). These are not customizable per-component.
- **Android**: Components respect your app's Material Theme. Customize via your `styles.xml` or Material 3 theme configuration.

This is intentional. The goal is native fidelity, not pixel-level customization. If you need custom styling beyond what the platform theme provides, this library may not be the right fit.

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
