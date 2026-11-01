// Switch.tsx
import React, { useCallback, useMemo, useState } from 'react';
import type { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native';

import NativeSwitch, { type SwitchChangeEvent } from './SwitchNativeComponent';
import type { Haptics } from './haptics';
import { NO_ICON, resolveIcon, type PlatformIcon } from './icons';

/**
 * The icon on an Android switch's thumb. `'check'` is Material's check
 * mark, shown while the switch is on; any other {@link PlatformIcon} is
 * shown in both states.
 */
export type SwitchThumbIcon = 'check' | PlatformIcon;

export interface SwitchAndroidProps {
  /**
   * Icon on the thumb (Material 3 `thumbIconDrawable`). `'check'` shows
   * Material's check mark while the switch is on. Any other icon (a
   * drawable name, `{ type: 'drawable' }` or `{ type: 'image' }`) shows in
   * both states, tinted by the theme. To use a drawable named `check`,
   * pass `{ type: 'drawable', name: 'check' }`. Default: none.
   */
  thumbIcon?: SwitchThumbIcon;
}

export interface SwitchProps extends ViewProps {
  /**
   * Whether the switch is on. Controlled, as with React Native's `Switch`:
   * a toggle calls `onValueChange` with the new value, and the switch goes
   * back unless the parent passes that value in. Default: `false`.
   */
  value?: boolean;

  /** Called with the new value when the user toggles the switch. */
  onValueChange?: (value: boolean) => void;

  /** Whether the switch is disabled. */
  disabled?: boolean;

  /**
   * Text of a settings row: the label at the leading edge and the switch at
   * the trailing edge, and the whole row toggles the switch. The row is one
   * element: it carries the `testID`, the screen-reader label (this text
   * unless `accessibilityLabel` is set) and the switch role and state. The
   * label wraps onto more lines when the row is narrow.
   */
  label?: string;

  /**
   * Track color while on. Default: the theme's (iOS: the brand color set
   * with `useNativeTheme`, else UIKit's green; Android: the Material
   * theme's `colorPrimary`).
   *
   * iOS: `onTintColor`. Android: `trackTintList` (checked).
   */
  color?: ColorValue;

  /**
   * Track color while off. Default: the theme's.
   *
   * iOS: the switch's background (UIKit has no off track color; its gray
   * off track is translucent, so this color shows through it, as with
   * React Native's `Switch`). Android: `trackTintList` (unchecked).
   */
  trackColor?: ColorValue;

  /**
   * Thumb color, on and off. Default: the theme's (white on iOS; Material's
   * `colorOutline` off and `colorOnPrimary` on).
   *
   * iOS: `thumbTintColor`. Android: `thumbTintList`.
   */
  thumbColor?: ColorValue;

  /**
   * Haptic played when the user toggles the switch. Default: none beyond
   * the platform switch's own. See {@link Haptics}.
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
   * Test identifier of the switch (or of the whole row with a `label`):
   * the element that carries the label and the switch state and takes the
   * touches.
   */
  testID?: string;

  /** Android-only options. */
  android?: SwitchAndroidProps;
}

function resolveThumbIcon(icon: SwitchThumbIcon | undefined) {
  if (icon === 'check') return { ...NO_ICON, iconType: 'check' };
  return resolveIcon(icon);
}

export function Switch(props: SwitchProps): React.ReactElement {
  const {
    value,
    onValueChange,
    disabled,
    label,
    color,
    trackColor,
    thumbColor,
    haptics,
    maxFontSizeMultiplier,
    accessibilityLabel,
    android,
    ...viewProps
  } = props;

  const thumbIcon = android?.thumbIcon;
  const nativeThumbIcon = useMemo(
    () => resolveThumbIcon(thumbIcon),
    [thumbIcon]
  );

  // Controlled, like React Native's Switch: every toggle re-renders with a
  // new event count, so native applies `value` again and a toggle the
  // parent didn't take goes back.
  const [valueEventCount, setValueEventCount] = useState(0);
  const handleChange = useCallback(
    (event: NativeSyntheticEvent<SwitchChangeEvent>) => {
      setValueEventCount((count) => count + 1);
      onValueChange?.(event.nativeEvent.value);
    },
    [onValueChange]
  );

  return (
    <NativeSwitch
      value={value ?? false}
      valueEventCount={valueEventCount}
      label={label ?? ''}
      interactivity={disabled ? 'disabled' : 'enabled'}
      color={color}
      trackColor={trackColor}
      thumbColor={thumbColor}
      thumbIcon={nativeThumbIcon}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? 0}
      spokenLabel={accessibilityLabel ?? ''}
      haptics={haptics ?? ''}
      onSwitchChange={handleChange}
      {...viewProps}
    />
  );
}
