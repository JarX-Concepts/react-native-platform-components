// SegmentedControlNativeComponent.ts
import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type {
  BubblingEventHandler,
  Double,
  Int32,
  WithDefault,
} from './codegenTypes';

/**
 * A single segment in the control.
 *
 * Icons are pre-resolved on the JS side so native only deals with flat
 * strings: `iconType` selects the source, `iconName` carries an SF Symbol or
 * drawable name, and `iconUri` / `iconScale` carry a resolved image asset.
 */
export type SegmentedControlSegment = Readonly<{
  label: string;
  value: string;
  disabled: string; // 'enabled' | 'disabled'
  iconType: string; // '' | 'sfSymbol' | 'drawable' | 'image'
  iconName: string; // SF Symbol (iOS) or drawable resource name (Android)
  iconUri: string; // Resolved image URI when iconType === 'image'
  iconScale: Double; // Resolved image scale when iconType === 'image'
  iconTinted: string; // 'true' | 'false' — draw the image as a tinted template
  badge: string; // Badge text, empty = no badge
  accessibilityLabel: string; // Screen-reader label, empty = use label
  testID: string; // E2E identifier of the segment, empty = none
}>;

/**
 * Event emitted when the user selects a segment.
 */
export type SegmentedControlSelectEvent = Readonly<{
  /** Selected segment index. -1 means the selection was cleared. */
  index: Int32;

  /** Selected segment value. Empty when the selection was cleared. */
  value: string;
}>;

/** Interactivity state (no booleans). */
export type SegmentedControlInteractivity = 'enabled' | 'disabled';

/** How labels and icons combine (no booleans). */
export type SegmentedControlLabelVisibility = 'auto' | 'labeled' | 'unlabeled';

/**
 * Label font. Empty strings / 0 mean "platform default".
 */
export type LabelStyleProps = Readonly<{
  fontFamily?: string;
  fontSize?: Double;
  fontWeight?: string; // 'normal' | 'bold' | '100'..'900'
  fontStyle?: string; // 'normal' | 'italic'
}>;

/**
 * iOS-specific configuration.
 */
export type IOSProps = Readonly<{
  /** Momentary mode: segment springs back after touch */
  momentary?: string; // 'true' | 'false'

  /** Whether segment widths are proportional to content */
  apportionsSegmentWidthsByContent?: string; // 'true' | 'false'
}>;

/**
 * Android-specific configuration.
 */
export type AndroidProps = Readonly<{
  /** Whether one segment must always be selected */
  selectionRequired?: string; // 'true' | 'false'

  /** Material style: 'm3' | 'expressive' */
  material?: string;
}>;

export interface SegmentedControlProps extends ViewProps {
  /**
   * Segments to display.
   */
  segments: ReadonlyArray<SegmentedControlSegment>;

  /**
   * Controlled selection by `value`.
   * Empty string means "no selection".
   */
  selectedValue?: WithDefault<string, ''>;

  /**
   * Enabled / disabled state.
   */
  interactivity?: string; // SegmentedControlInteractivity

  /**
   * How segment labels and icons combine.
   */
  labelVisibility?: string; // SegmentedControlLabelVisibility

  /** Background of the selected segment. */
  selectedSegmentColor?: ColorValue;

  /** Text / icon color of the selected segment. */
  activeTintColor?: ColorValue;

  /** Text / icon color of unselected segments. */
  inactiveTintColor?: ColorValue;

  /** Android: ripple color when pressing a segment. */
  androidRippleColor?: ColorValue;

  /** Android: outline color of the segments. */
  androidStrokeColor?: ColorValue;

  /** Label font. */
  labelStyle?: LabelStyleProps;

  /** Largest font scale the labels may reach; 0 = no cap. */
  maxFontSizeMultiplier?: Double;

  /** Badge background (default: system red). */
  badgeBackgroundColor?: ColorValue;

  /** Badge text color (default: white). */
  badgeTextColor?: ColorValue;

  /**
   * Haptic played when the user changes the selection: '' (none added) | 'none' | 'selection' |
   * 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
   */
  haptics?: string;

  /**
   * Fired when the user selects a segment.
   */
  onSelect?: BubblingEventHandler<SegmentedControlSelectEvent>;

  ios?: IOSProps;
  android?: AndroidProps;
}

export default codegenNativeComponent<SegmentedControlProps>(
  'PCSegmentedControl'
) as HostComponent<SegmentedControlProps>;
