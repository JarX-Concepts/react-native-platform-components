import {
  withAndroidStyles,
  type AndroidConfig,
  type ConfigPlugin,
} from '@expo/config-plugins';

type ResourceXML = AndroidConfig.Resources.ResourceXML;

/**
 * Parent theme for the Android `AppTheme` style.
 *
 * - `'material3'`: re-parent `AppTheme` onto `Theme.Material3.DayNight.NoActionBar`.
 *   Required for `SegmentedControl` and for `DatePicker` / `SelectionMenu` in
 *   `android={{ material: 'm3' }}` mode to pick up your app's Material colors.
 * - `'appcompat'` (default): leave Expo's `Theme.AppCompat.DayNight.NoActionBar` as is.
 */
export type AndroidTheme = 'material3' | 'appcompat';

export type PlatformComponentsPluginOptions = {
  android?: {
    theme?: AndroidTheme;
  };
};

export const MATERIAL3_THEME_PARENT = 'Theme.Material3.DayNight.NoActionBar';

/**
 * `react-native-edge-to-edge` re-parents `AppTheme` onto its own themes. When we
 * see one of those, switch to the matching Material 3 flavour instead of
 * replacing it, so edge-to-edge keeps working.
 */
const EDGE_TO_EDGE_PREFIX = 'Theme.EdgeToEdge';

const APP_THEME_NAME = 'AppTheme';

export function resolveMaterial3Parent(
  currentParent: string | undefined
): string {
  if (!currentParent || !currentParent.startsWith(EDGE_TO_EDGE_PREFIX)) {
    return MATERIAL3_THEME_PARENT;
  }
  if (currentParent.includes('.Material3')) {
    return currentParent;
  }
  const suffix = currentParent.slice(EDGE_TO_EDGE_PREFIX.length); // '' | '.Light'
  return `${EDGE_TO_EDGE_PREFIX}.Material3${suffix}`;
}

/**
 * Re-parents the app theme onto Material 3, keeping every existing `<item>`
 * (`colorPrimary`, `android:editTextBackground`, status bar colors, ...).
 * Idempotent: running prebuild again leaves the result unchanged.
 */
export function applyMaterial3Theme(xml: ResourceXML): ResourceXML {
  const styles = xml.resources.style ?? [];
  const appTheme = styles.find((style) => style.$.name === APP_THEME_NAME);

  if (appTheme) {
    appTheme.$.parent = resolveMaterial3Parent(appTheme.$.parent);
  } else {
    styles.push({
      $: { name: APP_THEME_NAME, parent: MATERIAL3_THEME_PARENT },
      item: [],
    });
  }

  xml.resources.style = styles;
  return xml;
}

/**
 * Expo config plugin for react-native-platform-components.
 *
 * Native linking needs no configuration on either platform: CocoaPods and
 * Gradle autolinking pick the library up during `expo prebuild`.
 *
 * The plugin's job is the Android theme. Expo's generated `AppTheme` inherits
 * from AppCompat, which is enough for ContextMenu, LiquidGlass and the
 * `material: 'system'` modes, but Material 3 widgets look best under a
 * Material 3 app theme. Pass `{ android: { theme: 'material3' } }` to have
 * prebuild re-parent `AppTheme` accordingly.
 */
const withPlatformComponents: ConfigPlugin<
  PlatformComponentsPluginOptions | void
> = (config, options) => {
  const theme = options?.android?.theme ?? 'appcompat';
  if (theme !== 'material3') {
    return config;
  }

  return withAndroidStyles(config, (styleConfig) => {
    styleConfig.modResults = applyMaterial3Theme(styleConfig.modResults);
    return styleConfig;
  });
};

export default withPlatformComponents;
