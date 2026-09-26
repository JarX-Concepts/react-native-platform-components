import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';

import type { DatePickerProps } from '../DatePicker';
import { DatePicker } from '../web/DatePicker';
import { DateRangePicker } from '../web/DateRangePicker';
import { SelectionMenu } from '../web/SelectionMenu';

function render(element: React.ReactElement): ReactTestRenderer {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

describe('web picker accessible names', () => {
  it.each<[DatePickerProps['mode'], string]>([
    [undefined, 'Date'],
    ['time', 'Time'],
    ['dateAndTime', 'Date and time'],
    ['yearAndMonth', 'Month'],
    ['countDownTimer', 'Duration'],
  ])('names the %s input and dialog', (mode, label) => {
    const tree = render(<DatePicker visible mode={mode} date={null} />);
    expect(tree.root.findByType('input').props['aria-label']).toBe(label);
    expect(tree.root.findByType('dialog').props['aria-label']).toBe(label);
  });

  it('names the date range dialog and distinguishes its fields', () => {
    const tree = render(<DateRangePicker visible />);
    expect(tree.root.findByType('dialog').props['aria-label']).toBe(
      'Date range'
    );
    expect(
      tree.root.findAllByType('input').map((input) => input.props['aria-label'])
    ).toEqual(['Start date', 'End date']);
  });

  it('puts the selection accessibilityLabel on the actual select', () => {
    const tree = render(
      <SelectionMenu
        presentation="embedded"
        options={[]}
        selected={null}
        placeholder="Select"
        accessibilityLabel="Country"
      />
    );
    expect(tree.root.findByType('select').props['aria-label']).toBe('Country');
  });

  it('names the selection dialog and listbox with the same label', () => {
    const tree = render(
      <SelectionMenu
        visible
        options={[]}
        selected={null}
        placeholder="Select"
        accessibilityLabel="Country"
      />
    );
    expect(tree.root.findByType('dialog').props['aria-label']).toBe('Country');
    expect(tree.root.findByProps({ role: 'listbox' }).props['aria-label']).toBe(
      'Country'
    );
  });

  it.each([
    ['Country', 'Country'],
    [undefined, 'Select an option'],
  ])(
    'provides a selection name without an explicit label',
    (placeholder, label) => {
      const tree = render(
        <SelectionMenu
          presentation="embedded"
          options={[]}
          selected={null}
          placeholder={placeholder}
        />
      );
      expect(tree.root.findByType('select').props['aria-label']).toBe(label);
    }
  );
});
