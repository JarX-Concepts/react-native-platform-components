import { Image, Platform } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { SelectionMenu } from '../index';

jest.mock('../SelectionMenuNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCSelectionMenu', props)),
  };
});

const NativeSelectionMenu = jest.requireMock('../SelectionMenuNativeComponent')
  .default as jest.Mock;

function lastNativeProps() {
  const calls = NativeSelectionMenu.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

describe('SelectionMenu', () => {
  beforeEach(() => {
    NativeSelectionMenu.mockClear();
    Platform.OS = 'ios';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('flattens options with their subtitles and icons', () => {
    jest
      .spyOn(Image, 'resolveAssetSource')
      .mockReturnValue({ uri: 'file:///bell.png', scale: 3 } as never);
    const tree = render(
      <SelectionMenu
        selected={null}
        options={[
          { label: 'Red', data: 'r' },
          {
            label: 'Push',
            data: 'push',
            subtitle: 'On this device',
            icon: { type: 'image', source: 1 },
          },
          { label: 'Mail', data: 'mail', icon: { ios: 'envelope' } },
        ]}
      />
    );
    const [red, push, mail] = lastNativeProps().options;
    expect(red).toEqual({
      label: 'Red',
      data: 'r',
      disabled: 'false',
      subtitle: '',
      iconType: '',
      iconName: '',
      iconRequest: '',
      iconUri: '',
      iconScale: 1,
      iconTinted: 'true',
    });
    expect(push).toMatchObject({
      subtitle: 'On this device',
      iconType: 'image',
      iconRequest: '',
      iconUri: 'file:///bell.png',
      iconScale: 3,
    });
    expect(mail).toMatchObject({ iconType: 'sfSymbol', iconName: 'envelope' });
    act(() => tree.unmount());
  });

  it('preserves disabled option indexes and rejects disabled or stale selections', () => {
    const onSelect = jest.fn();
    const options = [
      { label: 'Unavailable', data: 'blocked', disabled: true },
      { label: 'Available', data: 'ok' },
    ];
    const tree = render(
      <SelectionMenu selected={null} options={options} onSelect={onSelect} />
    );
    expect(
      lastNativeProps().options.map(
        (option: { disabled: string }) => option.disabled
      )
    ).toEqual(['true', 'false']);
    const select = (index: number, data: string) =>
      act(() =>
        lastNativeProps().onSelect({
          nativeEvent: {
            index,
            data,
            label: options[index]?.label ?? 'Unknown',
          },
        })
      );
    select(0, 'blocked');
    select(1, 'old-data');
    select(9, 'unknown');
    expect(onSelect).not.toHaveBeenCalled();
    select(1, 'ok');
    expect(onSelect).toHaveBeenLastCalledWith('ok', 'Available', 1);
    onSelect.mockClear();
    act(() =>
      tree.update(
        <SelectionMenu
          selected="ok"
          disabled
          options={options}
          onSelect={onSelect}
        />
      )
    );
    select(1, 'ok');
    expect(onSelect).not.toHaveBeenCalled();
    act(() =>
      tree.update(
        <SelectionMenu
          selected="blocked"
          options={options.map((option) => ({ ...option, disabled: false }))}
          onSelect={onSelect}
        />
      )
    );
    expect(lastNativeProps().selectedData).toBe('blocked');
    select(0, 'blocked');
    expect(onSelect).toHaveBeenLastCalledWith('blocked', 'Unavailable', 0);
    act(() => tree.unmount());
  });

  it('maps android.searchable to a string flag', () => {
    Platform.OS = 'android';
    const tree = render(
      <SelectionMenu
        selected={null}
        options={[]}
        presentation="embedded"
        android={{ material: 'm3', searchable: true }}
      />
    );
    expect(lastNativeProps().android).toEqual({
      material: 'm3',
      searchable: 'true',
    });

    act(() =>
      tree.update(
        <SelectionMenu
          selected={null}
          options={[]}
          presentation="embedded"
          android={{ material: 'm3' }}
        />
      )
    );
    expect(lastNativeProps().android).toEqual({
      material: 'm3',
      searchable: 'false',
    });
    act(() => tree.unmount());
  });
});
