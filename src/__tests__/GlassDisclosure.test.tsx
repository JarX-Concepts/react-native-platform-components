import {
  AccessibilityInfo,
  BackHandler,
  Pressable,
  Text,
  View,
} from 'react-native';
import renderer, { act } from 'react-test-renderer';

import {
  GlassDisclosureCore,
  type GlassDisclosureParts,
} from '../GlassDisclosureCore';
import type { GlassDisclosureProps } from '../GlassDisclosure';
import type { LiquidGlassProps } from '../LiquidGlass';
import type { LiquidGlassContainerProps } from '../LiquidGlassContainer';

function StubGlass(props: LiquidGlassProps) {
  return <View testID="glass" {...props} />;
}

function StubContainer(props: LiquidGlassContainerProps) {
  return <View testID="glass-container" {...props} />;
}

function parts(liquidGlass: boolean): GlassDisclosureParts {
  return {
    glass: liquidGlass,
    LiquidGlass: StubGlass,
    LiquidGlassContainer: StubContainer,
    CloseButton: (props) => <Pressable {...props} />,
    colors: { surface: 'white', title: 'black', subtitle: 'gray' },
  };
}

type Props = Partial<GlassDisclosureProps> & { glass?: boolean };

function element(props: Props) {
  const { glass: liquidGlass = true, ...rest } = props;
  return (
    <GlassDisclosureCore
      testID="disclosure"
      expanded={false}
      onExpandedChange={() => {}}
      title="concept-plans"
      subtitle="5 members • 3 tabs"
      {...rest}
      parts={parts(liquidGlass)}
    >
      <Text>Panel content</Text>
    </GlassDisclosureCore>
  );
}

function render(props: Props) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element(props));
  });
  return tree!;
}

function rerender(tree: renderer.ReactTestRenderer, props: Props) {
  act(() => {
    tree.update(element(props));
  });
}

function settle() {
  act(() => {
    jest.advanceTimersByTime(2000);
  });
}

// Host views: one per rendered view, where props reach the native side
function byTestID(tree: renderer.ReactTestRenderer, testID: string) {
  return tree.root.findAll(
    (node) => node.props.testID === testID && typeof node.type === 'string'
  );
}

// The outermost element with the testID, which holds the press handlers
function press(tree: renderer.ReactTestRenderer, testID: string) {
  const node = tree.root.findAll(
    (candidate) =>
      candidate.props.testID === testID &&
      candidate.type !== GlassDisclosureCore
  )[0]!;
  act(() => node.props.onPress());
}

// Whether the backdrop takes touches: its layer passes them through while
// the panel is closed
function backdropTakesTouches(tree: renderer.ReactTestRenderer) {
  let node: renderer.ReactTestInstance | null = byTestID(
    tree,
    'disclosure-backdrop'
  )[0]!.parent;
  while (node && node.props.pointerEvents === undefined) node = node.parent;
  return node?.props.pointerEvents === 'auto';
}

// The test IDs of the overlay's direct children, in order
function overlayChildren(tree: renderer.ReactTestRenderer): unknown[] {
  const find = (
    node:
      renderer.ReactTestRendererJSON | renderer.ReactTestRendererJSON[] | null
  ): renderer.ReactTestRendererJSON | undefined => {
    if (!node) return undefined;
    if (Array.isArray(node)) {
      for (const child of node) {
        const found = find(child);
        if (found) return found;
      }
      return undefined;
    }
    if (node.props.testID === 'disclosure') return node;
    return find(
      (node.children ?? []).filter(
        (child): child is renderer.ReactTestRendererJSON =>
          typeof child !== 'string'
      )
    );
  };
  return (find(tree.toJSON())?.children ?? []).map((child) =>
    typeof child === 'string' ? child : (child.props.testID ?? child.type)
  );
}

function glass(tree: renderer.ReactTestRenderer) {
  return byTestID(tree, 'glass');
}

function containers(tree: renderer.ReactTestRenderer) {
  return byTestID(tree, 'glass-container');
}

function texts(tree: renderer.ReactTestRenderer) {
  return tree.root.findAllByType(Text).map((node) => node.props.children);
}

describe('GlassDisclosure', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('shows the pill as a button that asks to expand', () => {
    const onExpandedChange = jest.fn();
    const tree = render({ onExpandedChange });

    const pill = byTestID(tree, 'disclosure-pill')[0]!;
    expect(byTestID(tree, 'disclosure-pill')).toHaveLength(1);
    expect(pill.props.accessibilityRole).toBe('button');
    expect(pill.props.accessibilityState).toEqual({ expanded: false });
    expect(pill.props.accessibilityLabel).toBe(
      'concept-plans, 5 members • 3 tabs'
    );
    expect(texts(tree)).not.toContain('Panel content');
    expect(backdropTakesTouches(tree)).toBe(false);

    press(tree, 'disclosure-pill');
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it('morphs one capsule glass into a concentric panel with Liquid Glass', () => {
    const tree = render({});

    expect(containers(tree)).toHaveLength(1);
    expect(glass(tree)).toHaveLength(1);
    expect(glass(tree)[0]!.props.cornerStyle).toBe('capsule');

    rerender(tree, { expanded: true });
    expect(glass(tree)).toHaveLength(1);
    expect(glass(tree)[0]!.props.cornerStyle).toBe('concentric');
    expect(texts(tree)).toContain('Panel content');
    expect(backdropTakesTouches(tree)).toBe(true);
  });

  it('opens without moving or reparenting the glass container', () => {
    // Fabric moves a view that gets a new sibling ahead of it, and mounts the
    // children of a flattened view into its parent; glass laid out while it
    // is detached jumps instead of morphing
    const tree = render({});
    const overlay = byTestID(tree, 'disclosure')[0]!;
    expect(overlay.props.collapsable).toBe(false);
    const before = overlayChildren(tree);
    rerender(tree, { expanded: true });
    expect(overlayChildren(tree)).toEqual(before);
    settle();
    rerender(tree, { expanded: false });
    settle();
    expect(overlayChildren(tree)).toEqual(before);
  });

  it('keeps the panel until its content has faded, then shrinks to the pill', () => {
    const tree = render({ expanded: true });
    rerender(tree, { expanded: false });
    expect(texts(tree)).toContain('Panel content');

    settle();
    expect(texts(tree)).not.toContain('Panel content');
    expect(byTestID(tree, 'disclosure-pill')).toHaveLength(1);
    expect(backdropTakesTouches(tree)).toBe(false);
    expect(glass(tree)[0]!.props.cornerStyle).toBe('capsule');
  });

  it('closes from the close button and the backdrop', () => {
    const onExpandedChange = jest.fn();
    const tree = render({ expanded: true, onExpandedChange });

    press(tree, 'disclosure-close');
    press(tree, 'disclosure-backdrop');
    expect(onExpandedChange.mock.calls).toEqual([[false], [false]]);
  });

  it('closes on VoiceOver escape and Android back', () => {
    const onExpandedChange = jest.fn();
    const remove = jest.fn();
    type Handler = Parameters<typeof BackHandler.addEventListener>[1];
    let backHandler: Handler | undefined;
    jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_event, handler) => {
        backHandler = handler;
        return { remove };
      });

    const tree = render({ expanded: true, onExpandedChange });
    act(() =>
      byTestID(tree, 'disclosure-panel')[0]!.props.onAccessibilityEscape()
    );
    expect(backHandler?.(undefined as never)).toBe(true);
    expect(onExpandedChange.mock.calls).toEqual([[false], [false]]);

    rerender(tree, { expanded: false, onExpandedChange });
    expect(remove).toHaveBeenCalled();
  });

  it('puts the panel header first and makes the overlay modal while open', () => {
    const tree = render({ expanded: true, headerRight: <Text>More</Text> });
    const overlay = byTestID(tree, 'disclosure')[0]!;
    expect(overlay.props.accessibilityViewIsModal).toBe(true);
    expect(texts(tree)).toEqual([
      'concept-plans',
      '5 members • 3 tabs',
      'More',
      'Panel content',
    ]);
    expect(
      tree.root.findAll(
        (node) =>
          typeof node.type === 'string' &&
          node.props.accessibilityRole === 'header'
      )
    ).toHaveLength(1);
  });

  it('opens a card over the pill without Liquid Glass', () => {
    const tree = render({ glass: false });
    expect(glass(tree)).toHaveLength(0);
    expect(containers(tree)).toHaveLength(0);

    rerender(tree, { glass: false, expanded: true });
    expect(texts(tree)).toContain('Panel content');
    // The pill stays underneath, hidden from screen readers
    expect(byTestID(tree, 'disclosure-pill')).toHaveLength(1);

    rerender(tree, { glass: false, expanded: false });
    settle();
    expect(texts(tree)).not.toContain('Panel content');
  });

  it('crossfades a card instead of morphing with Reduce Motion', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);
    const tree = render({});
    await act(async () => {});

    expect(containers(tree)).toHaveLength(0);
    // Two glass surfaces once open: the pill, and the panel over it
    rerender(tree, { expanded: true });
    expect(glass(tree)).toHaveLength(2);
  });
});
