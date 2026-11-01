import { useState } from 'react';
import { Platform } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { Switch } from '../index';

jest.mock('../SwitchNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCSwitch', props)),
  };
});

const NativeSwitch = jest.requireMock('../SwitchNativeComponent')
  .default as jest.Mock;

function lastProps() {
  const calls = NativeSwitch.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

function toggle(value: boolean) {
  act(() => lastProps().onSwitchChange({ nativeEvent: { value } }));
}

describe('Switch', () => {
  beforeEach(() => NativeSwitch.mockClear());

  it('maps a bare switch with the defaults', () => {
    const tree = render(<Switch />);

    const props = lastProps();
    expect(props.value).toBe(false);
    expect(props.valueEventCount).toBe(0);
    expect(props.label).toBe('');
    expect(props.interactivity).toBe('enabled');
    expect(props.color).toBeUndefined();
    expect(props.trackColor).toBeUndefined();
    expect(props.thumbColor).toBeUndefined();
    expect(props.thumbIcon).toEqual(expect.objectContaining({ iconType: '' }));
    expect(props.maxFontSizeMultiplier).toBe(0);
    expect(props.spokenLabel).toBe('');
    expect(props.haptics).toBe('');
    expect(props.onSwitchChange).toEqual(expect.any(Function));
    act(() => tree.unmount());
  });

  it('passes the label, state, colors and view props through', () => {
    const tree = render(
      <Switch
        testID="wifi"
        label="Wi-Fi"
        value
        disabled
        color="green"
        trackColor="pink"
        thumbColor="white"
        haptics="selection"
        maxFontSizeMultiplier={1.5}
        accessibilityLabel="Wireless"
        style={{ paddingHorizontal: 12 }}
      />
    );

    const props = lastProps();
    expect(props.testID).toBe('wifi');
    expect(props.label).toBe('Wi-Fi');
    expect(props.value).toBe(true);
    expect(props.interactivity).toBe('disabled');
    expect(props.color).toBe('green');
    expect(props.trackColor).toBe('pink');
    expect(props.thumbColor).toBe('white');
    expect(props.haptics).toBe('selection');
    expect(props.maxFontSizeMultiplier).toBe(1.5);
    expect(props.spokenLabel).toBe('Wireless');
    expect(props.style).toEqual({ paddingHorizontal: 12 });
    act(() => tree.unmount());
  });

  it('reports toggles and bumps the event count so native re-applies value', () => {
    const onValueChange = jest.fn();
    const tree = render(<Switch value={false} onValueChange={onValueChange} />);

    toggle(true);
    expect(onValueChange).toHaveBeenCalledWith(true);
    // The parent kept `false`: the count tells native to put it back
    expect(lastProps().value).toBe(false);
    expect(lastProps().valueEventCount).toBe(1);

    toggle(true);
    expect(lastProps().valueEventCount).toBe(2);
    act(() => tree.unmount());
  });

  it('follows the parent when it takes the new value', () => {
    function Parent() {
      const [on, setOn] = useState(false);
      return <Switch value={on} onValueChange={setOn} />;
    }
    const tree = render(<Parent />);

    toggle(true);
    expect(lastProps().value).toBe(true);
    toggle(false);
    expect(lastProps().value).toBe(false);
    act(() => tree.unmount());
  });

  it("maps 'check' to Material's check mark and other thumb icons as icons", () => {
    const tree = render(<Switch android={{ thumbIcon: 'check' }} />);
    expect(lastProps().thumbIcon).toEqual(
      expect.objectContaining({ iconType: 'check', iconName: '' })
    );

    const original = Platform.OS;
    Platform.OS = 'android';
    try {
      act(() =>
        tree.update(
          <Switch
            android={{ thumbIcon: { type: 'drawable', name: 'check' } }}
          />
        )
      );
      expect(lastProps().thumbIcon).toEqual(
        expect.objectContaining({ iconType: 'drawable', iconName: 'check' })
      );

      act(() => tree.update(<Switch android={{ thumbIcon: 'star' }} />));
      expect(lastProps().thumbIcon).toEqual(
        expect.objectContaining({ iconType: 'drawable', iconName: 'star' })
      );
    } finally {
      Platform.OS = original;
    }
    act(() => tree.unmount());
  });
});
