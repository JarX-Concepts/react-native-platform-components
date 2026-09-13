// SegmentedControlNativeComponent.ts
import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

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
  iconScale: CodegenTypes.Double; // Resolved image scale when iconType === 'image'
  iconTinted: string; // 'true' | 'false' — draw the image as a tinted template
  accessibilityLabel: string; // Screen-reader label, empty = use label
}>;

/**
 * Event emitted when the user selects a segment.
 */
export type SegmentedControlSelectEvent = Readonly<{
  /** Selected segment index. -1 means the selection was cleared. */
  index: CodegenTypes.Int32;

  /** Selected segment value. Empty when the selection was cleared. */
  value: string;
}>;

/** Interactivity state (no booleans). */
export type SegmentedControlInteractivity = 'enabled' | 'disabled';

/** How labels and icons combine (no booleans). */
export type SegmentedControlLabelVisibility = 'auto' | 'labeled' | 'unlabeled';

/**
 * iOS-specific configuration.
 */
export type IOSProps = Readonly<{
  /** Momentary mode: segment springs back after touch */
  momentary?: string; // 'true' | 'false'

  /** Whether segment widths are proportional to content */
  apportionsSegmentWidthsByContent?: string; // 'true' | 'false'

  /** Selected segment tint color (hex string) */
  selectedSegmentTintColor?: string;
}>;

/**
 * Android-specific configuration.
 */
export type AndroidProps = Readonly<{
  /** Whether one segment must always be selected */
  selectionRequired?: string; // 'true' | 'false'
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
  selectedValue?: CodegenTypes.WithDefault<string, ''>;

  /**
   * Enabled / disabled state.
   */
  interactivity?: string; // SegmentedControlInteractivity

  /**
   * How segment labels and icons combine.
   */
  labelVisibility?: string; // SegmentedControlLabelVisibility

  /**
   * Fired when the user selects a segment.
   */
  onSelect?: CodegenTypes.BubblingEventHandler<SegmentedControlSelectEvent>;

  ios?: IOSProps;
  android?: AndroidProps;
}

export default codegenNativeComponent<SegmentedControlProps>(
  'PCSegmentedControl'
) as HostComponent<SegmentedControlProps>;
