// CheckboxNativeComponent.ts
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { BubblingEventHandler, Double, Int32 } from './codegenTypes';

/** Event emitted when the user toggles the checkbox. */
export type CheckboxChangeEvent = Readonly<{
  /** The state the user asked for. */
  checked: boolean;
}>;

export interface CheckboxNativeProps extends ViewProps {
  /** 'true' | 'false' | 'indeterminate': the controlled state. */
  checked?: string;

  /**
   * Bumped by JS after every toggle, so native applies `checked` again: a
   * toggle the parent didn't accept goes back.
   */
  checkedEventCount?: Int32;

  /** Text beside the box; it wraps. */
  label?: string;

  /** 'none' | 'error': Material 3's error state / a red symbol on iOS. */
  errorState?: string;

  /** Message shown under the label in the error state; empty = none. */
  errorText?: string;

  /** 'enabled' | 'disabled' */
  interactivity?: string;

  /** Cap on the label's font scaling; 0 (or below 1) = no cap. */
  maxFontSizeMultiplier?: Double;

  /**
   * Screen-reader label, applied to the native checkbox rather than the
   * host view. Empty means "use the label".
   */
  spokenLabel?: string;

  /**
   * Haptic played when the user toggles the checkbox: '' (none added) |
   * 'none' | 'selection' | 'light' | 'medium' | 'heavy' | 'success' |
   * 'warning' | 'error'
   */
  haptics?: string;

  /**
   * Fired when the user toggles the checkbox. A name of its own: `onChange`
   * and `onValueChange` are taken by React Native's and other libraries'
   * inputs, and an event name can't be registered twice.
   */
  onCheckboxToggle?: BubblingEventHandler<CheckboxChangeEvent>;
}

export default codegenNativeComponent<CheckboxNativeProps>(
  'PCCheckbox'
) as HostComponent<CheckboxNativeProps>;
