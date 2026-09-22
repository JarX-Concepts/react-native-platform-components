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
});
