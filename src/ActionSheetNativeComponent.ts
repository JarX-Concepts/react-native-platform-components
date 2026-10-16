// ActionSheetNativeComponent.ts
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { BubblingEventHandler, Double } from './codegenTypes';

/**
 * One action of the sheet. The list is flat (no submenus or sections) and
 * hidden actions are already dropped. Every field is set; empty strings mean
 * "none" and flags are 'true' | 'false'.
 */
export type ActionSheetItem = Readonly<{
  /** Unique identifier returned by onSelect */
  id: string;
  title: string;
  /** '' | 'sfSymbol' | 'drawable' | 'image' (Android draws icons; iOS has no public icon API) */
  iconType: string;
  /** SF Symbol / asset name (iOS) or drawable resource name (Android) */
  iconName: string;
  /** Resolved image URI when iconType === 'image' */
  iconRequest: string;
  iconUri: string;
  /** Resolved image scale when iconType === 'image' */
  iconScale: Double;
  /** 'true' | 'false': draw the image as a tinted template */
  iconTinted: string;
  /** Tint color for the icon (hex string, e.g., "#FF0000") */
  imageColor: string;
  /** 'true' | 'false' */
  destructive: string;
  /** 'true' | 'false' */
  disabled: string;
  /** The action's own haptics; '' = the component's */
  haptics: string;
  /** accessibilityIdentifier (iOS) / view tag (Android) of the row */
  testID: string;
}>;

/**
 * Event emitted when the user picks an action.
 */
export type ActionSheetSelectEvent = Readonly<{
  /** The action's unique identifier */
  actionId: string;
}>;

/** Visibility state (no booleans for codegen). */
export type ActionSheetVisible = 'open' | 'closed';

export interface ActionSheetProps extends ViewProps {
  /**
   * 'open' presents the sheet, 'closed' dismisses it.
   */
  visible?: string; // ActionSheetVisible

  /** Sheet title; '' = none */
  title?: string;

  /** Sheet message under the title; '' = none */
  message?: string;

  /**
   * The actions, flat.
   */
  actions: ReadonlyArray<ActionSheetItem>;

  /** Title of the iOS cancel action; '' = the localized system "Cancel" */
  cancelTitle?: string;

  /** accessibilityIdentifier of the iOS cancel action */
  cancelTestID?: string;

  /**
   * Haptic played when an action is picked: '' (none added) | 'none' | 'selection' |
   * 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
   */
  haptics?: string;

  /** Android: largest font scale the sheet's text may reach; 0 = no cap. */
  maxFontSizeMultiplier?: Double;

  /**
   * Fired when the user picks an action.
   */
  onSelect?: BubblingEventHandler<ActionSheetSelectEvent>;

  /**
   * Fired when the sheet is dismissed without a pick.
   */
  onCancel?: BubblingEventHandler<Readonly<{}>>;
}

export default codegenNativeComponent<ActionSheetProps>(
  'PCActionSheet'
) as HostComponent<ActionSheetProps>;
