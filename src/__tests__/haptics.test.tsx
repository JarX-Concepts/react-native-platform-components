import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import {
  Button,
  ButtonGroup,
  ContextMenu,
  SegmentedControl,
  SelectionMenu,
  TabBar,
  type Haptics,
} from '../index';

function mockNative(name: string) {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement(name, props)),
  };
}

jest.mock('../ButtonNativeComponent', () => mockNative('PCButton'));
jest.mock('../ButtonGroupNativeComponent', () => mockNative('PCButtonGroup'));
jest.mock('../SegmentedControlNativeComponent', () =>
  mockNative('PCSegmentedControl')
);
jest.mock('../TabBarNativeComponent', () => mockNative('PCTabBar'));
jest.mock('../SelectionMenuNativeComponent', () =>
  mockNative('PCSelectionMenu')
);
jest.mock('../ContextMenuNativeComponent', () => mockNative('PCContextMenu'));

/** The props the native component received last. */
function nativeProps(spec: string) {
  const mock = jest.requireMock(spec).default as jest.Mock;
  const calls = mock.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  act(() => tree!.unmount());
}

// Each component with the spec module it renders, built with a given haptics.
const COMPONENTS: Array<
  [string, string, (haptics?: Haptics) => React.ReactElement]
> = [
  [
    'Button',
    '../ButtonNativeComponent',
    (h) => <Button label="Save" haptics={h} />,
  ],
  [
    'ButtonGroup',
    '../ButtonGroupNativeComponent',
    (h) => <ButtonGroup buttons={[{ label: 'A', value: 'a' }]} haptics={h} />,
  ],
  [
    'SegmentedControl',
    '../SegmentedControlNativeComponent',
    (h) => (
      <SegmentedControl
        segments={[{ label: 'A', value: 'a' }]}
        selectedValue="a"
        haptics={h}
      />
    ),
  ],
  [
    'TabBar',
    '../TabBarNativeComponent',
    (h) => (
      <TabBar
        items={[{ label: 'Home', value: 'home' }]}
        selectedValue="home"
        haptics={h}
      />
    ),
  ],
  [
    'SelectionMenu',
    '../SelectionMenuNativeComponent',
    (h) => (
      <SelectionMenu
        options={[{ label: 'A', data: 'a' }]}
        selected={null}
        haptics={h}
      />
    ),
  ],
  [
    'ContextMenu',
    '../ContextMenuNativeComponent',
    (h) => (
      <ContextMenu actions={[{ id: 'copy', title: 'Copy' }]} haptics={h}>
        <Text>Hold me</Text>
      </ContextMenu>
    ),
  ],
];

const VALUES: Haptics[] = [
  'selection',
  'light',
  'medium',
  'heavy',
  'success',
  'warning',
  'error',
  'none',
];

describe.each(COMPONENTS)('%s haptics', (_name, spec, build) => {
  it('sends an empty string when unset, so native adds no haptic', () => {
    render(build());
    expect(nativeProps(spec).haptics).toBe('');
  });

  it.each(VALUES)('passes %s through', (value) => {
    render(build(value));
    expect(nativeProps(spec).haptics).toBe(value);
  });
});
