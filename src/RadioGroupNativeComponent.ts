// RadioGroupNativeComponent.ts
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { BubblingEventHandler, Double, Int32 } from './codegenTypes';

/** One option of the group. */
export type RadioGroupNativeOption = Readonly<{
  value: string;
  label: string;
  description: string; // Secondary text under the label; empty = none
  disabled: string; // 'enabled' | 'disabled'
  testID: string; // Test identifier of the option's row; empty = none
  accessibilityLabel: string; // Screen-reader label, empty = use label
}>;

/** Event emitted when the user picks an option. */
export type RadioGroupChangeEvent = Readonly<{
  index: Int32;
  value: string;
}>;

export interface RadioGroupNativeProps extends ViewProps {
  /** Options to display, top to bottom. */
  options: ReadonlyArray<RadioGroupNativeOption>;

  /** Value of the chosen option; empty = none. */
  value?: string;

  /**
   * Bumped by JS after every pick, so native applies `value` again: a pick
   * the parent didn't accept goes back.
   */
  valueEventCount?: Int32;

  /** 'none' | 'error' */
  errorState?: string;

  /** Validation message shown under the group in the error state. */
  errorText?: string;

  /** 'enabled' | 'disabled' */
  interactivity?: string;

  /** Cap on the labels' font scaling; 0 (or below 1) = no cap. */
  maxFontSizeMultiplier?: Double;

  /** Screen-reader name of the group; empty = none. */
  groupLabel?: string;

  /**
   * Haptic played when the user picks an option: '' (none added) | 'none' |
   * 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' |
   * 'error'
   */
  haptics?: string;

  /**
   * Fired when the user picks an option. Not `onValueChange`, which other
   * libraries' native inputs register: an event name can't be registered
   * twice.
   */
  onRadioGroupChange?: BubblingEventHandler<RadioGroupChangeEvent>;
}

export default codegenNativeComponent<RadioGroupNativeProps>(
  'PCRadioGroup'
) as HostComponent<RadioGroupNativeProps>;
