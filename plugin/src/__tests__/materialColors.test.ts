import {
  MATERIAL_COLOR_ROLES,
  buildMaterialColorScheme,
  generateMaterialScheme,
  normalizeHexColor,
  parseMaterialColors,
  schemeRoles,
} from '../materialColors';

describe('normalizeHexColor', () => {
  it.each([
    ['#0b6e4f', '#0B6E4F'],
    ['#0B6E4F', '#0B6E4F'],
    ['#abc', '#AABBCC'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeHexColor(input, 'seedColor')).toBe(expected);
  });

  it.each([['0B6E4F'], ['#0B6E4'], ['#0B6E4F80'], ['red'], [42], [undefined]])(
    'rejects %p and names the option',
    (input) => {
      expect(() => normalizeHexColor(input, 'android.seedColor')).toThrow(
        /android\.seedColor must be a hex color/
      );
    }
  );
});

describe('generateMaterialScheme', () => {
  it('matches Material Theme Builder for the baseline seed', async () => {
    const scheme = await generateMaterialScheme('#6750A4');

    expect(scheme.light.primary).toBe('#65558F');
    expect(scheme.light.surface).toBe('#FDF7FF');
    expect(scheme.dark.primary).toBe('#CFBDFE');
    expect(scheme.dark.surface).toBe('#141218');
  });

  it('fills every role for light and dark', async () => {
    const scheme = await generateMaterialScheme('#0B6E4F');

    for (const colors of [scheme.light, scheme.dark]) {
      expect(Object.keys(colors).sort()).toEqual(
        [...MATERIAL_COLOR_ROLES].sort()
      );
      for (const value of Object.values(colors)) {
        expect(value).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });
});

describe('parseMaterialColors', () => {
  it('normalizes known roles', () => {
    const warn = jest.fn();

    expect(
      parseMaterialColors(
        { primary: '#0b6e4f', surfaceContainerHigh: '#eee' },
        'android.colors.light',
        warn
      )
    ).toEqual({ primary: '#0B6E4F', surfaceContainerHigh: '#EEEEEE' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('skips Theme Builder roles without an Android attribute silently', () => {
    const warn = jest.fn();

    expect(
      parseMaterialColors(
        { surfaceTint: '#000000', shadow: '#000000', scrim: '#000000' },
        'android.colors.light',
        warn
      )
    ).toEqual({});
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns about and drops unknown roles', () => {
    const warn = jest.fn();

    expect(
      parseMaterialColors(
        { primaryContiner: '#000000' },
        'android.colors.dark',
        warn
      )
    ).toEqual({});
    expect(warn).toHaveBeenCalledWith(
      'android.colors.dark.primaryContiner is not a Material 3 color role and was ignored.'
    );
  });

  it('rejects non-objects and invalid colors', () => {
    expect(() =>
      parseMaterialColors('#000000', 'android.colors.light', jest.fn())
    ).toThrow(/android\.colors\.light must be an object/);
    expect(() =>
      parseMaterialColors(
        { primary: 'teal' },
        'android.colors.light',
        jest.fn()
      )
    ).toThrow(/android\.colors\.light\.primary must be a hex color/);
  });
});

describe('buildMaterialColorScheme', () => {
  it('applies overrides on top of the generated scheme', async () => {
    const generated = await generateMaterialScheme('#0B6E4F');
    const scheme = await buildMaterialColorScheme('#0B6E4F', {
      light: { primary: '#0B6E4F' },
      dark: { primary: '#7ED8B2' },
    });

    expect(scheme.light).toEqual({ ...generated.light, primary: '#0B6E4F' });
    expect(scheme.dark).toEqual({ ...generated.dark, primary: '#7ED8B2' });
  });

  it('uses a role set for only one appearance in both', async () => {
    const scheme = await buildMaterialColorScheme(undefined, {
      light: { primary: '#0B6E4F' },
      dark: { surface: '#101010' },
    });

    expect(scheme.light).toEqual({ primary: '#0B6E4F', surface: '#101010' });
    expect(scheme.dark).toEqual({ primary: '#0B6E4F', surface: '#101010' });
    expect(schemeRoles(scheme)).toEqual(['primary', 'surface']);
  });
});
