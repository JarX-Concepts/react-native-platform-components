// SelectionMenu.tsx
import React, { useCallback, useMemo } from 'react';
import { Platform, type ViewProps } from 'react-native';

import NativeSelectionMenu, {
  type SelectionMenuNativeOption,
  type SelectionMenuSelectEvent,
} from './SelectionMenuNativeComponent';
import { resolveIcon, type PlatformIcon } from './icons';

import type { Haptics } from './haptics';
import type { AndroidMaterialMode, Presentation } from './sharedTypes';

/**
 * A single option: a label and its data payload, with an optional icon and
 * second line.
 */
export interface SelectionMenuOption {
  /** Display text */
  label: string;
  /** Payload returned by `onSelect`; also what `selected` matches */
  data: string;
  /**
   * Secondary text under the label.
   * - iOS: `UIAction.subtitle` in the system menu.
   * - Android: a second line in the rows of the embedded `m3` dropdown.
   *   The modal `PopupMenu` and the `system` Spinner have one line per item,
   *   so it's not shown there.
   */
  subtitle?: string;
  /**
   * Icon next to the label. See {@link PlatformIcon}.
   * - iOS: `UIAction.image`.
   * - Android: the modal `PopupMenu` item icon and a leading icon in the
   *   rows of the embedded `m3` dropdown. The `system` Spinner shows labels
   *   only.
   */
  icon?: PlatformIcon;
}

export interface SelectionMenuProps extends ViewProps {
  /** Options are label + data (payload) */
  options: readonly SelectionMenuOption[];

  /**
   * Controlled selection by the option's `data`.
   * Use `null` for "no selection".
   */
  selected: string | null;

  disabled?: boolean;
  placeholder?: string;

  /**
   * Presentation mode:
   * - 'modal' (default): Headless mode, controlled by `visible` prop.
   * - 'embedded': Native renders its own inline anchor and manages open/close internally.
   */
  presentation?: Presentation;

  /**
   * Modal mode only (presentation === 'modal'):
   * controls whether the native menu UI is presented.
   */
  visible?: boolean;

  /**
   * Haptic played when the user picks an option. Default: none beyond the
   * system menu's own feedback. See {@link Haptics}.
   */
  haptics?: Haptics;

  /**
   * Called when the user selects an option.
   * Receives the selected `data` payload, plus label/index for convenience.
   */
  onSelect?: (data: string, label: string, index: number) => void;

  /**
   * Called when the user dismisses without selecting.
   */
  onRequestClose?: () => void;

  /**
   * Pass-through platform props.
   */
  ios?: {};

  android?: {
    /** Material preference ('system' | 'm3'). */
    material?: AndroidMaterialMode;
    /**
     * Embedded `m3` dropdown only: the field accepts typing and filters the
     * options by label (case-insensitive prefix of the label or of any word
     * in it). Picking an option still goes through `onSelect`, and `selected`
     * stays the source of truth: when the field loses focus, its text goes
     * back to the selected option's label (or empty, showing the
     * placeholder). Default `false`.
     */
    searchable?: boolean;
  };

  /** Test identifier */
  testID?: string;
}

/** Flattens options for native: icons resolved, every field set. */
function normalizeSelectionMenuOptions(
  options: readonly SelectionMenuOption[]
): SelectionMenuNativeOption[] {
  return options.map((option) => ({
    label: option.label,
    data: option.data,
    subtitle: option.subtitle ?? '',
    ...resolveIcon(option.icon),
  }));
}

function normalizeSelectedData(selected: string | null): string {
  return selected ?? '';
}

function normalizeNativeVisible(
  presentation: Presentation | undefined,
  visible: boolean | undefined
): 'open' | 'closed' | undefined {
  // Embedded mode ignores visible; keep it undefined so native isn't spammed.
  if (presentation === 'embedded') return undefined;
  return visible ? 'open' : 'closed';
}

export function SelectionMenu(props: SelectionMenuProps): React.ReactElement {
  const {
    style,
    options,
    selected,
    disabled,
    placeholder,
    presentation = 'modal',
    visible,
    haptics,
    onSelect,
    onRequestClose,
    ios,
    android,
    ...viewProps
  } = props;

  const selectedData = useMemo(
    () => normalizeSelectedData(selected),
    [selected]
  );

  const nativeOptions = useMemo(
    () => normalizeSelectionMenuOptions(options),
    [options]
  );

  const nativeVisible = useMemo(
    () => normalizeNativeVisible(presentation, visible),
    [presentation, visible]
  );

  const handleSelect = useCallback(
    (e: { nativeEvent: SelectionMenuSelectEvent }) => {
      const { index, label, data } = e.nativeEvent;
      onSelect?.(data, label, index);
    },
    [onSelect]
  );

  const handleRequestClose = useCallback(() => {
    onRequestClose?.();
  }, [onRequestClose]);

  // Keep android prop stable and codegen-friendly (string unions live in native spec).
  const nativeAndroid = useMemo(() => {
    if (!android) return undefined;
    return {
      material: android.material,
      searchable: android.searchable ? 'true' : 'false',
    };
  }, [android]);

  // On Android, force a fresh native view when structural props change so the
  // widget gets a clean measurement cycle (TextInputLayout caches aggressively).
  const remountKey =
    Platform.OS === 'android'
      ? `${presentation}-${android?.material ?? 'system'}`
      : undefined;

  return (
    <NativeSelectionMenu
      key={remountKey}
      style={style}
      options={nativeOptions}
      selectedData={selectedData}
      interactivity={disabled ? 'disabled' : 'enabled'}
      placeholder={placeholder}
      anchorMode={presentation === 'embedded' ? 'inline' : 'headless'}
      visible={nativeVisible}
      haptics={haptics ?? ''}
      onSelect={onSelect ? handleSelect : undefined}
      onRequestClose={onRequestClose ? handleRequestClose : undefined}
      ios={ios}
      android={nativeAndroid}
      {...viewProps}
    />
  );
}
