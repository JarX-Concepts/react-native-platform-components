import type { AndroidConfig } from '@expo/config-plugins';

import withPlatformComponents, {
  MATERIAL3_THEME_PARENT,
  applyMaterial3Theme,
  resolveMaterial3Parent,
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
  });
});
