---
title: "Button"
description: "Native button for React Native: Material 3 Expressive on Android (five sizes, round or square, shape morphing on press), UIButton on iOS."
---

<table>
  <tr>
    <td align="center"><strong>iOS</strong></td>
    <td align="center"><strong>Android</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-button.gif" height="480" alt="Button on iOS" /></td>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-button.gif" height="480" alt="Button on Android" /></td>
  </tr>
</table>

Native button using **MaterialButton** with the Material 3 Expressive styles on Android and **UIButton** with a `UIButton.Configuration` on iOS. Each platform draws its own button: Android gets the Expressive shapes, sizes and press morph, iOS gets the system button of the iOS version it runs on.

```tsx
import { Button } from 'react-native-platform-components';

<Button label="Save" onPress={save} />
<Button label="Cancel" variant="text" onPress={cancel} />
<Button icon="plus" variant="tonal" accessibilityLabel="Add" onPress={add} />
```

### Props

| Prop                 | Type                                                     | Description                                                                              |
| -------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `label`              | `string`                                                 | Button text. Omit for an icon-only button                                                |
| `icon`               | `PlatformIcon`                                           | Icon next to the label, or alone. See [Icons](#icons)                                    |
| `iconPosition`       | `'leading' \| 'trailing'`                                | Side of the label the icon sits on. See [Icons](#icons). Default: `'leading'`            |
| `variant`            | `'filled' \| 'tonal' \| 'outlined' \| 'text' \| 'elevated' \| 'glass' \| 'prominentGlass'` | Emphasis. See [Variants](#variants). Default: `'filled'`                                 |
| `size`               | `'xsmall' \| 'small' \| 'medium' \| 'large' \| 'xlarge'` | Size. See [Sizes](#sizes). Default: `'small'`                                            |
| `shape`              | `'round' \| 'square'`                                    | Corner shape. See [Shape](#shape). Default: platform default                             |
| `cornerRadius`       | `number`                                                 | Corner radius in points (dp). Overrides `shape`. See [Shape](#shape)                     |
| `disabled`           | `boolean`                                                | Disables the button                                                                      |
| `loading`            | `boolean`                                                | Shows a spinner in place of the label and icon and ignores presses. See [Loading](#loading) |
| `color`              | `ColorValue`                                             | Container (background) color                                                             |
| `tintColor`          | `ColorValue`                                             | Label and icon color                                                                     |
| `disabledColor`      | `ColorValue`                                             | Container color while disabled. Unset keeps the platform's disabled look                 |
| `disabledTintColor`  | `ColorValue`                                             | Label and icon color while disabled. Unset keeps the platform's disabled look            |
| `labelStyle`         | `{ fontFamily?, fontSize?, fontWeight?, fontStyle? }`    | Label font. See [Styling](#styling)                                                      |
| `maxFontSizeMultiplier` | `number`                                              | Cap on the label's text-size scaling, as on `Text`. `0` / unset = no cap. See [Styling](#styling) |
| `accessibilityLabel` | `string`                                                 | Screen-reader label. Defaults to `label`; give icon-only buttons one                     |
| `haptics`            | `'selection' \| 'light' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error' \| 'none'` | Haptic played on a press, not while `loading` or disabled. See [Haptics](/guides/haptics). Default: none |
| `onPress`            | `() => void`                                             | Called when the button is pressed                                                        |

### Android Props (`android`)

| Prop          | Type                     | Description                                                                                               |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------------------- |
| `rippleColor` | `ColorValue`             | Ripple shown while pressing                                                                               |
| `strokeColor` | `ColorValue`             | Outline color (`outlined` variant)                                                                        |
| `material`    | `'m3' \| 'expressive'`  | Material style: Material 3 Expressive (default) or the classic Material 3 button. See [Material style](#material-style) |

### Variants

Five levels of emphasis, from highest to lowest. Android uses the Material 3 Expressive button styles; iOS uses the closest `UIButton.Configuration`, so buttons look like every other button on that iOS version.

| Variant    | Android                                                             | iOS           |
| ---------- | ------------------------------------------------------------------- | ------------- |
| `filled`   | Filled button (`materialButtonStyle`)                               | `.filled()`   |
| `tonal`    | Filled tonal button (`materialButtonTonalStyle`)                    | `.tinted()`   |
| `outlined` | Outlined button (`materialButtonOutlinedStyle`)                     | `.bordered()` |
| `text`     | Text button (`borderlessButtonStyle`)                               | `.plain()`    |
| `elevated` | Elevated button (`materialButtonElevatedStyle`)                     | `.gray()`     |

#### Liquid Glass

Two more variants give the iOS 26 Liquid Glass buttons. Earlier iOS versions and Android fall back to the closest regular style, so the same code works everywhere.

| Variant          | iOS 26+              | Before iOS 26 | Android |
| ---------------- | -------------------- | ------------- | ------- |
| `glass`          | `.glass()`           | `.gray()`     | Tonal   |
| `prominentGlass` | `.prominentGlass()`  | `.filled()`   | Filled  |

`color` tints the prominent glass (`baseBackgroundColor`) and `tintColor` colors the label and icon, as for `filled`. Pressed and disabled states follow the system glass behavior. In a [ButtonGroup](/components/buttongroup), selected glass buttons use the prominent glass style.

```tsx
<Button label="Done" variant="prominentGlass" color="#0A84FF" tintColor="white" />
<Button icon="xmark" variant="glass" accessibilityLabel="Close" />
```

### Sizes

Material 3 Expressive defines five button sizes; iOS maps them onto `UIButton.Configuration.Size`.

| Size     | Android height | iOS       |
| -------- | -------------- | --------- |
| `xsmall` | 32dp           | `.mini`   |
| `small`  | 40dp (default) | `.small`  |
| `medium` | 56dp           | `.medium` |
| `large`  | 96dp           | `.large`  |
| `xlarge` | 136dp          | `.large`  |

The button wraps its content. Give it `alignSelf: 'stretch'` or a `width` style to make it fill.

### Shape

Material 3 Expressive buttons come in two shapes: `round` (a pill, the default) and `square` (rounded corners). On Android the shape **morphs when pressed**, the signature Expressive interaction, and selected buttons in a [ButtonGroup](/components/buttongroup) morph too. On iOS `round` sets the capsule corner style and `square` the large one; unset keeps UIKit's dynamic corners.

```tsx
<Button label="Round" shape="round" size="medium" />
<Button label="Square" shape="square" size="medium" />
```

When a design specifies a radius, set `cornerRadius` (points on iOS, dp on Android). It overrides `shape`: iOS uses the fixed corner style with `background.cornerRadius`, Android sets the corner size on the button's `shapeAppearanceModel`, which turns off the Expressive press morph.

```tsx
<Button label="Radius 6" cornerRadius={6} />
```

### Loading

`loading` swaps the label and icon for the platform's spinner while a request is in flight. The button keeps its size, so the layout doesn't jump, keeps its enabled colors, and ignores presses. It also sets `accessibilityState.busy`, merged with any `accessibilityState` you pass.

```tsx
<Button label="Save" loading={saving} onPress={save} />
```

| Platform | Spinner |
| -------- | ------- |
| iOS      | `UIButton.Configuration.showsActivityIndicator`, centred in the button's idle size |
| Android  | A Material circular progress indicator (`IndeterminateDrawable`) at the icon size, drawn as the button icon in the label color; the label is hidden and the width kept |

### Icons

`icon` accepts the same shapes as [SegmentedControl](/components/segmentedcontrol#icon-support): an SF Symbol or drawable name, an image asset, or an `{ ios, android }` pair.

```tsx
// Native symbol on each platform
<Button
  label="Share"
  icon={{
    ios: { type: 'sfSymbol', name: 'square.and.arrow.up' },
    android: { type: 'drawable', name: 'share' },
  }}
/>

// One image asset for both, drawn as a tinted template
<Button label="Alerts" icon={{ type: 'image', source: require('./bell.png') }} />
```

The icon sits before the label by default. `iconPosition="trailing"` puts it after the label (iOS `imagePlacement = .trailing`, Android `iconGravity = textEnd`):

```tsx
<Button label="Next" icon="chevron.right" iconPosition="trailing" />
```

A button with an icon and no label is an **icon button**: on Android it uses the Material 3 Expressive icon button styles (a square container that keeps the `variant`), on iOS an image-only `UIButton`. Always give it an `accessibilityLabel`.

### Styling

Colors take any React Native `ColorValue`. Fonts follow the `Text` style conventions.

```tsx
<Button
  label="Brand"
  color="#FF6B35"
  tintColor="white"
  labelStyle={{ fontWeight: '700', fontSize: 15 }}
  android={{ rippleColor: 'rgba(255, 255, 255, 0.3)' }}
/>
```

| Prop                  | Android                        | iOS                   |
| --------------------- | ------------------------------ | --------------------- |
| `color`               | `backgroundTint`               | `baseBackgroundColor` |
| `tintColor`           | Text color and `iconTint`      | `baseForegroundColor` |
| `disabledColor`       | Disabled state of `backgroundTint` | Background color while `!isEnabled` (`configurationUpdateHandler`) |
| `disabledTintColor`   | Disabled state of the text color and `iconTint` | Title and image color while `!isEnabled` |
| `labelStyle`          | Typeface and size              | Title font            |
| `maxFontSizeMultiplier` | Scaled sp size capped at the multiplier | Dynamic Type size capped at the multiplier |
| `android.rippleColor` | Press ripple                   | —                     |
| `android.strokeColor` | Outline (`outlined` variant)   | —                     |

The label grows with the system text size (Dynamic Type on iOS, font scale on Android). `maxFontSizeMultiplier` caps that growth with the `Text` semantics: `2` lets the label reach twice its default size and no more; unset or `0` means no cap. On iOS the cap applies to the system title font and to a `labelStyle` without a `fontSize` (which follows the body text style); a fixed `labelStyle.fontSize` doesn't scale on iOS, so there is nothing to cap.

```tsx
<Button label="Continue" maxFontSizeMultiplier={1.5} />
```

A disabled button keeps the platform's disabled look (Material's disabled colors on Android, UIKit's on iOS) unless you set `disabledColor` / `disabledTintColor`, for example to keep the brand color at reduced opacity:

```tsx
<Button
  label="Brand"
  color="#FF6B35"
  tintColor="white"
  disabledColor="rgba(255, 107, 53, 0.4)"
  disabledTintColor="rgba(255, 255, 255, 0.8)"
  disabled
/>
```

Without these props the button takes its colors from the theme: the app's Material 3 theme or the brand color set with [`useNativeTheme`](/guides/theming) on Android, the tint color on iOS.

### Inside a FloatingToolbar

Buttons placed in a [FloatingToolbar](/components/floatingtoolbar) pick up the toolbar's button styles on Android, as Material's own toolbar children do: `filled` and `text` buttons become the toolbar's flat buttons, icon-only `text` buttons become the toolbar's icon buttons, and `tonal` keeps its container for an emphasized action.

### Material style

`android.material` picks the Android design generation: `'expressive'` (default) gives the Material 3 Expressive styles with their five sizes, two shapes and press morph; `'m3'` gives the classic Material 3 button, which has one size and shape, so `size` and `shape` are ignored. Use `'m3'` on screens that keep the older Material 3 look. Buttons inside a [FloatingToolbar](/components/floatingtoolbar) always take the toolbar's Expressive styles. [SegmentedControl](/components/segmentedcontrol#material-style) and [ButtonGroup](/components/buttongroup) take the same prop.

### Android theme

The Expressive look is a set of widget styles applied over your app theme, so your colors (and `useNativeTheme`) are kept. It works with a `Theme.Material3` app theme and with the library's Material 3 fallback; see [Android Theme Configuration](/guides/android-theme).
