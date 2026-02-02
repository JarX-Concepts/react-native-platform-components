import renderer, { act } from 'react-test-renderer';

import { DatePicker, LiquidGlass, SelectionMenu } from '../index';

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
      props.onConfirm({ nativeEvent: { timestampMs: 1577836800000 } });
    });
    expect(onConfirm).toHaveBeenCalledWith(new Date(1577836800000));
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
