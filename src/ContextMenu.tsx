// ContextMenu.tsx
import React, { useCallback, useMemo } from 'react';
import { type ViewProps } from 'react-native';

import NativeContextMenu, {
  type ContextMenuPressActionEvent,
} from './ContextMenuNativeComponent';
import { flattenMenuActions, type ContextMenuAction } from './menuItems';

export type {
  ContextMenuAction,
  ContextMenuActionAttributes,
} from './menuItems';

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

  /**
   * iOS only: called when the user taps the menu's preview (with
   * `ios.enablePreview`), after the menu has dismissed. Use it to open the
   * item, like tapping a preview in Photos or Mail. Maps to
   * `contextMenuInteraction(_:willPerformPreviewActionForMenuWith:animator:)`.
   */
  onPreviewPress?: () => void;

  /** The content to wrap */
  children: React.ReactNode;

  /** iOS-specific props */
  ios?: {
    /** Enable preview when long-pressing */
    enablePreview?: boolean;
  };

  /** Android-specific props */
  android?: {
    /**
     * Aligns the popup with the start ('left', default) or end ('right') edge
     * of the wrapped content. Mirrored in RTL layouts.
     */
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
    onPreviewPress,
    children,
    ios,
    android,
    ...viewProps
  } = props;

  const nativeActions = useMemo(() => flattenMenuActions(actions), [actions]);

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

  const handlePreviewPress = useCallback(() => {
    onPreviewPress?.();
  }, [onPreviewPress]);

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
      onPreviewPress={onPreviewPress ? handlePreviewPress : undefined}
      ios={nativeIOS}
      android={nativeAndroid}
      {...viewProps}
    >
      {children}
    </NativeContextMenu>
  );
}
