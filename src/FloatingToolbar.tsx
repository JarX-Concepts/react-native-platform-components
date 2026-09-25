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

/** Scroll edge effect under the toolbar on iOS 26. */
export type FloatingToolbarScrollEdgeEffect =
  'automatic' | 'soft' | 'hard' | 'hidden';

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
   * The `nativeID` of the ScrollView (or FlatList) the toolbar floats over.
   * The toolbar works out which edge of it it sits on (top or bottom for a
   * horizontal toolbar, left or right for a vertical one). Needed by
   * `hideOnScroll` and `ios.scrollEdgeEffect`; on iOS 26 it also gives that
   * edge the scroll edge effect, shaped around the toolbar.
   */
  scrollViewNativeID?: string;

  /**
   * Slides the toolbar past its edge of the linked ScrollView while the
   * content scrolls down, and back as it scrolls up or reaches the top (the
   * motion of Material's `HideViewOnScrollBehavior`, on both platforms).
   * Needs `scrollViewNativeID`. Default: `false`.
   */
  hideOnScroll?: boolean;

  /**
   * iOS-specific configuration
   */
  ios?: {
    /**
     * Glass effect style on iOS 26. Older versions use a blur.
     * Default: `'regular'`.
     */
    effect?: FloatingToolbarIOSEffect;

    /**
     * iOS 26: the glass scales and shimmers under a touch
     * (`UIGlassEffect.isInteractive`). Default: `false`.
     */
    interactive?: boolean;

    /**
     * iOS 26: the style of the linked ScrollView's edge effect under the
     * toolbar (`UIScrollEdgeEffect`): `'soft'` fades the content out,
     * `'hard'` cuts it off with a dividing line, `'hidden'` turns it off.
     * The ScrollView gets its own values back when the toolbar unlinks.
     * Default: the ScrollView's own (`'automatic'` unless changed).
     */
    scrollEdgeEffect?: FloatingToolbarScrollEdgeEffect;
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
  const {
    style,
    orientation,
    color,
    scrollViewNativeID,
    hideOnScroll,
    ios,
    android,
    children,
    ...viewProps
  } = props;

  const nativeIos = useMemo(() => {
    if (Platform.OS !== 'ios' || !ios) return undefined;
    return {
      effect: ios.effect ?? 'regular',
      interactive: ios.interactive ?? false,
      scrollEdgeEffect: ios.scrollEdgeEffect ?? '',
    };
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
      scrollViewNativeID={scrollViewNativeID ?? ''}
      hideOnScroll={hideOnScroll ?? false}
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
