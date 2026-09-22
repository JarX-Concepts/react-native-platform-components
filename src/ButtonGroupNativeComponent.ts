// ButtonGroupNativeComponent.ts
import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { BubblingEventHandler, Double, Int32 } from './codegenTypes';

/**
 * A single button in the group. Icons are pre-resolved on the JS side (see
 * icons.ts) so native only deals with flat strings.
 */
export type ButtonGroupButton = Readonly<{
  label: string; // Empty for an icon-only button
  value: string;
  disabled: string; // 'enabled' | 'disabled'
  iconType: string; // '' | 'sfSymbol' | 'drawable' | 'image'
  iconName: string; // SF Symbol (iOS) or drawable resource name (Android)
  iconUri: string; // Resolved image URI when iconType === 'image'
  iconScale: Double; // Resolved image scale when iconType === 'image'
  iconTinted: string; // 'true' | 'false' — draw the image as a tinted template
  accessibilityLabel: string; // Screen-reader label, empty = use label
}>;

/**
 * Event emitted when a button is pressed.
 */
export type ButtonGroupPressEvent = Readonly<{
  index: Int32;
  value: string;
}>;

/**
 * Event emitted when the selection changes (single / multiple selection).
 */
export type ButtonGroupSelectionEvent = Readonly<{
  /** Values of the selected buttons, in button order. */
  // Codegen only understands the `T[]` array form in event payloads.
  values: string[];
}>;

/**
 * Label font. Empty strings / 0 mean "platform default".
 */
export type ButtonGroupLabelStyleProps = Readonly<{
  fontFamily?: string;
  fontSize?: Double;
  fontWeight?: string; // 'normal' | 'bold' | '100'..'900'
  fontStyle?: string; // 'normal' | 'italic'
}>;

/**
 * Android-specific configuration.
 */
export type ButtonGroupAndroidProps = Readonly<{
  /** What happens to buttons that don't fit: 'none' | 'menu' | 'wrap' */
  overflow?: string;
}>;

export interface ButtonGroupNativeProps extends ViewProps {
  /** Buttons to display. */
  buttons: ReadonlyArray<ButtonGroupButton>;

  /** 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated' */
  variant?: string;

  /** 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' */
  size?: string;

  /** '' (platform default) | 'round' | 'square' */
  shape?: string;

  /** 'true' | 'false': connected group (shared outline, small inner corners) */
  connected?: string;

  /** Gap between buttons in points; negative means the platform default. */
  spacing?: Double;

  /** 'none' | 'single' | 'multiple' */
  selection?: string;

  /** Values of the selected buttons (single / multiple selection). */
  selectedValues?: ReadonlyArray<string>;

  /** 'true' | 'false': whether at least one button must stay selected */
  selectionRequired?: string;

  /** 'enabled' | 'disabled' */
  interactivity?: string;

  /** Container (background) color of the buttons. */
  color?: ColorValue;

  /** Label and icon color of the buttons. */
  foregroundColor?: ColorValue;

  /** Android: ripple color shown while pressing a button. */
  androidRippleColor?: ColorValue;

  /** Android: outline color (outlined variant). */
  androidStrokeColor?: ColorValue;

  /** Label font. */
  labelStyle?: ButtonGroupLabelStyleProps;

  /** Fired when a button is pressed. */
  onButtonPress?: BubblingEventHandler<ButtonGroupPressEvent>;

  /**
   * Fired when the selection changes. Not `onSelectionChange`: React Native's
   * TextInput registers `topSelectionChange` as a direct event, and an event
   * name can't be both direct and bubbling.
   */
  onGroupSelectionChange?: BubblingEventHandler<ButtonGroupSelectionEvent>;

  android?: ButtonGroupAndroidProps;
}

export default codegenNativeComponent<ButtonGroupNativeProps>(
  'PCButtonGroup'
) as HostComponent<ButtonGroupNativeProps>;
