import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';

import { DatePicker } from '../web/DatePicker';
import { DateRangePicker } from '../web/DateRangePicker';
import { parseInputValue, type DateInputType } from '../web/dateInput';

function render(element: React.ReactElement): ReactTestRenderer {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

const day = (date: number, hour = 0) => new Date(2026, 8, date, hour);
const done = (tree: ReactTestRenderer) => tree.root.findAllByType('button')[1]!;
const edit = (tree: ReactTestRenderer, value: string, index = 0) => {
  act(() => {
    tree.root.findAllByType('input')[index]!.props.onChange({
      target: { value },
    });
  });
};

describe('web date bounds', () => {
  it('updates an open dialog when the controlled date changes', () => {
    const onConfirm = jest.fn();
    const tree = render(
      <DatePicker visible date={day(15)} onConfirm={onConfirm} />
    );
    edit(tree, '2026-09-16');
    onConfirm.mockClear();

    act(() =>
      tree.update(<DatePicker visible date={day(20)} onConfirm={onConfirm} />)
    );
    expect(tree.root.findByType('input').props.value).toBe('2026-09-20');
    expect(onConfirm).not.toHaveBeenCalled();
    act(() => done(tree).props.onClick());
    expect(onConfirm).toHaveBeenLastCalledWith(day(20), true, 0);

    act(() =>
      tree.update(<DatePicker visible date={null} onConfirm={onConfirm} />)
    );
    expect(tree.root.findByType('input').props.value).toBe('');
    expect(done(tree).props.disabled).toBe(true);
  });

  it('keeps an edited draft when the same controlled date is recreated', () => {
    const tree = render(<DatePicker visible date={day(15)} />);
    edit(tree, '2026-09-16');
    act(() => tree.update(<DatePicker visible date={day(15)} />));
    expect(tree.root.findByType('input').props.value).toBe('2026-09-16');
  });

  it('does not confirm typed dates outside the bounds in embedded mode', () => {
    const onConfirm = jest.fn();
    const tree = render(
      <DatePicker
        presentation="embedded"
        date={day(15)}
        minDate={day(10, 18)}
        maxDate={day(20, 8)}
        onConfirm={onConfirm}
      />
    );

    edit(tree, '2026-09-09');
    edit(tree, '2026-09-21');
    expect(onConfirm).not.toHaveBeenCalled();

    // Date inputs compare days, not the hidden time of day of either bound.
    edit(tree, '2026-09-10');
    expect(onConfirm).toHaveBeenLastCalledWith(day(10), true, 0);
    edit(tree, '2026-09-20');
    expect(onConfirm).toHaveBeenLastCalledWith(day(20), true, 0);
  });

  it('disables Done for initial, edited and cleared invalid dates', () => {
    const onConfirm = jest.fn();
    const tree = render(
      <DatePicker
        visible
        date={day(9)}
        minDate={day(10)}
        maxDate={day(20)}
        onConfirm={onConfirm}
      />
    );

    expect(done(tree).props.disabled).toBe(true);
    act(() => done(tree).props.onClick());
    edit(tree, '2026-09-21');
    expect(done(tree).props.disabled).toBe(true);
    expect(onConfirm).not.toHaveBeenCalled();

    edit(tree, '2026-09-12');
    expect(done(tree).props.disabled).toBe(false);
    act(() => done(tree).props.onClick());
    expect(onConfirm).toHaveBeenLastCalledWith(day(12), true, 0);

    edit(tree, '');
    expect(done(tree).props.disabled).toBe(true);
    expect(tree.root.findByType('input').props.value).toBe('');
  });

  it('validates a draft again when bounds change while the dialog is open', () => {
    const onConfirm = jest.fn();
    const tree = render(
      <DatePicker visible date={day(15)} onConfirm={onConfirm} />
    );
    expect(done(tree).props.disabled).toBe(false);
    act(() =>
      tree.update(
        <DatePicker
          visible
          date={day(15)}
          maxDate={day(14)}
          onConfirm={onConfirm}
        />
      )
    );
    expect(done(tree).props.disabled).toBe(true);
    act(() => done(tree).props.onClick());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('compares the displayed time and supports ranges crossing midnight', () => {
    const onConfirm = jest.fn();
    const tree = render(
      <DatePicker
        presentation="embedded"
        mode="time"
        date={day(15)}
        minDate={day(10, 23)}
        maxDate={day(20, 1)}
        onConfirm={onConfirm}
      />
    );
    edit(tree, '12:00');
    expect(onConfirm).not.toHaveBeenCalled();
    edit(tree, '23:30');
    edit(tree, '00:30');
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['date', undefined],
    ['yearAndMonth', undefined],
    ['time', 900],
    ['dateAndTime', 900],
    ['countDownTimer', 900],
  ] as const)(
    'only applies a minute step to time inputs (%s)',
    (mode, step) => {
      const tree = render(
        <DatePicker
          date={day(15)}
          presentation="embedded"
          mode={mode}
          ios={{ minuteInterval: 15 }}
        />
      );
      expect(tree.root.findByType('input').props.step).toBe(step);
    }
  );

  it('rejects an out-of-bounds range and keeps the configured lower bound', () => {
    const onConfirm = jest.fn();
    const onClosed = jest.fn();
    const tree = render(
      <DateRangePicker
        visible
        startDate={day(9)}
        endDate={day(15)}
        minDate={day(10)}
        maxDate={day(20)}
        onConfirm={onConfirm}
        onClosed={onClosed}
      />
    );
    expect(done(tree).props.disabled).toBe(true);
    expect(tree.root.findAllByType('input')[1]!.props.min).toBe('2026-09-10');
    act(() => done(tree).props.onClick());
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClosed).not.toHaveBeenCalled();

    edit(tree, '2026-09-10');
    edit(tree, '2026-09-21', 1);
    expect(done(tree).props.disabled).toBe(true);
    edit(tree, '2026-09-20', 1);
    expect(done(tree).props.disabled).toBe(false);
    act(() => done(tree).props.onClick());
    expect(onConfirm).toHaveBeenCalledWith({
      startDate: day(10),
      endDate: day(20),
    });
    expect(onClosed).toHaveBeenCalledTimes(1);
  });
});

describe('web date parsing', () => {
  it.each<[string, DateInputType]>([
    ['2026-02-29', 'date'],
    ['2026-09-31', 'date'],
    ['2026-00-10', 'date'],
    ['2026-09-10junk', 'date'],
    ['2026-13', 'month'],
    ['0000-01', 'month'],
    ['24:00', 'time'],
    ['01:60', 'time'],
    ['01:00:60', 'time'],
    ['2026-09-10T01:00', 'time'],
    ['2026-09-10junkT01:00', 'datetime-local'],
    ['2026-09-10TjunkT01:00', 'datetime-local'],
  ])('rejects invalid %s input instead of normalizing it', (value, type) => {
    expect(parseInputValue(value, type, null)).toBeNull();
  });

  it('accepts leap days and recovers from an invalid initial Date', () => {
    expect(parseInputValue('2028-02-29', 'date', new Date(NaN))).toEqual(
      new Date(2028, 1, 29)
    );
  });
});
