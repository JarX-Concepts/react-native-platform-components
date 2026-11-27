import { Platform, StyleSheet, Text, View } from 'react-native';
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

describe('FormSection on iOS', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
    mockLiquidGlass = true;
    mockIOSVersion = '26.5';
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
