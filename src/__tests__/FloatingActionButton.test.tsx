import { Platform } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { FloatingActionButton } from '../index';

jest.mock('../FloatingActionButtonNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) =>
      React.createElement('PCFloatingActionButton', props)
    ),
  };
});

const NativeFloatingActionButton = jest.requireMock(
  '../FloatingActionButtonNativeComponent'
).default as jest.Mock;

function lastNativeProps() {
  const calls = NativeFloatingActionButton.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

describe('FloatingActionButton', () => {
  beforeEach(() => {
    NativeFloatingActionButton.mockClear();
    Platform.OS = 'ios';
  });

  it('applies the defaults: regular, extended, enabled', () => {
    const tree = render(
      <FloatingActionButton icon="plus" accessibilityLabel="Compose" />
    );

    const props = lastNativeProps();
    expect(props.label).toBe('');
    expect(props.size).toBe('regular');
    expect(props.extended).toBe('true');
    expect(props.interactivity).toBe('enabled');
    expect(props.spokenLabel).toBe('Compose');
    expect(props.scrollViewNativeID).toBe('');
    expect(props.icon).toEqual({
      iconType: 'sfSymbol',
      iconName: 'plus',
      iconUri: '',
      iconScale: 1,
      iconTinted: 'true',
    });
    expect(props.onFabPress).toBeUndefined();
    act(() => tree.unmount());
  });

  it('maps the extended button, size, colors and scroll link', () => {
    const tree = render(
      <FloatingActionButton
        icon={{ ios: 'pencil', android: 'edit' }}
        label="Compose"
        extended={false}
        size="large"
        color="#FFE0D1"
        tintColor="#5B1A00"
        disabled
        scrollViewNativeID="feed"
      />
    );

    const props = lastNativeProps();
    expect(props.label).toBe('Compose');
    expect(props.extended).toBe('false');
    expect(props.size).toBe('large');
    expect(props.color).toBe('#FFE0D1');
    expect(props.foregroundColor).toBe('#5B1A00');
    expect(props.interactivity).toBe('disabled');
    expect(props.spokenLabel).toBe('');
    expect(props.scrollViewNativeID).toBe('feed');
    expect(props.icon.iconName).toBe('pencil');
    act(() => tree.unmount());
  });

  it('resolves the Android icon on Android', () => {
    Platform.OS = 'android';
    const tree = render(
      <FloatingActionButton icon={{ ios: 'pencil', android: 'edit' }} />
    );
    expect(lastNativeProps().icon).toMatchObject({
      iconType: 'drawable',
      iconName: 'edit',
    });
    act(() => tree.unmount());
  });

  it('calls onPress', () => {
    const onPress = jest.fn();
    const tree = render(
      <FloatingActionButton icon="plus" label="New" onPress={onPress} />
    );
    act(() => lastNativeProps().onFabPress({ nativeEvent: {} }));
    expect(onPress).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });
});
