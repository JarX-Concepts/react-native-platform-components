import renderer, { act } from 'react-test-renderer';

import { DatePicker, SelectionMenu } from '../index';

jest.mock('../DatePickerNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCDatePicker', props)),
  };
});

jest.mock('../SelectionMenuNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCSelectionMenu', props)),
  };
});

const NativeDatePicker = jest.requireMock('../DatePickerNativeComponent')
  .default as jest.Mock;
const NativeSelectionMenu = jest.requireMock('../SelectionMenuNativeComponent')
  .default as jest.Mock;

describe('root exports', () => {
  it('exports DatePicker and SelectionMenu', () => {
    expect(DatePicker).toBeDefined();
    expect(SelectionMenu).toBeDefined();
  });
});

describe('DatePicker', () => {
  beforeEach(() => {
    NativeDatePicker.mockClear();
  });

  it('normalizes dates and modal visibility', () => {
    const date = new Date('2020-01-01T00:00:00.000Z');
    const onConfirm = jest.fn();
    let tree: ReturnType<typeof renderer.create>;

    act(() => {
      tree = renderer.create(
        <DatePicker
          date={date}
          minDate={null}
          maxDate={undefined}
          presentation="modal"
          visible
          onConfirm={onConfirm}
        />
      );
    });

    expect(NativeDatePicker).toHaveBeenCalledTimes(1);
    const props = NativeDatePicker.mock.calls[0][0];
    expect(props.dateMs).toBe(date.getTime());
    expect(props.minDateMs).toBe(-1);
    expect(props.maxDateMs).toBe(-1);
    expect(props.visible).toBe('open');
    expect(props.presentation).toBe('modal');

    act(() => {
      props.onConfirm({ nativeEvent: { timestampMs: 1577836800000 } });
    });
    expect(onConfirm).toHaveBeenCalledWith(new Date(1577836800000));
    act(() => {
      tree.unmount();
    });
  });

  it('omits visible when not modal', () => {
    let tree: ReturnType<typeof renderer.create>;
    act(() => {
      tree = renderer.create(
        <DatePicker date={null} presentation="embedded" visible />
      );
    });

    const props = NativeDatePicker.mock.calls[0][0];
    expect(props.presentation).toBe('embedded');
    expect(props.visible).toBeUndefined();
    act(() => {
      tree.unmount();
    });
  });
});

describe('SelectionMenu', () => {
  beforeEach(() => {
    NativeSelectionMenu.mockClear();
  });

  it('normalizes selected and interactivity in inline mode', () => {
    let tree: ReturnType<typeof renderer.create>;
    act(() => {
      tree = renderer.create(
        <SelectionMenu
          options={[{ label: 'A', data: 'a' }]}
          selected={null}
          inlineMode
          disabled
          placeholder="Pick"
        />
      );
    });

    const props = NativeSelectionMenu.mock.calls[0][0];
    expect(props.selectedData).toBe('');
    expect(props.interactivity).toBe('disabled');
    expect(props.anchorMode).toBe('inline');
    expect(props.visible).toBeUndefined();
    act(() => {
      tree.unmount();
    });
  });

  it('maps headless visibility and android material', () => {
    let tree: ReturnType<typeof renderer.create>;
    act(() => {
      tree = renderer.create(
        <SelectionMenu
          options={[{ label: 'A', data: 'a' }]}
          selected="a"
          visible
          android={{ material: 'm3' }}
        />
      );
    });

    const props = NativeSelectionMenu.mock.calls[0][0];
    expect(props.anchorMode).toBe('headless');
    expect(props.visible).toBe('open');
    expect(props.android).toEqual({ material: 'm3' });
    act(() => {
      tree.unmount();
    });
  });
});
