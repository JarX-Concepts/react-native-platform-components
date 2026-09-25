// LiquidGlassContainerNativeComponent.ts
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { Float, WithDefault } from './codegenTypes';

export interface LiquidGlassContainerNativeProps extends ViewProps {
  /**
   * Distance between glass elements at which they begin to merge
   * (UIGlassContainerEffect.spacing). Negative keeps the system default.
   * @default -1
   */
  spacing?: WithDefault<Float, -1>;
}

export default codegenNativeComponent<LiquidGlassContainerNativeProps>(
  'PCLiquidGlassContainer'
) as HostComponent<LiquidGlassContainerNativeProps>;
