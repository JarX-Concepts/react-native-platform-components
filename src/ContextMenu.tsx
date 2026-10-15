// ContextMenu.tsx
import React, { useCallback, useMemo } from 'react';
import { type ViewProps } from 'react-native';

import NativeContextMenu, {
  type ContextMenuPressActionEvent,
} from './ContextMenuNativeComponent';
import { flattenMenuActions, type ContextMenuAction } from './menuItems';
import type { Haptics } from './haptics';

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
   * - 'none': Only `visible` opens the menu. The wrapped content keeps all
   *   its touches, so it can hold its own buttons and open the menu from one
   *   of them.
   */
  trigger?: 'longPress' | 'tap' | 'none';

  /**
   * Opens the menu from JS, anchored to the wrapped content. Controlled:
   * set it to true to open the menu, and back to false in `onMenuClose`,
   * which fires however the menu closes (an action, a tap outside, or
   * `visible` turning false). False dismisses an open menu. Leave it unset
   * to leave the menu to the user; menus the user opens still call
   * `onMenuOpen` and `onMenuClose`.
   *
   * iOS 17.4+ (`UIControl.performPrimaryAction()` on an invisible anchor
   * button); earlier iOS has no public API to open a menu without a touch,
   * so `visible` does nothing there.
   */
  visible?: boolean;

  /**
   * Haptic played when the user presses an action. Opening the menu keeps
   * the platform's own long-press haptic; `'none'` also turns that off on
   * Android (iOS offers no switch for it). See {@link Haptics}.
   */
  haptics?: Haptics;

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
     * @deprecated Use the top-level `visible`, which also works on iOS.
     * When both are set, the top-level one wins.
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
    visible,
    haptics,
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
    return { anchorPosition: android.anchorPosition };
  }, [android]);

  // The deprecated android.visible still works, under the top-level prop
  const open = visible ?? android?.visible;

  return (
    <NativeContextMenu
      style={style}
      title={title}
      actions={nativeActions}
      interactivity={disabled ? 'disabled' : 'enabled'}
      trigger={trigger}
      visible={open === undefined ? undefined : open ? 'open' : 'closed'}
      haptics={haptics ?? ''}
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
