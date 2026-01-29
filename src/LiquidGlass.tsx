// LiquidGlass.tsx
import React, { useCallback, useMemo } from 'react';
import { Platform, type ViewProps } from 'react-native';

import NativeLiquidGlass, {
  type LiquidGlassColorScheme,
  type LiquidGlassEffect,
  type LiquidGlassPressEvent,
} from './LiquidGlassNativeComponent';

export type {
  LiquidGlassEffect,
  LiquidGlassColorScheme,
  LiquidGlassPressEvent,
};

/**
 * Whether the LiquidGlass effect is supported on the current device.
 * Returns true on iOS 26+ (with Liquid Glass support), false otherwise.
 *
 * Use this to conditionally render fallback UI on unsupported devices.
 */
export const isLiquidGlassSupported: boolean =
  Platform.OS === 'ios' && Number(Platform.Version) >= 26;

export interface LiquidGlassProps extends ViewProps {
  /**
   * Corner radius for the glass effect.
   * Applied uniformly to all corners.
   * @default 0
   */
  cornerRadius?: number;

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

    /**
     * Shadow radius for the glass effect glow.
     * Higher values create a more diffuse shadow.
     * @default 20
     */
    shadowRadius?: number;

    /**
     * @deprecated Use `interactive` instead for native touch-based highlighting.
     * This prop is a no-op on iOS 26+ where UIGlassEffect handles touch feedback.
     * @default false
     */
    isHighlighted?: boolean;
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
      shadowRadius: ios.shadowRadius,
      isHighlighted: ios.isHighlighted ? 'true' : 'false',
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
      cornerRadius={cornerRadius}
      ios={nativeIos}
      android={nativeAndroid}
      onGlassPress={onPress ? handlePress : undefined}
      {...viewProps}
    >
      {children}
    </NativeLiquidGlass>
  );
}
