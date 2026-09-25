// ContextMenuNativeComponent.ts
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';
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
export type ContextMenuTrigger = 'longPress' | 'tap';

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
  /**
   * Programmatic visibility control (Android only).
   * 'open' to show the menu, 'closed' to hide it.
   */
  visible?: string; // 'open' | 'closed'
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
   */
  trigger?: string; // ContextMenuTrigger

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

export default codegenNativeComponent<ContextMenuProps>(
  'PCContextMenu'
) as HostComponent<ContextMenuProps>;
