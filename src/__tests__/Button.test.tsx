import renderer, { act } from 'react-test-renderer';

import { Button } from '../index';

jest.mock('../ButtonNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCButton', props)),
  };
});

const NativeButton = jest.requireMock('../ButtonNativeComponent')
  .default as jest.Mock;

function lastNativeProps() {
  const calls = NativeButton.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

describe('Button', () => {
  beforeEach(() => {
    NativeButton.mockClear();
  });

  it('applies the defaults: filled, small, platform shape, enabled', () => {
    const tree = render(<Button label="Save" />);

    const props = lastNativeProps();
    expect(props.label).toBe('Save');
    expect(props.variant).toBe('filled');
    expect(props.size).toBe('small');
    expect(props.shape).toBe('');
    expect(props.interactivity).toBe('enabled');
    expect(props.spokenLabel).toBe('');
    expect(props.icon).toEqual({
      iconType: '',
      iconName: '',
      iconRequest: '',
      iconUri: '',
      iconScale: 1,
      iconTinted: 'true',
    });
    expect(props.onButtonPress).toBeUndefined();
    act(() => tree.unmount());
  });

  it('normalizes variant, size, shape, disabled and colors', () => {
    const tree = render(
      <Button
        label="Delete"
        variant="outlined"
        size="large"
        shape="square"
        disabled
        color="#FF0000"
        tintColor="white"
        accessibilityLabel="Delete item"
        android={{ rippleColor: 'red', strokeColor: 'blue' }}
      />
    );

    const props = lastNativeProps();
    expect(props.variant).toBe('outlined');
    expect(props.size).toBe('large');
    expect(props.shape).toBe('square');
    expect(props.interactivity).toBe('disabled');
    expect(props.color).toBe('#FF0000');
    expect(props.foregroundColor).toBe('white');
    expect(props.spokenLabel).toBe('Delete item');
    expect(props.androidRippleColor).toBe('red');
    expect(props.androidStrokeColor).toBe('blue');
    expect(props.androidMaterial).toBe('expressive');
    act(() => tree.unmount());
  });

  it("defaults to a leading icon and the shape's corners", () => {
    const tree = render(<Button label="Next" />);
    expect(lastNativeProps().iconPosition).toBe('leading');
    expect(lastNativeProps().cornerRadius).toBe(-1);
    act(() => tree.unmount());
  });

  it('passes iconPosition and cornerRadius through', () => {
    const tree = render(
      <Button label="Next" iconPosition="trailing" cornerRadius={0} />
    );
    expect(lastNativeProps().iconPosition).toBe('trailing');
    expect(lastNativeProps().cornerRadius).toBe(0);
    act(() => tree.unmount());
  });

  it('passes maxFontSizeMultiplier; unset means no cap (0)', () => {
    const tree = render(<Button label="Save" />);
    expect(lastNativeProps().maxFontSizeMultiplier).toBe(0);
    act(() => tree.update(<Button label="Save" maxFontSizeMultiplier={1.5} />));
    expect(lastNativeProps().maxFontSizeMultiplier).toBe(1.5);
    act(() => tree.unmount());
  });

  it('is not loading by default', () => {
    const tree = render(<Button label="Save" />);
    expect(lastNativeProps().loading).toBe('false');
    expect(lastNativeProps().accessibilityState).toBeUndefined();
    act(() => tree.unmount());
  });

  it('marks a loading button busy, merged with accessibilityState', () => {
    const onPress = jest.fn();
    const tree = render(
      <Button
        label="Save"
        loading
        onPress={onPress}
        accessibilityState={{ selected: true }}
      />
    );
    const props = lastNativeProps();
    expect(props.loading).toBe('true');
    expect(props.accessibilityState).toEqual({ selected: true, busy: true });

    // Presses that slip through while loading are ignored
    act(() => {
      props.onButtonPress({ nativeEvent: {} });
    });
    expect(onPress).not.toHaveBeenCalled();
    act(() => tree.unmount());
  });

  it('passes the disabled colors through', () => {
    const tree = render(
      <Button
        label="Save"
        disabled
        disabledColor="#FF000066"
        disabledTintColor="white"
      />
    );
    const props = lastNativeProps();
    expect(props.disabledColor).toBe('#FF000066');
    expect(props.disabledForegroundColor).toBe('white');
    act(() => tree.unmount());
  });

  it('passes the Liquid Glass variants through', () => {
    const tree = render(<Button label="Glass" variant="glass" />);
    expect(lastNativeProps().variant).toBe('glass');
    act(() => tree.update(<Button label="Glass" variant="prominentGlass" />));
    expect(lastNativeProps().variant).toBe('prominentGlass');
    act(() => tree.unmount());
  });

  it('passes the classic Material 3 style through', () => {
    const tree = render(<Button label="Plain" android={{ material: 'm3' }} />);
    expect(lastNativeProps().androidMaterial).toBe('m3');
    act(() => tree.unmount());
  });

  it('resolves a string icon to the platform symbol', () => {
    const tree = render(<Button icon="plus" />);

    const props = lastNativeProps();
    expect(props.label).toBe('');
    // The Jest preset runs as iOS
    expect(props.icon).toMatchObject({
      iconType: 'sfSymbol',
      iconName: 'plus',
    });
    act(() => tree.unmount());
  });

  it('normalizes the label font; missing fields mean platform default', () => {
    const tree = render(
      <Button label="Bold" labelStyle={{ fontWeight: '700', fontSize: 16 }} />
    );

    expect(lastNativeProps().labelStyle).toEqual({
      fontFamily: '',
      fontSize: 16,
      fontWeight: '700',
      fontStyle: '',
    });
    act(() => tree.unmount());
  });

  it('routes native presses to onPress', () => {
    const onPress = jest.fn();
    const tree = render(<Button label="Tap" onPress={onPress} />);

    act(() => {
      lastNativeProps().onButtonPress({ nativeEvent: {} });
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });

  it('passes the clear glass variants and top / bottom icons through', () => {
    const tree = render(
      <Button label="Clear" variant="clearGlass" iconPosition="top" />
    );
    expect(lastNativeProps().variant).toBe('clearGlass');
    expect(lastNativeProps().iconPosition).toBe('top');
    act(() =>
      tree.update(
        <Button
          label="Clear"
          variant="prominentClearGlass"
          iconPosition="bottom"
        />
      )
    );
    expect(lastNativeProps().variant).toBe('prominentClearGlass');
    expect(lastNativeProps().iconPosition).toBe('bottom');
    act(() => tree.unmount());
  });

  it('is not a toggle and has no menu by default', () => {
    const tree = render(<Button label="Save" />);
    const props = lastNativeProps();
    expect(props.selected).toBe('');
    expect(props.menu).toEqual([]);
    expect(props.onSelectedChange).toBeUndefined();
    expect(props.onMenuSelect).toBeUndefined();
    expect(props.ios).toEqual({ symbolEffect: '', symbolEffectTrigger: '' });
    act(() => tree.unmount());
  });

  it('is a controlled toggle: reports the press and re-syncs native', () => {
    const onSelectedChange = jest.fn();
    const tree = render(
      <Button
        label="Bold"
        selected={false}
        onSelectedChange={onSelectedChange}
      />
    );
    expect(lastNativeProps().selected).toBe('false');
    expect(lastNativeProps().selectedEventCount).toBe(0);

    act(() => {
      lastNativeProps().onSelectedChange({ nativeEvent: { selected: true } });
    });
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    // The parent kept `false`: native gets it again with a new event count
    expect(lastNativeProps().selected).toBe('false');
    expect(lastNativeProps().selectedEventCount).toBe(1);

    act(() => tree.update(<Button label="Bold" selected />));
    expect(lastNativeProps().selected).toBe('true');
    act(() => tree.unmount());
  });

  it('reports toggles to native even without onSelectedChange', () => {
    const tree = render(<Button label="Bold" selected />);
    expect(lastNativeProps().onSelectedChange).toEqual(expect.any(Function));
    act(() => {
      lastNativeProps().onSelectedChange({ nativeEvent: { selected: false } });
    });
    expect(lastNativeProps().selectedEventCount).toBe(1);
    act(() => tree.unmount());
  });

  it('flattens the menu and routes the menu events', () => {
    const onMenuSelect = jest.fn();
    const onMenuOpen = jest.fn();
    const onMenuClose = jest.fn();
    const tree = render(
      <Button
        label="Sort"
        menu={[
          {
            id: 'sort',
            title: 'Sort by',
            displayInline: true,
            subactions: [
              { id: 'name', title: 'Name', state: 'on' },
              { id: 'date', title: 'Date' },
            ],
          },
          { id: 'reset', title: 'Reset', attributes: { destructive: true } },
        ]}
        onMenuSelect={onMenuSelect}
        onMenuOpen={onMenuOpen}
        onMenuClose={onMenuClose}
      />
    );

    const props = lastNativeProps();
    expect(
      props.menu.map((item: { id: string; kind: string; parent: number }) => [
        item.id,
        item.kind,
        item.parent,
      ])
    ).toEqual([
      ['sort', 'section', -1],
      ['name', 'action', 0],
      ['date', 'action', 0],
      ['reset', 'action', -1],
    ]);
    expect(props.menu[1].state).toBe('on');
    expect(props.menu[3].destructive).toBe('true');

    act(() => {
      props.onMenuOpen({ nativeEvent: {} });
      props.onMenuSelect({ nativeEvent: { id: 'date', title: 'Date' } });
      props.onMenuClose({ nativeEvent: {} });
    });
    expect(onMenuOpen).toHaveBeenCalledTimes(1);
    expect(onMenuSelect).toHaveBeenCalledWith('date', 'Date');
    expect(onMenuClose).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });

  it('passes the symbol effect and its trigger as a string', () => {
    const tree = render(
      <Button
        icon="bell"
        ios={{ symbolEffect: 'bounce', symbolEffectTrigger: 3 }}
      />
    );
    expect(lastNativeProps().ios).toEqual({
      symbolEffect: 'bounce',
      symbolEffectTrigger: '3',
    });
    act(() =>
      tree.update(<Button icon="bell" ios={{ symbolEffect: 'pulse' }} />)
    );
    expect(lastNativeProps().ios).toEqual({
      symbolEffect: 'pulse',
      symbolEffectTrigger: '',
    });
    act(() => tree.unmount());
  });
});
