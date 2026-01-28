// ContextMenuNativeComponent.ts
import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

/**
 * Attributes for a context menu action.
 */
export type ContextMenuActionAttributes = Readonly<{
  /** Whether the action is destructive (red styling) */
  destructive?: string; // 'true' | 'false'
  /** Whether the action is disabled (grayed out) */
  disabled?: string; // 'true' | 'false'
  /** Whether the action is hidden */
  hidden?: string; // 'true' | 'false'
}>;

/**
 * A leaf subaction (no further nesting to avoid codegen recursion issues).
 */
export type ContextMenuSubaction = Readonly<{
  /** Unique identifier returned in callbacks */
  id: string;
  /** Display title */
  title: string;
  /** Secondary text (iOS only) */
  subtitle?: string;
  /** Icon name (SF Symbol on iOS, drawable resource on Android) */
  image?: string;
  /** Tint color for the icon (hex string, e.g., "#FF0000") */
  imageColor?: string;
  /** Action attributes */
  attributes?: ContextMenuActionAttributes;
  /** Checkmark state: 'off' | 'on' | 'mixed' */
  state?: string;
}>;

/**
 * A single action in the context menu.
 * Actions can be nested one level via `subactions` for submenus.
 */
export type ContextMenuAction = Readonly<{
  /** Unique identifier returned in callbacks */
  id: string;
  /** Display title */
  title: string;
  /** Secondary text (iOS only) */
  subtitle?: string;
  /** Icon name (SF Symbol on iOS, drawable resource on Android) */
  image?: string;
  /** Tint color for the icon (hex string, e.g., "#FF0000") */
  imageColor?: string;
  /** Action attributes */
  attributes?: ContextMenuActionAttributes;
  /** Checkmark state: 'off' | 'on' | 'mixed' */
  state?: string;
  /** Nested actions for submenu (one level deep) */
  subactions?: ReadonlyArray<ContextMenuSubaction>;
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
   * Menu actions.
   */
  actions: ReadonlyArray<ContextMenuAction>;

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
  onPressAction?: CodegenTypes.BubblingEventHandler<ContextMenuPressActionEvent>;

  /**
   * Fired when menu opens.
   */
  onMenuOpen?: CodegenTypes.BubblingEventHandler<Readonly<{}>>;

  /**
   * Fired when menu closes.
   */
  onMenuClose?: CodegenTypes.BubblingEventHandler<Readonly<{}>>;

  ios?: IOSProps;
  android?: AndroidProps;
}

export default codegenNativeComponent<ContextMenuProps>(
  'PCContextMenu'
) as HostComponent<ContextMenuProps>;
