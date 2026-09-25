import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { LiquidGlass, LiquidGlassContainer } from '../index';

jest.mock('../LiquidGlassContainerNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) =>
      React.createElement('PCLiquidGlassContainer', props)
    ),
  };
});

jest.mock('../LiquidGlassNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCLiquidGlass', props)),
  };
});

const NativeContainer = jest.requireMock(
  '../LiquidGlassContainerNativeComponent'
).default as jest.Mock;
const NativeLiquidGlass = jest.requireMock('../LiquidGlassNativeComponent')
  .default as jest.Mock;

function lastProps(mock: jest.Mock) {
  const calls = mock.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

describe('LiquidGlassContainer', () => {
  beforeEach(() => {
    NativeContainer.mockClear();
    NativeLiquidGlass.mockClear();
  });

  it('renders the glass inside the native container', () => {
    const tree = render(
      <LiquidGlassContainer spacing={20} testID="group">
        <LiquidGlass>
          <Text>One</Text>
        </LiquidGlass>
        <LiquidGlass>
          <Text>Two</Text>
        </LiquidGlass>
      </LiquidGlassContainer>
    );

    expect(NativeContainer).toHaveBeenCalledTimes(1);
    expect(lastProps(NativeContainer)).toMatchObject({
      spacing: 20,
      testID: 'group',
    });
    expect(NativeLiquidGlass).toHaveBeenCalledTimes(2);
    expect(tree.root.findAllByType(Text)).toHaveLength(2);
    act(() => tree.unmount());
  });

  it('keeps the system spacing when none is given', () => {
    const tree = render(<LiquidGlassContainer />);
    expect(lastProps(NativeContainer).spacing).toBe(-1);
    act(() => tree.unmount());
  });
});

describe('LiquidGlass cornerStyle', () => {
  beforeEach(() => {
    NativeLiquidGlass.mockClear();
  });

  it('defaults to the corner radius', () => {
    const tree = render(<LiquidGlass cornerRadius={12} />);
    expect(lastProps(NativeLiquidGlass)).toMatchObject({
      cornerStyle: '',
      cornerRadius: 12,
    });
    act(() => tree.unmount());
  });

  it('passes capsule and concentric through with the corner radius', () => {
    const tree = render(<LiquidGlass cornerStyle="capsule" />);
    expect(lastProps(NativeLiquidGlass)).toMatchObject({
      cornerStyle: 'capsule',
      cornerRadius: 0,
    });

    act(() =>
      tree.update(<LiquidGlass cornerStyle="concentric" cornerRadius={8} />)
    );
    expect(lastProps(NativeLiquidGlass)).toMatchObject({
      cornerStyle: 'concentric',
      cornerRadius: 8,
    });
    act(() => tree.unmount());
  });

  it('treats a number as a fixed radius', () => {
    const tree = render(<LiquidGlass cornerStyle={24} cornerRadius={4} />);
    expect(lastProps(NativeLiquidGlass)).toMatchObject({
      cornerStyle: '',
      cornerRadius: 24,
    });
    act(() => tree.unmount());
  });
});
