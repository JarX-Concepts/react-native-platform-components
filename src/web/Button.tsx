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
  warnOnce,
} from './shared';

/** The Web Animations API surface the spinner uses (no DOM lib here). */
type AnimatableElement = {
  animate?: (
    keyframes: object[],
    options: { duration: number; iterations: number }
  ) => { cancel: () => void };
};

/**
 * A `<button>`, styled after the Material 3 button variants. A toggle
 * (`selected`) sets `aria-pressed` and takes the filled look when selected.
 * Browsers have no native menu, so a button with a `menu` calls `onPress`.
 */
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
    // Browsers scale text with page zoom, which has no cap
    maxFontSizeMultiplier: _maxFontSizeMultiplier,
    accessibilityLabel,
    onPress,
    selected,
    onSelectedChange,
    menu,
    onMenuSelect: _onMenuSelect,
    onMenuOpen: _onMenuOpen,
    onMenuClose: _onMenuClose,
    // SF Symbols don't exist on the web
    ios: _ios,
    android,
    style,
    ...viewProps
  } = props;

  if (menu && menu.length > 0) {
    warnOnce(
      'Button.menu',
      'Button menus have no web implementation; the button calls onPress instead. ' +
        'See https://jarx-concepts.github.io/react-native-platform-components/guides/web'
    );
  }

  const isToggle = selected !== undefined;
  const primary = usePrimaryColor();
  const metrics = BUTTON_SIZES[size] ?? BUTTON_SIZES.small!;
  // A toggle is filled when selected; a filled toggle is tonal when not, as
  // Material's toggle buttons are
  const look = !isToggle
    ? variant
    : selected
      ? 'filled'
      : variant === 'filled'
        ? 'tonal'
        : variant;
  const colors = buttonColors(
    look,
    primary,
    isToggle && selected ? undefined : cssColor(color),
    isToggle && selected ? undefined : cssColor(tintColor)
  );
  const vertical = iconPosition === 'top' || iconPosition === 'bottom';
  const direction = (
    {
      leading: 'row',
      trailing: 'row-reverse',
      top: 'column',
      bottom: 'column-reverse',
    } as const
  )[iconPosition];

  const handleClick = () => {
    if (isToggle) onSelectedChange?.(!selected);
    onPress?.();
  };
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
        aria-pressed={isToggle ? !!selected : undefined}
        onClick={loading ? undefined : handleClick}
        style={{
          ...BUTTON_BASE,
          ...colors,
          // An icon above or below the label makes the button taller
          ...(vertical
            ? { minHeight: metrics.height, gap: 4 }
            : { height: metrics.height }),
          minWidth: metrics.height,
          padding: label ? `${vertical ? 8 : 0}px ${metrics.padding}px` : 0,
          flexDirection: direction,
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
