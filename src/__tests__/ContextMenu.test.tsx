import { Image, Platform, Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { ContextMenu, type ContextMenuAction } from '../index';
import { flattenMenuActions } from '../menuItems';

jest.mock('../ContextMenuNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCContextMenu', props)),
    Commands: { handleTap: jest.fn() },
  };
});

const NativeContextMenu = jest.requireMock('../ContextMenuNativeComponent')
  .default as jest.Mock;
const { Commands } = jest.requireMock('../ContextMenuNativeComponent') as {
  Commands: { handleTap: jest.Mock };
};

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
      iconRequest: '',
      iconUri: '',
      iconScale: 1,
      iconTinted: 'true',
      imageColor: '',
      destructive: 'false',
      disabled: 'false',
      keepsMenuPresented: 'false',
      state: '',
      haptics: '',
      testID: '',
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
      iconRequest: '',
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

  it('carries test IDs of actions, submenus and their children', () => {
    const items = flattenMenuActions([
      {
        id: 'send',
        title: 'Send To',
        testID: 'menu-send',
        subactions: [
          { id: 'mail', title: 'Mail', testID: 'menu-send-mail' },
          { id: 'messages', title: 'Messages' },
        ],
      },
      { id: 'copy', title: 'Copy', testID: 'menu-copy' },
    ]);
    expect(items.map((i) => [i.id, i.testID])).toEqual([
      ['send', 'menu-send'],
      ['mail', 'menu-send-mail'],
      ['messages', ''],
      ['copy', 'menu-copy'],
    ]);
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

  it('maps visible to the native prop, unset by default', () => {
    const tree = render(
      <ContextMenu actions={ACTIONS} trigger="none">
        <Text>Content</Text>
      </ContextMenu>
    );
    expect(lastNativeProps().visible).toBeUndefined();
    expect(lastNativeProps().trigger).toBe('none');

    act(() =>
      tree.update(
        <ContextMenu actions={ACTIONS} trigger="none" visible>
          <Text>Content</Text>
        </ContextMenu>
      )
    );
    expect(lastNativeProps().visible).toBe('open');

    act(() =>
      tree.update(
        <ContextMenu actions={ACTIONS} trigger="none" visible={false}>
          <Text>Content</Text>
        </ContextMenu>
      )
    );
    expect(lastNativeProps().visible).toBe('closed');
    act(() => tree.unmount());
  });

  it('keeps android.visible as an alias, under the top-level prop', () => {
    const tree = render(
      <ContextMenu actions={ACTIONS} android={{ visible: true }}>
        <Text>Content</Text>
      </ContextMenu>
    );
    expect(lastNativeProps().visible).toBe('open');
    expect(lastNativeProps().android).toEqual({ anchorPosition: undefined });

    act(() =>
      tree.update(
        <ContextMenu
          actions={ACTIONS}
          visible={false}
          android={{ visible: true, anchorPosition: 'right' }}
        >
          <Text>Content</Text>
        </ContextMenu>
      )
    );
    expect(lastNativeProps().visible).toBe('closed');
    expect(lastNativeProps().android).toEqual({ anchorPosition: 'right' });
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

  it('opens a tap menu for a tap that no inner pressable took', () => {
    const node = {};
    let tree: ReturnType<typeof renderer.create> | undefined;
    act(() => {
      tree = renderer.create(
        <ContextMenu actions={ACTIONS} trigger="tap">
          <Text>Content</Text>
        </ContextMenu>,
        { createNodeMock: () => node }
      );
    });
    const props = lastNativeProps();
    const at = (x: number, y: number) => ({
      nativeEvent: { pageX: x, pageY: y },
    });
    // Bubbles up to the menu only when no deeper responder took the touch
    expect(props.onStartShouldSetResponder()).toBe(true);

    act(() => {
      props.onResponderGrant(at(10, 10));
      props.onResponderMove(at(14, 12));
      props.onResponderRelease(at(14, 12));
    });
    expect(Commands.handleTap).toHaveBeenCalledWith(node);

    // A drag, or a touch a scroll view took over, opens nothing
    Commands.handleTap.mockClear();
    act(() => {
      props.onResponderGrant(at(10, 10));
      props.onResponderMove(at(40, 10));
      props.onResponderRelease(at(40, 10));
      props.onResponderGrant(at(10, 10));
      props.onResponderTerminate(at(10, 10));
      props.onResponderRelease(at(10, 10));
    });
    expect(Commands.handleTap).not.toHaveBeenCalled();
    act(() => tree!.unmount());
  });

  it('takes no touches outside tap mode, or when disabled', () => {
    const tree = render(
      <ContextMenu actions={ACTIONS}>
        <Text>Content</Text>
      </ContextMenu>
    );
    expect(lastNativeProps().onStartShouldSetResponder).toBeUndefined();

    for (const trigger of ['none', 'tap'] as const) {
      act(() =>
        tree.update(
          <ContextMenu actions={ACTIONS} trigger={trigger} disabled>
            <Text>Content</Text>
          </ContextMenu>
        )
      );
      expect(lastNativeProps().onStartShouldSetResponder).toBeUndefined();
    }
    act(() => tree.unmount());
  });
});
