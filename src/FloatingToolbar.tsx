// FloatingToolbar.tsx
import React, { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  type ColorValue,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import NativeFloatingToolbar from './FloatingToolbarNativeComponent';

/** Glass effect style of the toolbar on iOS 26. */
export type FloatingToolbarIOSEffect = 'regular' | 'clear';

/** Material 3 color variant of the toolbar on Android. */
export type FloatingToolbarAndroidVariant = 'standard' | 'vibrant';

export interface FloatingToolbarProps extends ViewProps {
  /**
   * Layout direction of the children. Default: `'horizontal'`.
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * Container color. Default: the platform's toolbar material (Material 3
   * `surfaceContainer` or `primaryContainer` on Android, Liquid Glass or a
   * blur on iOS). Use this rather than `style.backgroundColor`, which would
   * replace the native shape.
   */
  color?: ColorValue;

  /**
   * iOS-specific configuration
   */
  ios?: {
    /**
     * Glass effect style on iOS 26. Older versions use a blur.
     * Default: `'regular'`.
     */
    effect?: FloatingToolbarIOSEffect;
  };

  /**
   * Android-specific configuration
   */
  android?: {
    /**
     * Material 3 color variant: `'standard'` (surface) or `'vibrant'`
     * (primary container). Default: `'standard'`.
     */
    variant?: FloatingToolbarAndroidVariant;
  };

  /** The toolbar's actions, usually `Button`s. */
  children?: React.ReactNode;

  /** Test identifier */
  testID?: string;
}

export function FloatingToolbar(
  props: FloatingToolbarProps
): React.ReactElement {
  const { style, orientation, color, ios, android, children, ...viewProps } =
    props;

  const nativeIos = useMemo(() => {
    if (Platform.OS !== 'ios' || !ios) return undefined;
    return { effect: ios.effect ?? 'regular' };
  }, [ios]);

  const nativeAndroid = useMemo(() => {
    if (Platform.OS !== 'android' || !android) return undefined;
    return { variant: android.variant ?? 'standard' };
  }, [android]);

  const mergedStyle = useMemo(
    (): StyleProp<ViewStyle> => [
      styles.toolbar,
      orientation === 'vertical' ? styles.vertical : styles.horizontal,
      style,
    ],
    [orientation, style]
  );

  return (
    <NativeFloatingToolbar
      style={mergedStyle}
      color={color}
      ios={nativeIos}
      android={nativeAndroid}
      {...viewProps}
    >
      {children}
    </NativeFloatingToolbar>
  );
}

// Material 3 floating toolbar: 8dp container padding, 4dp between actions.
// The capsule shape comes from native.
const styles = StyleSheet.create({
  toolbar: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
  },
  horizontal: { flexDirection: 'row' },
  vertical: { flexDirection: 'column' },
});
