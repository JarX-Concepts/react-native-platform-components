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
   * Whether this app gets Liquid Glass and the iOS 26 design: true only when
   * the library was compiled against the iOS 26 SDK, the device runs iOS 26
   * or newer, *and* the app doesn't keep the iOS 18 design with
   * `UIDesignRequiresCompatibility`. Built with an older Xcode, the glass code
   * is compiled out and the views fall back to a blur; with the Info.plist
   * key, UIKit draws the iOS 18 design and no glass (on iOS 26, and on iOS 27
   * in builds made with the iOS 26 SDK: iOS 27 ignores the key in builds made
   * with the iOS 27 SDK). The device version alone cannot answer this.
   */
  isLiquidGlassSupported(): boolean;
}

export default TurboModuleRegistry.get<Spec>('PlatformComponentsTheme');
