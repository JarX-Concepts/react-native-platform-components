// ContextMenuNativeComponent.ts
import type * as React from 'react';
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeCommands, codegenNativeComponent } from 'react-native';
import type { BubblingEventHandler, Double, Int32 } from './codegenTypes';

/**
 * One menu item. The JS action tree is flattened (see `menuItems.ts`): each
 * item points at its parent submenu or section by index, so menus nest to any
 * depth without a recursive codegen type. Every field is set; empty strings
 * mean "none" and flags are 'true' | 'false'.
 */
export type ContextMenuItem = Readonly<{
  /** Unique identifier returned in callbacks */
  id: string;
  /** Display title (a section's header on iOS) */
  title: string;
  /** Secondary text (iOS only) */
  subtitle: string;
  /** Index of the parent submenu or section; -1 at the top level */
  parent: Int32;
  /** 'action' | 'menu' | 'section' */
  kind: string;
  /** '' | 'sfSymbol' | 'drawable' | 'image' */
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
  /** 'true' | 'false' (iOS 16+) */
  keepsMenuPresented: string;
  /** '' | 'off' | 'on' | 'mixed' */
  state: string;
  /** The action's own haptics; '' = the component's */
  haptics: string;
  /** Test identifier of the menu row; '' = none */
  testID: string;
}>;

/**
 * Event emitted when an action is pressed.
 */
export type ContextMenuPressActionEvent = Readonly<{
  /** The action's unique identifier */
  actionId: string;
  /** The action's title */
  actionTitle: string;
}>;

/** Interactivity state (no booleans for codegen). */
export type ContextMenuInteractivity = 'enabled' | 'disabled';

/** Trigger mode for opening the menu. */
export type ContextMenuTrigger = 'longPress' | 'tap' | 'none';

/**
 * iOS-specific configuration.
 */
export type IOSProps = Readonly<{
  /** Enable preview when long-pressing */
  enablePreview?: string; // 'true' | 'false'
}>;

/**
 * Android-specific configuration.
 */
export type AndroidProps = Readonly<{
  /** Anchor position for the popup menu */
  anchorPosition?: string; // 'left' | 'right'
}>;

export interface ContextMenuProps extends ViewProps {
  /**
   * Menu title (shown as header on iOS).
   */
  title?: string;

  /**
   * Menu items, flattened (see ContextMenuItem).
   */
  actions: ReadonlyArray<ContextMenuItem>;

  /**
   * Enabled / disabled state.
   */
  interactivity?: string; // ContextMenuInteractivity

  /**
   * How the menu is triggered:
   * - 'longPress' (default): Long-press opens the menu
   * - 'tap': Single tap opens the menu
   * - 'none': only `visible` opens it; the content keeps its touches
   */
  trigger?: string; // ContextMenuTrigger

  /**
   * Programmatic visibility: 'open' presents the menu anchored to the view,
   * 'closed' dismisses it. '' (unset) leaves the menu to the user.
   */
  visible?: string; // '' | 'open' | 'closed'

  /**
   * Haptic played when an action is pressed: '' (none added) | 'none' | 'selection' |
   * 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
   */
  haptics?: string;

  /**
   * Fired when user presses an action.
   */
  onPressAction?: BubblingEventHandler<ContextMenuPressActionEvent>;

  /**
   * Fired when menu opens.
   */
  onMenuOpen?: BubblingEventHandler<Readonly<{}>>;

  /**
   * Fired when menu closes.
   */
  onMenuClose?: BubblingEventHandler<Readonly<{}>>;

  /**
   * iOS: fired when the user taps the preview (with enablePreview).
   */
  onPreviewPress?: BubblingEventHandler<Readonly<{}>>;

  ios?: IOSProps;
  android?: AndroidProps;
}

type NativeContextMenuComponent = HostComponent<ContextMenuProps>;

// `React.ElementRef` rather than `React.ComponentRef`: the codegen shipped with
// React Native 0.81 (and the 0.76 Android floor) only accepts the former.
interface NativeCommands {
  /**
   * trigger 'tap': the user tapped the content and no inner pressable took
   * the tap. Opens the menu (iOS 17.4+; earlier iOS opens it natively).
   */
  handleTap: (viewRef: React.ElementRef<NativeContextMenuComponent>) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['handleTap'],
});

export default codegenNativeComponent<ContextMenuProps>(
  'PCContextMenu'
) as NativeContextMenuComponent;
