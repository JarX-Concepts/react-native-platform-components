import { Platform } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { TabBar } from '../index';

jest.mock('../TabBarNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCTabBar', props)),
  };
});

const NativeTabBar = jest.requireMock('../TabBarNativeComponent')
  .default as jest.Mock;

const ITEMS = [
  { label: 'Home', value: 'home', icon: 'house', selectedIcon: 'house.fill' },
  { label: 'Inbox', value: 'inbox', badge: 3, testID: 'tab-inbox' },
];

function lastNativeProps() {
  const calls = NativeTabBar.mock.calls;
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
    lastNativeProps().onTabPress({
      nativeEvent: {
        index,
        value,
        reselected: reselected ? 'true' : 'false',
      },
    });
  });
}

describe('TabBar', () => {
  beforeEach(() => {
    NativeTabBar.mockClear();
    Platform.OS = 'ios';
  });

  it('applies the defaults', () => {
    const tree = render(<TabBar items={ITEMS} selectedValue={null} />);
    const props = lastNativeProps();
    expect(props.selectedValue).toBe('');
    expect(props.labelVisibility).toBe('auto');
    expect(props.maxFontSizeMultiplier).toBe(0);
    expect(props.onTabPress).toBeUndefined();
    expect(props.minimizeBehavior).toBe('');
    expect(props.scrollViewNativeID).toBe('');
    act(() => tree.unmount());
  });

  it('flattens items, icons and badges for native', () => {
    const tree = render(
      <TabBar
        items={[
          ...ITEMS,
          { label: 'Alerts', value: 'alerts', badge: '', disabled: true },
          { label: 'Me', value: 'me', accessibilityLabel: 'Profile' },
        ]}
        selectedValue="home"
      />
    );
    const [home, inbox, alerts, me] = lastNativeProps().items;
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
    expect(inbox).toMatchObject({ badge: '3', testID: 'tab-inbox' });
    // An empty badge is a dot, sent as a space
    expect(alerts).toMatchObject({ badge: ' ', disabled: 'disabled' });
    expect(me.accessibilityLabel).toBe('Profile');
    act(() => tree.unmount());
  });

  it('drops the selected icon that does not apply to the platform', () => {
    Platform.OS = 'android';
    const tree = render(
      <TabBar
        items={[
          {
            label: 'Home',
            value: 'home',
            icon: { ios: 'house', android: 'home' },
            selectedIcon: { ios: 'house.fill' },
          },
        ]}
        selectedValue="home"
      />
    );
    expect(lastNativeProps().items[0]).toMatchObject({
      iconType: 'drawable',
      iconName: 'home',
      selectedIconType: '',
    });
    act(() => tree.unmount());
  });

  it('keeps at most five tabs and warns', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const many = Array.from({ length: 6 }, (_, i) => ({
      label: `Tab ${i}`,
      value: `t${i}`,
    }));
    const tree = render(<TabBar items={many} selectedValue="t0" />);
    expect(lastNativeProps().items).toHaveLength(5);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    act(() => tree.unmount());
  });

  it('routes presses to onSelect and onReselect', () => {
    const onSelect = jest.fn();
    const onReselect = jest.fn();
    const tree = render(
      <TabBar
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
    expect(onSelect).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });

  it('passes colors, fonts and the android props through', () => {
    const tree = render(
      <TabBar
        items={ITEMS}
        selectedValue="home"
        onSelect={jest.fn()}
        labelVisibility="selected"
        activeTintColor="orange"
        inactiveTintColor="gray"
        barColor="transparent"
        badgeStyle={{ backgroundColor: 'blue', color: 'white' }}
        labelStyle={{ fontWeight: '600' }}
        maxFontSizeMultiplier={1.3}
        minimizeBehavior="onScrollDown"
        scrollViewNativeID="feed"
        android={{ indicatorColor: 'peachpuff', rippleColor: 'red' }}
      />
    );
    expect(lastNativeProps()).toMatchObject({
      labelVisibility: 'selected',
      activeTintColor: 'orange',
      inactiveTintColor: 'gray',
      barColor: 'transparent',
      badgeBackgroundColor: 'blue',
      badgeTextColor: 'white',
      labelStyle: { fontWeight: '600', fontFamily: '', fontSize: 0 },
      maxFontSizeMultiplier: 1.3,
      minimizeBehavior: 'onScrollDown',
      scrollViewNativeID: 'feed',
      androidIndicatorColor: 'peachpuff',
      androidRippleColor: 'red',
    });
    act(() => tree.unmount());
  });
});
