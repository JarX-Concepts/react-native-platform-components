import { Platform, Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { TabBar } from '../index';

jest.mock('../TabBarNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCTabBar', props)),
  };
});

jest.mock('../TabBarAccessoryNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) =>
      React.createElement('PCTabBarAccessory', props)
    ),
  };
});

// iOS 26 (Liquid Glass) hosts the accessory natively; switched per test
let mockLiquidGlass = false;
jest.mock('../LiquidGlass', () => ({
  ...jest.requireActual('../LiquidGlass'),
  get isLiquidGlassSupported() {
    return mockLiquidGlass;
  },
}));

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
    mockLiquidGlass = false;
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
    expect(props.accessoryID).toBe('');
    expect(props).toMatchObject({
      androidIndicator: '',
      androidIndicatorShape: '',
      androidIndicatorCornerRadius: 0,
      androidIndicatorWidth: 0,
      androidIndicatorHeight: 0,
      androidItemLayout: '',
    });
    expect(props.onAccessoryLayout).toBeUndefined();
    act(() => tree.unmount());
  });

  it('flattens the search role and system items', () => {
    const tree = render(
      <TabBar
        items={[
          { label: 'Search', value: 'search', role: 'search' },
          { label: 'Starred', value: 'fav', systemItem: 'favorites' },
          { label: 'Home', value: 'home' },
        ]}
        selectedValue="home"
      />
    );
    const [search, fav, home] = lastNativeProps().items;
    expect(search).toMatchObject({ role: 'search', systemItem: '' });
    expect(fav).toMatchObject({ role: '', systemItem: 'favorites' });
    expect(home).toMatchObject({ role: '', systemItem: '' });
    act(() => tree.unmount());
  });

  it('maps the Android indicator and item layout', () => {
    const tree = render(
      <TabBar
        items={ITEMS}
        selectedValue="home"
        android={{
          indicator: false,
          indicatorShape: 8,
          indicatorWidth: 48,
          indicatorHeight: 40,
          itemLayout: 'horizontal',
        }}
      />
    );
    expect(lastNativeProps()).toMatchObject({
      androidIndicator: 'false',
      androidIndicatorShape: 'rounded',
      androidIndicatorCornerRadius: 8,
      androidIndicatorWidth: 48,
      androidIndicatorHeight: 40,
      androidItemLayout: 'horizontal',
    });
    act(() => {
      tree.update(
        <TabBar
          items={ITEMS}
          selectedValue="home"
          android={{ indicatorShape: 'circle', itemLayout: 'auto' }}
        />
      );
    });
    expect(lastNativeProps()).toMatchObject({
      androidIndicator: '',
      androidIndicatorShape: 'circle',
      androidIndicatorCornerRadius: 0,
      androidItemLayout: 'auto',
    });
    act(() => tree.unmount());
  });

  it('renders the accessory above the bar where it is not hosted', () => {
    Platform.OS = 'android';
    const tree = render(
      <TabBar
        items={ITEMS}
        selectedValue="home"
        style={{ position: 'absolute' }}
        testID="bar"
        accessory={<Text>Now playing</Text>}
      />
    );
    const props = lastNativeProps();
    // The bar slides the accessory away with it, found by its nativeID
    expect(props.accessoryID).not.toBe('');
    expect(props.onAccessoryLayout).toBeUndefined();
    expect(props.style).toBeUndefined();
    expect(props.testID).toBe('bar');
    const accessory = tree.root.find(
      (node) => node.props.nativeID === props.accessoryID
    );
    expect(accessory.findByType(Text).props.children).toBe('Now playing');
    // The wrapper takes the bar's style
    const wrapper = tree.root.find(
      (node) =>
        typeof node.type !== 'string' &&
        (node.props.style as { position?: string } | undefined)?.position ===
          'absolute'
    );
    expect(wrapper).toBeDefined();
    expect(
      tree.root.findAll((node) => String(node.type) === 'PCTabBarAccessory')
    ).toHaveLength(0);
    act(() => tree.unmount());
  });

  it('hosts the accessory natively on iOS 26 and follows its layout', () => {
    mockLiquidGlass = true;
    const onEnvironment = jest.fn();
    const tree = render(
      <TabBar
        items={ITEMS}
        selectedValue="home"
        accessory={<Text>Now playing</Text>}
        onAccessoryEnvironmentChange={onEnvironment}
      />
    );
    const props = lastNativeProps();
    const host = () => tree.root.findByType('PCTabBarAccessory' as never);
    expect(host().props.accessoryID).toBe(props.accessoryID);
    expect(props.accessoryID).not.toBe('');
    expect(host().findByType(Text).props.children).toBe('Now playing');

    const layout = (environment: string, x: number, width: number) =>
      act(() => {
        lastNativeProps().onAccessoryLayout({
          nativeEvent: { x, y: 0, width, height: 48, environment },
        });
      });
    layout('regular', 21, 358);
    expect(host().props.style).toContainEqual({
      left: 21,
      top: 0,
      width: 358,
      height: 48,
    });
    // Regular is where it starts; only a change is reported
    expect(onEnvironment).not.toHaveBeenCalled();
    layout('inline', 84, 230);
    expect(onEnvironment).toHaveBeenLastCalledWith('inline');
    expect(host().props.style).toContainEqual({
      left: 84,
      top: 0,
      width: 230,
      height: 48,
    });
    layout('regular', 21, 358);
    expect(onEnvironment).toHaveBeenLastCalledWith('regular');
    expect(onEnvironment).toHaveBeenCalledTimes(2);
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
