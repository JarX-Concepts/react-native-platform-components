import renderer, { act } from 'react-test-renderer';

import { SegmentedControl } from '../index';

jest.mock('../SegmentedControlNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) =>
      React.createElement('PCSegmentedControl', props)
    ),
  };
});

const NativeSegmentedControl = jest.requireMock(
  '../SegmentedControlNativeComponent'
).default as jest.Mock;

const SEGMENTS = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
];

function lastNativeProps() {
  const calls = NativeSegmentedControl.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

describe('SegmentedControl', () => {
  beforeEach(() => {
    NativeSegmentedControl.mockClear();
  });

  it('normalizes selection, interactivity, and segments', () => {
    const tree = render(
      <SegmentedControl
        segments={[{ label: 'Off', value: 'off', disabled: true }]}
        selectedValue={null}
        disabled
      />
    );

    const props = lastNativeProps();
    expect(props.selectedValue).toBe('');
    expect(props.interactivity).toBe('disabled');
    expect(props.segments[0]).toMatchObject({
      label: 'Off',
      value: 'off',
      disabled: 'disabled',
    });
    expect(props.onSelect).toBeUndefined();
    expect(props.segments[0].testID).toBe('');
    expect(props.maxFontSizeMultiplier).toBe(0);
    act(() => tree.unmount());
  });

  it('passes segment testIDs and the font cap through', () => {
    const tree = render(
      <SegmentedControl
        segments={[
          { label: 'Day', value: 'day', testID: 'tab-day' },
          { label: 'Week', value: 'week' },
        ]}
        selectedValue="day"
        maxFontSizeMultiplier={1.2}
      />
    );
    const props = lastNativeProps();
    expect(props.segments.map((s: { testID: string }) => s.testID)).toEqual([
      'tab-day',
      '',
    ]);
    expect(props.maxFontSizeMultiplier).toBe(1.2);
    act(() => tree.unmount());
  });

  it('routes native selections to onSelect', () => {
    const onSelect = jest.fn();
    const onDeselect = jest.fn();
    const tree = render(
      <SegmentedControl
        segments={SEGMENTS}
        selectedValue="day"
        onSelect={onSelect}
        onDeselect={onDeselect}
      />
    );

    act(() => {
      lastNativeProps().onSelect({ nativeEvent: { index: 1, value: 'week' } });
    });
    expect(onSelect).toHaveBeenCalledWith('week', 1);
    expect(onDeselect).not.toHaveBeenCalled();
    act(() => tree.unmount());
  });

  it('routes a cleared selection (index -1) to onDeselect', () => {
    const onSelect = jest.fn();
    const onDeselect = jest.fn();
    const tree = render(
      <SegmentedControl
        segments={SEGMENTS}
        selectedValue="day"
        onSelect={onSelect}
        onDeselect={onDeselect}
      />
    );

    act(() => {
      lastNativeProps().onSelect({ nativeEvent: { index: -1, value: '' } });
    });
    expect(onDeselect).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
    act(() => tree.unmount());
  });

  it('subscribes to native events when only onDeselect is provided', () => {
    const tree = render(
      <SegmentedControl
        segments={SEGMENTS}
        selectedValue="day"
        onDeselect={() => {}}
      />
    );
    expect(lastNativeProps().onSelect).toEqual(expect.any(Function));
    act(() => tree.unmount());
  });

  it('defaults android.selectionRequired to true', () => {
    const tree = render(
      <SegmentedControl segments={SEGMENTS} selectedValue="day" android={{}} />
    );
    expect(lastNativeProps().android).toEqual({
      selectionRequired: 'true',
      material: 'expressive',
    });

    act(() => {
      tree.update(
        <SegmentedControl
          segments={SEGMENTS}
          selectedValue="day"
          android={{ selectionRequired: false }}
        />
      );
    });
    expect(lastNativeProps().android).toEqual({
      selectionRequired: 'false',
      material: 'expressive',
    });
    act(() => tree.unmount());
  });
});

describe('SegmentedControl icons', () => {
  const { Image, Platform } = require('react-native');
  const resolveAssetSource = jest.fn();

  beforeEach(() => {
    NativeSegmentedControl.mockClear();
    resolveAssetSource.mockReset();
    Image.resolveAssetSource = resolveAssetSource;
  });

  function nativeIcon(icon: unknown) {
    const tree = render(
      <SegmentedControl
        segments={[{ label: 'A', value: 'a', icon: icon as never }]}
        selectedValue="a"
      />
    );
    const segment = lastNativeProps().segments[0];
    act(() => tree.unmount());
    return segment;
  }

  it('treats a bare string as an SF Symbol on iOS', () => {
    expect(nativeIcon('list.bullet')).toMatchObject({
      iconType: 'sfSymbol',
      iconName: 'list.bullet',
      iconRequest: '',
      iconUri: '',
    });
  });

  it('treats a bare string as a drawable on Android', () => {
    const restore = jest.replaceProperty(Platform, 'OS', 'android');
    expect(nativeIcon('list_bullet')).toMatchObject({
      iconType: 'drawable',
      iconName: 'list_bullet',
    });
    restore.restore();
  });

  it('drops sources that do not apply to the platform', () => {
    expect(nativeIcon({ type: 'drawable', name: 'grid_view' })).toMatchObject({
      iconType: '',
      iconName: '',
    });
  });

  it('picks the per-platform source', () => {
    expect(
      nativeIcon({
        ios: { type: 'sfSymbol', name: 'square.grid.2x2' },
        android: { type: 'drawable', name: 'grid_view' },
      })
    ).toMatchObject({ iconType: 'sfSymbol', iconName: 'square.grid.2x2' });
  });

  it('resolves image sources to a uri and scale', () => {
    resolveAssetSource.mockReturnValue({
      uri: 'file:///bundle/assets/bell@2x.png',
      scale: 2,
      width: 18,
      height: 18,
    });
    expect(
      nativeIcon({ type: 'image', source: 42, tinted: false })
    ).toMatchObject({
      iconType: 'image',
      iconRequest: '',
      iconUri: 'file:///bundle/assets/bell@2x.png',
      iconScale: 2,
      iconTinted: 'false',
    });
    expect(resolveAssetSource).toHaveBeenCalledWith(42);
  });

  it('defaults images to tinted and scale 1', () => {
    resolveAssetSource.mockReturnValue({ uri: 'https://x/icon.png' });
    expect(
      nativeIcon({ type: 'image', source: { uri: 'https://x/icon.png' } })
    ).toMatchObject({ iconType: 'image', iconScale: 1, iconTinted: 'true' });
  });

  it('passes labelVisibility and accessibility labels through', () => {
    const tree = render(
      <SegmentedControl
        segments={[{ label: 'A', value: 'a', accessibilityLabel: 'Alpha' }]}
        selectedValue="a"
        labelVisibility="unlabeled"
      />
    );
    const props = lastNativeProps();
    expect(props.labelVisibility).toBe('unlabeled');
    expect(props.segments[0].accessibilityLabel).toBe('Alpha');
    act(() => tree.unmount());
  });
});

describe('SegmentedControl styling', () => {
  beforeEach(() => {
    NativeSegmentedControl.mockClear();
  });

  it('passes colors through and flattens android colors', () => {
    const tree = render(
      <SegmentedControl
        segments={SEGMENTS}
        selectedValue="day"
        selectedSegmentColor="#FF6B35"
        activeTintColor="white"
        inactiveTintColor="rgba(0, 0, 0, 0.5)"
        android={{ rippleColor: 'red', strokeColor: 'blue' }}
      />
    );
    const props = lastNativeProps();
    expect(props.selectedSegmentColor).toBe('#FF6B35');
    expect(props.activeTintColor).toBe('white');
    expect(props.inactiveTintColor).toBe('rgba(0, 0, 0, 0.5)');
    expect(props.androidRippleColor).toBe('red');
    expect(props.androidStrokeColor).toBe('blue');
    expect(props.android).toEqual({
      selectionRequired: 'true',
      material: 'expressive',
    });
    act(() => tree.unmount());
  });

  it('maps the deprecated ios.selectedSegmentTintColor on iOS', () => {
    const tree = render(
      <SegmentedControl
        segments={SEGMENTS}
        selectedValue="day"
        ios={{ selectedSegmentTintColor: '#123456' }}
      />
    );
    const props = lastNativeProps();
    expect(props.selectedSegmentColor).toBe('#123456');
    expect(props.ios).toEqual({
      momentary: 'false',
      apportionsSegmentWidthsByContent: 'false',
    });

    act(() => {
      tree.update(
        <SegmentedControl
          segments={SEGMENTS}
          selectedValue="day"
          selectedSegmentColor="#abcdef"
          ios={{ selectedSegmentTintColor: '#123456' }}
        />
      );
    });
    expect(lastNativeProps().selectedSegmentColor).toBe('#abcdef');
    act(() => tree.unmount());
  });

  it('normalizes labelStyle with platform-default sentinels', () => {
    const tree = render(
      <SegmentedControl
        segments={SEGMENTS}
        selectedValue="day"
        labelStyle={{ fontWeight: 700, fontStyle: 'italic' }}
      />
    );
    expect(lastNativeProps().labelStyle).toEqual({
      fontFamily: '',
      fontSize: 0,
      fontWeight: '700',
      fontStyle: 'italic',
    });

    act(() => {
      tree.update(<SegmentedControl segments={SEGMENTS} selectedValue="day" />);
    });
    expect(lastNativeProps().labelStyle).toBeUndefined();
    act(() => tree.unmount());
  });
});

describe('SegmentedControl badges', () => {
  beforeEach(() => {
    NativeSegmentedControl.mockClear();
  });

  it('normalizes badges to strings and empty for none', () => {
    const tree = render(
      <SegmentedControl
        segments={[
          { label: 'Inbox', value: 'inbox', badge: 3 },
          { label: 'Drafts', value: 'drafts', badge: 'new' },
          { label: 'Sent', value: 'sent' },
        ]}
        selectedValue="inbox"
      />
    );
    const segments = lastNativeProps().segments;
    expect(segments.map((s: { badge: string }) => s.badge)).toEqual([
      '3',
      'new',
      '',
    ]);
    act(() => tree.unmount());
  });

  it('flattens badgeStyle into native color props', () => {
    const tree = render(
      <SegmentedControl
        segments={SEGMENTS}
        selectedValue="day"
        badgeStyle={{ backgroundColor: '#5856D6', color: 'white' }}
      />
    );
    const props = lastNativeProps();
    expect(props.badgeBackgroundColor).toBe('#5856D6');
    expect(props.badgeTextColor).toBe('white');
    act(() => tree.unmount());
  });
});
