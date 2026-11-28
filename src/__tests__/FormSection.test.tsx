import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import {
  Checkbox,
  FormSection,
  SelectionMenu,
  Switch,
  TextField,
} from '../index';

jest.mock('../TextFieldNativeComponent', () => {
  const React = require('react');
  const Native = React.forwardRef((props: object, ref: unknown) =>
    React.createElement('PCTextField', { ...props, ref })
  );
  return {
    __esModule: true,
    default: Native,
    Commands: {
      focus: jest.fn(),
      blur: jest.fn(),
      clear: jest.fn(),
      setText: jest.fn(),
      setSelection: jest.fn(),
    },
  };
});

jest.mock('../SwitchNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: object) => React.createElement('PCSwitch', props),
  };
});

jest.mock('../CheckboxNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: object) => React.createElement('PCCheckbox', props),
  };
});

jest.mock('../SelectionMenuNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: object) => React.createElement('PCSelectionMenu', props),
  };
});

jest.mock('../FormSectionGeometryNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: object) =>
      React.createElement('PCFormSectionGeometry', props),
  };
});

// The iOS 26 design follows isLiquidGlassSupported
let mockLiquidGlass = true;
jest.mock('../LiquidGlass', () => {
  const actual = jest.requireActual('../LiquidGlass');
  return {
    ...actual,
    get isLiquidGlassSupported() {
      return mockLiquidGlass;
    },
  };
});

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

// The host view with this testID
function host(tree: renderer.ReactTestRenderer, testID: string) {
  return tree.root.find(
    (node) => node.props.testID === testID && typeof node.type === 'string'
  );
}

function hostOrNull(tree: renderer.ReactTestRenderer, testID: string) {
  return (
    tree.root.findAll(
      (node) => node.props.testID === testID && typeof node.type === 'string'
    )[0] ?? null
  );
}

function style(tree: renderer.ReactTestRenderer, testID: string) {
  return StyleSheet.flatten(host(tree, testID).props.style);
}

function fieldProps(tree: renderer.ReactTestRenderer, testID: string) {
  return tree.root.find(
    (node) =>
      (node.type as unknown) === 'PCTextField' && node.props.testID === testID
  ).props;
}

let mockWindow = { width: 420, fontScale: 1 };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ height: 900, scale: 3, ...mockWindow }),
}));

const windowSize = (width: number, fontScale = 1) => {
  mockWindow = { width, fontScale };
};

let mockIOSVersion = '26.5';
Object.defineProperty(Platform, 'Version', {
  configurable: true,
  get: () => mockIOSVersion,
});

// The device: Platform.isPad and the screen, for the earlier design
let mockScreen = { width: 393, height: 852 };
let mockPad = false;
const realDimensionsGet = Dimensions.get;
jest
  .spyOn(Dimensions, 'get')
  .mockImplementation((dim) =>
    dim === 'screen'
      ? { ...mockScreen, scale: 3, fontScale: 1 }
      : realDimensionsGet(dim)
  );
Object.defineProperty(Platform, 'isPad', { get: () => mockPad });

// What the native view over the card reports: where the card is in its
// window, and the window's safe area
type Geometry = {
  width: number;
  windowLeft?: number;
  windowRight?: number;
  safeAreaLeft?: number;
  safeAreaRight?: number;
};
function reportGeometry(tree: renderer.ReactTestRenderer, geometry: Geometry) {
  const probe = tree.root.find(
    (node) => (node.type as unknown) === 'PCFormSectionGeometry'
  );
  act(() => {
    probe.props.onGeometryChange({
      nativeEvent: {
        windowLeft: 20,
        windowRight: 20,
        safeAreaLeft: 0,
        safeAreaRight: 0,
        ...geometry,
      },
    });
  });
}

const twoRows = (
  <FormSection testID="section" header="Header">
    <Text>One</Text>
    <Text>Two</Text>
  </FormSection>
);
const insetOf = (tree: renderer.ReactTestRenderer) =>
  style(tree, 'section-row-0').paddingHorizontal;

describe('FormSection on iOS', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
    mockLiquidGlass = true;
    mockIOSVersion = '26.5';
    mockPad = false;
    mockScreen = { width: 393, height: 852 };
    windowSize(420);
  });

  it('puts each child in a row of the card, with separators between rows', () => {
    const tree = render(
      <FormSection testID="section" header="Payee" footer="We'll mail it.">
        <Text>One</Text>
        {null}
        {false}
        {undefined}
        <>
          <Text>Two</Text>
          <Text>Three</Text>
        </>
      </FormSection>
    );
    expect(host(tree, 'section-header').props.children).toBe('Payee');
    expect(host(tree, 'section-header').props.accessibilityRole).toBe('header');
    expect(host(tree, 'section-footer').props.children).toBe("We'll mail it.");
    expect(host(tree, 'section-card')).toBeTruthy();
    // The fragment's children are rows of their own; the empty children
    // make none
    expect(hostOrNull(tree, 'section-row-2')).not.toBeNull();
    expect(hostOrNull(tree, 'section-row-3')).toBeNull();
    expect(hostOrNull(tree, 'section-separator-0')).not.toBeNull();
    expect(hostOrNull(tree, 'section-separator-1')).not.toBeNull();
    // None under the last row
    expect(hostOrNull(tree, 'section-separator-2')).toBeNull();
  });

  it('draws the iOS 26 card', () => {
    const tree = render(
      <FormSection testID="section" header="Payee" footer="Footer">
        <Text>One</Text>
        <Text>Two</Text>
      </FormSection>
    );
    expect(style(tree, 'section-card')).toMatchObject({
      borderRadius: 26,
      borderCurve: 'continuous',
    });
    // 20pt insets on a 420pt phone; the separator is inset at both ends
    expect(style(tree, 'section-row-0')).toMatchObject({
      paddingHorizontal: 20,
      minHeight: 52,
      paddingVertical: 12,
    });
    expect(style(tree, 'section-separator-0')).toMatchObject({
      height: 1,
      start: 20,
      end: 20,
      position: 'absolute',
      bottom: 0,
    });
    // Headers in the headline style, sentence case
    expect(host(tree, 'section-header').props.dynamicTypeRamp).toBe('headline');
    expect(style(tree, 'section-header')).toMatchObject({
      fontSize: 17,
      fontWeight: '600',
      textTransform: 'none',
      paddingHorizontal: 20,
    });
    expect(host(tree, 'section-footer').props.dynamicTypeRamp).toBe('footnote');
    expect(style(tree, 'section-footer')).toMatchObject({
      fontSize: 13,
      paddingHorizontal: 20,
    });
  });

  it('uses 16pt insets on narrower phones', () => {
    windowSize(402);
    const tree = render(
      <FormSection testID="section">
        <Text>One</Text>
        <Text>Two</Text>
      </FormSection>
    );
    expect(style(tree, 'section-row-0').paddingHorizontal).toBe(16);
    expect(style(tree, 'section-separator-0')).toMatchObject({
      start: 16,
      end: 16,
    });
  });

  it('puts the native geometry view over the card, out of the way', () => {
    const tree = render(twoRows);
    const probe = host(tree, 'section-card').find(
      (node) => (node.type as unknown) === 'PCFormSectionGeometry'
    );
    expect(probe.props.pointerEvents).toBe('none');
    expect(StyleSheet.flatten(probe.props.style)).toMatchObject({
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });
  });

  it("follows the card's own width, not the window's (iOS 26)", () => {
    const tree = render(twoRows);
    // Until the native view reports: a card filling the 420pt window
    expect(insetOf(tree)).toBe(20);
    // In a padded container: the 340pt list it lines up with is 16, as
    // every list up to 402pt wide
    reportGeometry(tree, { width: 300, windowLeft: 60, windowRight: 60 });
    expect(insetOf(tree)).toBe(16);
    expect(style(tree, 'section-separator-0')).toMatchObject({
      start: 16,
      end: 16,
    });
    expect(style(tree, 'section-header').paddingHorizontal).toBe(16);
    // A 402pt list (iPhone 17) and a wider one
    reportGeometry(tree, { width: 362 });
    expect(insetOf(tree)).toBe(16);
    reportGeometry(tree, { width: 365 });
    expect(insetOf(tree)).toBe(20);
    // iPad, full screen
    reportGeometry(tree, { width: 794 });
    expect(insetOf(tree)).toBe(20);
  });

  it('uses 16pt on an iPhone in landscape, as a list under the safe area (iOS 26)', () => {
    windowSize(874);
    const tree = render(twoRows);
    const landscape = {
      width: 710,
      safeAreaLeft: 62,
      safeAreaRight: 62,
    };
    // 20pt inside the safe area, where a full-width list puts its card
    reportGeometry(tree, { ...landscape, windowLeft: 82, windowRight: 82 });
    expect(insetOf(tree)).toBe(16);
    // Out under the safe area
    reportGeometry(tree, { ...landscape, windowLeft: 20, windowRight: 20 });
    expect(insetOf(tree)).toBe(16);
    // In a narrower column: the list it lines up with stays inside the
    // safe area
    reportGeometry(tree, {
      ...landscape,
      width: 600,
      windowLeft: 137,
      windowRight: 137,
    });
    expect(insetOf(tree)).toBe(20);
    // Against the safe area on one side only
    reportGeometry(tree, { ...landscape, windowLeft: 82, windowRight: 200 });
    expect(insetOf(tree)).toBe(20);
    // No safe area at the sides (iPhone SE, iPad)
    reportGeometry(tree, { width: 627, windowLeft: 20, windowRight: 20 });
    expect(insetOf(tree)).toBe(20);
  });

  it('uses 16pt before iOS 26 on iPad, on 375pt phones and in narrow cards', () => {
    mockLiquidGlass = false;
    mockIOSVersion = '18.5';
    windowSize(393);
    const tree = render(twoRows);
    expect(insetOf(tree)).toBe(20);
    reportGeometry(tree, { width: 321 });
    expect(insetOf(tree)).toBe(20);
    reportGeometry(tree, { width: 320 });
    expect(insetOf(tree)).toBe(16);
    // Landscape: the safe area makes no difference
    reportGeometry(tree, {
      width: 694,
      windowLeft: 79,
      windowRight: 79,
      safeAreaLeft: 59,
      safeAreaRight: 59,
    });
    expect(insetOf(tree)).toBe(20);

    mockScreen = { width: 375, height: 667 };
    windowSize(375);
    const se = render(twoRows);
    expect(insetOf(se)).toBe(16);
    reportGeometry(se, { width: 627 });
    expect(insetOf(se)).toBe(16);

    mockScreen = { width: 834, height: 1210 };
    mockPad = true;
    windowSize(834);
    const pad = render(twoRows);
    expect(insetOf(pad)).toBe(16);
    reportGeometry(pad, { width: 794 });
    expect(insetOf(pad)).toBe(16);
  });

  it('draws the card of earlier iOS versions', () => {
    mockLiquidGlass = false;
    mockIOSVersion = '18.5';
    windowSize(393);
    const tree = render(
      <FormSection testID="section" header="Payee">
        <Text>One</Text>
        <Text>Two</Text>
      </FormSection>
    );
    expect(style(tree, 'section-card').borderRadius).toBe(10);
    expect(style(tree, 'section-row-0')).toMatchObject({
      paddingHorizontal: 20,
      minHeight: 44,
    });
    expect(style(tree, 'section-separator-0')).toMatchObject({
      height: StyleSheet.hairlineWidth,
      start: 20,
      end: 0,
    });
    expect(host(tree, 'section-header').props.dynamicTypeRamp).toBe('footnote');
    expect(style(tree, 'section-header')).toMatchObject({
      fontSize: 13,
      textTransform: 'uppercase',
    });
  });

  // UIDesignRequiresCompatibility: no glass, so the iOS 18 card, inside the
  // margins of iOS 26 (16pt on a 402pt phone)
  it('draws the earlier card with iOS 26 margins when the app keeps the iOS 18 design', () => {
    mockLiquidGlass = false;
    mockIOSVersion = '26.5';
    windowSize(402);
    const tree = render(
      <FormSection testID="section" header="Payee">
        <Text>One</Text>
        <Text>Two</Text>
      </FormSection>
    );
    expect(style(tree, 'section-card').borderRadius).toBe(10);
    expect(style(tree, 'section-row-0')).toMatchObject({
      paddingHorizontal: 16,
      minHeight: 44,
    });
    expect(style(tree, 'section-separator-0')).toMatchObject({
      height: StyleSheet.hairlineWidth,
      start: 16,
      end: 0,
    });
    expect(style(tree, 'section-header')).toMatchObject({
      fontSize: 13,
      textTransform: 'uppercase',
      paddingHorizontal: 16,
    });
  });

  it('grows the header and footer gaps with the text size, up to the cap', () => {
    windowSize(420, 3);
    const tree = render(
      <FormSection testID="section" header="Payee" footer="Footer">
        <Text>One</Text>
      </FormSection>
    );
    const big = style(tree, 'section-header').paddingBottom as number;
    expect(big).toBeGreaterThan(12);

    const capped = render(
      <FormSection
        testID="capped"
        header="Payee"
        footer="Footer"
        maxFontSizeMultiplier={1}
      >
        <Text>One</Text>
      </FormSection>
    );
    expect(style(capped, 'capped-header').paddingBottom).toBeCloseTo(6.33);
    expect(host(capped, 'capped-header').props.maxFontSizeMultiplier).toBe(1);
    expect(host(capped, 'capped-footer').props.maxFontSizeMultiplier).toBe(1);
  });

  it('gives a TextField the leading label, borderless field, labelWidth and row height', () => {
    const tree = render(
      <FormSection testID="section" labelWidth={120}>
        <TextField testID="name" label="Name" />
      </FormSection>
    );
    const props = fieldProps(tree, 'name');
    expect(props.ios).toMatchObject({
      labelPlacement: 'leading',
      borderStyle: 'none',
      labelWidth: 120,
    });
    expect(props.minFieldHeight).toBe(52);
    // The field sets the row's height: the row adds none
    const row = style(tree, 'section-row-0');
    expect(row.paddingVertical).toBeUndefined();
    expect(row.minHeight).toBeUndefined();
  });

  it('gives a nested TextField the defaults too', () => {
    const tree = render(
      <FormSection testID="section">
        <View>
          <TextField testID="name" label="Name" />
        </View>
      </FormSection>
    );
    expect(fieldProps(tree, 'name').ios.labelPlacement).toBe('leading');
    // Without a section labelWidth, the field's default (0: native's 100)
    expect(fieldProps(tree, 'name').ios.labelWidth).toBe(0);
    expect(style(tree, 'section-row-0').paddingVertical).toBeUndefined();
  });

  it("lets the TextField's own props win", () => {
    const tree = render(
      <FormSection testID="section" labelWidth={120}>
        <TextField
          testID="name"
          label="Name"
          minFieldHeight={60}
          ios={{
            labelPlacement: 'above',
            borderStyle: 'roundedRect',
            labelWidth: 80,
          }}
        />
        <TextField testID="phone" label="Phone" ios={{ borderStyle: 'line' }} />
      </FormSection>
    );
    const name = fieldProps(tree, 'name');
    expect(name.ios).toMatchObject({
      labelPlacement: 'above',
      borderStyle: 'roundedRect',
      labelWidth: 80,
    });
    expect(name.minFieldHeight).toBe(60);
    // A field that sets one prop keeps the section's others
    expect(fieldProps(tree, 'phone').ios).toMatchObject({
      labelPlacement: 'leading',
      borderStyle: 'line',
      labelWidth: 120,
    });
  });

  it('uses the earlier row height for TextFields before iOS 26', () => {
    mockLiquidGlass = false;
    const tree = render(
      <FormSection>
        <TextField testID="name" label="Name" />
      </FormSection>
    );
    expect(fieldProps(tree, 'name').minFieldHeight).toBe(44);
  });

  it('pads the 44pt controls to the row height', () => {
    const tree = render(
      <FormSection testID="section">
        <Switch label="Overnight mail" />
        <Checkbox label="Receipt" checked={false} />
        <SelectionMenu
          options={[{ label: 'USPS', data: 'usps' }]}
          selected="usps"
          presentation="embedded"
        />
      </FormSection>
    );
    expect(style(tree, 'section-row-0')).toMatchObject({
      minHeight: 52,
      paddingVertical: 12,
    });
    expect(style(tree, 'section-row-1')).toMatchObject({
      minHeight: 52,
      paddingVertical: 4,
    });
    expect(style(tree, 'section-row-2')).toMatchObject({
      minHeight: 52,
      paddingVertical: 4,
    });
  });

  it('pads a row again when its TextField goes away', () => {
    const element = (field: boolean) => (
      <FormSection testID="section">
        <View>{field ? <TextField label="Memo" /> : <Text>Memo</Text>}</View>
      </FormSection>
    );
    const tree = render(element(true));
    expect(style(tree, 'section-row-0').paddingVertical).toBeUndefined();
    act(() => tree.update(element(false)));
    expect(style(tree, 'section-row-0').paddingVertical).toBe(12);
  });

  it('leaves a TextField outside a FormSection alone', () => {
    const tree = render(<TextField testID="name" label="Name" />);
    const props = fieldProps(tree, 'name');
    expect(props.ios).toMatchObject({
      labelPlacement: '',
      borderStyle: '',
      labelWidth: 0,
    });
    expect(props.minFieldHeight).toBe(0);
  });
});

describe('FormSection on Android', () => {
  beforeEach(() => {
    Platform.OS = 'android';
  });
  afterEach(() => {
    Platform.OS = 'ios';
  });

  it('renders the children as they are, with the header and footer', () => {
    const tree = render(
      <FormSection
        testID="section"
        header="Payee"
        footer="We'll mail it."
        labelWidth={120}
        maxFontSizeMultiplier={1.5}
      >
        <TextField testID="name" label="Name" />
        <Text testID="plain">Plain</Text>
      </FormSection>
    );
    expect(hostOrNull(tree, 'section-card')).toBeNull();
    expect(hostOrNull(tree, 'section-row-0')).toBeNull();
    expect(hostOrNull(tree, 'section-separator-0')).toBeNull();
    expect(host(tree, 'section-header').props.children).toBe('Payee');
    expect(host(tree, 'section-header').props.maxFontSizeMultiplier).toBe(1.5);
    expect(host(tree, 'section-footer').props.children).toBe("We'll mail it.");
    // The children are the section's own
    const section = host(tree, 'section');
    expect(
      section.children.map((child) =>
        typeof child === 'string' ? child : child.props.testID
      )
    ).toEqual(['section-header', 'name', 'plain', 'section-footer']);
    // No iOS defaults for the field
    const props = fieldProps(tree, 'name');
    expect(props.ios.labelPlacement).toBe('');
    expect(props.minFieldHeight).toBe(0);
  });
});

// React Native < 0.87 keeps a Text's old size after a runtime text-size
// change (react/react-native#57512): the header and footer remount, the
// card and its rows don't
describe('FormSection after a text-size change', () => {
  let mockMinor = 86;
  const realConstants = Object.getOwnPropertyDescriptor(Platform, 'constants')!;
  beforeAll(() => {
    Object.defineProperty(Platform, 'constants', {
      configurable: true,
      get: () => ({
        isTesting: true,
        reactNativeVersion: { major: 0, minor: mockMinor, patch: 0 },
      }),
    });
  });
  afterAll(() => {
    Object.defineProperty(Platform, 'constants', realConstants);
  });
  beforeEach(() => {
    mockLiquidGlass = true;
    mockIOSVersion = '26.5';
    windowSize(420);
  });
  afterEach(() => {
    Platform.OS = 'ios';
  });

  const parts = ['header', 'footer', 'card', 'row-0'];
  const section = () => (
    <FormSection testID="section" header="Payee" footer="Footer">
      <Text>One</Text>
    </FormSection>
  );
  // The host views before and after: a new instance means a remount
  function changeFontScale() {
    const tree = render(section());
    const before = parts.map((part) => hostOrNull(tree, `section-${part}`));
    windowSize(420, 3.12);
    act(() => tree.update(section()));
    const after = parts.map((part) => hostOrNull(tree, `section-${part}`));
    return { before, after };
  }

  it.each(['ios', 'android'] as const)(
    'remounts the header and footer before React Native 0.87 (%s)',
    (os) => {
      Platform.OS = os;
      mockMinor = 86;
      const { before, after } = changeFontScale();
      expect(after[0]).not.toBe(before[0]);
      expect(after[1]).not.toBe(before[1]);
      // On Android there is no card
      expect(after[2]).toBe(before[2]);
      expect(after[3]).toBe(before[3]);
    }
  );

  it('keeps them from React Native 0.87', () => {
    mockMinor = 88;
    const { before, after } = changeFontScale();
    after.forEach((node, index) => expect(node).toBe(before[index]));
  });
});
