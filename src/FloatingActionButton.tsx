// FloatingActionButton.tsx
import React, { useCallback, useMemo } from 'react';
import type { ColorValue, ViewProps } from 'react-native';

import NativeFloatingActionButton from './FloatingActionButtonNativeComponent';
import type { Haptics } from './haptics';
import { resolveIcon, type PlatformIcon } from './icons';

/**
 * Button size.
 *
 * | Size      | Android FAB                     | Android extended FAB | iOS          |
 * | --------- | ------------------------------- | -------------------- | ------------ |
 * | `small`   | 40dp small FAB (Material 3)     | 56dp small extended  | 44pt circle  |
 * | `regular` | 56dp FAB                        | 56dp small extended  | 56pt circle  |
 * | `medium`  | 80dp medium FAB (M3 Expressive) | 80dp medium extended | 80pt circle  |
 * | `large`   | 96dp large FAB                  | 96dp large extended  | 96pt circle  |
 *
 * An extended iOS button is a capsule of the same height.
 */
export type FloatingActionButtonSize = 'small' | 'regular' | 'medium' | 'large';

export interface FloatingActionButtonProps extends ViewProps {
  /** The icon. See {@link PlatformIcon}. */
  icon: PlatformIcon;

  /**
   * Label shown next to the icon: the extended FAB. Omit for an icon-only
   * button, and give it an `accessibilityLabel`.
   */
  label?: string;

  /**
   * Whether a button with a `label` shows it. Default: `true`. Changing it
   * animates: Android's `extend()` / `shrink()`, a capsule-to-circle
   * animation on iOS. Ignored without a `label`.
   */
  extended?: boolean;

  /** Size. Default: `'regular'`. See {@link FloatingActionButtonSize}. */
  size?: FloatingActionButtonSize;

  /**
   * Container color. Android: `backgroundTint` (default: the Material
   * primary container). iOS: `baseBackgroundColor`, the tint of the
   * prominent glass (default: the tint color).
   */
  color?: ColorValue;

  /**
   * Icon and label color. Android: the icon tint and text color. iOS:
   * `baseForegroundColor`.
   */
  tintColor?: ColorValue;

  /** Whether the button is disabled. */
  disabled?: boolean;

  /** Screen-reader label. Defaults to `label`. */
  accessibilityLabel?: string;

  /**
   * Haptic played when the button is pressed. Default: none, like the
   * native buttons. See {@link Haptics}.
   */
  haptics?: Haptics;

  /** Called when the button is pressed. */
  onPress?: () => void;

  /**
   * The `nativeID` of the ScrollView (or FlatList) whose scrolling shrinks
   * and extends the button: an extended button shrinks to its icon while
   * the content scrolls down and extends again scrolling up or back at the
   * top. Needs a `label`; `extended={false}` keeps it shrunk.
   */
  scrollViewNativeID?: string;

  /** Test identifier */
  testID?: string;
}

export function FloatingActionButton(
  props: FloatingActionButtonProps
): React.ReactElement {
  const {
    icon,
    label,
    extended,
    size,
    color,
    tintColor,
    disabled,
    accessibilityLabel,
    haptics,
    onPress,
    scrollViewNativeID,
    ...viewProps
  } = props;

  const nativeIcon = useMemo(() => resolveIcon(icon), [icon]);

  const handlePress = useCallback(() => onPress?.(), [onPress]);

  return (
    <NativeFloatingActionButton
      icon={nativeIcon}
      label={label ?? ''}
      size={size ?? 'regular'}
      extended={extended === false ? 'false' : 'true'}
      color={color}
      foregroundColor={tintColor}
      interactivity={disabled ? 'disabled' : 'enabled'}
      spokenLabel={accessibilityLabel ?? ''}
      scrollViewNativeID={scrollViewNativeID ?? ''}
      haptics={haptics ?? ''}
      onFabPress={onPress ? handlePress : undefined}
      {...viewProps}
    />
  );
}
