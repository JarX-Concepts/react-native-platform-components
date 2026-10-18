// Dialog.tsx
import React, { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import NativeDialog, {
  type DialogItem,
  type DialogPresentFailedEvent,
  type DialogSelectEvent,
} from './DialogNativeComponent';
import type { Haptics } from './haptics';
import { warnSelectionIdentifiers } from './selectionIdentifiers';

/**
 * The role of a dialog action:
 * - `'default'`: a plain button.
 * - `'cancel'`: dismisses the dialog and reports `onCancel` (at most one).
 * - `'destructive'`: drawn in red (`.destructive` on iOS, the theme's
 *   `colorError` on Android).
 */
export type DialogActionRole = 'default' | 'cancel' | 'destructive';

/**
 * Why a dialog couldn't be shown:
 * - `'noWindow'`: the component isn't in a window, or there is no view
 *   controller (iOS) or live activity (Android) to show it from.
 * - `'busy'`: something it doesn't go over is already up: on iOS any alert
 *   or action sheet (`UIAlertController`), or a screen being dismissed; on
 *   Android and the web, another `Dialog`.
 * - `'rejected'`: the system refused the presentation (iOS presented
 *   nothing, Android threw `BadTokenException`).
 */
export type DialogPresentFailure = 'noWindow' | 'busy' | 'rejected';

/** A button of the dialog. */
export interface DialogAction {
  /** Unique, non-empty identifier passed to `onSelect` */
  id: string;
  /** Button title */
  title: string;
  /** Default `'default'`. See {@link DialogActionRole}. */
  role?: DialogActionRole;
  /**
   * The dialog's preferred action: bold on iOS (`preferredAction`), and on
   * Android the positive (end) button when the dialog has three actions or
   * fewer. At most one.
   */
  preferred?: boolean;
  /** Shows the button dimmed; it can't be picked */
  disabled?: boolean;
  /** Leaves the action out */
  hidden?: boolean;
  /**
   * Haptic played when this action is picked, in place of the component's
   * `haptics` (`'none'` plays nothing). The cancel action plays only its own.
   * See {@link Haptics}.
   */
  haptics?: Haptics;
  /**
   * Test identifier of the button: the `UIAlertAction`'s
   * `accessibilityIdentifier` on iOS, the button's view tag on Android, so
   * Detox's `by.id` finds it.
   */
  testID?: string;
}

export interface DialogProps {
  /**
   * Whether the dialog is presented. Controlled: set it back to `false` in
   * `onSelect` and `onCancel` (and in `onPresentFailed`). Setting it to
   * `false` while the dialog is up dismisses it without `onSelect` or
   * `onCancel`; `onDismiss` still follows.
   */
  visible: boolean;

  /** Title */
  title?: string;

  /** Message under the title */
  message?: string;

  /** The buttons. See {@link DialogAction}. */
  actions: readonly DialogAction[];

  /**
   * Android and web: whether a tap outside the dialog and the back button
   * (Escape on the web) cancel it. Default `true`. An iOS alert never closes
   * on a tap outside, so this changes nothing there.
   */
  dismissable?: boolean;

  /**
   * Haptic played when the user picks a default or destructive action; an
   * action's own `haptics` wins. Default: none. See {@link Haptics}.
   */
  haptics?: Haptics;

  /**
   * Android: largest scale the dialog's text may reach with the system font
   * scale, as on `Text`. Unset or `0`: no cap. iOS: `UIAlertController`
   * sizes its own text with Dynamic Type.
   */
  maxFontSizeMultiplier?: number;

  /**
   * Called with the action's `id` when the user picks a default or
   * destructive action. The dialog is already closing; set `visible` to
   * `false`.
   */
  onSelect?: (id: string) => void;

  /**
   * Called when the dialog is cancelled: its cancel action, or on Android a
   * tap outside or the back button (unless `dismissable` is `false`). Set
   * `visible` to `false`.
   */
  onCancel?: () => void;

  /** Called once the dialog is on screen. */
  onShow?: () => void;

  /**
   * Called once the dialog has fully gone, whatever closed it (after
   * `onSelect` / `onCancel`, or after `visible` turned `false`). The place to
   * show the next dialog. Not called after the component unmounts.
   */
  onDismiss?: () => void;

  /**
   * Called when `visible` turned `true` but the dialog couldn't be shown.
   * Set `visible` back to `false`; nothing retries it. See
   * {@link DialogPresentFailure}.
   */
  onPresentFailed?: (reason: DialogPresentFailure) => void;

  /** Test identifier of the component's (empty) view */
  testID?: string;
}

const flag = (value: boolean | undefined) => (value ? 'true' : 'false');

const PRESENT_FAILURES: readonly string[] = ['noWindow', 'busy', 'rejected'];

/**
 * Flattens actions for native: hidden ones dropped, every field set, and at
 * most one cancel action (UIKit throws on a second) and one preferred action.
 */
function normalizeActions(actions: readonly DialogAction[]): DialogItem[] {
  const shown = actions.filter((action) => !action.hidden);
  warnSelectionIdentifiers(
    'Dialog',
    shown.map((action) => action.id)
  );
  let cancelSeen = false;
  let preferredSeen = false;
  return shown.map((action) => {
    let role: DialogActionRole = action.role ?? 'default';
    if (role === 'cancel') {
      if (cancelSeen) {
        if (__DEV__) {
          console.warn(
            `react-native-platform-components: Dialog takes one cancel action; ` +
              `"${action.id}" is shown as a default action.`
          );
        }
        role = 'default';
      }
      cancelSeen = true;
    }
    let preferred = !!action.preferred;
    if (preferred) {
      if (preferredSeen) {
        if (__DEV__) {
          console.warn(
            `react-native-platform-components: Dialog takes one preferred action; ` +
              `"${action.id}" is not preferred.`
          );
        }
        preferred = false;
      }
      preferredSeen = true;
    }
    return {
      id: action.id,
      title: action.title,
      role,
      preferred: flag(preferred),
      disabled: flag(action.disabled),
      haptics: action.haptics ?? '',
      testID: action.testID ?? '',
    };
  });
}

/**
 * A native alert dialog: `UIAlertController` (`.alert`) on iOS and
 * `MaterialAlertDialogBuilder` on Android, presented while `visible`.
 */
export function Dialog(props: DialogProps): React.ReactElement {
  const {
    visible,
    title,
    message,
    actions,
    dismissable,
    haptics,
    maxFontSizeMultiplier,
    onSelect,
    onCancel,
    onShow,
    onDismiss,
    onPresentFailed,
    testID,
  } = props;

  const nativeActions = useMemo(() => normalizeActions(actions), [actions]);

  const handleSelect = useCallback(
    (e: { nativeEvent: DialogSelectEvent }) => {
      const { actionId } = e.nativeEvent;
      const action = nativeActions.find((a) => a.id === actionId);
      // Only enabled default and destructive actions that were shown.
      if (!action || action.disabled === 'true' || action.role === 'cancel')
        return;
      onSelect?.(actionId);
    },
    [nativeActions, onSelect]
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleShow = useCallback(() => {
    onShow?.();
  }, [onShow]);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  const handlePresentFailed = useCallback(
    (e: { nativeEvent: DialogPresentFailedEvent }) => {
      const { reason } = e.nativeEvent;
      onPresentFailed?.(
        (PRESENT_FAILURES.includes(reason)
          ? reason
          : 'rejected') as DialogPresentFailure
      );
    },
    [onPresentFailed]
  );

  return (
    <NativeDialog
      // Takes no space and no touches: the dialog is its own window.
      style={styles.host}
      pointerEvents="none"
      visible={visible ? 'open' : 'closed'}
      title={title ?? ''}
      message={message ?? ''}
      actions={nativeActions}
      dismissable={flag(dismissable ?? true)}
      haptics={haptics ?? ''}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? 0}
      onSelect={onSelect ? handleSelect : undefined}
      onCancel={onCancel ? handleCancel : undefined}
      onShow={onShow ? handleShow : undefined}
      onDismiss={onDismiss ? handleDismiss : undefined}
      onPresentFailed={onPresentFailed ? handlePresentFailed : undefined}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', width: 0, height: 0 },
});
