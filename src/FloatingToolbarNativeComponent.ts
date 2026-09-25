// FloatingToolbarNativeComponent.ts
import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { WithDefault } from './codegenTypes';

/**
 * iOS-specific configuration.
 */
export type FloatingToolbarIOSProps = Readonly<{
  /** Glass effect style on iOS 26: 'regular' | 'clear' */
  effect?: string;

  /** iOS 26: glass that reacts to touches (UIGlassEffect.isInteractive) */
  interactive?: WithDefault<boolean, false>;

  /**
   * iOS 26: the linked scroll view's edge effect under the toolbar:
   * '' (the scroll view's own) | 'automatic' | 'soft' | 'hard' | 'hidden'
   */
  scrollEdgeEffect?: string;
}>;

/**
 * Android-specific configuration.
 */
export type FloatingToolbarAndroidProps = Readonly<{
  /** Material color variant: 'standard' | 'vibrant' */
  variant?: string;
}>;

export interface FloatingToolbarNativeProps extends ViewProps {
  /** Container color. Default: the platform's toolbar material. */
  color?: ColorValue;

  /** nativeID of the ScrollView the toolbar floats over. */
  scrollViewNativeID?: string;

  /** Slide off the linked ScrollView's edge while its content scrolls down. */
  hideOnScroll?: WithDefault<boolean, false>;

  ios?: FloatingToolbarIOSProps;
  android?: FloatingToolbarAndroidProps;
}

export default codegenNativeComponent<FloatingToolbarNativeProps>(
  'PCFloatingToolbar'
) as HostComponent<FloatingToolbarNativeProps>;
