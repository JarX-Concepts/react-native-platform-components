import { Image, Platform, Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { ActionSheet, type ActionSheetAction } from '../index';

jest.mock('../ActionSheetNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCActionSheet', props)),
  };
});

const NativeActionSheet = jest.requireMock('../ActionSheetNativeComponent')
  .default as jest.Mock;

function lastNativeProps() {
  const calls = NativeActionSheet.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

const ACTIONS: ActionSheetAction[] = [
  {
    id: 'library',
    title: 'Photo Library',
    image: { ios: 'photo', android: 'photo_library' },
    testID: 'source-library',
  },
  {
    id: 'camera',
    title: 'Take Photo',
    image: { type: 'image', source: { uri: 'camera' } },
    imageColor: '#007AFF',
    attributes: { disabled: true },
  },
  { id: 'secret', title: 'Secret', attributes: { hidden: true } },
  {
    id: 'remove',
    title: 'Remove',
    attributes: { destructive: true },
    haptics: 'warning',
  },
];

describe('ActionSheet', () => {
  beforeEach(() => {
    NativeActionSheet.mockClear();
    Platform.OS = 'ios';
    jest
      .spyOn(Image, 'resolveAssetSource')
      .mockReturnValue({ uri: 'https://x/camera.png', scale: 2 } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('flattens the actions for native, dropping hidden ones', () => {
    render(<ActionSheet visible={false} actions={ACTIONS} />);
    const { actions } = lastNativeProps();
    expect(actions.map((a: { id: string }) => a.id)).toEqual([
      'library',
      'camera',
      'remove',
    ]);
    expect(actions[0]).toEqual({
      id: 'library',
      title: 'Photo Library',
      iconType: 'sfSymbol',
      iconName: 'photo',
      iconRequest: '',
      iconUri: '',
      iconScale: 1,
      iconTinted: 'true',
      imageColor: '',
      destructive: 'false',
      disabled: 'false',
      haptics: '',
      testID: 'source-library',
    });
    expect(actions[1]).toMatchObject({
      iconType: 'image',
      iconUri: 'https://x/camera.png',
      iconScale: 2,
      imageColor: '#007AFF',
      disabled: 'true',
      testID: '',
    });
    expect(actions[2]).toMatchObject({
      destructive: 'true',
      haptics: 'warning',
      iconType: '',
    });
  });

  it('resolves string icons to drawables on Android', () => {
    Platform.OS = 'android';
    render(<ActionSheet visible={false} actions={ACTIONS} />);
    expect(lastNativeProps().actions[0]).toMatchObject({
      iconType: 'drawable',
      iconName: 'photo_library',
    });
  });

  it('maps visibility and fills the optional strings', () => {
    const tree = render(<ActionSheet visible actions={[]} />);
    expect(lastNativeProps()).toMatchObject({
      visible: 'open',
      title: '',
      message: '',
      cancelTitle: '',
      cancelTestID: '',
      haptics: '',
      maxFontSizeMultiplier: 0,
    });
    act(() =>
      tree.update(
        <ActionSheet
          visible={false}
          title="Add a file"
          message="Choose a source"
          cancelTitle="Not now"
          cancelTestID="cancel"
          haptics="selection"
          maxFontSizeMultiplier={1.5}
          actions={[]}
        />
      )
    );
    expect(lastNativeProps()).toMatchObject({
      visible: 'closed',
      title: 'Add a file',
      message: 'Choose a source',
      cancelTitle: 'Not now',
      cancelTestID: 'cancel',
      haptics: 'selection',
      maxFontSizeMultiplier: 1.5,
    });
  });

  it('calls onSelect with the id of an enabled action and onCancel', () => {
    const onSelect = jest.fn();
    const onCancel = jest.fn();
    render(
      <ActionSheet
        visible
        actions={ACTIONS}
        onSelect={onSelect}
        onCancel={onCancel}
      >
        <Text>Trigger</Text>
      </ActionSheet>
    );
    const props = lastNativeProps();
    act(() => {
      props.onSelect({ nativeEvent: { actionId: 'remove' } });
      // Disabled, hidden and unknown actions can't be picked
      props.onSelect({ nativeEvent: { actionId: 'camera' } });
      props.onSelect({ nativeEvent: { actionId: 'secret' } });
      props.onSelect({ nativeEvent: { actionId: 'nope' } });
      props.onCancel({ nativeEvent: {} });
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('remove');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders its children and leaves unset callbacks off', () => {
    const tree = render(
      <ActionSheet visible={false} actions={ACTIONS} testID="sheet">
        <Text>Trigger</Text>
      </ActionSheet>
    );
    const props = lastNativeProps();
    expect(props.onSelect).toBeUndefined();
    expect(props.onCancel).toBeUndefined();
    expect(props.testID).toBe('sheet');
    expect(tree.root.findByType(Text).props.children).toBe('Trigger');
  });

  it('warns about empty and duplicate ids in development', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <ActionSheet
        visible={false}
        actions={[
          { id: 'a', title: 'A' },
          { id: 'a', title: 'Again' },
          { id: '', title: 'Empty' },
          { id: 'a', title: 'Hidden', attributes: { hidden: true } },
        ]}
      />
    );
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0]![0]).toContain(
      'ActionSheet requires unique, non-empty identifiers; item 1 has a duplicate identifier'
    );
  });
});
