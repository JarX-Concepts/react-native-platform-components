// web/Button.tsx
import React, { useEffect, useRef } from 'react';
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

/** The Web Animations API surface the spinner uses (no DOM lib here). */
type AnimatableElement = {
  animate?: (
    keyframes: object[],
    options: { duration: number; iterations: number }
  ) => { cancel: () => void };
};

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
    loading,
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

  const iconElement = (
    <Icon icon={icon} color={colors.color as string | undefined} />
  );

  // The Web Animations API spins the indicator without a stylesheet.
  const spinnerRef = useRef<AnimatableElement | null>(null);
  useEffect(() => {
    const spinner = spinnerRef.current;
    if (!loading || !spinner?.animate) return undefined;
    const animation = spinner.animate(
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      { duration: 800, iterations: Infinity }
    );
    return () => animation.cancel();
  }, [loading]);
  const spinnerSize = Math.round(metrics.fontSize * 1.3);

  return (
    <View {...viewProps} style={[{ alignSelf: 'flex-start' }, style]}>
      <button
        type="button"
        disabled={disabled}
        aria-label={accessibilityLabel ?? label}
        aria-busy={loading || undefined}
        onClick={loading ? undefined : onPress}
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
          cursor: disabled || loading ? 'default' : 'pointer',
          position: 'relative',
          ...cssFont(labelStyle),
        }}
      >
        {!loading && iconElement}
        {!loading && label}
        {loading && (
          <>
            {/* Hidden, not removed, so the button keeps its width */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: BUTTON_BASE.gap,
                flexDirection: 'inherit',
                visibility: 'hidden',
              }}
            >
              {iconElement}
              {label}
            </span>
            <span
              ref={(element) => {
                spinnerRef.current = element as unknown as AnimatableElement;
              }}
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: spinnerSize,
                height: spinnerSize,
                margin: -spinnerSize / 2,
                boxSizing: 'border-box',
                borderRadius: '50%',
                border: `2px solid ${colors.color ?? 'currentColor'}`,
                borderTopColor: 'transparent',
              }}
            />
          </>
        )}
      </button>
    </View>
  );
}
