import type { AndroidConfig } from '@expo/config-plugins';

import withPlatformComponents, {
  MATERIAL3_THEME_PARENT,
  applyMaterial3Theme,
  resolveMaterial3Parent,
  resolveOptions,
} from '../index';

type ResourceXML = AndroidConfig.Resources.ResourceXML;

function expoDefaultStyles(): ResourceXML {
  return {
    resources: {
      style: [
        {
          $: {
            name: 'AppTheme',
            parent: 'Theme.AppCompat.DayNight.NoActionBar',
          },
          item: [
            {
              $: { name: 'android:editTextBackground' },
              _: '@drawable/rn_edit_text_material',
            },
            { $: { name: 'colorPrimary' }, _: '@color/colorPrimary' },
          ],
        },
        {
          $: { name: 'Theme.App.SplashScreen', parent: 'AppTheme' },
          item: [
            {
              $: { name: 'android:windowBackground' },
              _: '@drawable/splashscreen_logo',
            },
          ],
        },
      ],
    },
  };
}

function appThemeOf(xml: ResourceXML) {
  return xml.resources.style?.find((s) => s.$.name === 'AppTheme');
}

describe('applyMaterial3Theme', () => {
  it('re-parents AppTheme onto Material 3 and keeps existing items', () => {
    const xml = applyMaterial3Theme(expoDefaultStyles());
    const appTheme = appThemeOf(xml);

    expect(appTheme?.$.parent).toBe(MATERIAL3_THEME_PARENT);
    expect(appTheme?.item.map((i) => i.$.name)).toEqual([
      'android:editTextBackground',
      'colorPrimary',
    ]);
  });

  it('leaves other styles untouched', () => {
    const xml = applyMaterial3Theme(expoDefaultStyles());
    const splash = xml.resources.style?.find(
      (s) => s.$.name === 'Theme.App.SplashScreen'
    );

    expect(splash?.$.parent).toBe('AppTheme');
    expect(splash?.item).toHaveLength(1);
  });

  it('is idempotent', () => {
    const once = applyMaterial3Theme(expoDefaultStyles());
    const twice = applyMaterial3Theme(JSON.parse(JSON.stringify(once)));

    expect(twice).toEqual(once);
  });

  it('creates AppTheme when styles.xml has none', () => {
    const xml = applyMaterial3Theme({ resources: {} });

    expect(appThemeOf(xml)).toEqual({
      $: { name: 'AppTheme', parent: MATERIAL3_THEME_PARENT },
      item: [],
    });
  });
});

describe('resolveMaterial3Parent', () => {
  it.each([
    [undefined, MATERIAL3_THEME_PARENT],
    ['Theme.AppCompat.DayNight.NoActionBar', MATERIAL3_THEME_PARENT],
    ['Theme.AppCompat.Light.NoActionBar', MATERIAL3_THEME_PARENT],
    ['Theme.EdgeToEdge', 'Theme.EdgeToEdge.Material3'],
    ['Theme.EdgeToEdge.Light', 'Theme.EdgeToEdge.Material3.Light'],
    ['Theme.EdgeToEdge.Material3', 'Theme.EdgeToEdge.Material3'],
    ['Theme.EdgeToEdge.Material3.Light', 'Theme.EdgeToEdge.Material3.Light'],
  ])('maps %s to %s', (input, expected) => {
    expect(resolveMaterial3Parent(input)).toBe(expected);
  });
});

describe('withPlatformComponents', () => {
  const baseConfig = { name: 'app', slug: 'app' };

  it('registers no mods by default', () => {
    const config = withPlatformComponents({ ...baseConfig });

    expect(config.mods?.android?.styles).toBeUndefined();
  });

  it('registers no mods for the appcompat theme', () => {
    const config = withPlatformComponents(
      { ...baseConfig },
      { android: { theme: 'appcompat' } }
    );

    expect(config.mods?.android?.styles).toBeUndefined();
  });

  it('registers an Android styles mod for the material3 theme', () => {
    const config = withPlatformComponents(
      { ...baseConfig },
      { android: { theme: 'material3' } }
    );

    expect(typeof config.mods?.android?.styles).toBe('function');
    expect(config.mods?.android?.colors).toBeUndefined();
  });

  it('registers Android color mods and iOS accent color mods for seedColor', () => {
    const config = withPlatformComponents(
      { ...baseConfig },
      { seedColor: '#0B6E4F' }
    );

    expect(typeof config.mods?.android?.styles).toBe('function');
    expect(typeof config.mods?.android?.colors).toBe('function');
    expect(typeof config.mods?.android?.colorsNight).toBe('function');
    expect(typeof config.mods?.ios?.dangerous).toBe('function');
    expect(typeof config.mods?.ios?.xcodeproj).toBe('function');
  });

  it('registers only iOS mods for ios.accentColor', () => {
    const config = withPlatformComponents(
      { ...baseConfig },
      { ios: { accentColor: '#0B6E4F' } }
    );

    expect(config.mods?.android).toBeUndefined();
    expect(typeof config.mods?.ios?.xcodeproj).toBe('function');
  });

  it('throws on invalid options', () => {
    expect(() =>
      withPlatformComponents({ ...baseConfig }, { seedColor: 'green' })
    ).toThrow(/seedColor must be a hex color/);
  });
});

describe('resolveOptions', () => {
  it('changes nothing by default', () => {
    expect(resolveOptions(undefined)).toEqual({
      android: { theme: 'appcompat' },
      iosAccentColor: undefined,
    });
  });

  it('applies seedColor to both platforms and implies the material3 theme', () => {
    expect(resolveOptions({ seedColor: '#0b6e4f' })).toEqual({
      android: { theme: 'material3', seedColor: '#0B6E4F' },
      iosAccentColor: { light: '#0B6E4F' },
    });
  });

  it('lets platform options take precedence over seedColor', () => {
    expect(
      resolveOptions({
        seedColor: '#0B6E4F',
        android: { seedColor: '#6750A4' },
        ios: { accentColor: { light: '#0B6E4F', dark: '#7ED8B2' } },
      })
    ).toEqual({
      android: { theme: 'material3', seedColor: '#6750A4' },
      iosAccentColor: { light: '#0B6E4F', dark: '#7ED8B2' },
    });
  });

  it('uses android.colors without a seed color', () => {
    expect(
      resolveOptions({
        android: { colors: { light: { primary: '#0B6E4F' } } },
      })
    ).toEqual({
      android: {
        theme: 'material3',
        colors: { light: { primary: '#0B6E4F' }, dark: {} },
      },
      iosAccentColor: undefined,
    });
  });

  it('rejects colors with the appcompat theme', () => {
    expect(() =>
      resolveOptions({
        seedColor: '#0B6E4F',
        android: { theme: 'appcompat' },
      })
    ).toThrow(/need the Material 3 theme/);
  });

  it('rejects an unknown theme', () => {
    expect(() =>
      resolveOptions({
        android: { theme: 'Material3' as 'material3' },
      })
    ).toThrow(/android\.theme must be "material3" or "appcompat"/);
  });

  it('rejects an accent color pair without a dark color', () => {
    expect(() =>
      resolveOptions({
        ios: {
          accentColor: { light: '#0B6E4F' } as { light: string; dark: string },
        },
      })
    ).toThrow(/ios\.accentColor\.dark must be a hex color/);
  });
});
