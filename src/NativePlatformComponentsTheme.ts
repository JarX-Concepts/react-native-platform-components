// NativePlatformComponentsTheme.ts
import type { CodegenTypes, TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * `{ primary }`, where `primary` is a color from `processColor`. An empty
   * object restores the app's own theme colors.
   */
  setTheme(theme: CodegenTypes.UnsafeObject): void;
}

export default TurboModuleRegistry.get<Spec>('PlatformComponentsTheme');
