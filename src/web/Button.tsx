// web/Button.tsx
import React from 'react';
import { View } from 'react-native';

import type { ButtonProps } from '../Button';
import { Icon } from './Icon';
import {
  BUTTON_BASE,
  BUTTON_SIZES,
  buttonColors,
  cssColor,
  cssFont,
  usePrimaryColor,
} from './shared';

/** A `<button>`, styled after the Material 3 button variants. */
export function Button(props: ButtonProps): React.ReactElement {
  const {
    label,
    icon,
    iconPosition = 'leading',
    variant = 'filled',
    size = 'small',
    shape = 'round',
    cornerRadius,
    disabled,
    color,
    tintColor,
    disabledColor,
    disabledTintColor,
    labelStyle,
    accessibilityLabel,
    onPress,
    android,
    style,
    ...viewProps
  } = props;

  const primary = usePrimaryColor();
  const metrics = BUTTON_SIZES[size] ?? BUTTON_SIZES.small!;
  const colors = buttonColors(
    variant,
    primary,
    cssColor(color),
    cssColor(tintColor)
  );
  // Custom disabled colors replace the default faded look.
  const customDisabled =
    disabled &&
    (disabledColor !== undefined || disabledTintColor !== undefined);
  if (disabled) {
    if (disabledColor !== undefined) {
      colors.backgroundColor = cssColor(disabledColor);
    }
    if (disabledTintColor !== undefined) {
      colors.color = cssColor(disabledTintColor);
    }
  }

  return (
    <View {...viewProps} style={[{ alignSelf: 'flex-start' }, style]}>
      <button
        type="button"
        disabled={disabled}
        aria-label={accessibilityLabel ?? label}
        onClick={onPress}
        style={{
          ...BUTTON_BASE,
          ...colors,
          height: metrics.height,
          minWidth: metrics.height,
          padding: label ? `0 ${metrics.padding}px` : 0,
          flexDirection: iconPosition === 'trailing' ? 'row-reverse' : 'row',
          borderRadius:
            cornerRadius ?? (shape === 'square' ? 12 : metrics.height / 2),
          fontSize: metrics.fontSize,
          opacity: disabled && !customDisabled ? 0.38 : 1,
          cursor: disabled ? 'default' : 'pointer',
          ...cssFont(labelStyle),
        }}
      >
        <Icon icon={icon} color={colors.color as string | undefined} />
        {label}
      </button>
    </View>
  );
}
