// ChipGroup.tsx
import React, { useCallback, useMemo, useState } from 'react';
import type { ViewProps } from 'react-native';

import type { ChipVariant } from './Chip';
import NativeChipGroup, {
  type ChipGroupChip as NativeChip,
  type ChipGroupPressEvent,
  type ChipGroupSelectionEvent,
} from './ChipGroupNativeComponent';
import { resolveIcon, type PlatformIcon } from './icons';
import type { Haptics } from './haptics';

/**
 * Selection behavior of the group.
 *
 * - `none` (default): the chips are plain actions.
 * - `single`: at most one chip is selected at a time.
 * - `multiple`: any number of chips can be selected.
 */
export type ChipGroupSelection = 'none' | 'single' | 'multiple';

export interface ChipGroupItem {
  /** Unique value identifier for the chip */
  value: string;

  /** Chip text. */
  label: string;

  /** Optional leading icon. See {@link PlatformIcon}. */
  icon?: PlatformIcon;

  /** Whether this specific chip is disabled */
  disabled?: boolean;

  /**
   * Shows the trailing close (remove) icon. Default: `true` when the group
   * has `onClose`.
   */
  closeIcon?: boolean;

  /** Test identifier of the chip. Default: `${testID}-${value}`. */
  testID?: string;

  /**
   * Test identifier of the close icon. Default: `${testID}-${value}-close`.
   * See `ChipProps.closeTestID` for how each platform exposes it.
   */
  closeTestID?: string;

  /** Screen-reader label. Defaults to `label`. */
  accessibilityLabel?: string;

  /**
   * Screen-reader label of the close icon. Default: Material's localized
   * "Remove {label}" on Android, "Remove {label}" on iOS.
   */
  closeAccessibilityLabel?: string;
}

export interface ChipGroupProps extends ViewProps {
  /** Chips to display */
  chips: readonly ChipGroupItem[];

  /**
   * Material 3 chip type of every chip. Default: `'filter'` when
   * `selection` is `'single'` or `'multiple'`, `'assist'` otherwise. See
   * {@link ChipVariant}.
   */
  variant?: ChipVariant;

  /** Selection behavior. Default: `'none'`. See {@link ChipGroupSelection}. */
  selection?: ChipGroupSelection;

  /**
   * Values of the selected chips (controlled). Only the first value is
   * used with `selection: 'single'`.
   */
  selectedValues?: readonly string[];

  /**
   * Whether at least one chip must stay selected. Default: `true` for
   * `single`, `false` for `multiple`, as in ButtonGroup.
   */
  selectionRequired?: boolean;

  /**
   * `true` (default): chips that don't fit wrap onto more rows, and the
   * group grows taller. `false`: one row that scrolls horizontally.
   */
  wrap?: boolean;

  /**
   * Gap between chips in points, across and between rows. Default: the
   * platform's (8 on both).
   */
  spacing?: number;

  /** Whether the entire group is disabled */
  disabled?: boolean;

  /**
   * Haptic played when a chip or a close icon is pressed. Default: none,
   * like the native chips. See {@link Haptics}.
   */
  haptics?: Haptics;

  /**
   * Largest scale the labels' font can reach with the system text size
   * (Dynamic Type / font scale), as on `Text`: `undefined` or `0` means no
   * cap; values of 1 or more cap it.
   */
  maxFontSizeMultiplier?: number;

  /**
   * Called when a chip is pressed, in every selection mode.
   * @param value - The chip's value
   * @param index - The chip's index
   */
  onPress?: (value: string, index: number) => void;

  /**
   * Called when the selection changes (`single` / `multiple` selection).
   * @param values - Values of the selected chips, in chip order
   */
  onSelectionChange?: (values: string[]) => void;

  /**
   * Called when a chip's close icon is pressed. The chip stays until the
   * parent removes it from `chips`.
   * @param value - The chip's value
   * @param index - The chip's index
   */
  onClose?: (value: string, index: number) => void;

  /** Test identifier of the group; also the prefix of the chips' defaults. */
  testID?: string;
}

export function ChipGroup(props: ChipGroupProps): React.ReactElement {
  const {
    chips,
    variant,
    selection,
    selectedValues,
    selectionRequired,
    wrap,
    spacing,
    disabled,
    haptics,
    maxFontSizeMultiplier,
    onPress,
    onSelectionChange,
    onClose,
    testID,
    ...viewProps
  } = props;

  const selectionMode = selection ?? 'none';
  const hasClose = onClose !== undefined;

  const nativeChips = useMemo((): NativeChip[] => {
    return chips.map((chip) => ({
      label: chip.label,
      value: chip.value,
      disabled: chip.disabled ? 'disabled' : 'enabled',
      closeIcon: (chip.closeIcon ?? hasClose) ? 'true' : 'false',
      testID: chip.testID ?? (testID ? `${testID}-${chip.value}` : ''),
      closeTestID:
        chip.closeTestID ?? (testID ? `${testID}-${chip.value}-close` : ''),
      accessibilityLabel: chip.accessibilityLabel ?? '',
      closeAccessibilityLabel: chip.closeAccessibilityLabel ?? '',
      ...resolveIcon(chip.icon),
    }));
  }, [chips, hasClose, testID]);

  const nativeSelectedValues = useMemo((): string[] => {
    if (selectionMode === 'none' || !selectedValues) return [];
    return selectionMode === 'single'
      ? selectedValues.slice(0, 1)
      : [...selectedValues];
  }, [selectionMode, selectedValues]);

  const handlePress = useCallback(
    (e: { nativeEvent: ChipGroupPressEvent }) => {
      const { index, value } = e.nativeEvent;
      onPress?.(value, index);
    },
    [onPress]
  );

  const handleClose = useCallback(
    (e: { nativeEvent: ChipGroupPressEvent }) => {
      const { index, value } = e.nativeEvent;
      onClose?.(value, index);
    },
    [onClose]
  );

  // Controlled selection: every change re-renders with a new event count,
  // so native applies `selectedValues` again and a change the parent didn't
  // take goes back.
  const [selectionEventCount, setSelectionEventCount] = useState(0);
  const handleSelectionChange = useCallback(
    (e: { nativeEvent: ChipGroupSelectionEvent }) => {
      setSelectionEventCount((count) => count + 1);
      onSelectionChange?.([...e.nativeEvent.values]);
    },
    [onSelectionChange]
  );

  const isSelectionRequired = selectionRequired ?? selectionMode === 'single';

  return (
    <NativeChipGroup
      chips={nativeChips}
      variant={variant ?? (selectionMode !== 'none' ? 'filter' : 'assist')}
      selection={selectionMode}
      selectedValues={nativeSelectedValues}
      selectionRequired={isSelectionRequired ? 'true' : 'false'}
      selectionEventCount={selectionEventCount}
      wrap={wrap === false ? 'false' : 'true'}
      spacing={spacing ?? -1}
      interactivity={disabled ? 'disabled' : 'enabled'}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? 0}
      haptics={haptics ?? ''}
      onChipPress={onPress ? handlePress : undefined}
      onChipClose={onClose ? handleClose : undefined}
      onGroupSelectionChange={
        selectionMode !== 'none' ? handleSelectionChange : undefined
      }
      testID={testID}
      {...viewProps}
    />
  );
}
