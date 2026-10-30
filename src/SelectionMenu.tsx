// SelectionMenu.tsx
import React, { useCallback, useMemo } from 'react';
import { Platform, type ViewProps } from 'react-native';

import NativeSelectionMenu, {
  type SelectionMenuNativeOption,
  type SelectionMenuSelectEvent,
} from './SelectionMenuNativeComponent';
import { resolveIcon, type PlatformIcon } from './icons';
import { warnSelectionIdentifiers } from './selectionIdentifiers';

import type { Haptics } from './haptics';
import type { AndroidMaterialMode, Presentation } from './sharedTypes';

/**
 * A single option: a label and its data payload, with an optional icon and
 * second line.
 */
export interface SelectionMenuOption {
  /** Display text */
  label: string;
  /** Unique, non-empty payload returned by `onSelect` and matched by `selected`. */
  data: string;
  /** Keeps the option visible but prevents the user from choosing it. */
  disabled?: boolean;
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
   * Embedded only: smallest height of the field in points (dp), as on
   * `TextField`. Default: 44pt for the borderless iOS button, UIKit's 34pt
   * rounded rect with `ios.borderStyle: 'roundedRect'`, the Material field's
   * 56dp (dense: 48dp) and the Spinner's own height on Android. The extra
   * height goes above and below the text, which stays centered.
   */
  minFieldHeight?: number;

  /**
   * Embedded only: space in points (dp) between the field's sides and its
   * text, as on `TextField`. Default: none for the borderless iOS button, 7pt
   * in the rounded rect, Material's 16dp, and the Spinner's own padding at
   * its start (the end keeps room for the arrow).
   */
  fieldPaddingHorizontal?: number;

  /**
   * iOS-specific configuration.
   */
  ios?: {
    /**
     * Embedded only: `'none'` (default), a borderless pop-up button with
     * the tint color, or `'roundedRect'`, a field box drawn like
     * `TextField`'s rounded rect, so a picker row lines up with text fields.
     */
    borderStyle?: 'none' | 'roundedRect';
  };

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
    /**
     * Embedded `m3` dropdown: the Material 3 exposed dropdown menu style,
     * `'outlined'` (default) or `'filled'`, as `TextField`'s `variant`.
     */
    variant?: 'outlined' | 'filled';
    /** Embedded `m3` dropdown: the dense style, a shorter field. */
    dense?: boolean;
  };

  /** Test identifier */
  testID?: string;
}

/** Flattens options for native: icons resolved, every field set. */
function normalizeSelectionMenuOptions(
  options: readonly SelectionMenuOption[]
): SelectionMenuNativeOption[] {
  warnSelectionIdentifiers(
    'SelectionMenu',
    options.map((option) => option.data)
  );
  return options.map((option) => ({
    label: option.label,
    data: option.data,
    disabled: option.disabled ? 'true' : 'false',
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
    minFieldHeight,
    fieldPaddingHorizontal,
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
      const option = options[index];
      if (disabled || !option || option.disabled || option.data !== data)
        return;
      onSelect?.(data, label, index);
    },
    [disabled, onSelect, options]
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
      variant: android.variant ?? 'outlined',
      density: android.dense ? 'dense' : 'standard',
    };
  }, [android]);

  const nativeIos = useMemo(
    () => (ios ? { borderStyle: ios.borderStyle ?? 'none' } : undefined),
    [ios]
  );

  // On Android, force a fresh native view when structural props change so the
  // widget gets a clean measurement cycle (TextInputLayout caches aggressively).
  const remountKey =
    Platform.OS === 'android'
      ? `${presentation}-${android?.material ?? 'system'}-${
          android?.variant ?? 'outlined'
        }-${android?.dense ? 'dense' : 'standard'}`
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
      minFieldHeight={minFieldHeight ?? 0}
      fieldPaddingHorizontal={fieldPaddingHorizontal ?? -1}
      onSelect={onSelect ? handleSelect : undefined}
      onRequestClose={onRequestClose ? handleRequestClose : undefined}
      ios={nativeIos}
      android={nativeAndroid}
      {...viewProps}
    />
  );
}
