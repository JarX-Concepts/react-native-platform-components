// LiquidGlass.tsx
import React, { useCallback, useMemo } from 'react';
import { Platform, type ViewProps } from 'react-native';

import NativeLiquidGlass, {
  type LiquidGlassColorScheme,
  type LiquidGlassEffect,
  type LiquidGlassPressEvent,
} from './LiquidGlassNativeComponent';
import NativePlatformComponentsTheme from './NativePlatformComponentsTheme';

export type {
  LiquidGlassEffect,
  LiquidGlassColorScheme,
  LiquidGlassPressEvent,
};

/**
 * Corner shape of the glass: `'capsule'`, `'concentric'`, or a fixed radius.
 */
export type LiquidGlassCornerStyle = 'capsule' | 'concentric' | number;

function resolveLiquidGlassSupport(): boolean {
  if (Platform.OS !== 'ios') {
    return false;
  }
  try {
    // The native module answers for this build: Liquid Glass is compiled out
    // when the library is built with an Xcode that predates the iOS 26 SDK,
    // and then no device version makes it available.
    const supported = NativePlatformComponentsTheme?.isLiquidGlassSupported();
    if (typeof supported === 'boolean') {
      return supported;
    }
  } catch {
    // Native module not available (web, tests): fall back to the OS version.
  }
  return parseInt(String(Platform.Version), 10) >= 26;
}

/**
 * Whether the LiquidGlass effect is supported here: iOS 26 or newer, in a
 * build compiled against the iOS 26 SDK. False on Android, on older iOS, and
 * in builds made with an older Xcode, where the views fall back to a blur.
 *
 * Use this to conditionally render fallback UI.
 */
export const isLiquidGlassSupported: boolean = resolveLiquidGlassSupport();

export interface LiquidGlassProps extends ViewProps {
  /**
   * Corner radius for the glass effect.
   * Applied uniformly to all corners.
   * @default 0
   */
  cornerRadius?: number;

  /**
   * Corner shape, set through `UIView.cornerConfiguration` on iOS 26.
   * - `'capsule'`: fully rounded short sides that follow the view's size
   *   (`.capsule()`). Half the shorter side elsewhere.
   * - `'concentric'`: each corner concentric with the matching corner of the
   *   enclosing shape, such as a parent `LiquidGlass` or the screen
   *   (`.containerConcentric()`). `cornerRadius` is the minimum on iOS 26
   *   and the radius elsewhere.
   * - a number: a fixed radius, the same as `cornerRadius`.
   *
   * Default: `cornerRadius`.
   */
  cornerStyle?: LiquidGlassCornerStyle;

  /**
   * iOS-specific props for the glass effect.
   */
  ios?: {
    /**
     * Glass effect style.
     * - 'clear': More transparent, subtle glass effect
     * - 'regular': Standard blur intensity (default)
     * - 'none': No glass effect (useful for animating materialization)
     * @default 'regular'
     */
    effect?: LiquidGlassEffect;

    /**
     * Enables native touch interaction effects when pressing the view.
     * When enabled, the glass effect responds to touch location with
     * position-aware visual feedback (iOS 26+ UIGlassEffect.isInteractive).
     *
     * Note: Only applies on component mount; cannot be changed dynamically.
     * @default false
     */
    interactive?: boolean;

    /**
     * Overlay tint color applied to the glass effect.
     * Accepts any valid color value (hex, rgba, named colors).
     *
     * Example: '#FF0000', 'rgba(255, 0, 0, 0.5)', 'red'
     */
    tintColor?: string;

    /**
     * Appearance adaptation mode.
     * - 'light': Force light appearance
     * - 'dark': Force dark appearance
     * - 'system': Follow system appearance (default)
     * @default 'system'
     */
    colorScheme?: LiquidGlassColorScheme;
  };

  /**
   * Android-specific props.
   * Note: LiquidGlass is an iOS-only effect. On Android, the component
   * renders as a regular View with optional fallback styling.
   */
  android?: {
    /**
     * Fallback background color for Android since glass effect is not supported.
     * If not provided, the view renders transparently.
     */
    fallbackBackgroundColor?: string;
  };

  /**
   * Content to render inside the glass effect container.
   */
  children?: React.ReactNode;

  /**
   * Called when the glass view is pressed.
   * Includes touch coordinates relative to the view bounds.
   */
  onPress?: (event: { x: number; y: number }) => void;

  /** Test identifier */
  testID?: string;
}

export function LiquidGlass(props: LiquidGlassProps): React.ReactElement {
  const {
    style,
    cornerRadius = 0,
    cornerStyle,
    ios,
    android,
    children,
    onPress,
    ...viewProps
  } = props;

  // Normalize iOS props for native layer (strings for codegen)
  const nativeIos = useMemo(() => {
    if (Platform.OS !== 'ios' || !ios) return undefined;
    return {
      effect: ios.effect,
      interactive: ios.interactive ? 'true' : 'false',
      tintColor: ios.tintColor,
      colorScheme: ios.colorScheme,
    };
  }, [ios]);

  // Normalize Android props
  const nativeAndroid = useMemo(() => {
    if (Platform.OS !== 'android' || !android) return undefined;
    return {
      fallbackBackgroundColor: android.fallbackBackgroundColor,
    };
  }, [android]);

  // Handle native press event
  const handlePress = useCallback(
    (event: { nativeEvent: { x: number; y: number } }) => {
      onPress?.({ x: event.nativeEvent.x, y: event.nativeEvent.y });
    },
    [onPress]
  );

  return (
    <NativeLiquidGlass
      style={style}
      cornerRadius={
        typeof cornerStyle === 'number' ? cornerStyle : cornerRadius
      }
      cornerStyle={typeof cornerStyle === 'string' ? cornerStyle : ''}
      ios={nativeIos}
      android={nativeAndroid}
      onGlassPress={onPress ? handlePress : undefined}
      {...viewProps}
    >
      {children}
    </NativeLiquidGlass>
  );
}
