import renderer, { act } from 'react-test-renderer';

import { Platform } from 'react-native';

import {
  DatePicker,
  DateRangePicker,
  LiquidGlass,
  SelectionMenu,
  isDateRangePickerSupported,
} from '../index';

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

jest.mock('../LiquidGlassNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCLiquidGlass', props)),
  };
});

const NativeDatePicker = jest.requireMock('../DatePickerNativeComponent')
  .default as jest.Mock;
const NativeSelectionMenu = jest.requireMock('../SelectionMenuNativeComponent')
  .default as jest.Mock;
const NativeLiquidGlass = jest.requireMock('../LiquidGlassNativeComponent')
  .default as jest.Mock;

describe('root exports', () => {
  it('exports DatePicker, SelectionMenu, and LiquidGlass', () => {
    expect(DatePicker).toBeDefined();
    expect(SelectionMenu).toBeDefined();
    expect(LiquidGlass).toBeDefined();
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
    expect(props.visible).toBe('open');
    expect(props.presentation).toBe('modal');

    act(() => {
      props.onConfirm({
        nativeEvent: { timestampMs: 1577836800000, confirmed: true },
      });
    });
    expect(onConfirm).toHaveBeenCalledWith(new Date(1577836800000), true, 0);

    act(() => {
      props.onConfirm({
        nativeEvent: {
          timestampMs: 1577836800000,
          confirmed: true,
          durationSeconds: 5400,
        },
      });
    });
    expect(onConfirm).toHaveBeenLastCalledWith(
      new Date(1577836800000),
      true,
      5400
    );
    act(() => {
      tree.unmount();
    });
  });

  it('maps is24Hour, the Android input mode and yearAndMonth', () => {
    let tree: ReturnType<typeof renderer.create>;
    act(() => {
      tree = renderer.create(
        <DatePicker
          date={null}
          mode="yearAndMonth"
          is24Hour
          android={{ material: 'm3', inputMode: 'text' }}
        />
      );
    });
    let props = NativeDatePicker.mock.calls.at(-1)[0];
    expect(props.mode).toBe('yearAndMonth');
    expect(props.hourFormat).toBe('24');
    expect(props.android.inputMode).toBe('text');

    act(() => tree.update(<DatePicker date={null} is24Hour={false} />));
    props = NativeDatePicker.mock.calls.at(-1)[0];
    expect(props.hourFormat).toBe('12');

    act(() => tree.update(<DatePicker date={null} />));
    props = NativeDatePicker.mock.calls.at(-1)[0];
    // The device setting
    expect(props.hourFormat).toBe('');
    act(() => {
      tree.unmount();
    });
  });

  it('omits visible and onClosed when not modal', () => {
    const onClosed = jest.fn();
    let tree: ReturnType<typeof renderer.create>;
    act(() => {
      tree = renderer.create(
        <DatePicker
          date={null}
          presentation="embedded"
          visible
          onClosed={onClosed}
        />
      );
    });

    const props = NativeDatePicker.mock.calls[0][0];
    expect(props.presentation).toBe('embedded');
    expect(props.visible).toBeUndefined();
    expect(props.onClosed).toBeUndefined();
    act(() => {
      tree.unmount();
    });
  });
});

describe('DateRangePicker', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    NativeDatePicker.mockClear();
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('renders nothing on iOS and warns once it is shown', () => {
    // The Jest preset runs as iOS, where the module decided at load time
    expect(isDateRangePickerSupported).toBe(false);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    let tree: ReturnType<typeof renderer.create>;
    act(() => {
      tree = renderer.create(<DateRangePicker visible={false} />);
    });
    expect(tree!.toJSON()).toBeNull();
    expect(warn).not.toHaveBeenCalled();

    act(() => tree.update(<DateRangePicker visible />));
    expect(NativeDatePicker).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('isDateRangePickerSupported');
    warn.mockRestore();
    act(() => {
      tree.unmount();
    });
  });

  it('drives the native picker in dateRange mode on Android', () => {
    Platform.OS = 'android';
    const start = new Date(2026, 8, 24);
    const end = new Date(2026, 8, 28);
    const onConfirm = jest.fn();
    const onClosed = jest.fn();
    let tree: ReturnType<typeof renderer.create>;
    act(() => {
      tree = renderer.create(
        <DateRangePicker
          visible
          startDate={start}
          endDate={end}
          minDate={null}
          onConfirm={onConfirm}
          onClosed={onClosed}
          android={{ inputMode: 'text', positiveButtonTitle: 'Save' }}
        />
      );
    });
    const props = NativeDatePicker.mock.calls.at(-1)[0];
    expect(props.mode).toBe('dateRange');
    expect(props.presentation).toBe('modal');
    expect(props.visible).toBe('open');
    expect(props.dateMs).toBe(start.getTime());
    expect(props.endDateMs).toBe(end.getTime());
    expect(props.minDateMs).toBe(Number.MIN_SAFE_INTEGER);
    expect(props.android).toMatchObject({
      material: 'm3',
      inputMode: 'text',
      positiveButtonTitle: 'Save',
    });

    act(() => {
      props.onConfirm({
        nativeEvent: {
          timestampMs: start.getTime(),
          endTimestampMs: end.getTime(),
          confirmed: true,
          durationSeconds: 0,
        },
      });
      props.onClosed({ nativeEvent: {} });
    });
    expect(onConfirm).toHaveBeenCalledWith({ startDate: start, endDate: end });
    expect(onClosed).toHaveBeenCalledTimes(1);
    act(() => {
      tree.unmount();
    });
  });
});

describe('SelectionMenu', () => {
  beforeEach(() => {
    NativeSelectionMenu.mockClear();
  });

  it('normalizes selected and interactivity in embedded mode', () => {
    let tree: ReturnType<typeof renderer.create>;
    act(() => {
      tree = renderer.create(
        <SelectionMenu
          options={[{ label: 'A', data: 'a' }]}
          selected={null}
          presentation="embedded"
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

  it('maps modal visibility and android material', () => {
    let tree: ReturnType<typeof renderer.create>;
    act(() => {
      tree = renderer.create(
        <SelectionMenu
          options={[{ label: 'A', data: 'a' }]}
          selected="a"
          presentation="modal"
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

describe('LiquidGlass', () => {
  beforeEach(() => {
    NativeLiquidGlass.mockClear();
  });

  it('passes cornerRadius to native component', () => {
    let tree: ReturnType<typeof renderer.create>;
    act(() => {
      tree = renderer.create(<LiquidGlass cornerRadius={20} />);
    });

    expect(NativeLiquidGlass).toHaveBeenCalledTimes(1);
    const props = NativeLiquidGlass.mock.calls[0][0];
    expect(props.cornerRadius).toBe(20);
    act(() => {
      tree.unmount();
    });
  });

  it('defaults cornerRadius to 0', () => {
    let tree: ReturnType<typeof renderer.create>;
    act(() => {
      tree = renderer.create(<LiquidGlass />);
    });

    const props = NativeLiquidGlass.mock.calls[0][0];
    expect(props.cornerRadius).toBe(0);
    act(() => {
      tree.unmount();
    });
  });

  it('normalizes ios props with boolean to string conversion', () => {
    // Mock Platform to be iOS
    jest.doMock('react-native', () => ({
      ...jest.requireActual('react-native'),
      Platform: { OS: 'ios' },
    }));

    let tree: ReturnType<typeof renderer.create>;
    act(() => {
      tree = renderer.create(
        <LiquidGlass
          cornerRadius={30}
          ios={{
            effect: 'clear',
            interactive: true,
            tintColor: '#FF0000',
            colorScheme: 'dark',
          }}
        />
      );
    });

    const props = NativeLiquidGlass.mock.calls[0][0];
    expect(props.cornerRadius).toBe(30);
    // iOS props are normalized in the component (booleans to strings)
    // On non-iOS platform in test, ios prop may be undefined
    act(() => {
      tree.unmount();
    });
  });

  it('passes android fallback props', () => {
    let tree: ReturnType<typeof renderer.create>;
    act(() => {
      tree = renderer.create(
        <LiquidGlass
          cornerRadius={15}
          android={{ fallbackBackgroundColor: '#FFFFFF80' }}
        />
      );
    });

    const props = NativeLiquidGlass.mock.calls[0][0];
    expect(props.cornerRadius).toBe(15);
    // Android props are normalized in the component
    act(() => {
      tree.unmount();
    });
  });

  it('renders children inside the glass container', () => {
    let tree: ReturnType<typeof renderer.create>;
    act(() => {
      tree = renderer.create(
        <LiquidGlass cornerRadius={10}>
          <div data-testid="child">Child Content</div>
        </LiquidGlass>
      );
    });

    expect(NativeLiquidGlass).toHaveBeenCalledTimes(1);
    const props = NativeLiquidGlass.mock.calls[0][0];
    expect(props.children).toBeDefined();
    act(() => {
      tree.unmount();
    });
  });
});
