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
    expect(lastNativeProps().android).toEqual({ selectionRequired: 'true' });

    act(() => {
      tree.update(
        <SegmentedControl
          segments={SEGMENTS}
          selectedValue="day"
          android={{ selectionRequired: false }}
        />
      );
    });
    expect(lastNativeProps().android).toEqual({ selectionRequired: 'false' });
    act(() => tree.unmount());
  });
});
