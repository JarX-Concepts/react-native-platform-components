import type { AndroidConfig } from '@expo/config-plugins';

import {
  applyMaterial3Theme,
  applyThemeColorResources,
  colorResourceName,
} from '../android';

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
      ],
    },
  };
}

function expoDefaultColors(): ResourceXML {
  return {
    resources: {
      color: [
        { $: { name: 'splashscreen_background' }, _: '#FFFFFF' },
        { $: { name: 'colorPrimary' }, _: '#023c69' },
      ],
    },
  };
}

function appThemeItems(xml: ResourceXML) {
  return xml.resources.style
    ?.find((s) => s.$.name === 'AppTheme')
    ?.item.map((i) => [i.$.name, i._]);
}

describe('colorResourceName', () => {
  it.each([
    ['primary', 'pc_theme_primary'],
    ['onPrimaryContainer', 'pc_theme_on_primary_container'],
    ['surfaceContainerHighest', 'pc_theme_surface_container_highest'],
  ] as const)('maps %s to %s', (role, expected) => {
    expect(colorResourceName(role)).toBe(expected);
  });
});

describe('applyMaterial3Theme with color roles', () => {
  it('points theme attributes at the color resources, replacing Expo colorPrimary', () => {
    const xml = applyMaterial3Theme(expoDefaultStyles(), [
      'primary',
      'surfaceContainerHigh',
      'background',
    ]);

    expect(appThemeItems(xml)).toEqual([
      ['android:editTextBackground', '@drawable/rn_edit_text_material'],
      ['colorPrimary', '@color/pc_theme_primary'],
      ['colorSurfaceContainerHigh', '@color/pc_theme_surface_container_high'],
      ['android:colorBackground', '@color/pc_theme_background'],
    ]);
  });

  it('is idempotent', () => {
    const once = applyMaterial3Theme(expoDefaultStyles(), ['primary']);
    const twice = applyMaterial3Theme(JSON.parse(JSON.stringify(once)), [
      'primary',
    ]);

    expect(twice).toEqual(once);
  });

  it('removes items from an earlier run that are no longer configured', () => {
    const earlier = applyMaterial3Theme(expoDefaultStyles(), [
      'primary',
      'tertiary',
    ]);
    const xml = applyMaterial3Theme(earlier, ['secondary']);

    expect(appThemeItems(xml)).toEqual([
      ['android:editTextBackground', '@drawable/rn_edit_text_material'],
      ['colorSecondary', '@color/pc_theme_secondary'],
    ]);
  });

  it('handles an AppTheme without items', () => {
    const xml = applyMaterial3Theme(
      {
        resources: {
          style: [
            { $: { name: 'AppTheme', parent: 'Theme.AppCompat' } },
          ] as ResourceXML['resources']['style'],
        },
      },
      ['primary']
    );

    expect(appThemeItems(xml)).toEqual([
      ['colorPrimary', '@color/pc_theme_primary'],
    ]);
  });
});

describe('applyThemeColorResources', () => {
  it('adds a resource per role and keeps other colors', () => {
    const xml = applyThemeColorResources(expoDefaultColors(), {
      surface: '#F5FBF5',
      primary: '#2A6A4F',
    });

    expect(xml.resources.color).toEqual([
      { $: { name: 'splashscreen_background' }, _: '#FFFFFF' },
      { $: { name: 'colorPrimary' }, _: '#023c69' },
      { $: { name: 'pc_theme_primary' }, _: '#2A6A4F' },
      { $: { name: 'pc_theme_surface' }, _: '#F5FBF5' },
    ]);
  });

  it('replaces resources from an earlier run', () => {
    const earlier = applyThemeColorResources(expoDefaultColors(), {
      primary: '#2A6A4F',
      tertiary: '#3D6373',
    });
    const xml = applyThemeColorResources(earlier, { primary: '#0B6E4F' });

    expect(xml.resources.color).toEqual([
      { $: { name: 'splashscreen_background' }, _: '#FFFFFF' },
      { $: { name: 'colorPrimary' }, _: '#023c69' },
      { $: { name: 'pc_theme_primary' }, _: '#0B6E4F' },
    ]);
  });

  it('creates the color list in an empty file', () => {
    const xml = applyThemeColorResources(
      { resources: {} },
      { primary: '#0B6E4F' }
    );

    expect(xml.resources.color).toEqual([
      { $: { name: 'pc_theme_primary' }, _: '#0B6E4F' },
    ]);
  });
});
