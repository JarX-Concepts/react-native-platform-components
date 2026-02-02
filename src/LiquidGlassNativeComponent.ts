// LiquidGlassNativeComponent.ts
import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

/**
 * Glass effect intensity/style.
 * - 'clear': More transparent, subtle glass effect
 * - 'regular': Standard blur intensity (default)
 * - 'none': No glass effect (useful for animating materialization)
 */
export type LiquidGlassEffect = 'clear' | 'regular' | 'none';

/**
 * Color scheme for the glass effect.
 * - 'light': Force light appearance
 * - 'dark': Force dark appearance
 * - 'system': Follow system appearance (default)
 */
export type LiquidGlassColorScheme = 'light' | 'dark' | 'system';

/**
 * iOS-specific configuration.
 */
export type LiquidGlassIOSProps = Readonly<{
  /**
   * Glass effect style.
   * @default 'regular'
   */
  effect?: string; // LiquidGlassEffect

  /**
   * Enables touch interaction effects when pressing the view.
   * Note: Only applies on component mount; cannot be changed dynamically.
   * @default false
   */
  interactive?: string; // 'true' | 'false'

  /**
   * Overlay tint color applied to the glass effect.
   * Accepts hex color strings (e.g., '#FF0000', '#FF000080').
   */
  tintColor?: string;

  /**
   * Appearance adaptation mode.
   * @default 'system'
   */
  colorScheme?: string; // LiquidGlassColorScheme
}>;

/**
 * Android-specific configuration (stub - LiquidGlass is iOS only).
 */
export type LiquidGlassAndroidProps = Readonly<{
  /**
   * Fallback background color for Android (since glass effect is not supported).
   * If not provided, renders as transparent.
   */
  fallbackBackgroundColor?: string;
}>;

/**
 * Event emitted when the glass view is pressed.
 */
export type LiquidGlassPressEvent = Readonly<{
  /** X coordinate of touch relative to view bounds */
  x: CodegenTypes.Float;
  /** Y coordinate of touch relative to view bounds */
  y: CodegenTypes.Float;
}>;

export interface LiquidGlassNativeProps extends ViewProps {
  /**
   * Corner radius for the glass effect.
   * Applied uniformly to all corners.
   * @default 0
   */
  cornerRadius?: CodegenTypes.WithDefault<CodegenTypes.Float, 0>;

  /**
   * iOS-specific props.
   */
  ios?: LiquidGlassIOSProps;

  /**
   * Android-specific props.
   */
  android?: LiquidGlassAndroidProps;

  /**
   * Fired when the glass view is pressed.
   * Includes touch coordinates relative to view bounds.
   */
  onGlassPress?: CodegenTypes.DirectEventHandler<LiquidGlassPressEvent>;
}

export default codegenNativeComponent<LiquidGlassNativeProps>(
  'PCLiquidGlass'
) as HostComponent<LiquidGlassNativeProps>;
