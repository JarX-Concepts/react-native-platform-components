/**
 * Material 3 color roles and the Android theme attribute each one sets. Role
 * names match Material Theme Builder's JSON export and
 * `@material/material-color-utilities`, so an exported scheme can be passed in
 * as is.
 */
export const ANDROID_THEME_ATTRIBUTES = {
  primary: 'colorPrimary',
  onPrimary: 'colorOnPrimary',
  primaryContainer: 'colorPrimaryContainer',
  onPrimaryContainer: 'colorOnPrimaryContainer',
  inversePrimary: 'colorPrimaryInverse',
  primaryFixed: 'colorPrimaryFixed',
  primaryFixedDim: 'colorPrimaryFixedDim',
  onPrimaryFixed: 'colorOnPrimaryFixed',
  onPrimaryFixedVariant: 'colorOnPrimaryFixedVariant',
  secondary: 'colorSecondary',
  onSecondary: 'colorOnSecondary',
  secondaryContainer: 'colorSecondaryContainer',
  onSecondaryContainer: 'colorOnSecondaryContainer',
  secondaryFixed: 'colorSecondaryFixed',
  secondaryFixedDim: 'colorSecondaryFixedDim',
  onSecondaryFixed: 'colorOnSecondaryFixed',
  onSecondaryFixedVariant: 'colorOnSecondaryFixedVariant',
  tertiary: 'colorTertiary',
  onTertiary: 'colorOnTertiary',
  tertiaryContainer: 'colorTertiaryContainer',
  onTertiaryContainer: 'colorOnTertiaryContainer',
  tertiaryFixed: 'colorTertiaryFixed',
  tertiaryFixedDim: 'colorTertiaryFixedDim',
  onTertiaryFixed: 'colorOnTertiaryFixed',
  onTertiaryFixedVariant: 'colorOnTertiaryFixedVariant',
  error: 'colorError',
  onError: 'colorOnError',
  errorContainer: 'colorErrorContainer',
  onErrorContainer: 'colorOnErrorContainer',
  background: 'android:colorBackground',
  onBackground: 'colorOnBackground',
  surface: 'colorSurface',
  onSurface: 'colorOnSurface',
  surfaceVariant: 'colorSurfaceVariant',
  onSurfaceVariant: 'colorOnSurfaceVariant',
  inverseSurface: 'colorSurfaceInverse',
  inverseOnSurface: 'colorOnSurfaceInverse',
  outline: 'colorOutline',
  outlineVariant: 'colorOutlineVariant',
  surfaceDim: 'colorSurfaceDim',
  surfaceBright: 'colorSurfaceBright',
  surfaceContainerLowest: 'colorSurfaceContainerLowest',
  surfaceContainerLow: 'colorSurfaceContainerLow',
  surfaceContainer: 'colorSurfaceContainer',
  surfaceContainerHigh: 'colorSurfaceContainerHigh',
  surfaceContainerHighest: 'colorSurfaceContainerHighest',
} as const;

export type MaterialColorRole = keyof typeof ANDROID_THEME_ATTRIBUTES;

export const MATERIAL_COLOR_ROLES = Object.keys(
  ANDROID_THEME_ATTRIBUTES
) as MaterialColorRole[];

/**
 * Roles in a Material Theme Builder export that have no Android theme
 * attribute. They are skipped without a warning.
 */
export const ROLES_WITHOUT_THEME_ATTRIBUTE: readonly string[] = [
  'surfaceTint',
  'shadow',
  'scrim',
];

/** Hex colors (`#RRGGBB` or `#RGB`) keyed by Material 3 color role. */
export type MaterialColors = Partial<Record<MaterialColorRole, string>>;

export type MaterialColorScheme = {
  light: MaterialColors;
  dark: MaterialColors;
};

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Validates a `#RRGGBB` / `#RGB` color and returns it as uppercase `#RRGGBB`.
 * `path` names the option in the error message.
 */
export function normalizeHexColor(value: unknown, path: string): string {
  if (typeof value !== 'string' || !HEX_COLOR.test(value)) {
    throw new Error(
      `react-native-platform-components: ${path} must be a hex color such as "#0B6E4F", got ${JSON.stringify(value)}.`
    );
  }
  const digits =
    value.length === 4
      ? [...value.slice(1)].map((digit) => digit + digit).join('')
      : value.slice(1);
  return `#${digits.toUpperCase()}`;
}

/**
 * Validates a `{ role: color }` map. Unknown roles are reported through
 * `warn` and dropped, so a Material Theme Builder export with extra keys still
 * works.
 */
export function parseMaterialColors(
  value: unknown,
  path: string,
  warn: (message: string) => void
): MaterialColors {
  if (value === undefined) {
    return {};
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(
      `react-native-platform-components: ${path} must be an object of Material 3 color roles, such as { "primary": "#0B6E4F" }.`
    );
  }

  const colors: MaterialColors = {};
  for (const [role, color] of Object.entries(value)) {
    if (role in ANDROID_THEME_ATTRIBUTES) {
      colors[role as MaterialColorRole] = normalizeHexColor(
        color,
        `${path}.${role}`
      );
    } else if (!ROLES_WITHOUT_THEME_ATTRIBUTE.includes(role)) {
      warn(`${path}.${role} is not a Material 3 color role and was ignored.`);
    }
  }
  return colors;
}

/**
 * The colors to write: the scheme generated from `seedColor` (if any) with
 * `overrides` on top. A role set for only light or only dark is used for both.
 */
export async function buildMaterialColorScheme(
  seedColor: string | undefined,
  overrides: MaterialColorScheme
): Promise<MaterialColorScheme> {
  const base = seedColor
    ? await generateMaterialScheme(seedColor)
    : { light: {}, dark: {} };
  const light = { ...base.light, ...overrides.light };
  const dark = { ...base.dark, ...overrides.dark };
  return { light: { ...dark, ...light }, dark: { ...light, ...dark } };
}

/** Roles present in a scheme, in `MATERIAL_COLOR_ROLES` order. */
export function schemeRoles(scheme: MaterialColorScheme): MaterialColorRole[] {
  return MATERIAL_COLOR_ROLES.filter((role) => scheme.light[role]);
}

/**
 * Generates a full Material 3 light and dark scheme from a seed color, with the
 * Tonal Spot variant that Material Theme Builder and Android dynamic color use.
 */
export async function generateMaterialScheme(
  seedColor: string
): Promise<MaterialColorScheme> {
  // Stay on 0.3.x: 0.4.0 ships extensionless ESM imports that Node cannot load.
  const { Hct, SchemeTonalSpot, argbFromHex, hexFromArgb } =
    await import('@material/material-color-utilities');
  const source = Hct.fromInt(argbFromHex(seedColor));

  const schemeColors = (isDark: boolean): MaterialColors => {
    const scheme = new SchemeTonalSpot(source, isDark, 0);
    return Object.fromEntries(
      MATERIAL_COLOR_ROLES.map((role) => [
        role,
        hexFromArgb(scheme[role]).toUpperCase(),
      ])
    );
  };

  return { light: schemeColors(false), dark: schemeColors(true) };
}
