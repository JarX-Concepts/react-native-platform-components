---
title: "LiquidGlass"
description: "Liquid glass for React Native: UIGlassEffect on iOS 26, glass that merges and morphs in a UIGlassContainerEffect, and a fallback View on Android and older iOS."
---

<table>
  <tr>
    <td align="center"><strong>iOS</strong></td>
    <td align="center"><strong>Android</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-liquidglass.gif" height="480" alt="LiquidGlass on iOS" /></td>
    <td align="center" valign="middle"><em>iOS 26+ only</em><br/><br/>On Android, renders as a<br/>regular View with optional<br/>fallback background color.</td>
  </tr>
</table>

Native glass morphism effect using **UIGlassEffect** on iOS 26+. On Android and older iOS versions, renders as a regular View with optional fallback styling. Put glass views in a [`LiquidGlassContainer`](#liquidglasscontainer) to have neighbours merge and morph into each other.

> **Note:** LiquidGlass requires **iOS 26+** at runtime, and the library must be **built with Xcode 26** (the iOS 26 SDK). Built with an older Xcode, the glass code is compiled out and the component falls back to a blur, so the library still builds without Xcode 26. On older iOS versions and on Android, the component renders children without the glass effect. Use `isLiquidGlassSupported` to check availability and provide fallback UI — it reports what the build can actually do, not just the OS version.

### Props

| Prop           | Type                                   | Description                                                                          |
| -------------- | -------------------------------------- | ------------------------------------------------------------------------------------ |
| `cornerRadius` | `number`                               | Corner radius for the glass effect (default: `0`)                                    |
| `cornerStyle`  | `'capsule' \| 'concentric' \| number` | Corner shape, a `UICornerConfiguration` on iOS 26. See [Corner styles](#corner-styles). Default: `cornerRadius` |
| `children`     | `ReactNode`                            | Content to render inside the glass container                                         |

### iOS Props (`ios`)

| Prop          | Type                             | Description                                          |
| ------------- | -------------------------------- | ---------------------------------------------------- |
| `effect`      | `'clear' \| 'regular' \| 'none'` | Glass effect intensity (default: `'regular'`)        |
| `interactive` | `boolean`                        | Enable touch interaction feedback (default: `false`) |
| `tintColor`   | `string`                         | Overlay tint color (hex string)                      |
| `colorScheme` | `'light' \| 'dark' \| 'system'`  | Appearance mode (default: `'system'`)                |

### Android Props (`android`)

| Prop                      | Type     | Description                                    |
| ------------------------- | -------- | ---------------------------------------------- |
| `fallbackBackgroundColor` | `string` | Background color when glass effect unavailable |

### Constants

| Export                   | Type      | Description                          |
| ------------------------ | --------- | ------------------------------------ |
| `isLiquidGlassSupported` | `boolean` | `true` on iOS 26+ when built with the iOS 26 SDK, `false` otherwise |

### Effect Modes

- **`'regular'`** (default): Standard glass blur intensity with full glass morphism effect
- **`'clear'`**: More transparent, subtle glass effect
- **`'none'`**: No glass effect (useful for animating materialization/dematerialization)

### Corner styles

`cornerStyle` sets the view's `cornerConfiguration` on iOS 26, which shapes the glass:

- **`'capsule'`**: `.capsule()`. The short sides are fully rounded and follow the view's size, so a button stays a pill as it grows.
- **`'concentric'`**: `.corners(radius: .containerConcentric())`. Each corner is concentric with the matching corner of the shape around it: a parent `LiquidGlass`, or the screen's corners. A card inset 12 pt in a glass with a 36 pt radius gets 24 pt corners where it meets the outer corners, and `cornerRadius` (the minimum) elsewhere.
- **a number**: a fixed radius, the same as `cornerRadius`.

Without `cornerStyle`, `cornerRadius` is used as before (on iOS 26 it goes through `cornerConfiguration` too, so concentric children can follow it).

| iOS 26 |
| --- |
| ![A glass card with a 36 pt radius, holding a concentric card and a capsule button](/img/components/liquidglass/corners-ios.webp) |

```tsx
<LiquidGlass cornerRadius={36} style={{ padding: 12, gap: 10 }}>
  <LiquidGlass cornerStyle="concentric" cornerRadius={8} style={{ flex: 1 }}>
    {/* … */}
  </LiquidGlass>
  <LiquidGlass cornerStyle="capsule" style={{ height: 48 }}>
    {/* … */}
  </LiquidGlass>
</LiquidGlass>
```

Corner configurations are iOS 26 API. Elsewhere, `'capsule'` rounds to half the shorter side and `'concentric'` uses `cornerRadius`. That shows on Android, where the view has `android.fallbackBackgroundColor`; on iOS before 26 the view has no background, so the corners have nothing to shape.

| Android (with `android.fallbackBackgroundColor`) |
| --- |
| ![The same card on Android: the capsule is rounded to half its height, the concentric card uses its 8 dp cornerRadius](/img/components/liquidglass/corners-android.webp) |

### Platform Behavior

| Platform      | iOS 26+             | iOS < 26    | Android      |
| ------------- | ------------------- | ----------- | ------------ |
| Glass Effect  | Full glass morphism | No effect   | No effect    |
| Corner Radius | Applied             | Applied     | Applied      |
| Corner Style  | `cornerConfiguration` | Capsule: half the short side; concentric: `cornerRadius` | Same as iOS < 26 |
| Tint Color    | Supported           | Ignored     | Ignored      |
| Interactive   | Supported           | Ignored     | Ignored      |
| Fallback BG   | N/A                 | Transparent | Configurable |
| Container     | Merging and morphing glass | Plain container | Plain container |

### Usage Tips

1. **Check support first**: Use `isLiquidGlassSupported` to conditionally render fallback UI
2. **Background content**: Glass effects work best over images or colorful backgrounds
3. **Interactive mode**: Only applies on mount; cannot be toggled after initial render
4. **Android fallback**: Set `android.fallbackBackgroundColor` for a semi-transparent background

## LiquidGlassContainer

On iOS 26, glass that sits close together merges into one shape inside a glass container, which is how grouped toolbar buttons and expanding controls are drawn. `LiquidGlassContainer` is that container: a `UIVisualEffectView` with a **UIGlassContainerEffect**. The `LiquidGlass` views inside it render together, and neighbours within `spacing` blend into each other.

```tsx
import { LiquidGlass, LiquidGlassContainer } from 'react-native-platform-components';

<LiquidGlassContainer spacing={24} style={{ flexDirection: 'row', gap: 8 }}>
  <LiquidGlass cornerStyle="capsule" style={styles.button}>{/* … */}</LiquidGlass>
  <LiquidGlass cornerStyle="capsule" style={styles.button}>{/* … */}</LiquidGlass>
  {showMore && (
    <LiquidGlass cornerStyle="capsule" style={styles.button}>{/* … */}</LiquidGlass>
  )}
</LiquidGlassContainer>
```

The `LiquidGlass` views don't have to be direct children: any `LiquidGlass` below the container joins it, unless it sits inside another `LiquidGlass`.

| Prop       | Type        | Description                                                                                                         |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `spacing`  | `number`    | How far apart glass can be and still merge (`UIGlassContainerEffect.spacing`). iOS 26 only. Default: the system's, `0` on iOS 26, where glass doesn't merge across gaps |
| `children` | `ReactNode` | Content, with the `LiquidGlass` views that merge                                                                    |

`spacing` is UIKit's value, not a gap: in the example, two buttons 8 pt apart stay separate at `12` and merge at `24`.

| Default spacing (iOS 26) | `spacing={24}` (iOS 26) |
| --- | --- |
| ![Two glass buttons 8 pt apart, separate](/img/components/liquidglass/container-separate-ios.webp) | ![The same buttons merged into one shape](/img/components/liquidglass/container-merged-ios.webp) |

### Morphing

Changes inside a container that's on screen animate, so the glass morphs instead of popping:

- **A `LiquidGlass` appears:** its glass materializes (UIKit animates `effect` from `nil` to a `UIGlassEffect` in an animation block), and grows out of the neighbours it merges with.
- **A `LiquidGlass` goes away:** React removes the view at once, so a copy of its glass stays in the container and dematerializes in its place. At the edge of the container, the copy shrinks into the neighbour it was merged with.
- **A `LiquidGlass` changes frame** (it widens, or moves because a sibling came or went): the new frame is applied in a spring animation, which reshapes the merged glass. The container animates its own size the same way, since it clips the glass near its bounds.

| iOS 26: a button appears, then the first one widens |
| --- |
| ![A third glass button materializing out of the group, then the first button widening into a Favorite label while the others slide over](/img/components/liquidglass/container-morph-ios.webp) |

Glass that arrives with the container (the first render, or a screen that comes back) appears without an animation. Only the glass itself morphs: the React content inside a `LiquidGlass` takes its new layout at once. A new `spacing` applies without an animation.

### Fallback

`UIGlassContainerEffect` is iOS 26 API. On Android, on older iOS and on web, `LiquidGlassContainer` is a plain container: the `LiquidGlass` views inside render as they do anywhere else, and `spacing` does nothing.

| iOS 18 | Android (with `android.fallbackBackgroundColor`) |
| --- | --- |
| ![The same group on iOS 18: no glass, the labels over the background](/img/components/liquidglass/container-ios18.webp) | ![The same group on Android: separate translucent capsules](/img/components/liquidglass/container-android.webp) |
