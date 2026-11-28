---
title: 'Troubleshooting'
description: 'Known pitfalls when moving from JS controls to native ones: Android controls outside their parent that get no touches, text that keeps its old size after a text-size change, dialogs and Detox synchronization, and harmless logcat warnings.'
---

### A native control responds on iOS but not on Android

**Symptom:** a native control (a `Button`, `Chip`, `SegmentedControl` and so on) works on iOS, but on Android taps do nothing. In Detox on Android it may also fail with "not visible" (or "at least 75% visible") even though it is on screen. The JS `Pressable` it replaced worked on both platforms.

**Cause:** the control sits outside the bounds of its parent view. Android only passes a touch to a child view when the touch lands inside the parent's bounds, so the part of a native view that hangs outside its parent never gets touches. Espresso measures visibility by the same clipped rectangle. JS `Pressable`s don't run into this, because React Native does their hit-testing itself and follows children outside their parents. On iOS, React Native's views do the same for native subviews unless `overflow` is `hidden`. So the layout bug stays hidden until a control becomes native, and then shows up on Android only.

Common ways to get there:

- An absolutely positioned footer or toolbar inside a parent with a fixed or zero height, such as a form's submit row placed with `position: 'absolute'` under content that doesn't size the parent.
- Negative margins or a `transform` that moves the control past its parent's edge.
- A parent whose height comes from a percentage or `flex` that ends up smaller than its content, with `overflow` left `visible` so nothing looks wrong.

**Check:** turn on **Settings → Developer options → Show layout bounds** on the Android device or emulator, or select the parent in the React Native DevTools element inspector, and compare the parent's frame with the control's. The control has to lie fully inside every ancestor's frame.

**Fix:** let the parent contain the control: drop the fixed height so the parent sizes to its content, move the control into a parent that covers it, or give the parent the padding or `minHeight` the control needs. `overflow: 'visible'` doesn't help, since it changes drawing, not touch dispatch.

### Text goes back to its old size after a text-size change

**Symptom:** the user changes the system text size (iOS Dynamic Type, Android font size) while the app is running. React Native `Text` grows to the new size, then on the next render goes back to its old size, or keeps its old frame and draws the larger text clipped inside it. Text that mounts after the change gets the right size.

**Cause:** React Native's bug [react/react-native#57512](https://github.com/react/react-native/issues/57512), on the New Architecture before 0.87. When the font scale changes, React Native measures the text again, but only in the native copy of the view tree. The next render from React, wherever in the tree it happens (a state update, a `useWindowDimensions` change), builds on React's own copy, which still has the old measurements. On Android this only happens when the activity handles font-scale changes itself (`fontScale` in its `android:configChanges`). Otherwise Android recreates the activity and everything mounts again. React Native 0.87 fixes it ([#57246](https://github.com/react/react-native/pull/57246)).

**In this library:** the components handle it on older React Native versions. The React Native `Text` they render themselves (the `GlassDisclosure` pill and panel titles, the `FormSection` header and footer) remounts when the font scale changes, and nothing else does. Text the components draw natively isn't affected.

**Fix for your own `Text`** on React Native < 0.87: remount it when the font scale changes, by giving it a `key` from `useWindowDimensions`. Turning on the `updateRuntimeShadowNodeReferencesOnCommit` feature flag doesn't help.

```tsx
const { fontScale } = useWindowDimensions();

return <Text key={fontScale}>{title}</Text>;
```

A remount resets the state inside it, so put the `key` on the `Text` itself or the smallest part that shows the problem, and keep state you need above it.

### Detox doesn't wait for a native dialog

`Dialog` and `ActionSheet` open in their own system windows, and Detox's synchronization doesn't reliably wait for them to appear. On Android, Espresso also sees only the dialog's window while it is up. Wait for an action with `waitFor(...).toBeVisible().withTimeout(6000)` instead of tapping it right away, and on iOS match it with `.atIndex(0)`, since the alert puts its identifier on more than one view. See [Dialog testing](/components/dialog#testing) and [ActionSheet testing](/components/actionsheet#testing).

### "Could not find generated setter for PC…ViewManager" in logcat

Harmless. Every view manager in the library sets its props through its codegen delegate. React Native still looks for an older, reflection-based setter class the first time it uses a manager, and logs this warning when it doesn't find one.
