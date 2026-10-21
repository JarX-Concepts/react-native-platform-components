// ActionSheet.tsx
import React, { useCallback, useMemo } from 'react';
import { Platform, type ViewProps } from 'react-native';

import NativeActionSheet, {
  type ActionSheetItem,
  type ActionSheetSelectEvent,
} from './ActionSheetNativeComponent';
import type { Haptics } from './haptics';
import { resolveIcon, type PlatformIcon } from './icons';
import { useActionStructureWarning } from './presentedActions';
import { warnSelectionIdentifiers } from './selectionIdentifiers';

/**
 * Attributes for an action sheet action, as on a ContextMenu action.
 */
export interface ActionSheetActionAttributes {
  /** Draws the action in the destructive style (red) */
  destructive?: boolean;
  /** Shows the action dimmed; it can't be picked. Applies while presented. */
  disabled?: boolean;
  /** Leaves the action out */
  hidden?: boolean;
}

/**
 * A single action in the sheet. The fields mean what they mean on a
 * ContextMenu action; a sheet has no submenus, sections or states.
 */
export interface ActionSheetAction {
  /** Unique, non-empty identifier passed to `onSelect` */
  id: string;
  /** Display title */
  title: string;
  /**
   * Icon before the title. Android only: `UIAlertAction` has no public icon
   * API, so iOS shows titles only. See {@link PlatformIcon}.
   */
  image?: PlatformIcon;
  /** Tint color for the icon (hex string, e.g. `'#FF3B30'`). Android only. */
  imageColor?: string;
  /** Action attributes */
  attributes?: ActionSheetActionAttributes;
  /**
   * Haptic played when this action is picked, in place of the component's
   * `haptics` (`'none'` plays nothing). Unset uses the component's.
   * Applies while presented. See {@link Haptics}.
   */
  haptics?: Haptics;
  /**
   * Test identifier of the action's row: the `UIAlertAction`'s
   * `accessibilityIdentifier` on iOS, the row's view tag on Android, so
   * Detox's `by.id` finds it. Applies while presented.
   */
  testID?: string;
}

export interface ActionSheetProps extends ViewProps {
  /**
   * Whether the sheet is presented. Controlled: set it back to `false` in
   * `onSelect` and `onCancel`. Setting it to `false` while the sheet is up
   * dismisses it without a callback.
   */
  visible: boolean;

  /** Title above the actions. Applies while presented. */
  title?: string;

  /** Message under the title. Applies while presented. */
  message?: string;

  /**
   * The actions, top to bottom. While the sheet is up, each action's
   * `disabled`, `testID` and `haptics` apply; any other change (an action
   * added, removed, reordered or retitled, or a changed `destructive`,
   * `hidden`, `image` or `imageColor`) applies the next time it is
   * presented, with a warning in development.
   */
  actions: readonly ActionSheetAction[];

  /**
   * Title of the cancel action. iOS only: default the system's localized
   * "Cancel". Android bottom sheets have no cancel row. A change applies the
   * next time the sheet is presented.
   */
  cancelTitle?: string;

  /** Test identifier of the iOS cancel action. Applies while presented. */
  cancelTestID?: string;

  /**
   * Haptic played when the user picks an action (not on cancel); an
   * action's own `haptics` wins. Default: none. See {@link Haptics}.
   */
  haptics?: Haptics;

  /**
   * Android: largest scale the sheet's text may reach with the system font
   * scale, as on `Text`. Unset or `0`: no cap. iOS: `UIAlertController`
   * sizes its own text with Dynamic Type.
   */
  maxFontSizeMultiplier?: number;

  /**
   * Called with the action's `id` when the user picks one. The sheet is
   * already closing; set `visible` to `false`.
   */
  onSelect?: (id: string) => void;

  /**
   * Called when the sheet is dismissed without a pick: the cancel action,
   * a tap outside, a swipe down or the back button. Set `visible` to
   * `false`.
   */
  onCancel?: () => void;

  /**
   * Optional content, rendered in place. On iPad (and wherever UIKit shows
   * the sheet as a popover) the sheet points at this view.
   */
  children?: React.ReactNode;

  /** Test identifier */
  testID?: string;
}

const flag = (value: boolean | undefined) => (value ? 'true' : 'false');

/** Flattens actions for native: hidden ones dropped, icons resolved, every field set. */
function normalizeActions(
  actions: readonly ActionSheetAction[]
): ActionSheetItem[] {
  const shown = actions.filter((action) => !action.attributes?.hidden);
  warnSelectionIdentifiers(
    'ActionSheet',
    shown.map((action) => action.id)
  );
  return shown.map((action) => ({
    id: action.id,
    title: action.title,
    ...resolveIcon(action.image),
    imageColor: action.imageColor ?? '',
    destructive: flag(action.attributes?.destructive),
    disabled: flag(action.attributes?.disabled),
    haptics: action.haptics ?? '',
    testID: action.testID ?? '',
  }));
}

export function ActionSheet(props: ActionSheetProps): React.ReactElement {
  const {
    visible,
    title,
    message,
    actions,
    cancelTitle,
    cancelTestID,
    haptics,
    maxFontSizeMultiplier,
    onSelect,
    onCancel,
    children,
    ...viewProps
  } = props;

  const nativeActions = useMemo(() => normalizeActions(actions), [actions]);

  // What the sheet on screen can't change: it keeps the actions it was
  // presented with until the next presentation. iOS: the cancel action's
  // title too (Android has no cancel row).
  const structure = useMemo(
    () =>
      __DEV__
        ? JSON.stringify([
            nativeActions.map((a) => [
              a.id,
              a.title,
              a.destructive,
              a.iconType,
              a.iconName,
              a.iconRequest,
              a.iconUri,
              a.iconScale,
              a.iconTinted,
              a.imageColor,
            ]),
            Platform.OS === 'ios' ? (cancelTitle ?? '') : '',
          ])
        : '',
    [nativeActions, cancelTitle]
  );
  const endPresentation = useActionStructureWarning(
    'ActionSheet',
    visible,
    structure
  );

  const handleSelect = useCallback(
    (e: { nativeEvent: ActionSheetSelectEvent }) => {
      const { actionId } = e.nativeEvent;
      endPresentation();
      // A row of the sheet on screen, which keeps its actions when they
      // change shape: an id that is gone (or hidden) since is still the
      // user's pick. Native refuses disabled rows; a current action that is
      // disabled isn't a pick.
      const action = actions.find((a) => a.id === actionId);
      if (action?.attributes?.disabled) return;
      onSelect?.(actionId);
    },
    [actions, endPresentation, onSelect]
  );

  const handleCancel = useCallback(() => {
    endPresentation();
    onCancel?.();
  }, [endPresentation, onCancel]);

  return (
    <NativeActionSheet
      visible={visible ? 'open' : 'closed'}
      title={title ?? ''}
      message={message ?? ''}
      actions={nativeActions}
      cancelTitle={cancelTitle ?? ''}
      cancelTestID={cancelTestID ?? ''}
      haptics={haptics ?? ''}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? 0}
      onSelect={onSelect ? handleSelect : undefined}
      onCancel={onCancel ? handleCancel : undefined}
      {...viewProps}
    >
      {children}
    </NativeActionSheet>
  );
}
