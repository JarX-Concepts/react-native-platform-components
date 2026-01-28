import type { ConfigPlugin } from '@expo/config-plugins';

/**
 * Expo config plugin for react-native-platform-components.
 *
 * This library requires no manual native configuration on either iOS or Android.
 * The native modules are automatically linked via Expo prebuild and React Native's
 * autolinking system.
 *
 * iOS:
 *   - Pod linkage works automatically via the standard podspec
 *   - No Info.plist, entitlements, or AppDelegate changes required
 *
 * Android:
 *   - Gradle linkage works automatically via autolinking
 *   - No AndroidManifest.xml, theme, or permission changes required
 *
 * This plugin is provided for discoverability and to enable future configuration
 * options if needed. Running prebuild multiple times is idempotent.
 */

const withPlatformComponents: ConfigPlugin = (config) => {
  // No-op plugin: react-native-platform-components requires no native configuration
  // beyond standard autolinking which Expo prebuild handles automatically.
  return config;
};

export default withPlatformComponents;
