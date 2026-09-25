// ButtonGroup.tsx
import React, { useCallback, useMemo } from 'react';
import type { ColorValue, ViewProps } from 'react-native';

import type { ButtonShape, ButtonSize, ButtonVariant } from './Button';
import NativeButtonGroup, {
  type ButtonGroupButton as NativeButton,
  type ButtonGroupPressEvent,
  type ButtonGroupSelectionEvent,
} from './ButtonGroupNativeComponent';
import { resolveIcon, type PlatformIcon } from './icons';
import { normalizeLabelStyle, type LabelStyle } from './labelStyle';
import type { Haptics } from './haptics';
import type { AndroidMaterialStyle } from './sharedTypes';

/**
 * Selection behavior of the group.
 *
 * - `none` (default): the buttons are plain actions.
 * - `single`: at most one button is selected at a time.
 * - `multiple`: any number of buttons can be selected.
 */
export type ButtonGroupSelection = 'none' | 'single' | 'multiple';

/** What happens to buttons that don't fit the group's width (Android). */
export type ButtonGroupOverflow = 'none' | 'menu' | 'wrap';

export interface ButtonGroupButtonProps {
  /** Button text. Omit for an icon-only button. */
  label?: string;

  /** Unique value identifier for the button */
  value: string;

  /** Whether this specific button is disabled */
  disabled?: boolean;

  /** Optional icon. See {@link PlatformIcon}. */
  icon?: PlatformIcon;

  /** Screen-reader label. Defaults to `label`. */
  accessibilityLabel?: string;
}

export interface ButtonGroupProps extends ViewProps {
  /** Buttons to display */
  buttons: readonly ButtonGroupButtonProps[];

  /** Emphasis of every button. Default: `'outlined'`. */
  variant?: ButtonVariant;

  /** Size of every button. Default: `'small'`. */
  size?: ButtonSize;

  /** Corner shape of every button. Default: platform default. */
  shape?: ButtonShape;

  /**
   * Connected group: the buttons share one outline with small inner corners
   * (Material 3 "connected button group"). Default: `true` when `selection`
   * is `'single'` or `'multiple'`, `false` otherwise.
   */
  connected?: boolean;

  /** Gap between buttons in points. Default: the platform's group spacing. */
  spacing?: number;

  /** Selection behavior. Default: `'none'`. See {@link ButtonGroupSelection}. */
  selection?: ButtonGroupSelection;

  /**
   * Values of the selected buttons (controlled). Only the first value is
   * used with `selection: 'single'`.
   */
  selectedValues?: readonly string[];

  /**
   * Whether at least one button must stay selected. Default: `true` for
   * `single`, `false` for `multiple`.
   */
  selectionRequired?: boolean;

  /** Whether the entire group is disabled */
  disabled?: boolean;

  /** Container (background) color of the buttons. */
  color?: ColorValue;

  /** Label and icon color of the buttons. */
  tintColor?: ColorValue;

  /** Label font. */
  labelStyle?: LabelStyle;

  /**
   * Haptic played when a button is pressed, in every selection mode.
   * Default: none, like the native buttons. See {@link Haptics}.
   */
  haptics?: Haptics;

  /**
   * Called when a button is pressed, in every selection mode.
   * @param value - The button's value
   * @param index - The button's index
   */
  onPress?: (value: string, index: number) => void;

  /**
   * Called when the selection changes (`single` / `multiple` selection).
   * @param values - Values of the selected buttons, in button order
   */
  onSelectionChange?: (values: string[]) => void;

  /**
   * Android-specific configuration
   */
  android?: {
    /**
     * What happens to buttons that don't fit: `'none'` (clipped), `'menu'`
     * (moved into an overflow menu) or `'wrap'` (wrapped onto more rows).
     * Default: `'none'`.
     */
    overflow?: ButtonGroupOverflow;

    /** Ripple color shown while pressing a button. */
    rippleColor?: ColorValue;

    /** Outline color (outlined variant). */
    strokeColor?: ColorValue;

    /**
     * Material style: Material 3 Expressive (default), or the classic
     * Material 3 group, which has one size and shape (`size` and `shape`
     * are ignored).
     */
    material?: AndroidMaterialStyle;
  };

  /** Test identifier */
  testID?: string;
}

export function ButtonGroup(props: ButtonGroupProps): React.ReactElement {
  const {
    buttons,
    variant,
    size,
    shape,
    connected,
    spacing,
    selection,
    selectedValues,
    selectionRequired,
    disabled,
    color,
    tintColor,
    labelStyle,
    haptics,
    onPress,
    onSelectionChange,
    android,
    ...viewProps
  } = props;

  const selectionMode = selection ?? 'none';

  const nativeButtons = useMemo((): NativeButton[] => {
    return buttons.map((button) => ({
      label: button.label ?? '',
      value: button.value,
      disabled: button.disabled ? 'disabled' : 'enabled',
      accessibilityLabel: button.accessibilityLabel ?? '',
      ...resolveIcon(button.icon),
    }));
  }, [buttons]);

  const nativeSelectedValues = useMemo((): string[] => {
    if (selectionMode === 'none' || !selectedValues) return [];
    return selectionMode === 'single'
      ? selectedValues.slice(0, 1)
      : [...selectedValues];
  }, [selectionMode, selectedValues]);

  const nativeLabelStyle = useMemo(
    () => normalizeLabelStyle(labelStyle),
    [labelStyle]
  );

  const handlePress = useCallback(
    (e: { nativeEvent: ButtonGroupPressEvent }) => {
      const { index, value } = e.nativeEvent;
      onPress?.(value, index);
    },
    [onPress]
  );

  const handleSelectionChange = useCallback(
    (e: { nativeEvent: ButtonGroupSelectionEvent }) => {
      onSelectionChange?.([...e.nativeEvent.values]);
    },
    [onSelectionChange]
  );

  const nativeAndroid = useMemo(
    () => ({
      overflow: android?.overflow ?? 'none',
      material: android?.material ?? 'expressive',
    }),
    [android]
  );

  const isConnected = connected ?? selectionMode !== 'none';
  const isSelectionRequired =
    selectionRequired ?? (selectionMode === 'single' ? true : false);

  return (
    <NativeButtonGroup
      buttons={nativeButtons}
      variant={variant ?? 'outlined'}
      size={size ?? 'small'}
      shape={shape ?? ''}
      connected={isConnected ? 'true' : 'false'}
      spacing={spacing ?? -1}
      selection={selectionMode}
      selectedValues={nativeSelectedValues}
      selectionRequired={isSelectionRequired ? 'true' : 'false'}
      interactivity={disabled ? 'disabled' : 'enabled'}
      color={color}
      foregroundColor={tintColor}
      androidRippleColor={android?.rippleColor}
      androidStrokeColor={android?.strokeColor}
      labelStyle={nativeLabelStyle}
      haptics={haptics ?? ''}
      onButtonPress={onPress ? handlePress : undefined}
      onGroupSelectionChange={
        onSelectionChange ? handleSelectionChange : undefined
      }
      android={nativeAndroid}
      {...viewProps}
    />
  );
}
