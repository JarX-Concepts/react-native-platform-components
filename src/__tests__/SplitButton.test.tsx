import renderer, { act } from 'react-test-renderer';

import { SplitButton } from '../index';

jest.mock('../ButtonGroupNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCButtonGroup', props)),
  };
});

const NativeButtonGroup = jest.requireMock('../ButtonGroupNativeComponent')
  .default as jest.Mock;

const MENU = [
  { id: 'reply-all', title: 'Reply All' },
  {
    id: 'more',
    title: 'More',
    subactions: [{ id: 'forward', title: 'Forward' }],
  },
];

function lastNativeProps() {
  const calls = NativeButtonGroup.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

describe('SplitButton', () => {
  beforeEach(() => {
    NativeButtonGroup.mockClear();
  });

  it('is a split button group with one button and the flattened menu', () => {
    const tree = render(
      <SplitButton label="Reply" icon="arrowshape.turn.up.left" menu={MENU} />
    );

    const props = lastNativeProps();
    expect(props.split).toBe('true');
    expect(props.buttons).toEqual([
      expect.objectContaining({
        label: 'Reply',
        value: 'primary',
        disabled: 'enabled',
        iconType: 'sfSymbol',
        iconName: 'arrowshape.turn.up.left',
      }),
    ]);
    expect(
      props.menu.map((item: { id: string; kind: string; parent: number }) => [
        item.id,
        item.kind,
        item.parent,
      ])
    ).toEqual([
      ['reply-all', 'action', -1],
      ['more', 'menu', -1],
      ['forward', 'action', 1],
    ]);
    expect(props.variant).toBe('filled');
    expect(props.size).toBe('small');
    expect(props.connected).toBe('true');
    expect(props.selection).toBe('none');
    expect(props.overflow).toBe('none');
    expect(props.menuAccessibilityLabel).toBe('More options');
    expect(props.android).toEqual({ material: 'expressive' });
    act(() => tree.unmount());
  });

  it('passes variant, size, colors and the menu label through', () => {
    const tree = render(
      <SplitButton
        label="Save"
        menu={MENU}
        variant="tonal"
        size="medium"
        disabled
        color="#FF6B35"
        tintColor="white"
        menuAccessibilityLabel="Save options"
        android={{ material: 'm3', rippleColor: 'red' }}
      />
    );

    const props = lastNativeProps();
    expect(props.variant).toBe('tonal');
    expect(props.size).toBe('medium');
    expect(props.interactivity).toBe('disabled');
    expect(props.color).toBe('#FF6B35');
    expect(props.foregroundColor).toBe('white');
    expect(props.menuAccessibilityLabel).toBe('Save options');
    expect(props.androidRippleColor).toBe('red');
    expect(props.android).toEqual({ material: 'm3' });
    act(() => tree.unmount());
  });

  it('routes the press and the menu events', () => {
    const onPress = jest.fn();
    const onMenuSelect = jest.fn();
    const onMenuOpen = jest.fn();
    const onMenuClose = jest.fn();
    const tree = render(
      <SplitButton
        label="Reply"
        menu={MENU}
        onPress={onPress}
        onMenuSelect={onMenuSelect}
        onMenuOpen={onMenuOpen}
        onMenuClose={onMenuClose}
      />
    );

    const props = lastNativeProps();
    act(() => {
      props.onButtonPress({ nativeEvent: { index: 0, value: 'primary' } });
      props.onMenuOpen({ nativeEvent: {} });
      props.onMenuSelect({ nativeEvent: { id: 'forward', title: 'Forward' } });
      props.onMenuClose({ nativeEvent: {} });
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onMenuOpen).toHaveBeenCalledTimes(1);
    expect(onMenuSelect).toHaveBeenCalledWith('forward', 'Forward');
    expect(onMenuClose).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });

  it('leaves out the handlers it has no callback for', () => {
    const tree = render(<SplitButton label="Reply" menu={MENU} />);
    const props = lastNativeProps();
    expect(props.onButtonPress).toBeUndefined();
    expect(props.onMenuSelect).toBeUndefined();
    expect(props.onMenuOpen).toBeUndefined();
    expect(props.onMenuClose).toBeUndefined();
    act(() => tree.unmount());
  });
});
