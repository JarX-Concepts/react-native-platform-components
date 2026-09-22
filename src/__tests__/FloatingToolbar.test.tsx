import { StyleSheet, Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { FloatingToolbar } from '../index';

jest.mock('../FloatingToolbarNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) =>
      React.createElement('PCFloatingToolbar', props)
    ),
  };
});

const NativeFloatingToolbar = jest.requireMock(
  '../FloatingToolbarNativeComponent'
).default as jest.Mock;

function lastNativeProps() {
  const calls = NativeFloatingToolbar.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

describe('FloatingToolbar', () => {
  beforeEach(() => {
    NativeFloatingToolbar.mockClear();
  });

  it('renders its children inside the native container', () => {
    const tree = render(
      <FloatingToolbar>
        <Text>Action</Text>
      </FloatingToolbar>
    );

    expect(NativeFloatingToolbar).toHaveBeenCalledTimes(1);
    expect(lastNativeProps().children).toBeDefined();
    expect(tree.root.findAllByType(Text)).toHaveLength(1);
    act(() => tree.unmount());
  });

  it('lays out horizontally by default with the Material toolbar padding', () => {
    const tree = render(<FloatingToolbar />);

    expect(StyleSheet.flatten(lastNativeProps().style)).toMatchObject({
      flexDirection: 'row',
      padding: 8,
      gap: 4,
      alignSelf: 'center',
    });
    act(() => tree.unmount());
  });

  it('lays out vertically and lets the caller override the style', () => {
    const tree = render(
      <FloatingToolbar orientation="vertical" style={{ padding: 0 }} />
    );

    expect(StyleSheet.flatten(lastNativeProps().style)).toMatchObject({
      flexDirection: 'column',
      padding: 0,
    });
    act(() => tree.unmount());
  });

  it('passes the color and the iOS effect', () => {
    const tree = render(
      <FloatingToolbar color="#112233" ios={{ effect: 'clear' }} />
    );

    const props = lastNativeProps();
    expect(props.color).toBe('#112233');
    // The Jest preset runs as iOS
    expect(props.ios).toEqual({ effect: 'clear' });
    expect(props.android).toBeUndefined();
    act(() => tree.unmount());
  });

  it('defaults the iOS effect to regular', () => {
    const tree = render(<FloatingToolbar ios={{}} />);
    expect(lastNativeProps().ios).toEqual({ effect: 'regular' });
    act(() => tree.unmount());
  });
});
