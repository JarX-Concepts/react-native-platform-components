// Checkbox.tsx
import React, { useCallback, useState } from 'react';
import type { ViewProps } from 'react-native';

import NativeCheckbox, {
  type CheckboxChangeEvent,
} from './CheckboxNativeComponent';
import type { Haptics } from './haptics';

/**
 * A checkbox's state. `'indeterminate'` is the mixed state of a parent
 * checkbox whose children are partly checked.
 */
export type CheckboxState = boolean | 'indeterminate';

export interface CheckboxProps extends ViewProps {
  /**
   * The controlled state. The checkbox shows what the prop says: a tap
   * calls `onCheckedChange`, and the box changes once `checked` does (and
   * goes back if it doesn't).
   */
  checked: CheckboxState;

  /**
   * Called when the user toggles the checkbox, with the state asked for:
   * the opposite of `checked`, and `true` from `'indeterminate'` (as
   * Material, UIKit lists and the web do).
   */
  onCheckedChange?: (checked: boolean) => void;

  /**
   * Text beside the box. It wraps onto as many lines as it needs, and the
   * whole row (box and label) is one touch target.
   */
  label?: string;

  /** Whether the checkbox is disabled. */
  disabled?: boolean;

  /**
   * Error state. `true` shows the error look (Material 3's error colors on
   * Android, a red symbol on iOS). A string also shows that message under
   * the label, and screen readers announce it with the checkbox.
   */
  error?: boolean | string;

  /**
   * Haptic played when the user toggles the checkbox. Default: none, like
   * the native controls. See {@link Haptics}.
   */
  haptics?: Haptics;

  /**
   * Largest scale the label's font can reach with the system text size
   * (Dynamic Type / font scale), as on `Text`: `undefined` or `0` means no
   * cap; values of 1 or more cap it.
   */
  maxFontSizeMultiplier?: number;

  /** Screen-reader label. Defaults to `label`. */
  accessibilityLabel?: string;

  /**
   * Test identifier. It lands on the native element that carries the label,
   * the checked state and the touches (the row on iOS, the
   * `MaterialCheckBox` on Android).
   */
  testID?: string;
}

export function Checkbox(props: CheckboxProps): React.ReactElement {
  const {
    checked,
    onCheckedChange,
    label,
    disabled,
    error,
    haptics,
    maxFontSizeMultiplier,
    accessibilityLabel,
    testID,
    ...viewProps
  } = props;

  // Controlled, like React Native's Switch: every toggle re-renders with a
  // new event count, so native applies `checked` again and a toggle the
  // parent didn't take goes back.
  const [checkedEventCount, setCheckedEventCount] = useState(0);
  const handleToggle = useCallback(
    (e: { nativeEvent: CheckboxChangeEvent }) => {
      setCheckedEventCount((count) => count + 1);
      onCheckedChange?.(e.nativeEvent.checked);
    },
    [onCheckedChange]
  );

  return (
    <NativeCheckbox
      checked={
        checked === 'indeterminate'
          ? 'indeterminate'
          : checked
            ? 'true'
            : 'false'
      }
      checkedEventCount={checkedEventCount}
      label={label ?? ''}
      errorState={error ? 'error' : 'none'}
      errorText={typeof error === 'string' ? error : ''}
      interactivity={disabled ? 'disabled' : 'enabled'}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? 0}
      spokenLabel={accessibilityLabel ?? ''}
      haptics={haptics ?? ''}
      onCheckboxToggle={handleToggle}
      testID={testID}
      {...viewProps}
    />
  );
}
