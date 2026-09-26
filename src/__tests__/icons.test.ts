import { Image } from 'react-native';

import { NO_ICON, resolveIcon } from '../icons';

function resolveOn(
  os: 'ios' | 'android',
  icon: Parameters<typeof resolveIcon>[0]
) {
  let result = NO_ICON;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      Platform: { OS: os },
      Image: { resolveAssetSource: Image.resolveAssetSource },
    }));
    result = require('../icons').resolveIcon(icon);
  });
  return result;
}

describe('resolveIcon', () => {
  it('returns no icon for undefined and empty strings', () => {
    expect(resolveIcon(undefined)).toEqual(NO_ICON);
    expect(resolveIcon('')).toEqual(NO_ICON);
  });

  it('treats a string as an SF Symbol on iOS and a drawable on Android', () => {
    expect(resolveOn('ios', 'plus')).toMatchObject({
      iconType: 'sfSymbol',
      iconName: 'plus',
    });
    expect(resolveOn('android', 'add')).toMatchObject({
      iconType: 'drawable',
      iconName: 'add',
    });
  });

  it('drops sources that do not apply to the platform', () => {
    expect(resolveOn('android', { type: 'sfSymbol', name: 'plus' })).toEqual(
      NO_ICON
    );
    expect(resolveOn('ios', { type: 'drawable', name: 'add' })).toEqual(
      NO_ICON
    );
  });

  it('picks the platform half of a pair', () => {
    const pair = {
      ios: { type: 'sfSymbol' as const, name: 'trash' },
      android: { type: 'drawable' as const, name: 'delete' },
    };
    expect(resolveOn('ios', pair)).toMatchObject({ iconName: 'trash' });
    expect(resolveOn('android', pair)).toMatchObject({ iconName: 'delete' });
    expect(resolveOn('android', { ios: 'trash' })).toEqual(NO_ICON);
  });

  it('resolves image sources with their scale and tint flag', () => {
    const spy = jest
      .spyOn(Image, 'resolveAssetSource')
      .mockReturnValue({ uri: 'file:///icon.png', scale: 3 } as never);

    expect(
      resolveIcon({ type: 'image', source: { uri: 'x' }, tinted: false })
    ).toEqual({
      iconType: 'image',
      iconName: '',
      iconRequest: '',
      iconUri: 'file:///icon.png',
      iconScale: 3,
      iconTinted: 'false',
    });

    spy.mockReturnValue({ uri: '', scale: 0 } as never);
    expect(resolveIcon({ type: 'image', source: 1 })).toEqual(NO_ICON);
    spy.mockRestore();
  });

  it.each(['ios', 'android'] as const)(
    'forwards request options on %s with stable header ordering',
    (os) => {
      const spy = jest.spyOn(Image, 'resolveAssetSource').mockReturnValue({
        uri: 'https://example.test/icon',
        scale: 1,
      } as never);
      try {
        const source = {
          uri: 'https://example.test/icon',
          method: 'POST',
          body: 'variant=small',
          cache: 'reload' as const,
          headers: { 'X-Variant': 'small', 'Authorization': 'Bearer sample' },
        };
        const first = resolveOn(os, { type: 'image', source });
        const second = resolveOn(os, {
          type: 'image',
          source: {
            ...source,
            headers: { 'Authorization': 'Bearer sample', 'X-Variant': 'small' },
          },
        });
        expect(first.iconRequest).toBe(second.iconRequest);
        expect(JSON.parse(first.iconRequest)).toEqual({
          headers: source.headers,
          method: 'POST',
          body: 'variant=small',
          cache: 'reload',
        });
      } finally {
        spy.mockRestore();
      }
    }
  );
});
