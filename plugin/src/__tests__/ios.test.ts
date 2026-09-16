import { accentColorSetContents } from '../ios';

describe('accentColorSetContents', () => {
  it('writes a universal color', () => {
    expect(accentColorSetContents({ light: '#0B6E4F' })).toEqual({
      colors: [
        {
          color: {
            'color-space': 'srgb',
            'components': {
              red: '0x0B',
              green: '0x6E',
              blue: '0x4F',
              alpha: '1.000',
            },
          },
          idiom: 'universal',
        },
      ],
      info: { author: 'xcode', version: 1 },
    });
  });

  it('adds a dark appearance variant', () => {
    const contents = accentColorSetContents({
      light: '#0B6E4F',
      dark: '#7ED8B2',
    });

    expect(contents.colors).toHaveLength(2);
    expect(contents.colors[1]).toEqual({
      appearances: [{ appearance: 'luminosity', value: 'dark' }],
      color: {
        'color-space': 'srgb',
        'components': {
          red: '0x7E',
          green: '0xD8',
          blue: '0xB2',
          alpha: '1.000',
        },
      },
      idiom: 'universal',
    });
  });
});
