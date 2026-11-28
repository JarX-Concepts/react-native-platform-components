import { Platform, Pressable, Text, View } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import {
  textKeepsStaleFontScale,
  useFontScaleRemountKey,
} from '../fontScaleKey';
import {
  GlassDisclosureCore,
  type GlassDisclosureParts,
} from '../GlassDisclosureCore';

let mockFontScale = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({
    width: 393,
    height: 852,
    scale: 3,
    fontScale: mockFontScale,
  }),
}));

// The running React Native, as Platform.constants reports it
let mockVersion: { major: number; minor: number } | undefined;
const realConstants = Object.getOwnPropertyDescriptor(Platform, 'constants')!;
const realOS = Platform.OS;
beforeAll(() => {
  Object.defineProperty(Platform, 'constants', {
    configurable: true,
    get: () => ({
      isTesting: true,
      reactNativeVersion: mockVersion && { ...mockVersion, patch: 0 },
    }),
  });
});
afterAll(() => {
  Object.defineProperty(Platform, 'constants', realConstants);
});
beforeEach(() => {
  mockFontScale = 1;
  mockVersion = { major: 0, minor: 86 };
  Platform.OS = 'ios';
});
afterEach(() => {
  Platform.OS = realOS;
});

describe('textKeepsStaleFontScale', () => {
  it('is true before React Native 0.87', () => {
    for (const minor of [81, 84, 86]) {
      mockVersion = { major: 0, minor };
      expect(textKeepsStaleFontScale()).toBe(true);
    }
  });

  it('is false from React Native 0.87', () => {
    for (const version of [
      { major: 0, minor: 87 },
      { major: 0, minor: 88 },
      { major: 1, minor: 0 },
    ]) {
      mockVersion = version;
      expect(textKeepsStaleFontScale()).toBe(false);
    }
  });

  it('counts a missing version as affected', () => {
    mockVersion = undefined;
    expect(textKeepsStaleFontScale()).toBe(true);
  });

  it('is false on web', () => {
    Platform.OS = 'web' as typeof Platform.OS;
    expect(textKeepsStaleFontScale()).toBe(false);
  });
});

describe('useFontScaleRemountKey', () => {
  function keyAt(fontScale: number) {
    mockFontScale = fontScale;
    let key = '';
    function Probe() {
      key = useFontScaleRemountKey();
      return null;
    }
    act(() => {
      renderer.create(<Probe />);
    });
    return key;
  }

  it('changes with the font scale before React Native 0.87', () => {
    expect(keyAt(1)).not.toBe(keyAt(3.12));
    expect(keyAt(1.5)).toBe(keyAt(1.5));
  });

  it('is constant from React Native 0.87', () => {
    mockVersion = { major: 0, minor: 88 };
    expect(keyAt(1)).toBe(keyAt(3.12));
  });
});

describe('GlassDisclosure after a text-size change', () => {
  const parts: GlassDisclosureParts = {
    glass: true,
    LiquidGlass: (props) => <View {...props} />,
    LiquidGlassContainer: (props) => <View {...props} />,
    CloseButton: (props) => <Pressable {...props} />,
    colors: { surface: 'white', title: 'black', subtitle: 'gray' },
  };
  const element = () => (
    <GlassDisclosureCore
      testID="disclosure"
      expanded={false}
      onExpandedChange={() => {}}
      title="concept-plans"
      subtitle="5 members"
      parts={parts}
    />
  );

  // The pill's view and its Text: a new instance means a remount
  function pill(tree: renderer.ReactTestRenderer) {
    const pressable = tree.root.find(
      (node) =>
        typeof node.type === 'string' && node.props.testID === 'disclosure-pill'
    );
    const texts = pressable.findAllByType(Text);
    return { pressable, title: texts[0]!, subtitle: texts[1]! };
  }

  function changeFontScale(fontScale: number) {
    let tree: renderer.ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(element());
    });
    const before = pill(tree!);
    mockFontScale = fontScale;
    act(() => tree!.update(element()));
    return { before, after: pill(tree!) };
  }

  it('remounts only the Text before React Native 0.87', () => {
    mockVersion = { major: 0, minor: 86 };
    const { before, after } = changeFontScale(3.12);
    expect(after.title).not.toBe(before.title);
    expect(after.subtitle).not.toBe(before.subtitle);
    // The pill keeps its ref, press handling and accessibility focus
    expect(after.pressable).toBe(before.pressable);
  });

  it('keeps the Text from React Native 0.87', () => {
    mockVersion = { major: 0, minor: 88 };
    const { before, after } = changeFontScale(3.12);
    expect(after.title).toBe(before.title);
    expect(after.subtitle).toBe(before.subtitle);
    expect(after.pressable).toBe(before.pressable);
  });
});
