// ContextMenu.tsx
import React, { useCallback, useMemo, useRef } from 'react';
import { type GestureResponderEvent, type ViewProps } from 'react-native';

import NativeContextMenu, {
  Commands,
  type ContextMenuPressActionEvent,
} from './ContextMenuNativeComponent';
import { flattenMenuActions, type ContextMenuAction } from './menuItems';
import type { Haptics } from './haptics';

/** How far (in points) a tap may move before it no longer opens the menu. */
const TAP_SLOP = 10;

export type {
  ContextMenuAction,
  ContextMenuActionAttributes,
  MenuElementSize,
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
   * - 'longPress' (default): Long-press opens the menu, also on a button
   *   inside the content; taps still reach the content's buttons
   * - 'tap': Single tap opens the menu. A tap on a pressable inside the
   *   content goes to that pressable instead
   * - 'none': Only `visible` opens the menu. The wrapped content keeps all
   *   its touches, so it can open the menu from one of its own buttons.
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

  const nativeRef = useRef<React.ComponentRef<typeof NativeContextMenu>>(null);
  // Where the current tap went down; null once it moved too far
  const tapStart = useRef<{ x: number; y: number } | null>(null);

  // trigger 'tap': React Native gives a touch to the deepest view that asks
  // for it, so the content's own pressables keep their taps. A tap none of
  // them took bubbles up to this view, and opens the menu.
  const tapHandlers = useMemo(() => {
    if (trigger !== 'tap' || disabled) return undefined;
    return {
      onStartShouldSetResponder: () => true,
      onResponderGrant: (e: GestureResponderEvent) => {
        tapStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
      },
      onResponderMove: (e: GestureResponderEvent) => {
        const start = tapStart.current;
        if (!start) return;
        const { pageX, pageY } = e.nativeEvent;
        if (Math.hypot(pageX - start.x, pageY - start.y) > TAP_SLOP) {
          tapStart.current = null;
        }
      },
      onResponderRelease: () => {
        const node = nativeRef.current;
        if (tapStart.current && node != null) Commands.handleTap(node);
        tapStart.current = null;
      },
      // A scroll view took the touch over
      onResponderTerminate: () => {
        tapStart.current = null;
      },
    };
  }, [trigger, disabled]);

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
      ref={nativeRef}
      {...tapHandlers}
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
