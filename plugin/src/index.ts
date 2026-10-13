import fs from 'fs';
import path from 'path';

import {
  withAndroidStyles,
  withDangerousMod,
  type AndroidConfig,
  type ConfigPlugin,
} from '@expo/config-plugins';

type ResourceXML = AndroidConfig.Resources.ResourceXML;

/**
 * Parent theme for the Android `AppTheme` style.
 *
 * - `'material3'`: re-parent `AppTheme` onto `Theme.Material3.DayNight.NoActionBar`.
 *   Required for `SegmentedControl`, `TabBar`, `Button`, `ButtonGroup`,
 *   `FloatingToolbar`, and for `DatePicker` / `SelectionMenu` in
 *   `android={{ material: 'm3' }}` mode, to pick up your app's Material colors.
 * - `'appcompat'` (default): leave Expo's `Theme.AppCompat.DayNight.NoActionBar` as is.
 */
export type AndroidTheme = 'material3' | 'appcompat';

export type PlatformComponentsPluginOptions = {
  android?: {
    theme?: AndroidTheme;
    /**
     * Vector drawables to copy into `res/drawable` at prebuild, so drawable
     * icon names (`android: 'home'`) resolve in an Expo app. Each entry is a
     * `.xml` file or a directory of them, relative to the project root. The
     * drawable name is the file name without `.xml`.
     */
    drawables?: string[];
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

export type DrawableFile = {
  /** Resource name: the file name without `.xml`. */
  name: string;
  /** Absolute path of the source file. */
  source: string;
};

const PLUGIN_NAME = 'react-native-platform-components';

/** Android resource names: lowercase letters, digits and underscores. */
const DRAWABLE_NAME = /^[a-z][a-z0-9_]*$/;

/**
 * Expands the `drawables` option into the files to copy, checking each name
 * is a valid Android resource name and appears once.
 */
export function resolveDrawables(
  projectRoot: string,
  entries: string[]
): DrawableFile[] {
  const files: DrawableFile[] = [];
  for (const entry of entries) {
    const source = path.resolve(projectRoot, entry);
    if (!fs.existsSync(source)) {
      throw new Error(`${PLUGIN_NAME}: drawable not found: ${entry}`);
    }
    let sources = [source];
    if (fs.statSync(source).isDirectory()) {
      sources = fs
        .readdirSync(source)
        .filter((file) => file.endsWith('.xml'))
        .sort()
        .map((file) => path.join(source, file));
      if (sources.length === 0) {
        throw new Error(`${PLUGIN_NAME}: no .xml drawables in ${entry}`);
      }
    }
    for (const file of sources) {
      if (path.extname(file) !== '.xml') {
        throw new Error(
          `${PLUGIN_NAME}: ${entry} is not a vector drawable (.xml). ` +
            'Use an image icon for PNGs.'
        );
      }
      const name = path.basename(file, '.xml');
      if (!DRAWABLE_NAME.test(name)) {
        throw new Error(
          `${PLUGIN_NAME}: "${name}" is not a valid drawable name. ` +
            'Use lowercase letters, digits and underscores, starting with a letter.'
        );
      }
      if (files.some((existing) => existing.name === name)) {
        throw new Error(
          `${PLUGIN_NAME}: more than one drawable named "${name}"`
        );
      }
      files.push({ name, source: file });
    }
  }
  return files;
}

/** Copies the drawables into `<resDir>/drawable`, replacing earlier copies. */
export function copyDrawables(files: DrawableFile[], resDir: string): void {
  const drawableDir = path.join(resDir, 'drawable');
  fs.mkdirSync(drawableDir, { recursive: true });
  for (const file of files) {
    fs.copyFileSync(file.source, path.join(drawableDir, `${file.name}.xml`));
  }
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
 *
 * It also copies the vector drawables listed in `android.drawables` into the
 * generated project, since hand-added files there don't survive
 * `expo prebuild --clean`.
 */
const withPlatformComponents: ConfigPlugin<
  PlatformComponentsPluginOptions | void
> = (config, options) => {
  const theme = options?.android?.theme ?? 'appcompat';
  const drawables = options?.android?.drawables ?? [];

  if (theme === 'material3') {
    config = withAndroidStyles(config, (styleConfig) => {
      styleConfig.modResults = applyMaterial3Theme(styleConfig.modResults);
      return styleConfig;
    });
  }

  if (drawables.length > 0) {
    config = withDangerousMod(config, [
      'android',
      (modConfig) => {
        const { projectRoot, platformProjectRoot } = modConfig.modRequest;
        copyDrawables(
          resolveDrawables(projectRoot, drawables),
          path.join(platformProjectRoot, 'app', 'src', 'main', 'res')
        );
        return modConfig;
      },
    ]);
  }

  return config;
};

export default withPlatformComponents;
