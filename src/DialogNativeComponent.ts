// DialogNativeComponent.ts
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
import type { BubblingEventHandler, Double } from './codegenTypes';

/**
 * One button of the dialog. Hidden actions are already dropped, at most one
 * has the cancel role and at most one is preferred. Every field is set;
 * empty strings mean "none" and flags are 'true' | 'false'.
 */
export type DialogItem = Readonly<{
  /** Unique identifier returned by onSelect */
  id: string;
  title: string;
  /** 'default' | 'cancel' | 'destructive' */
  role: string;
  /** 'true' | 'false': the dialog's preferred (default) action */
  preferred: string;
  /** 'true' | 'false' */
  disabled: string;
  /** The action's own haptics; '' = the component's (none for the cancel action) */
  haptics: string;
  /** accessibilityIdentifier (iOS) / view tag (Android) of the button */
  testID: string;
}>;

/**
 * Event emitted when the user picks a default or destructive action.
 */
export type DialogSelectEvent = Readonly<{
  /** The action's unique identifier */
  actionId: string;
}>;

/**
 * Event emitted when the dialog couldn't be shown.
 */
export type DialogPresentFailedEvent = Readonly<{
  /** 'noWindow' | 'busy' | 'rejected' */
  reason: string;
}>;

/** Visibility state (no booleans for codegen). */
export type DialogVisible = 'open' | 'closed';

export interface DialogProps extends ViewProps {
  /**
   * 'open' presents the dialog, 'closed' dismisses it.
   */
  visible?: string; // DialogVisible

  /** Dialog title; '' = none */
  title?: string;

  /** Dialog message under the title; '' = none */
  message?: string;

  /** The buttons, in order. */
  actions: ReadonlyArray<DialogItem>;

  /**
   * 'true' | 'false': Android, whether a tap outside and the back button
   * cancel the dialog. An iOS alert never dismisses on a tap outside.
   */
  dismissable?: string;

  /**
   * Haptic played when an action is picked: '' (none added) | 'none' | 'selection' |
   * 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
   */
  haptics?: string;

  /** Android: largest font scale the dialog's text may reach; 0 = no cap. */
  maxFontSizeMultiplier?: Double;

  /** Fired when the user picks a default or destructive action. */
  onSelect?: BubblingEventHandler<DialogSelectEvent>;

  /**
   * Fired when the dialog is cancelled: its cancel action, or (Android) a tap
   * outside or the back button.
   */
  onCancel?: BubblingEventHandler<Readonly<{}>>;

  /** Fired once the dialog is on screen. */
  onShow?: BubblingEventHandler<Readonly<{}>>;

  /** Fired once the dialog has gone, whatever closed it. */
  onDismiss?: BubblingEventHandler<Readonly<{}>>;

  /** Fired when the dialog couldn't be shown. */
  onPresentFailed?: BubblingEventHandler<DialogPresentFailedEvent>;
}

export default codegenNativeComponent<DialogProps>(
  'PCDialog'
) as HostComponent<DialogProps>;
