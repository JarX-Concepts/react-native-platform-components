// SwitchNativeComponent.ts
import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { BubblingEventHandler, Double, Int32 } from './codegenTypes';

/**
 * Icon fields, pre-resolved on the JS side (see icons.ts).
 */
export type SwitchIconProps = Readonly<{
  iconType: string; // '' | 'check' | 'sfSymbol' | 'drawable' | 'image'
  iconName: string; // SF Symbol (iOS) or drawable resource name (Android)
  iconRequest: string;
  iconUri: string; // Resolved image URI when iconType === 'image'
  iconScale: Double; // Resolved image scale when iconType === 'image'
  iconTinted: string; // 'true' | 'false' — draw the image as a tinted template
}>;

export type SwitchChangeEvent = Readonly<{
  value: boolean;
}>;

export interface SwitchNativeProps extends ViewProps {
  /** The controlled state: on or off. */
  value?: boolean;

  /**
   * Bumped by JS after every change the user makes, so native applies
   * `value` again: a change the parent didn't accept goes back.
   */
  valueEventCount?: Int32;

  /** Text of the settings row, at the leading edge; empty = a bare switch. */
  label?: string;

  /** 'enabled' | 'disabled' */
  interactivity?: string;

  /** Track color while on; unset = the theme's. */
  color?: ColorValue;

  /** Track color while off; unset = the theme's. */
  trackColor?: ColorValue;

  /** Thumb color; unset = the theme's. */
  thumbColor?: ColorValue;

  /** Android: icon on the thumb ('check' = Material's check mark while on). */
  thumbIcon?: SwitchIconProps;

  /** Cap on the label's font scaling; 0 (or below 1) = no cap. */
  maxFontSizeMultiplier?: Double;

  /**
   * Screen-reader label, applied to the native element that carries the
   * testID and takes the touches. Empty means "use the label".
   */
  spokenLabel?: string;

  /**
   * Haptic played when the user changes the value: '' (none added) |
   * 'none' | 'selection' | 'light' | 'medium' | 'heavy' | 'success' |
   * 'warning' | 'error'
   */
  haptics?: string;

  /** Fired when the user changes the value. */
  onSwitchChange?: BubblingEventHandler<SwitchChangeEvent>;
}

export default codegenNativeComponent<SwitchNativeProps>(
  'PCSwitch'
) as HostComponent<SwitchNativeProps>;
