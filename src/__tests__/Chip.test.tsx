import renderer, { act } from 'react-test-renderer';

import { Chip, ChipGroup } from '../index';

jest.mock('../ChipNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCChip', props)),
  };
});

jest.mock('../ChipGroupNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCChipGroup', props)),
  };
});

const NativeChip = jest.requireMock('../ChipNativeComponent')
  .default as jest.Mock;
const NativeChipGroup = jest.requireMock('../ChipGroupNativeComponent')
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

describe('Chip', () => {
  beforeEach(() => NativeChip.mockClear());

  it('maps an assist chip with the defaults', () => {
    const tree = render(<Chip label="Share" />);

    const props = lastProps(NativeChip);
    expect(props.label).toBe('Share');
    expect(props.variant).toBe('assist');
    expect(props.selected).toBe('');
    expect(props.closeIcon).toBe('false');
    expect(props.closeTestID).toBe('');
    expect(props.closeAccessibilityLabel).toBe('');
    expect(props.interactivity).toBe('enabled');
    expect(props.maxFontSizeMultiplier).toBe(0);
    expect(props.chipMinHeight).toBe(-1);
    expect(props.chipPaddingHorizontal).toBe(-1);
    expect(props.spokenLabel).toBe('');
    expect(props.haptics).toBe('');
    expect(props.icon).toEqual(expect.objectContaining({ iconType: '' }));
    expect(props.onChipPress).toBeUndefined();
    expect(props.onChipClose).toBeUndefined();
    act(() => tree.unmount());
  });

  it('a selectable chip is a filter chip and always reports presses', () => {
    const tree = render(<Chip label="Vegan" selected />);

    const props = lastProps(NativeChip);
    expect(props.variant).toBe('filter');
    expect(props.selected).toBe('true');
    expect(props.onChipPress).toEqual(expect.any(Function));

    act(() => tree.update(<Chip label="Vegan" selected={false} />));
    expect(lastProps(NativeChip).selected).toBe('false');
    act(() => tree.unmount());
  });

  it('bumps the press count of a selectable chip so native re-applies selected', () => {
    const onPress = jest.fn();
    const tree = render(
      <Chip label="Vegan" selected={false} onPress={onPress} />
    );
    expect(lastProps(NativeChip).pressEventCount).toBe(0);

    act(() => lastProps(NativeChip).onChipPress({ nativeEvent: {} }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(lastProps(NativeChip).pressEventCount).toBe(1);
    act(() => tree.unmount());
  });

  it('onClose implies the close icon, which can be turned off', () => {
    const onClose = jest.fn();
    const tree = render(
      <Chip label="Ada" variant="input" testID="ada" onClose={onClose} />
    );

    let props = lastProps(NativeChip);
    expect(props.variant).toBe('input');
    expect(props.closeIcon).toBe('true');
    expect(props.closeTestID).toBe('ada-close');
    act(() => props.onChipClose({ nativeEvent: {} }));
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() =>
      tree.update(
        <Chip
          label="Ada"
          testID="ada"
          closeIcon={false}
          closeTestID="remove-ada"
          onClose={onClose}
        />
      )
    );
    props = lastProps(NativeChip);
    expect(props.closeIcon).toBe('false');
    expect(props.closeTestID).toBe('remove-ada');
    act(() => tree.unmount());
  });

  it('maps icons, labels, haptics and the rest', () => {
    const tree = render(
      <Chip
        label="Add to calendar"
        icon={{ ios: 'calendar', android: 'calendar' }}
        accessibilityLabel="Add the event to your calendar"
        closeIcon
        closeAccessibilityLabel="Dismiss"
        disabled
        haptics="selection"
        maxFontSizeMultiplier={1.3}
        minHeight={40}
        paddingHorizontal={16}
      />
    );

    const props = lastProps(NativeChip);
    expect(props.icon).toEqual(
      expect.objectContaining({ iconType: 'sfSymbol', iconName: 'calendar' })
    );
    expect(props.spokenLabel).toBe('Add the event to your calendar');
    expect(props.closeIcon).toBe('true');
    expect(props.closeAccessibilityLabel).toBe('Dismiss');
    expect(props.interactivity).toBe('disabled');
    expect(props.haptics).toBe('selection');
    expect(props.maxFontSizeMultiplier).toBe(1.3);
    expect(props.chipMinHeight).toBe(40);
    expect(props.chipPaddingHorizontal).toBe(16);
    act(() => tree.unmount());
  });
});

const CHIPS = [
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month', disabled: true },
  {
    value: 'custom',
    label: 'Custom…',
    icon: 'calendar',
    testID: 'custom-chip',
    closeTestID: 'custom-close',
    closeIcon: true,
    accessibilityLabel: 'Custom range',
    closeAccessibilityLabel: 'Clear custom range',
  },
];

describe('ChipGroup', () => {
  beforeEach(() => NativeChipGroup.mockClear());

  it('normalizes chips and applies the action-group defaults', () => {
    const tree = render(<ChipGroup chips={CHIPS} />);

    const props = lastProps(NativeChipGroup);
    expect(props.chips).toEqual([
      expect.objectContaining({
        label: 'Last week',
        value: 'week',
        disabled: 'enabled',
        closeIcon: 'false',
        testID: '',
        closeTestID: '',
        accessibilityLabel: '',
        closeAccessibilityLabel: '',
        iconType: '',
      }),
      expect.objectContaining({ value: 'month', disabled: 'disabled' }),
      expect.objectContaining({
        value: 'custom',
        iconType: 'sfSymbol',
        iconName: 'calendar',
        closeIcon: 'true',
        testID: 'custom-chip',
        closeTestID: 'custom-close',
        accessibilityLabel: 'Custom range',
        closeAccessibilityLabel: 'Clear custom range',
      }),
    ]);
    expect(props.variant).toBe('assist');
    expect(props.selection).toBe('none');
    expect(props.selectedValues).toEqual([]);
    expect(props.selectionRequired).toBe('false');
    expect(props.wrap).toBe('true');
    expect(props.spacing).toBe(-1);
    expect(props.interactivity).toBe('enabled');
    expect(props.maxFontSizeMultiplier).toBe(0);
    expect(props.chipMinHeight).toBe(-1);
    expect(props.chipPaddingHorizontal).toBe(-1);
    expect(props.haptics).toBe('');
    expect(props.onChipPress).toBeUndefined();
    expect(props.onChipClose).toBeUndefined();
    expect(props.onGroupSelectionChange).toBeUndefined();
    act(() => tree.unmount());
  });

  it('derives chip and close testIDs from the group testID', () => {
    const tree = render(
      <ChipGroup chips={CHIPS} testID="frame" onClose={() => {}} />
    );

    const [week, , custom] = lastProps(NativeChipGroup).chips;
    expect(week.testID).toBe('frame-week');
    expect(week.closeTestID).toBe('frame-week-close');
    // onClose gives every chip a close icon unless it opts out
    expect(week.closeIcon).toBe('true');
    expect(custom.testID).toBe('custom-chip');
    expect(custom.closeTestID).toBe('custom-close');
    act(() => tree.unmount());
  });

  it('single selection is a required filter group with one value', () => {
    const tree = render(
      <ChipGroup
        chips={CHIPS}
        selection="single"
        selectedValues={['custom', 'week']}
      />
    );

    const props = lastProps(NativeChipGroup);
    expect(props.variant).toBe('filter');
    expect(props.selectionRequired).toBe('true');
    expect(props.selectedValues).toEqual(['custom']);
    // Attached even without onSelectionChange, so native re-applies the prop
    expect(props.onGroupSelectionChange).toEqual(expect.any(Function));
    act(() => tree.unmount());
  });

  it('multiple selection keeps every value and is not required', () => {
    const tree = render(
      <ChipGroup
        chips={CHIPS}
        variant="input"
        selection="multiple"
        selectedValues={['custom', 'week']}
        wrap={false}
        spacing={4}
        chipMinHeight={40}
        chipPaddingHorizontal={10}
        disabled
      />
    );

    const props = lastProps(NativeChipGroup);
    expect(props.variant).toBe('input');
    expect(props.selectionRequired).toBe('false');
    expect(props.selectedValues).toEqual(['custom', 'week']);
    expect(props.wrap).toBe('false');
    expect(props.spacing).toBe(4);
    expect(props.chipMinHeight).toBe(40);
    expect(props.chipPaddingHorizontal).toBe(10);
    expect(props.interactivity).toBe('disabled');
    act(() => tree.unmount());
  });

  it('routes presses, closes and selection changes', () => {
    const onPress = jest.fn();
    const onClose = jest.fn();
    const onSelectionChange = jest.fn();
    const tree = render(
      <ChipGroup
        chips={CHIPS}
        selection="multiple"
        onPress={onPress}
        onClose={onClose}
        onSelectionChange={onSelectionChange}
      />
    );
    expect(lastProps(NativeChipGroup).selectionEventCount).toBe(0);

    act(() => {
      lastProps(NativeChipGroup).onChipPress({
        nativeEvent: { index: 2, value: 'custom' },
      });
      lastProps(NativeChipGroup).onChipClose({
        nativeEvent: { index: 0, value: 'week' },
      });
      lastProps(NativeChipGroup).onGroupSelectionChange({
        nativeEvent: { values: ['week', 'custom'] },
      });
    });
    expect(onPress).toHaveBeenCalledWith('custom', 2);
    expect(onClose).toHaveBeenCalledWith('week', 0);
    expect(onSelectionChange).toHaveBeenCalledWith(['week', 'custom']);
    expect(lastProps(NativeChipGroup).selectionEventCount).toBe(1);
    act(() => tree.unmount());
  });
});
