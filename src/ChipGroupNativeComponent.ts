// ChipGroupNativeComponent.ts
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { BubblingEventHandler, Double, Int32 } from './codegenTypes';

/**
 * A single chip in the group. Icons are pre-resolved on the JS side (see
 * icons.ts) so native only deals with flat strings.
 */
export type ChipGroupChip = Readonly<{
  label: string;
  value: string;
  disabled: string; // 'enabled' | 'disabled'
  iconType: string; // '' | 'sfSymbol' | 'drawable' | 'image'
  iconName: string; // SF Symbol (iOS) or drawable resource name (Android)
  iconRequest: string;
  iconUri: string; // Resolved image URI when iconType === 'image'
  iconScale: Double; // Resolved image scale when iconType === 'image'
  iconTinted: string; // 'true' | 'false' — draw the image as a tinted template
  closeIcon: string; // 'true' | 'false'
  testID: string; // Test identifier of the chip; empty = none
  closeTestID: string; // Test identifier of the close icon; empty = none
  accessibilityLabel: string; // Screen-reader label, empty = use label
  closeAccessibilityLabel: string; // Close icon's label, empty = platform default
}>;

/** Event emitted when a chip, or its close icon, is pressed. */
export type ChipGroupPressEvent = Readonly<{
  index: Int32;
  value: string;
}>;

/** Event emitted when the selection changes (single / multiple selection). */
export type ChipGroupSelectionEvent = Readonly<{
  /** Values of the selected chips, in chip order. */
  // Codegen only understands the `T[]` array form in event payloads.
  values: string[];
}>;

export interface ChipGroupNativeProps extends ViewProps {
  /** Chips to display. */
  chips: ReadonlyArray<ChipGroupChip>;

  /** 'assist' | 'filter' | 'input' | 'suggestion' */
  variant?: string;

  /** 'none' | 'single' | 'multiple' */
  selection?: string;

  /** Values of the selected chips (single / multiple selection). */
  selectedValues?: ReadonlyArray<string>;

  /** 'true' | 'false': whether at least one chip must stay selected */
  selectionRequired?: string;

  /**
   * Bumped by JS after every selection change, so native applies
   * `selectedValues` again: a change the parent didn't accept goes back.
   */
  selectionEventCount?: Int32;

  /** 'true' (rows wrap) | 'false' (one row that scrolls horizontally) */
  wrap?: string;

  /** Gap between chips in points; negative means the platform default. */
  spacing?: Double;

  /** 'enabled' | 'disabled' */
  interactivity?: string;

  /** Cap on the labels' font scaling; 0 (or below 1) = no cap. */
  maxFontSizeMultiplier?: Double;

  /** Smallest height of every chip in points (dp); negative = the platform's. */
  chipMinHeight?: Double;

  /**
   * Space between each chip's edges and its content in points (dp);
   * negative = the platform's.
   */
  chipPaddingHorizontal?: Double;

  /**
   * Haptic played when a chip or a close icon is pressed: '' (none added) |
   * 'none' | 'selection' | 'light' | 'medium' | 'heavy' | 'success' |
   * 'warning' | 'error'
   */
  haptics?: string;

  /** Fired when a chip is pressed. */
  onChipPress?: BubblingEventHandler<ChipGroupPressEvent>;

  /** Fired when a chip's close icon is pressed. */
  onChipClose?: BubblingEventHandler<ChipGroupPressEvent>;

  /**
   * Fired when the selection changes. Not `onSelectionChange`: React Native's
   * TextInput registers `topSelectionChange` as a direct event, and an event
   * name can't be both direct and bubbling.
   */
  onGroupSelectionChange?: BubblingEventHandler<ChipGroupSelectionEvent>;
}

export default codegenNativeComponent<ChipGroupNativeProps>(
  'PCChipGroup'
) as HostComponent<ChipGroupNativeProps>;
