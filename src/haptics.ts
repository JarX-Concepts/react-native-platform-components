// haptics.ts
//
// The `haptics` prop shared by the interactive components.

/**
 * Haptic feedback a control plays when the user acts on it: a press, a
 * selection change or a menu pick. Unset plays nothing beyond what the
 * platform control does itself.
 *
 * | Value       | iOS                                        | Android (`HapticFeedbackConstants`)    |
 * | ----------- | ------------------------------------------ | -------------------------------------- |
 * | `selection` | `UISelectionFeedbackGenerator`             | `SEGMENT_TICK` (API 34+), else `CLOCK_TICK` |
 * | `light`     | `UIImpactFeedbackGenerator` `.light`       | `CONTEXT_CLICK`                        |
 * | `medium`    | `UIImpactFeedbackGenerator` `.medium`      | `VIRTUAL_KEY`                          |
 * | `heavy`     | `UIImpactFeedbackGenerator` `.heavy`       | `LONG_PRESS`                           |
 * | `success`   | `UINotificationFeedbackGenerator` `.success` | `CONFIRM` (API 30+), else `VIRTUAL_KEY` |
 * | `warning`   | `UINotificationFeedbackGenerator` `.warning` | `REJECT` (API 30+), else `LONG_PRESS` |
 * | `error`     | `UINotificationFeedbackGenerator` `.error` | `REJECT` (API 30+), else `LONG_PRESS`  |
 * | `none`      | Nothing                                    | Nothing, and turns off the view's own haptic (`isHapticFeedbackEnabled`) |
 *
 * Both platforms follow the system haptics setting. Web ignores the prop.
 */
export type Haptics =
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'none';
