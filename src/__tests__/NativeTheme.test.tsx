import renderer, { act } from 'react-test-renderer';
import { PlatformColor } from 'react-native';

import { setNativeTheme, useNativeTheme, type NativeTheme } from '../index';

jest.mock('../NativePlatformComponentsTheme', () => ({
  __esModule: true,
  default: { setTheme: jest.fn() },
}));

const setTheme = jest.requireMock('../NativePlatformComponentsTheme').default
  .setTheme as jest.Mock;

function ThemeSync({ theme }: { theme: NativeTheme | null }) {
  useNativeTheme(theme);
  return null;
}

function render(theme: NativeTheme | null) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(<ThemeSync theme={theme} />);
  });
  return {
    update(next: NativeTheme | null) {
      act(() => {
        tree!.update(<ThemeSync theme={next} />);
      });
    },
  };
}

describe('setNativeTheme', () => {
  beforeEach(() => setTheme.mockClear());

  it('sends the processed primary color', () => {
    setNativeTheme({ colors: { primary: '#00897B' } });

    expect(setTheme).toHaveBeenCalledWith({ primary: 0xff00897b });
  });

  it('sends an empty theme for null', () => {
    setNativeTheme(null);

    expect(setTheme).toHaveBeenCalledWith({});
  });

  it('passes platform colors through processColor', () => {
    setNativeTheme({ colors: { primary: PlatformColor('systemTeal') } });

    expect(setTheme).toHaveBeenCalledWith({
      primary: { semantic: ['systemTeal'] },
    });
  });
});

describe('useNativeTheme', () => {
  beforeEach(() => setTheme.mockClear());

  it('applies the theme on mount', () => {
    render({ colors: { primary: 'teal' } });

    expect(setTheme).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenCalledWith({ primary: 0xff008080 });
  });

  it('does not re-apply an equal color from a new theme object', () => {
    const { update } = render({ colors: { primary: '#00897B' } });
    update({ colors: { primary: '#00897b' } });

    expect(setTheme).toHaveBeenCalledTimes(1);
  });

  it('applies a changed color and clears for null', () => {
    const { update } = render({ colors: { primary: '#00897B' } });
    update({ colors: { primary: '#6750A4' } });
    update(null);

    expect(setTheme.mock.calls.map(([theme]) => theme)).toEqual([
      { primary: 0xff00897b },
      { primary: 0xff6750a4 },
      {},
    ]);
  });
});
