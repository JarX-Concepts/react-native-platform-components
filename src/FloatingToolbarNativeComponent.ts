// FloatingToolbarNativeComponent.ts
import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

/**
 * iOS-specific configuration.
 */
export type FloatingToolbarIOSProps = Readonly<{
  /** Glass effect style on iOS 26: 'regular' | 'clear' */
  effect?: string;
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

  ios?: FloatingToolbarIOSProps;
  android?: FloatingToolbarAndroidProps;
}

export default codegenNativeComponent<FloatingToolbarNativeProps>(
  'PCFloatingToolbar'
) as HostComponent<FloatingToolbarNativeProps>;
