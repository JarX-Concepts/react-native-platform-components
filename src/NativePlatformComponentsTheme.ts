// NativePlatformComponentsTheme.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from './codegenTypes';

export interface Spec extends TurboModule {
  /**
   * `{ primary }`, where `primary` is a color from `processColor`. An empty
   * object restores the app's own theme colors.
   */
  setTheme(theme: UnsafeObject): void;

  /**
   * Whether this build can render Liquid Glass: true only when the library was
   * compiled against the iOS 26 SDK *and* the device runs iOS 26 or newer.
   * Built with an older Xcode, the glass code is compiled out and the views
   * fall back to a blur, so the device version alone cannot answer this.
   */
  isLiquidGlassSupported(): boolean;
}

export default TurboModuleRegistry.get<Spec>('PlatformComponentsTheme');
