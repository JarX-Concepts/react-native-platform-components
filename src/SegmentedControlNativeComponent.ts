// SegmentedControlNativeComponent.ts
import type { CodegenTypes, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

/**
 * A single segment in the control.
 */
export type SegmentedControlSegment = Readonly<{
  label: string;
  value: string;
  disabled: string; // 'enabled' | 'disabled'
  icon: string; // SF Symbol (iOS) or drawable name (Android), empty = none
}>;

/**
 * Event emitted when the user selects a segment.
 */
export type SegmentedControlSelectEvent = Readonly<{
  /** Selected segment index */
  index: CodegenTypes.Int32;

  /** Selected segment value */
  value: string;
}>;

/** Interactivity state (no booleans). */
export type SegmentedControlInteractivity = 'enabled' | 'disabled';

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
   * Fired when the user selects a segment.
   */
  onSelect?: CodegenTypes.BubblingEventHandler<SegmentedControlSelectEvent>;

  ios?: IOSProps;
  android?: AndroidProps;
}

export default codegenNativeComponent<SegmentedControlProps>(
  'PCSegmentedControl'
);
