import { Image, Platform, Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { ContextMenu, type ContextMenuAction } from '../index';
import { flattenMenuActions } from '../menuItems';

jest.mock('../ContextMenuNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCContextMenu', props)),
  };
});

const NativeContextMenu = jest.requireMock('../ContextMenuNativeComponent')
  .default as jest.Mock;

function lastNativeProps() {
  const calls = NativeContextMenu.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

const ACTIONS: ContextMenuAction[] = [
  {
    id: 'edit',
    title: '',
    displayInline: true,
    subactions: [
      { id: 'copy', title: 'Copy', image: 'doc.on.doc' },
      {
        id: 'send',
        title: 'Send To',
        subactions: [
          { id: 'mail', title: 'Mail' },
          { id: 'secret', title: 'Secret', attributes: { hidden: true } },
        ],
      },
    ],
  },
  {
    id: 'count',
    title: 'Increase',
    subtitle: 'By one',
    imageColor: '#FF0000',
    state: 'on',
    attributes: { keepsMenuPresented: true, disabled: true },
  },
  {
    id: 'delete',
    title: 'Delete',
    image: { type: 'image', source: { uri: 'trash' } },
    attributes: { destructive: true },
  },
  { id: 'hidden', title: 'Hidden', attributes: { hidden: true } },
];

describe('flattenMenuActions', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
    jest
      .spyOn(Image, 'resolveAssetSource')
      .mockReturnValue({ uri: 'https://x/trash.png', scale: 2 } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('flattens the tree depth first, children pointing at their parent', () => {
    const items = flattenMenuActions(ACTIONS);
    expect(items.map((i) => [i.id, i.kind, i.parent])).toEqual([
      ['edit', 'section', -1],
      ['copy', 'action', 0],
      ['send', 'menu', 0],
      ['mail', 'action', 2],
      ['count', 'action', -1],
      ['delete', 'action', -1],
    ]);
  });

  it('drops hidden actions and fills every field', () => {
    const [, copy, , , count, del] = flattenMenuActions(ACTIONS);
    expect(copy).toEqual({
      id: 'copy',
      title: 'Copy',
      subtitle: '',
      parent: 0,
      kind: 'action',
      iconType: 'sfSymbol',
      iconName: 'doc.on.doc',
      iconUri: '',
      iconScale: 1,
      iconTinted: 'true',
      imageColor: '',
      destructive: 'false',
      disabled: 'false',
      keepsMenuPresented: 'false',
      state: '',
      haptics: '',
    });
    expect(count).toMatchObject({
      subtitle: 'By one',
      imageColor: '#FF0000',
      state: 'on',
      disabled: 'true',
      keepsMenuPresented: 'true',
      iconType: '',
    });
    expect(del).toMatchObject({
      destructive: 'true',
      iconType: 'image',
      iconUri: 'https://x/trash.png',
      iconScale: 2,
    });
  });

  it('resolves string images to drawables on Android', () => {
    Platform.OS = 'android';
    const [, copy] = flattenMenuActions(ACTIONS);
    expect(copy).toMatchObject({
      iconType: 'drawable',
      iconName: 'doc.on.doc',
    });
  });

  it("carries an action's own haptics", () => {
    const [warn, plain] = flattenMenuActions([
      { id: 'delete', title: 'Delete', haptics: 'warning' },
      { id: 'copy', title: 'Copy' },
    ]);
    expect(warn).toMatchObject({ haptics: 'warning' });
    expect(plain).toMatchObject({ haptics: '' });
  });

  it('keeps an action with an empty subactions list an action', () => {
    const [item] = flattenMenuActions([
      { id: 'a', title: 'A', subactions: [], displayInline: true },
    ]);
    expect(item).toMatchObject({ kind: 'action' });
  });
});

describe('ContextMenu', () => {
  beforeEach(() => {
    NativeContextMenu.mockClear();
    Platform.OS = 'ios';
  });

  it('passes the flattened actions and maps the callbacks', () => {
    const onPressAction = jest.fn();
    const onPreviewPress = jest.fn();
    const tree = render(
      <ContextMenu
        actions={ACTIONS}
        onPressAction={onPressAction}
        onPreviewPress={onPreviewPress}
        ios={{ enablePreview: true }}
      >
        <Text>Content</Text>
      </ContextMenu>
    );
    const props = lastNativeProps();
    expect(props.actions).toEqual(flattenMenuActions(ACTIONS));
    expect(props.ios).toEqual({ enablePreview: 'true' });
    expect(props.onMenuOpen).toBeUndefined();

    act(() => {
      props.onPressAction({
        nativeEvent: { actionId: 'mail', actionTitle: 'Mail' },
      });
      props.onPreviewPress({ nativeEvent: {} });
    });
    expect(onPressAction).toHaveBeenCalledWith('mail', 'Mail');
    expect(onPreviewPress).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });

  it('leaves onPreviewPress off when not set', () => {
    const tree = render(
      <ContextMenu actions={[]}>
        <Text>Content</Text>
      </ContextMenu>
    );
    expect(lastNativeProps().onPreviewPress).toBeUndefined();
    act(() => tree.unmount());
  });
});
