import { Platform, Text, View } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { NavigationRail } from '../index';

jest.mock('../NavigationRailNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCNavigationRail', props)),
  };
});

const NativeNavigationRail = jest.requireMock(
  '../NavigationRailNativeComponent'
).default as jest.Mock;

const ITEMS = [
  { label: 'Home', value: 'home', icon: 'house', selectedIcon: 'house.fill' },
  { label: 'Inbox', value: 'inbox', badge: 3, testID: 'rail-inbox' },
];

function lastNativeProps() {
  const calls = NativeNavigationRail.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

function press(index: number, value: string, reselected: boolean) {
  act(() => {
    lastNativeProps().onItemPress({
      nativeEvent: {
        index,
        value,
        reselected: reselected ? 'true' : 'false',
      },
    });
  });
}

describe('NavigationRail', () => {
  beforeEach(() => {
    NativeNavigationRail.mockClear();
    Platform.OS = 'ios';
  });

  it('applies the defaults', () => {
    const tree = render(<NavigationRail items={ITEMS} selectedValue={null} />);
    const props = lastNativeProps();
    expect(props.selectedValue).toBe('');
    expect(props.labelVisibility).toBe('auto');
    expect(props.menuGravity).toBe('top');
    expect(props.expanded).toBe('false');
    expect(props.maxFontSizeMultiplier).toBe(0);
    expect(props.onItemPress).toBeUndefined();
    expect(props.children).toBeNull();
    act(() => tree.unmount());
  });

  it('flattens items, icons and badges like TabBar', () => {
    const tree = render(
      <NavigationRail
        items={[
          ...ITEMS,
          { label: 'Photos', value: 'photos', badge: '', disabled: true },
          { label: 'Me', value: 'me', accessibilityLabel: 'Profile' },
        ]}
        selectedValue="home"
      />
    );
    const [home, inbox, photos, me] = lastNativeProps().items;
    expect(home).toMatchObject({
      label: 'Home',
      value: 'home',
      disabled: 'enabled',
      iconType: 'sfSymbol',
      iconName: 'house',
      selectedIconType: 'sfSymbol',
      selectedIconName: 'house.fill',
      badge: '',
      testID: '',
    });
    expect(inbox).toMatchObject({ badge: '3', testID: 'rail-inbox' });
    expect(photos).toMatchObject({ badge: ' ', disabled: 'disabled' });
    expect(me).toMatchObject({ accessibilityLabel: 'Profile' });
    act(() => tree.unmount());
  });

  it('maps gravity, expanded, labels and colors', () => {
    const tree = render(
      <NavigationRail
        items={ITEMS}
        selectedValue="inbox"
        menuGravity="center"
        expanded
        labelVisibility="selected"
        activeTintColor="#FF6B35"
        inactiveTintColor="gray"
        railColor="white"
        badgeStyle={{ backgroundColor: 'blue', color: 'white' }}
        maxFontSizeMultiplier={1.5}
        android={{ indicatorColor: '#FFE0D1', rippleColor: 'red' }}
      />
    );
    const props = lastNativeProps();
    expect(props.selectedValue).toBe('inbox');
    expect(props.menuGravity).toBe('center');
    expect(props.expanded).toBe('true');
    expect(props.labelVisibility).toBe('selected');
    expect(props.activeTintColor).toBe('#FF6B35');
    expect(props.inactiveTintColor).toBe('gray');
    expect(props.railColor).toBe('white');
    expect(props.badgeBackgroundColor).toBe('blue');
    expect(props.badgeTextColor).toBe('white');
    expect(props.maxFontSizeMultiplier).toBe(1.5);
    expect(props.androidIndicatorColor).toBe('#FFE0D1');
    expect(props.androidRippleColor).toBe('red');
    act(() => tree.unmount());
  });

  it('hosts the header in an absolutely positioned view', () => {
    const tree = render(
      <NavigationRail
        items={ITEMS}
        selectedValue="home"
        header={<Text>Compose</Text>}
      />
    );
    const wrapper = tree.root
      .findAllByType(View)
      .find((view) => view.props.collapsable === false)!;
    expect(wrapper.props.style).toMatchObject({ position: 'absolute' });
    expect(wrapper.findByType(Text).props.children).toBe('Compose');
    act(() => tree.unmount());
  });

  it('reports select and reselect', () => {
    const onSelect = jest.fn();
    const onReselect = jest.fn();
    const tree = render(
      <NavigationRail
        items={ITEMS}
        selectedValue="home"
        onSelect={onSelect}
        onReselect={onReselect}
      />
    );
    press(1, 'inbox', false);
    expect(onSelect).toHaveBeenCalledWith('inbox', 1);
    press(0, 'home', true);
    expect(onReselect).toHaveBeenCalledWith('home', 0);
    act(() => tree.unmount());
  });
});
