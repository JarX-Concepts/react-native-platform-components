---
title: "FloatingToolbar"
description: "Native floating toolbar for React Native: Material 3 Expressive FloatingToolbarLayout on Android, a Liquid Glass capsule on iOS 26."
---

<table>
  <tr>
    <td align="center"><strong>iOS</strong></td>
    <td align="center"><strong>Android</strong></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/ios-floatingtoolbar.gif" height="480" alt="FloatingToolbar on iOS" /></td>
    <td><img src="https://raw.githubusercontent.com/JarX-Concepts/react-native-platform-components/main/assets/android-floatingtoolbar.gif" height="480" alt="FloatingToolbar on Android" /></td>
  </tr>
</table>

A toolbar that floats above the content, using **FloatingToolbarLayout** (Material 3 Expressive) on Android and a capsule of **UIGlassEffect** on iOS 26 (a blur material with a soft shadow on earlier versions). The toolbar is a container: put [Button](/components/button)s, or anything else, inside it and position it with a style.

```tsx
import { Button, FloatingToolbar } from 'react-native-platform-components';

<View style={{ flex: 1 }}>
  {/* content */}

  <FloatingToolbar style={{ position: 'absolute', bottom: 24 }}>
    <Button icon="square.and.arrow.up" variant="text" accessibilityLabel="Share" onPress={share} />
    <Button icon="pencil" variant="text" accessibilityLabel="Edit" onPress={edit} />
    <Button icon="trash" variant="text" accessibilityLabel="Delete" onPress={remove} />
    <Button label="Send" variant="tonal" onPress={send} />
  </FloatingToolbar>
</View>
```

The toolbar centers itself horizontally (`alignSelf: 'center'`) and adds the Material padding and gap; override any of it through `style`.

### Props

| Prop                 | Type                           | Description                                                                              |
| -------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| `orientation`        | `'horizontal' \| 'vertical'`   | Layout direction of the children. Default: `'horizontal'`                                |
| `color`              | `ColorValue`                   | Container color. Default: the platform's toolbar material. See [Color](#color)           |
| `scrollViewNativeID` | `string`                       | The `nativeID` of the ScrollView (or FlatList) the toolbar floats over. See [Linked ScrollView](#linked-scrollview) |
| `hideOnScroll`       | `boolean`                      | Slide past the ScrollView's edge while its content scrolls down. Needs `scrollViewNativeID`. Default: `false` |
| `children`           | `ReactNode`                    | The toolbar's actions                                                                    |

### iOS Props (`ios`)

| Prop               | Type                                             | Description                                                                 |
| ------------------ | ------------------------------------------------ | --------------------------------------------------------------------------- |
| `effect`           | `'regular' \| 'clear'`                           | Liquid Glass style on iOS 26. Default: `'regular'`                          |
| `interactive`      | `boolean`                                        | iOS 26: the glass scales and shimmers under a touch (`UIGlassEffect.isInteractive`). Default: `false` |
| `scrollEdgeEffect` | `'automatic' \| 'soft' \| 'hard' \| 'hidden'`    | iOS 26: the linked ScrollView's edge effect under the toolbar. Default: the ScrollView's own |

### Android Props (`android`)

| Prop      | Type                       | Description                                                                                       |
| --------- | -------------------------- | ------------------------------------------------------------------------------------------------- |
| `variant` | `'standard' \| 'vibrant'`  | Material 3 color variant: `surfaceContainer` or `primaryContainer`. Default: `'standard'`         |

### Platform behavior

| Platform      | Container                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------- |
| Android       | `FloatingToolbarLayout`: Material 3 shape, elevation and colors, standard or vibrant variant |
| iOS 26+       | `UIGlassEffect` capsule (regular or clear)                                                  |
| iOS 15 – 18   | `UIBlurEffect` capsule with the thin material and a soft shadow                             |

On Android the toolbar's window-inset margins are disabled, since React Native positions the view; add your own bottom inset with `useSafeAreaInsets` or the `bottom` style.

### Linked ScrollView

Native floating toolbars react to the content under them. Pass the `nativeID` of the ScrollView (or FlatList) the toolbar floats over as `scrollViewNativeID`. The toolbar finds the edge of it that it sits on: the top or bottom edge for a horizontal toolbar, the left or right edge for a vertical one, whichever is nearer.

```tsx
<View style={{ flex: 1 }}>
  <FlatList nativeID="feed" data={posts} renderItem={renderPost} />
  <FloatingToolbar
    scrollViewNativeID="feed"
    hideOnScroll
    ios={{ scrollEdgeEffect: 'soft', interactive: true }}
    style={{ position: 'absolute', bottom: insets.bottom + 16 }}
  >
    ...
  </FloatingToolbar>
</View>
```

**Scroll edge effect (iOS 26).** Linked, the toolbar adds a `UIScrollEdgeElementContainerInteraction` for its edge, so the ScrollView's edge effect (the blur and fade the system draws under bars) takes the toolbar's shape. `ios.scrollEdgeEffect` sets that edge's `UIScrollEdgeEffect`: `'soft'` fades the content out, `'hard'` cuts it off with a dividing line, `'hidden'` turns the effect off, and `'automatic'` lets the system choose. Without it the ScrollView keeps its own style. When the toolbar unlinks or unmounts, the ScrollView gets its previous values back. Before iOS 26 there is no edge effect.

| `'soft'` (iOS 26) | `'hard'` (iOS 26) |
| --- | --- |
| ![Rows fading into a blur under the glass toolbar](/img/components/floatingtoolbar/scroll-edge-soft-ios.webp) | ![Rows cut off by an opaque band under the glass toolbar](/img/components/floatingtoolbar/scroll-edge-hard-ios.webp) |

**Hide on scroll.** With `hideOnScroll`, the toolbar slides past its edge of the ScrollView while the content scrolls down, and comes back as it scrolls up or reaches the top. This is the motion of Material's `HideViewOnScrollBehavior` (175 ms out, 225 ms back) on both platforms. The behavior itself only works inside a `CoordinatorLayout`, which a React Native screen doesn't have, so the toolbar moves itself, as [TabBar](/components/tabbar#minimize-on-scroll) does on Android. It moves from where it sits to just past the ScrollView's edge. If the ScrollView doesn't reach the screen edge, put both in a view with `overflow: 'hidden'` so the toolbar leaves the screen rather than stopping below the list. While the toolbar is away, touches in its place reach the content. Only vertical scrolling hides it.

| iOS 26 (before, after scrolling down) | Android (before, after scrolling down) |
| --- | --- |
| ![The toolbar over the list, then gone after scrolling down](/img/components/floatingtoolbar/hide-on-scroll-ios.webp) | ![The Material toolbar over the list, then gone after scrolling down](/img/components/floatingtoolbar/hide-on-scroll-android.webp) |

**Interactive glass (iOS 26).** `ios.interactive` makes the glass `UIGlassEffect.isInteractive`: it scales and shimmers under a touch, as system toolbars do.

On web the toolbar ignores the linked ScrollView.

### Buttons inside

On Android, `Button`s inside the toolbar take the toolbar's button styles (`ThemeOverlay.Material3.FloatingToolbar`), as XML children of a `FloatingToolbarLayout` would: `text` buttons are flat, icon-only `text` buttons are the toolbar's icon buttons, and `tonal` keeps its container for one emphasized action. The `vibrant` variant restyles them for the primary container. On iOS the buttons are plain `UIButton`s on the glass.

### View switcher

Any component can go in the toolbar. A [SegmentedControl](/components/segmentedcontrol) inside it is the iOS 26 Photos pattern, a view picker in a glass pill, and gives Material segmented buttons inside the Material toolbar on Android. Give the control a width: on its own it fills whatever width the toolbar offers.

```tsx
<FloatingToolbar style={{ position: 'absolute', bottom: 24 }}>
  <SegmentedControl
    style={{ width: 250 }}
    segments={[
      { label: 'Years', value: 'years' },
      { label: 'Months', value: 'months' },
      { label: 'All', value: 'all' },
    ]}
    selectedValue={view}
    onSelect={setView}
  />
  <Button icon="square.and.arrow.up" variant="text" accessibilityLabel="Share" onPress={share} />
</FloatingToolbar>
```

### Floating tabs

A transparent [TabBar](/components/tabbar) in the toolbar gives floating tabs on Android and on iOS before 26. On iOS 26 the tab bar is already a floating Liquid Glass bar; show it without the toolbar there (`isLiquidGlassSupported`). See [Floating tabs](/components/tabbar#floating-tabs).

### Orientation

`orientation="vertical"` stacks the children; the container stays a capsule. Position it with `top` / `bottom` and `right` / `left`.

```tsx
<FloatingToolbar
  orientation="vertical"
  style={{ position: 'absolute', top: 16, right: 16, alignSelf: 'flex-end' }}
>
  ...
</FloatingToolbar>
```

### Color

`color` tints the container: the Material shape's fill on Android, the glass (or a wash over the blur) on iOS. Use it rather than `style.backgroundColor`, which would replace the native shape.

```tsx
<FloatingToolbar color="#FF6B35" android={{ variant: 'vibrant' }}>
  ...
</FloatingToolbar>
```
