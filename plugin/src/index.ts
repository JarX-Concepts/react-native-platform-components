import {
  WarningAggregator,
  withAndroidColors,
  withAndroidColorsNight,
  withAndroidStyles,
  type ConfigPlugin,
} from '@expo/config-plugins';

import { applyMaterial3Theme, applyThemeColorResources } from './android';
import { withIosAccentColor, type AccentColor } from './ios';
import {
  buildMaterialColorScheme,
  normalizeHexColor,
  parseMaterialColors,
  schemeRoles,
  type MaterialColorScheme,
  type MaterialColors,
} from './materialColors';

export {
  MATERIAL3_THEME_PARENT,
  applyMaterial3Theme,
  resolveMaterial3Parent,
} from './android';
export type { MaterialColorRole, MaterialColors } from './materialColors';

/**
 * Parent theme for the Android `AppTheme` style.
 *
 * - `'material3'`: re-parent `AppTheme` onto `Theme.Material3.DayNight.NoActionBar`.
 *   Required for `SegmentedControl` and for `DatePicker` / `SelectionMenu` in
 *   `android={{ material: 'm3' }}` mode to pick up your app's Material colors.
 * - `'appcompat'`: leave Expo's `Theme.AppCompat.DayNight.NoActionBar` as is.
 */
export type AndroidTheme = 'material3' | 'appcompat';

export type PlatformComponentsPluginOptions = {
  /**
   * One brand color for both platforms, as `#RRGGBB`. Android generates a
   * Material 3 light and dark color scheme from it; iOS uses it as the app's
   * accent color. `android.seedColor` and `ios.accentColor` take precedence.
   */
  seedColor?: string;
  android?: {
    /**
     * Defaults to `'material3'` when a seed color or `colors` is set, and to
     * `'appcompat'` otherwise.
     */
    theme?: AndroidTheme;
    /** Seed for the generated Material 3 color scheme on Android. */
    seedColor?: string;
    /**
     * Colors by Material 3 role, applied on top of the generated scheme. The
     * `schemes` object of a Material Theme Builder JSON export fits here. A
     * role set for only `light` or only `dark` is used for both.
     */
    colors?: { light?: MaterialColors; dark?: MaterialColors };
  };
  ios?: {
    /**
     * The app's accent color, which UIKit uses as the default tint color. Pass
     * `{ light, dark }` for a separate dark mode color.
     */
    accentColor?: string | { light: string; dark: string };
  };
};

type ResolvedOptions = {
  android: {
    theme: AndroidTheme;
    seedColor?: string;
    colors?: MaterialColorScheme;
  };
  iosAccentColor?: AccentColor;
};

const WARNING_PROPERTY = 'react-native-platform-components';

function resolveColors(colors: unknown): MaterialColorScheme | undefined {
  if (colors === undefined) {
    return undefined;
  }
  if (typeof colors !== 'object' || colors === null || Array.isArray(colors)) {
    throw new Error(
      'react-native-platform-components: android.colors must be an object with "light" and/or "dark" color roles.'
    );
  }
  const { light, dark } = colors as Record<string, unknown>;
  const warn = (message: string) =>
    WarningAggregator.addWarningAndroid(WARNING_PROPERTY, message);
  return {
    light: parseMaterialColors(light, 'android.colors.light', warn),
    dark: parseMaterialColors(dark, 'android.colors.dark', warn),
  };
}

function resolveAccentColor(
  accentColor: unknown,
  path: string
): AccentColor | undefined {
  if (accentColor === undefined) {
    return undefined;
  }
  if (typeof accentColor === 'object' && accentColor !== null) {
    const { light, dark } = accentColor as Record<string, unknown>;
    return {
      light: normalizeHexColor(light, `${path}.light`),
      dark: normalizeHexColor(dark, `${path}.dark`),
    };
  }
  return { light: normalizeHexColor(accentColor, path) };
}

/** Validates the plugin options and applies defaults and precedence. */
export function resolveOptions(
  options: PlatformComponentsPluginOptions | void
): ResolvedOptions {
  const seedColor =
    options?.seedColor === undefined
      ? undefined
      : normalizeHexColor(options.seedColor, 'seedColor');
  const androidSeedColor =
    options?.android?.seedColor === undefined
      ? seedColor
      : normalizeHexColor(options.android.seedColor, 'android.seedColor');
  const colors = resolveColors(options?.android?.colors);
  const hasColors = androidSeedColor !== undefined || colors !== undefined;

  const theme =
    options?.android?.theme ?? (hasColors ? 'material3' : 'appcompat');
  if (theme !== 'material3' && theme !== 'appcompat') {
    throw new Error(
      `react-native-platform-components: android.theme must be "material3" or "appcompat", got ${JSON.stringify(theme)}.`
    );
  }
  if (hasColors && theme !== 'material3') {
    throw new Error(
      'react-native-platform-components: seedColor and android.colors need the Material 3 theme. Remove android.theme: "appcompat" or the colors.'
    );
  }

  return {
    android: { theme, seedColor: androidSeedColor, colors },
    iosAccentColor:
      options?.ios?.accentColor === undefined
        ? resolveAccentColor(seedColor, 'seedColor')
        : resolveAccentColor(options.ios.accentColor, 'ios.accentColor'),
  };
}

/**
 * Expo config plugin for react-native-platform-components.
 *
 * Native linking needs no configuration on either platform: CocoaPods and
 * Gradle autolinking pick the library up during `expo prebuild`.
 *
 * The plugin's job is theming. Expo's generated `AppTheme` inherits from
 * AppCompat, which is enough for ContextMenu, LiquidGlass and the
 * `material: 'system'` modes, but Material 3 widgets look best under a
 * Material 3 app theme with the app's colors:
 *
 * - `android.theme: 'material3'` re-parents `AppTheme` onto Material 3.
 * - `seedColor` / `android.seedColor` / `android.colors` write a Material 3
 *   light and dark color scheme to `values/colors.xml` and
 *   `values-night/colors.xml` and point `AppTheme` at it.
 * - `seedColor` / `ios.accentColor` set the iOS app accent color.
 */
const withPlatformComponents: ConfigPlugin<
  PlatformComponentsPluginOptions | void
> = (config, options) => {
  const { android, iosAccentColor } = resolveOptions(options);
  const hasColors =
    android.seedColor !== undefined || android.colors !== undefined;

  // Every Android mod needs the same scheme; generate it once, on first use.
  let scheme: Promise<MaterialColorScheme> | undefined;
  const getScheme = () =>
    (scheme ??= buildMaterialColorScheme(
      android.seedColor,
      android.colors ?? { light: {}, dark: {} }
    ));

  if (android.theme === 'material3') {
    config = withAndroidStyles(config, async (styleConfig) => {
      const colorRoles = hasColors ? schemeRoles(await getScheme()) : [];
      styleConfig.modResults = applyMaterial3Theme(
        styleConfig.modResults,
        colorRoles
      );
      return styleConfig;
    });
  }

  if (hasColors) {
    config = withAndroidColors(config, async (colorConfig) => {
      colorConfig.modResults = applyThemeColorResources(
        colorConfig.modResults,
        (await getScheme()).light
      );
      return colorConfig;
    });
    config = withAndroidColorsNight(config, async (colorConfig) => {
      colorConfig.modResults = applyThemeColorResources(
        colorConfig.modResults,
        (await getScheme()).dark
      );
      return colorConfig;
    });
  }

  if (iosAccentColor) {
    config = withIosAccentColor(config, iosAccentColor);
  }

  return config;
};

export default withPlatformComponents;
