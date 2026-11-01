import renderer, { act } from 'react-test-renderer';

import { Checkbox, RadioGroup } from '../index';

jest.mock('../CheckboxNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCCheckbox', props)),
  };
});

jest.mock('../RadioGroupNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCRadioGroup', props)),
  };
});

const NativeCheckbox = jest.requireMock('../CheckboxNativeComponent')
  .default as jest.Mock;
const NativeRadioGroup = jest.requireMock('../RadioGroupNativeComponent')
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

describe('Checkbox', () => {
  beforeEach(() => NativeCheckbox.mockClear());

  it('maps an unchecked checkbox with the defaults', () => {
    const tree = render(<Checkbox checked={false} />);

    const props = lastProps(NativeCheckbox);
    expect(props.checked).toBe('false');
    expect(props.checkedEventCount).toBe(0);
    expect(props.label).toBe('');
    expect(props.errorState).toBe('none');
    expect(props.errorText).toBe('');
    expect(props.interactivity).toBe('enabled');
    expect(props.maxFontSizeMultiplier).toBe(0);
    expect(props.spokenLabel).toBe('');
    expect(props.haptics).toBe('');
    expect(props.onCheckboxToggle).toEqual(expect.any(Function));
    act(() => tree.unmount());
  });

  it('maps the checked, indeterminate, label and disabled props', () => {
    const tree = render(
      <Checkbox
        checked
        label="I have read the terms"
        disabled
        haptics="selection"
        maxFontSizeMultiplier={1.5}
        accessibilityLabel="Accept the terms"
        testID="terms"
      />
    );
    let props = lastProps(NativeCheckbox);
    expect(props.checked).toBe('true');
    expect(props.label).toBe('I have read the terms');
    expect(props.interactivity).toBe('disabled');
    expect(props.haptics).toBe('selection');
    expect(props.maxFontSizeMultiplier).toBe(1.5);
    expect(props.spokenLabel).toBe('Accept the terms');
    expect(props.testID).toBe('terms');
    // The label isn't left on the host view
    expect(props.accessibilityLabel).toBeUndefined();

    act(() => tree.update(<Checkbox checked="indeterminate" />));
    props = lastProps(NativeCheckbox);
    expect(props.checked).toBe('indeterminate');
    act(() => tree.unmount());
  });

  it('maps error as a state and an optional message', () => {
    const tree = render(<Checkbox checked={false} error />);
    expect(lastProps(NativeCheckbox).errorState).toBe('error');
    expect(lastProps(NativeCheckbox).errorText).toBe('');

    act(() =>
      tree.update(
        <Checkbox checked={false} error="You must accept the terms" />
      )
    );
    expect(lastProps(NativeCheckbox).errorState).toBe('error');
    expect(lastProps(NativeCheckbox).errorText).toBe(
      'You must accept the terms'
    );

    act(() => tree.update(<Checkbox checked={false} error="" />));
    expect(lastProps(NativeCheckbox).errorState).toBe('none');
    act(() => tree.unmount());
  });

  it('reports toggles and bumps the event count so native re-applies checked', () => {
    const onCheckedChange = jest.fn();
    const tree = render(
      <Checkbox checked={false} onCheckedChange={onCheckedChange} />
    );

    act(() =>
      lastProps(NativeCheckbox).onCheckboxToggle({
        nativeEvent: { checked: true },
      })
    );
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    // The parent didn't take it: checked stays, the count moves
    expect(lastProps(NativeCheckbox).checked).toBe('false');
    expect(lastProps(NativeCheckbox).checkedEventCount).toBe(1);
    act(() => tree.unmount());
  });
});

describe('RadioGroup', () => {
  beforeEach(() => NativeRadioGroup.mockClear());

  const OPTIONS = [
    { value: 'standard', label: 'Standard', description: '3–5 days' },
    { value: 'express', label: 'Express', testID: 'go-fast' },
    { value: 'pickup', label: 'Pickup', disabled: true },
  ];

  it('maps the options with their default test IDs', () => {
    const tree = render(
      <RadioGroup testID="delivery" options={OPTIONS} value="express" />
    );

    const props = lastProps(NativeRadioGroup);
    expect(props.options).toEqual([
      {
        value: 'standard',
        label: 'Standard',
        description: '3–5 days',
        disabled: 'enabled',
        testID: 'delivery-standard',
        accessibilityLabel: '',
      },
      {
        value: 'express',
        label: 'Express',
        description: '',
        disabled: 'enabled',
        testID: 'go-fast',
        accessibilityLabel: '',
      },
      {
        value: 'pickup',
        label: 'Pickup',
        description: '',
        disabled: 'disabled',
        testID: 'delivery-pickup',
        accessibilityLabel: '',
      },
    ]);
    expect(props.value).toBe('express');
    expect(props.valueEventCount).toBe(0);
    expect(props.errorState).toBe('none');
    expect(props.errorText).toBe('');
    expect(props.interactivity).toBe('enabled');
    expect(props.groupLabel).toBe('');
    expect(props.haptics).toBe('');
    expect(props.testID).toBe('delivery');
    act(() => tree.unmount());
  });

  it('maps no value, the validation message, disabled and the group label', () => {
    const tree = render(
      <RadioGroup
        options={OPTIONS}
        value={null}
        error="Choose a delivery method"
        disabled
        accessibilityLabel="Delivery method"
      />
    );
    const props = lastProps(NativeRadioGroup);
    expect(props.value).toBe('');
    expect(props.errorState).toBe('error');
    expect(props.errorText).toBe('Choose a delivery method');
    expect(props.interactivity).toBe('disabled');
    expect(props.groupLabel).toBe('Delivery method');
    expect(props.accessibilityLabel).toBeUndefined();
    // No group testID: no option testIDs either
    expect(props.options[0].testID).toBe('');
    act(() => tree.unmount());
  });

  it('reports picks and bumps the event count so native re-applies value', () => {
    const onValueChange = jest.fn();
    const tree = render(
      <RadioGroup
        options={OPTIONS}
        value="standard"
        onValueChange={onValueChange}
      />
    );
    act(() =>
      lastProps(NativeRadioGroup).onRadioGroupChange({
        nativeEvent: { index: 1, value: 'express' },
      })
    );
    expect(onValueChange).toHaveBeenCalledWith('express', 1);
    expect(lastProps(NativeRadioGroup).value).toBe('standard');
    expect(lastProps(NativeRadioGroup).valueEventCount).toBe(1);
    act(() => tree.unmount());
  });

  it('warns about duplicate or empty values in development', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const tree = render(
      <RadioGroup
        options={[
          { value: 'a', label: 'A' },
          { value: 'a', label: 'Also A' },
        ]}
      />
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('RadioGroup requires unique, non-empty')
    );
    warn.mockRestore();
    act(() => tree.unmount());
  });
});
