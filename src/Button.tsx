// Button.tsx
import React, { useCallback, useMemo } from 'react';
import type { ColorValue, ViewProps } from 'react-native';

import NativeButton from './ButtonNativeComponent';
import { resolveIcon, type PlatformIcon } from './icons';
import { normalizeLabelStyle, type LabelStyle } from './labelStyle';
import type { AndroidMaterialStyle } from './sharedTypes';

/**
 * Emphasis of the button, from highest to lowest.
 *
 * | Variant    | Android (Material 3 Expressive) | iOS (`UIButton.Configuration`) |
 * | ---------- | ------------------------------- | ------------------------------ |
 * | `filled`   | Filled button                   | `.filled()`                    |
 * | `tonal`    | Filled tonal button             | `.tinted()`                    |
 * | `outlined` | Outlined button                 | `.bordered()`                  |
 * | `text`     | Text button                     | `.plain()`                     |
 * | `elevated` | Elevated button                 | `.gray()`                      |
 * | `glass`    | Filled tonal button             | `.glass()` (iOS 26+), else `.gray()` |
 * | `prominentGlass` | Filled button             | `.prominentGlass()` (iOS 26+), else `.filled()` |
 *
 * The glass variants are the iOS 26 Liquid Glass buttons; `color` tints
 * the prominent glass and `tintColor` colors the label and icon.
 */
export type ButtonVariant =
  | 'filled'
  | 'tonal'
  | 'outlined'
  | 'text'
  | 'elevated'
  | 'glass'
  | 'prominentGlass';

/**
 * Button size. Material 3 Expressive defines five sizes; iOS maps them onto
 * `UIButton.Configuration.Size` (`xsmall` → mini, `xlarge` → large).
 */
export type ButtonSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Corner shape. `round` is a pill; `square` keeps rounded corners. Unset
 * means the platform default (round on Android, dynamic on iOS).
 */
export type ButtonShape = 'round' | 'square';

export interface ButtonProps extends ViewProps {
  /** Button text. Omit for an icon-only button. */
  label?: string;

  /** Icon shown before the label, or alone when there is no label. */
  icon?: PlatformIcon;

  /** Emphasis. Default: `'filled'`. See {@link ButtonVariant}. */
  variant?: ButtonVariant;

  /** Size. Default: `'small'`, the Material 3 default. */
  size?: ButtonSize;

  /** Corner shape. Default: platform default. */
  shape?: ButtonShape;

  /** Whether the button is disabled. */
  disabled?: boolean;

  /**
   * Container (background) color.
   * Android: `backgroundTint`. iOS: `baseBackgroundColor`.
   */
  color?: ColorValue;

  /**
   * Label and icon color.
   * Android: text color and `iconTint`. iOS: `baseForegroundColor`.
   */
  tintColor?: ColorValue;

  /** Label font. */
  labelStyle?: LabelStyle;

  /** Screen-reader label. Defaults to `label`. */
  accessibilityLabel?: string;

  /** Called when the button is pressed. */
  onPress?: () => void;

  /**
   * Android-specific configuration
   */
  android?: {
    /** Ripple color shown while pressing. */
    rippleColor?: ColorValue;

    /** Outline color (outlined variant). */
    strokeColor?: ColorValue;

    /**
     * Material style: Material 3 Expressive (default), or the classic
     * Material 3 button, which has one size and shape (`size` and `shape`
     * are ignored).
     */
    material?: AndroidMaterialStyle;
  };

  /** Test identifier */
  testID?: string;
}

export function Button(props: ButtonProps): React.ReactElement {
  const {
    label,
    icon,
    variant,
    size,
    shape,
    disabled,
    color,
    tintColor,
    labelStyle,
    accessibilityLabel,
    onPress,
    android,
    ...viewProps
  } = props;

  const nativeIcon = useMemo(() => resolveIcon(icon), [icon]);
  const nativeLabelStyle = useMemo(
    () => normalizeLabelStyle(labelStyle),
    [labelStyle]
  );

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  return (
    <NativeButton
      label={label ?? ''}
      icon={nativeIcon}
      variant={variant ?? 'filled'}
      size={size ?? 'small'}
      shape={shape ?? ''}
      interactivity={disabled ? 'disabled' : 'enabled'}
      color={color}
      foregroundColor={tintColor}
      androidRippleColor={android?.rippleColor}
      androidStrokeColor={android?.strokeColor}
      androidMaterial={android?.material ?? 'expressive'}
      labelStyle={nativeLabelStyle}
      spokenLabel={accessibilityLabel ?? ''}
      onButtonPress={onPress ? handlePress : undefined}
      {...viewProps}
    />
  );
}
