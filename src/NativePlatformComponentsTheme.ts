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
}

export default TurboModuleRegistry.get<Spec>('PlatformComponentsTheme');
