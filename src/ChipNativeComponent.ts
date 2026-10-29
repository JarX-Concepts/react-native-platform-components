// ChipNativeComponent.ts
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { BubblingEventHandler, Double, Int32 } from './codegenTypes';

/**
 * Icon fields, pre-resolved on the JS side (see icons.ts).
 */
export type ChipIconProps = Readonly<{
  iconType: string; // '' | 'sfSymbol' | 'drawable' | 'image'
  iconName: string; // SF Symbol (iOS) or drawable resource name (Android)
  iconRequest: string;
  iconUri: string; // Resolved image URI when iconType === 'image'
  iconScale: Double; // Resolved image scale when iconType === 'image'
  iconTinted: string; // 'true' | 'false' — draw the image as a tinted template
}>;

export interface ChipNativeProps extends ViewProps {
  /** Chip text. */
  label?: string;

  /** Leading icon. */
  icon?: ChipIconProps;

  /** 'assist' | 'filter' | 'input' | 'suggestion' */
  variant?: string;

  /** '' (not selectable) | 'true' | 'false': the controlled selected state. */
  selected?: string;

  /**
   * Bumped by JS after every press of a selectable chip, so native applies
   * `selected` again: a toggle the parent didn't accept goes back.
   */
  pressEventCount?: Int32;

  /** 'true' | 'false': shows the trailing close (remove) icon. */
  closeIcon?: string;

  /** Screen-reader label of the close icon; empty = the platform default. */
  closeAccessibilityLabel?: string;

  /** Test identifier of the close icon; empty = none. */
  closeTestID?: string;

  /** 'enabled' | 'disabled' */
  interactivity?: string;

  /** Cap on the label's font scaling; 0 (or below 1) = no cap. */
  maxFontSizeMultiplier?: Double;

  /** Smallest chip height in points (dp); negative = the platform's. */
  chipMinHeight?: Double;

  /**
   * Space between the chip's edges and its content in points (dp);
   * negative = the platform's.
   */
  chipPaddingHorizontal?: Double;

  /**
   * Screen-reader label, applied to the native chip rather than the host
   * view. Empty means "use the label".
   */
  spokenLabel?: string;

  /**
   * Haptic played when the chip or its close icon is pressed: '' (none
   * added) | 'none' | 'selection' | 'light' | 'medium' | 'heavy' |
   * 'success' | 'warning' | 'error'
   */
  haptics?: string;

  /** Fired when the chip is pressed. */
  onChipPress?: BubblingEventHandler<Readonly<{}>>;

  /** Fired when the close icon is pressed. */
  onChipClose?: BubblingEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<ChipNativeProps>(
  'PCChip'
) as HostComponent<ChipNativeProps>;
