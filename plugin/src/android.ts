import type { AndroidConfig } from '@expo/config-plugins';

import {
  ANDROID_THEME_ATTRIBUTES,
  MATERIAL_COLOR_ROLES,
  type MaterialColorRole,
  type MaterialColors,
} from './materialColors';

type ResourceXML = AndroidConfig.Resources.ResourceXML;

export const MATERIAL3_THEME_PARENT = 'Theme.Material3.DayNight.NoActionBar';

/**
 * `react-native-edge-to-edge` re-parents `AppTheme` onto its own themes. When we
 * see one of those, switch to the matching Material 3 flavour instead of
 * replacing it, so edge-to-edge keeps working.
 */
const EDGE_TO_EDGE_PREFIX = 'Theme.EdgeToEdge';

const APP_THEME_NAME = 'AppTheme';

/**
 * Prefix of the color resources the plugin writes. Items and resources with it
 * belong to the plugin, so a later prebuild can replace them.
 */
export const COLOR_RESOURCE_PREFIX = 'pc_theme_';

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

/** `surfaceContainerHigh` -> `pc_theme_surface_container_high` */
export function colorResourceName(role: MaterialColorRole): string {
  return (
    COLOR_RESOURCE_PREFIX +
    role.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  );
}

/**
 * Re-parents the app theme onto Material 3, keeping every existing `<item>`
 * (`android:editTextBackground`, status bar colors, ...).
 *
 * Each role in `colorRoles` sets its theme attribute to the matching
 * `@color/pc_theme_*` resource, replacing an existing item for that attribute
 * (Expo's `colorPrimary`). Items from an earlier run that are no longer
 * configured are removed. Idempotent: running prebuild again leaves the result
 * unchanged.
 */
export function applyMaterial3Theme(
  xml: ResourceXML,
  colorRoles: readonly MaterialColorRole[] = []
): ResourceXML {
  const styles = xml.resources.style ?? [];
  let appTheme = styles.find((style) => style.$.name === APP_THEME_NAME);

  if (appTheme) {
    appTheme.$.parent = resolveMaterial3Parent(appTheme.$.parent);
  } else {
    appTheme = {
      $: { name: APP_THEME_NAME, parent: MATERIAL3_THEME_PARENT },
      item: [],
    };
    styles.push(appTheme);
  }

  const attributes = new Set<string>(
    colorRoles.map((role) => ANDROID_THEME_ATTRIBUTES[role])
  );
  const pluginReference = `@color/${COLOR_RESOURCE_PREFIX}`;
  appTheme.item = [
    ...(appTheme.item ?? []).filter(
      (item) =>
        !attributes.has(item.$.name) && !item._?.startsWith(pluginReference)
    ),
    ...colorRoles.map((role) => ({
      $: { name: ANDROID_THEME_ATTRIBUTES[role] },
      _: `@color/${colorResourceName(role)}`,
    })),
  ];

  xml.resources.style = styles;
  return xml;
}

/**
 * Writes a `pc_theme_*` color resource for each role in `colors`, replacing the
 * ones from an earlier run and leaving other colors alone. Used for both
 * `values/colors.xml` and `values-night/colors.xml`.
 */
export function applyThemeColorResources(
  xml: ResourceXML,
  colors: MaterialColors
): ResourceXML {
  const otherColors = (xml.resources.color ?? []).filter(
    (color) => !color.$.name.startsWith(COLOR_RESOURCE_PREFIX)
  );
  const themeColors = MATERIAL_COLOR_ROLES.flatMap((role) => {
    const value = colors[role];
    return value ? [{ $: { name: colorResourceName(role) }, _: value }] : [];
  });

  xml.resources.color = [...otherColors, ...themeColors];
  return xml;
}
