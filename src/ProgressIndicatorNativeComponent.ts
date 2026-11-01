// ProgressIndicatorNativeComponent.ts
import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { Double, Int32, WithDefault } from './codegenTypes';

/**
 * Android-specific props.
 */
export type ProgressIndicatorAndroidNativeProps = Readonly<{
  /** 'true' | 'false': the Material 3 Expressive wavy indicator. */
  wavy?: string;
}>;

export interface ProgressIndicatorNativeProps extends ViewProps {
  /** 'linear' | 'circular' | 'loading' */
  variant?: WithDefault<string, 'linear'>;

  /** Progress from 0 to 1; negative = indeterminate. */
  progress?: WithDefault<Double, -1>;

  /** Indicator color; unset = the platform's. */
  color?: ColorValue;

  /** Track color (Android LoadingIndicator: container color); unset = the platform's. */
  trackColor?: ColorValue;

  /** 'small' | 'large' | '' (the platform's default size). */
  size?: WithDefault<string, ''>;

  /** Number of segments of a determinate linear bar; 0 or 1 = one bar. */
  segments?: WithDefault<Int32, 0>;

  /** Android-specific props. */
  android?: ProgressIndicatorAndroidNativeProps;
}

export default codegenNativeComponent<ProgressIndicatorNativeProps>(
  'PCProgressIndicator'
) as HostComponent<ProgressIndicatorNativeProps>;
