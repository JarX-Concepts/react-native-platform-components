// ContextMenu.tsx
import React, { useCallback, useMemo } from 'react';
import { type ViewProps } from 'react-native';

import NativeContextMenu, {
  type ContextMenuAction as NativeAction,
  type ContextMenuSubaction as NativeSubaction,
  type ContextMenuPressActionEvent,
} from './ContextMenuNativeComponent';

/**
 * Attributes for a context menu action.
 */
export interface ContextMenuActionAttributes {
  /** Whether the action is destructive (red styling) */
  destructive?: boolean;
  /** Whether the action is disabled (grayed out) */
  disabled?: boolean;
  /** Whether the action is hidden */
  hidden?: boolean;
}

/**
 * A single action in the context menu.
 */
export interface ContextMenuAction {
  /** Unique identifier returned in callbacks */
  id: string;
  /** Display title */
  title: string;
  /** Secondary text (iOS only) */
  subtitle?: string;
  /** Icon name (SF Symbol on iOS, drawable resource on Android) */
  image?: string;
  /** Tint color for the icon (hex string or named color) */
  imageColor?: string;
  /** Action attributes */
  attributes?: ContextMenuActionAttributes;
  /** Checkmark state */
  state?: 'off' | 'on' | 'mixed';
  /** Nested actions for submenu */
  subactions?: readonly ContextMenuAction[];
}

export interface ContextMenuProps extends ViewProps {
  /** Menu title (shown as header on iOS) */
  title?: string;

  /** Menu actions */
  actions: readonly ContextMenuAction[];

  /** Disabled state */
  disabled?: boolean;

  /**
   * How the menu is triggered:
   * - 'longPress' (default): Long-press opens the menu
   * - 'tap': Single tap opens the menu
   */
  trigger?: 'longPress' | 'tap';

  /**
   * Called when the user presses an action.
   * Receives the action's id and title.
   */
  onPressAction?: (actionId: string, actionTitle: string) => void;

  /** Called when the menu opens */
  onMenuOpen?: () => void;

  /** Called when the menu closes */
  onMenuClose?: () => void;

  /** The content to wrap */
  children: React.ReactNode;

  /** iOS-specific props */
  ios?: {
    /** Enable preview when long-pressing */
    enablePreview?: boolean;
  };

  /** Android-specific props */
  android?: {
    /** Anchor position for the popup menu */
    anchorPosition?: 'left' | 'right';
    /**
     * Programmatic visibility control (Android only).
     * Set to true to open the menu, false to close it.
     * Note: iOS does not support programmatic menu opening.
     */
    visible?: boolean;
  };

  /** Test identifier */
  testID?: string;
}

/**
 * Convert user-friendly subaction to native format (no further nesting).
 */
function normalizeSubaction(action: ContextMenuAction): NativeSubaction {
  return {
    id: action.id,
    title: action.title,
    subtitle: action.subtitle,
    image: action.image,
    imageColor: action.imageColor,
    attributes: action.attributes
      ? {
          destructive: action.attributes.destructive ? 'true' : 'false',
          disabled: action.attributes.disabled ? 'true' : 'false',
          hidden: action.attributes.hidden ? 'true' : 'false',
        }
      : undefined,
    state: action.state,
  };
}

/**
 * Convert user-friendly action to native format.
 * Note: Only one level of nesting is supported by the native component.
 */
function normalizeAction(action: ContextMenuAction): NativeAction {
  return {
    id: action.id,
    title: action.title,
    subtitle: action.subtitle,
    image: action.image,
    imageColor: action.imageColor,
    attributes: action.attributes
      ? {
          destructive: action.attributes.destructive ? 'true' : 'false',
          disabled: action.attributes.disabled ? 'true' : 'false',
          hidden: action.attributes.hidden ? 'true' : 'false',
        }
      : undefined,
    state: action.state,
    subactions: action.subactions?.map(normalizeSubaction),
  };
}

export function ContextMenu(props: ContextMenuProps): React.ReactElement {
  const {
    style,
    title,
    actions,
    disabled,
    trigger = 'longPress',
    onPressAction,
    onMenuOpen,
    onMenuClose,
    children,
    ios,
    android,
    ...viewProps
  } = props;

  const nativeActions = useMemo(() => actions.map(normalizeAction), [actions]);

  const handlePressAction = useCallback(
    (e: { nativeEvent: ContextMenuPressActionEvent }) => {
      const { actionId, actionTitle } = e.nativeEvent;
      onPressAction?.(actionId, actionTitle);
    },
    [onPressAction]
  );

  const handleMenuOpen = useCallback(() => {
    onMenuOpen?.();
  }, [onMenuOpen]);

  const handleMenuClose = useCallback(() => {
    onMenuClose?.();
  }, [onMenuClose]);

  const nativeIOS = useMemo(() => {
    if (!ios) return undefined;
    return {
      enablePreview: ios.enablePreview ? 'true' : 'false',
    };
  }, [ios]);

  const nativeAndroid = useMemo(() => {
    if (!android) return undefined;
    return {
      anchorPosition: android.anchorPosition,
      visible: android.visible ? 'open' : 'closed',
    };
  }, [android]);

  return (
    <NativeContextMenu
      style={style}
      title={title}
      actions={nativeActions}
      interactivity={disabled ? 'disabled' : 'enabled'}
      trigger={trigger}
      onPressAction={onPressAction ? handlePressAction : undefined}
      onMenuOpen={onMenuOpen ? handleMenuOpen : undefined}
      onMenuClose={onMenuClose ? handleMenuClose : undefined}
      ios={nativeIOS}
      android={nativeAndroid}
      {...viewProps}
    >
      {children}
    </NativeContextMenu>
  );
}
