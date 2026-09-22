import renderer, { act } from 'react-test-renderer';

import { ButtonGroup } from '../index';

jest.mock('../ButtonGroupNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCButtonGroup', props)),
  };
});

const NativeButtonGroup = jest.requireMock('../ButtonGroupNativeComponent')
  .default as jest.Mock;

const BUTTONS = [
  { label: 'Copy', value: 'copy' },
  { label: 'Paste', value: 'paste', disabled: true },
  { value: 'more', icon: 'ellipsis', accessibilityLabel: 'More' },
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

describe('ButtonGroup', () => {
  beforeEach(() => {
    NativeButtonGroup.mockClear();
  });

  it('normalizes buttons and applies the action-group defaults', () => {
    const tree = render(<ButtonGroup buttons={BUTTONS} />);

    const props = lastNativeProps();
    expect(props.buttons).toEqual([
      expect.objectContaining({
        label: 'Copy',
        value: 'copy',
        disabled: 'enabled',
        iconType: '',
        accessibilityLabel: '',
      }),
      expect.objectContaining({ value: 'paste', disabled: 'disabled' }),
      expect.objectContaining({
        label: '',
        value: 'more',
        iconType: 'sfSymbol',
        iconName: 'ellipsis',
        accessibilityLabel: 'More',
      }),
    ]);
    expect(props.variant).toBe('outlined');
    expect(props.size).toBe('small');
    expect(props.shape).toBe('');
    expect(props.connected).toBe('false');
    expect(props.spacing).toBe(-1);
    expect(props.selection).toBe('none');
    expect(props.selectedValues).toEqual([]);
    expect(props.selectionRequired).toBe('false');
    expect(props.interactivity).toBe('enabled');
    expect(props.android).toBeUndefined();
    expect(props.onButtonPress).toBeUndefined();
    expect(props.onGroupSelectionChange).toBeUndefined();
    act(() => tree.unmount());
  });

  it('single selection is connected, required, and keeps one value', () => {
    const tree = render(
      <ButtonGroup
        buttons={BUTTONS}
        selection="single"
        selectedValues={['paste', 'copy']}
      />
    );

    const props = lastNativeProps();
    expect(props.connected).toBe('true');
    expect(props.selectionRequired).toBe('true');
    expect(props.selectedValues).toEqual(['paste']);
    act(() => tree.unmount());
  });

  it('multiple selection keeps every value and is not required', () => {
    const tree = render(
      <ButtonGroup
        buttons={BUTTONS}
        selection="multiple"
        selectedValues={['paste', 'copy']}
        connected={false}
      />
    );

    const props = lastNativeProps();
    expect(props.connected).toBe('false');
    expect(props.selectionRequired).toBe('false');
    expect(props.selectedValues).toEqual(['paste', 'copy']);
    act(() => tree.unmount());
  });

  it('ignores selectedValues without a selection mode', () => {
    const tree = render(
      <ButtonGroup buttons={BUTTONS} selectedValues={['copy']} />
    );
    expect(lastNativeProps().selectedValues).toEqual([]);
    act(() => tree.unmount());
  });

  it('routes native presses and selection changes', () => {
    const onPress = jest.fn();
    const onSelectionChange = jest.fn();
    const tree = render(
      <ButtonGroup
        buttons={BUTTONS}
        selection="multiple"
        onPress={onPress}
        onSelectionChange={onSelectionChange}
      />
    );

    act(() => {
      lastNativeProps().onButtonPress({
        nativeEvent: { index: 2, value: 'more' },
      });
      lastNativeProps().onGroupSelectionChange({
        nativeEvent: { values: ['copy', 'more'] },
      });
    });
    expect(onPress).toHaveBeenCalledWith('more', 2);
    expect(onSelectionChange).toHaveBeenCalledWith(['copy', 'more']);
    act(() => tree.unmount());
  });

  it('maps android overflow and colors', () => {
    const tree = render(
      <ButtonGroup
        buttons={BUTTONS}
        spacing={4}
        disabled
        android={{ overflow: 'menu', rippleColor: 'red', strokeColor: 'blue' }}
      />
    );

    const props = lastNativeProps();
    expect(props.spacing).toBe(4);
    expect(props.interactivity).toBe('disabled');
    expect(props.android).toEqual({ overflow: 'menu' });
    expect(props.androidRippleColor).toBe('red');
    expect(props.androidStrokeColor).toBe('blue');
    act(() => tree.unmount());
  });
});
