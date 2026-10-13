import fs from 'fs';
import os from 'os';
import path from 'path';

import type { AndroidConfig } from '@expo/config-plugins';

import withPlatformComponents, {
  MATERIAL3_THEME_PARENT,
  applyMaterial3Theme,
  copyDrawables,
  resolveDrawables,
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

  it('registers no dangerous mod without drawables', () => {
    const config = withPlatformComponents(
      { ...baseConfig },
      { android: { drawables: [] } }
    );

    expect(config.mods?.android?.dangerous).toBeUndefined();
  });

  it('registers an Android dangerous mod for drawables, alongside the theme', () => {
    const config = withPlatformComponents(
      { ...baseConfig },
      { android: { theme: 'material3', drawables: ['./assets/icons'] } }
    );

    expect(typeof config.mods?.android?.dangerous).toBe('function');
    expect(typeof config.mods?.android?.styles).toBe('function');
  });
});

describe('drawables', () => {
  const VECTOR =
    '<vector xmlns:android="http://schemas.android.com/apk/res/android" />';
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-plugin-'));
    fs.mkdirSync(path.join(root, 'icons'));
    for (const name of ['search', 'home']) {
      fs.writeFileSync(path.join(root, 'icons', `${name}.xml`), VECTOR);
    }
    fs.writeFileSync(path.join(root, 'icons', 'README.md'), 'not a drawable');
    fs.writeFileSync(path.join(root, 'bell.xml'), VECTOR);
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('expands directories to their .xml files, sorted, after single files', () => {
    const files = resolveDrawables(root, ['./bell.xml', './icons']);

    expect(files).toEqual([
      { name: 'bell', source: path.join(root, 'bell.xml') },
      { name: 'home', source: path.join(root, 'icons', 'home.xml') },
      { name: 'search', source: path.join(root, 'icons', 'search.xml') },
    ]);
  });

  it('copies the drawables into res/drawable, replacing earlier copies', () => {
    const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res');
    fs.mkdirSync(path.join(resDir, 'drawable'), { recursive: true });
    fs.writeFileSync(path.join(resDir, 'drawable', 'home.xml'), 'stale');

    copyDrawables(resolveDrawables(root, ['./icons']), resDir);

    expect(fs.readdirSync(path.join(resDir, 'drawable')).sort()).toEqual([
      'home.xml',
      'search.xml',
    ]);
    expect(
      fs.readFileSync(path.join(resDir, 'drawable', 'home.xml'), 'utf8')
    ).toBe(VECTOR);
  });

  it('rejects a missing path', () => {
    expect(() => resolveDrawables(root, ['./missing.xml'])).toThrow(
      'drawable not found: ./missing.xml'
    );
  });

  it('rejects a file that is not a vector drawable', () => {
    fs.writeFileSync(path.join(root, 'plus.png'), '');

    expect(() => resolveDrawables(root, ['./plus.png'])).toThrow(
      'is not a vector drawable'
    );
  });

  it('rejects a directory with no .xml files', () => {
    fs.mkdirSync(path.join(root, 'empty'));

    expect(() => resolveDrawables(root, ['./empty'])).toThrow(
      'no .xml drawables in ./empty'
    );
  });

  it.each(['Home', 'my-icon', '2fa', 'my.icon'])(
    'rejects the resource name %s',
    (name) => {
      fs.writeFileSync(path.join(root, `${name}.xml`), VECTOR);

      expect(() => resolveDrawables(root, [`./${name}.xml`])).toThrow(
        `"${name}" is not a valid drawable name`
      );
    }
  );

  it('rejects two drawables with the same name', () => {
    fs.mkdirSync(path.join(root, 'more'));
    fs.writeFileSync(path.join(root, 'more', 'home.xml'), VECTOR);

    expect(() => resolveDrawables(root, ['./icons', './more'])).toThrow(
      'more than one drawable named "home"'
    );
  });
});
