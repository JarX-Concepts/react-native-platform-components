// web/FloatingActionButton.tsx
import React from 'react';
import { View } from 'react-native';

import type { FloatingActionButtonProps } from '../FloatingActionButton';
import { Icon } from './Icon';
import { BUTTON_BASE, cssColor, usePrimaryColor } from './shared';

/** Height (and diameter when shrunk), icon and label size for each size. */
const FAB_SIZES: Record<
  string,
  { height: number; icon: number; fontSize: number; padding: number }
> = {
  small: { height: 40, icon: 24, fontSize: 16, padding: 16 },
  regular: { height: 56, icon: 24, fontSize: 16, padding: 16 },
  medium: { height: 80, icon: 28, fontSize: 22, padding: 26 },
  large: { height: 96, icon: 36, fontSize: 24, padding: 28 },
};

/**
 * A `<button>` styled after the Material 3 FAB: a rounded square with the
 * icon, or the extended FAB with the label. `scrollViewNativeID` is ignored.
 */
export function FloatingActionButton(
  props: FloatingActionButtonProps
): React.ReactElement {
  const {
    icon,
    label,
    extended = true,
    size = 'regular',
    color,
    tintColor,
    disabled,
    accessibilityLabel,
    onPress,
    scrollViewNativeID: _scrollViewNativeID,
    style,
    ...viewProps
  } = props;

  const primary = usePrimaryColor();
  const metrics = FAB_SIZES[size] ?? FAB_SIZES.regular!;
  const showsLabel = !!label && extended;
  const foreground = cssColor(tintColor) ?? 'CanvasText';

  return (
    <View {...viewProps} style={[{ alignSelf: 'flex-start' }, style]}>
      <button
        type="button"
        disabled={disabled}
        aria-label={accessibilityLabel ?? label}
        onClick={onPress}
        style={{
          ...BUTTON_BASE,
          gap: 12,
          height: metrics.height,
          minWidth: metrics.height,
          padding: showsLabel ? `0 ${metrics.padding}px` : 0,
          border: 'none',
          borderRadius: size === 'small' ? 12 : metrics.height / 3.5,
          backgroundColor:
            cssColor(color) ?? `color-mix(in srgb, ${primary} 24%, Canvas)`,
          color: foreground,
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2)',
          fontSize: metrics.fontSize,
          opacity: disabled ? 0.38 : 1,
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        <Icon icon={icon} color={foreground} size={metrics.icon} />
        {showsLabel ? label : null}
      </button>
    </View>
  );
}
