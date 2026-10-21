---
title: 'Troubleshooting'
description: 'Known pitfalls when moving from JS controls to native ones: Android controls outside their parent that get no touches, dialogs and Detox synchronization, and harmless logcat warnings.'
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

### Detox doesn't wait for a native dialog

`Dialog` and `ActionSheet` open in their own system windows, and Detox's synchronization doesn't reliably wait for them to appear. On Android, Espresso also sees only the dialog's window while it is up. Wait for an action with `waitFor(...).toBeVisible().withTimeout(6000)` instead of tapping it right away, and on iOS match it with `.atIndex(0)`, since the alert puts its identifier on more than one view. See [Dialog testing](/components/dialog#testing) and [ActionSheet testing](/components/actionsheet#testing).

### "Could not find generated setter for PC…ViewManager" in logcat

Harmless. Every view manager in the library sets its props through its codegen delegate. React Native still looks for an older, reflection-based setter class the first time it uses a manager, and logs this warning when it doesn't find one.
